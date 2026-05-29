import { useMutation, useQueries, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query'
import { courseProgressService } from '../services/courseProgressService'
import type { CourseProgressSummary, LessonProgress, LessonProgressUpdateRequest } from '../utils/types'

export const courseProgressQueryKeys = {
  lesson: (courseId: string, lessonId: string) => ['course-progress', 'lesson', courseId, lessonId] as const,
  courseLessons: (courseId: string) => ['course-progress', 'course-lessons', courseId] as const,
  courseSummary: (courseId: string) => ['course-progress', 'course-summary', courseId] as const,
}

export const useLessonProgress = (courseId?: string | null, lessonId?: string | null) =>
  useQuery({
    queryKey: courseId && lessonId
      ? courseProgressQueryKeys.lesson(courseId, lessonId)
      : ['course-progress', 'lesson', 'disabled'],
    queryFn: () => courseProgressService.getLessonProgress(courseId ?? '', lessonId ?? ''),
    enabled: Boolean(courseId && lessonId),
  })

export const useCourseLessonProgress = (courseId?: string | null) =>
  useQuery({
    queryKey: courseId ? courseProgressQueryKeys.courseLessons(courseId) : ['course-progress', 'course-lessons', 'disabled'],
    queryFn: () => courseProgressService.getCourseLessonProgress(courseId ?? ''),
    enabled: Boolean(courseId),
  })

export const useCourseProgressSummary = (courseId?: string | null) =>
  useQuery({
    queryKey: courseId ? courseProgressQueryKeys.courseSummary(courseId) : ['course-progress', 'course-summary', 'disabled'],
    queryFn: () => courseProgressService.getCourseProgressSummary(courseId ?? ''),
    enabled: Boolean(courseId),
  })

export const useUpdateLessonProgress = (courseId?: string | null, lessonId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: LessonProgressUpdateRequest) =>
      courseProgressService.updateLessonProgress(courseId ?? '', lessonId ?? '', payload),
    onSuccess: (updatedProgress) => {
      if (!courseId || !lessonId) {
        return
      }

      queryClient.setQueryData(courseProgressQueryKeys.lesson(courseId, lessonId), updatedProgress)

      queryClient.setQueryData<LessonProgress[]>(
        courseProgressQueryKeys.courseLessons(courseId),
        (previousList) => {
          if (!previousList) {
            return previousList
          }

          const existingIndex = previousList.findIndex((item) => item.lessonId === lessonId)

          if (existingIndex < 0) {
            return [...previousList, updatedProgress]
          }

          const nextList = [...previousList]
          nextList[existingIndex] = updatedProgress
          return nextList
        },
      )

      void Promise.all([
        queryClient.invalidateQueries({ queryKey: courseProgressQueryKeys.lesson(courseId, lessonId) }),
        queryClient.invalidateQueries({ queryKey: courseProgressQueryKeys.courseLessons(courseId) }),
        queryClient.invalidateQueries({ queryKey: courseProgressQueryKeys.courseSummary(courseId) }),
      ])
    },
  })
}

export const useCourseProgressSummaries = (courseIds: string[]) => {
  const results = useQueries({
    queries: courseIds.map((courseId) => ({
      queryKey: courseProgressQueryKeys.courseSummary(courseId),
      queryFn: () => courseProgressService.getCourseProgressSummary(courseId),
      enabled: Boolean(courseId),
    })),
  })

  return courseIds.reduce<Record<string, UseQueryResult<CourseProgressSummary | null>>>((accumulator, courseId, index) => {
    accumulator[courseId] = results[index]
    return accumulator
  }, {})
}
