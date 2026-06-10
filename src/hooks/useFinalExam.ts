import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { finalExamService, type SaveAttemptAnswersPayload, type UpsertFinalExamPayload, type UpsertQuestionPayload } from '../services/finalExamService'
import { API_ENDPOINTS } from '../services/endpoints'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import type { TerminateAttemptReason } from '../types/finalExam'

const isFinalExamDebug = import.meta.env.DEV

export const finalExamQueryKeys = {
  manage: (courseId: string) => ['final-exam', 'manage', courseId] as const,
  overview: (courseId: string) => ['final-exam', 'overview', courseId] as const,
  attempt: (courseId: string, attemptId: string) => ['final-exam', 'attempt', courseId, attemptId] as const,
}

export const useFinalExamManage = (courseId?: string | null) =>
  useQuery({
    queryKey: courseId ? finalExamQueryKeys.manage(courseId) : ['final-exam', 'manage', 'disabled'],
    queryFn: () => finalExamService.getManage(courseId ?? ''),
    enabled: Boolean(courseId),
  })

export const useFinalExamOverview = (courseId?: string | null) =>
  useQuery({
    queryKey: courseId ? finalExamQueryKeys.overview(courseId) : ['final-exam', 'overview', 'disabled'],
    queryFn: () => finalExamService.getOverview(courseId ?? ''),
    enabled: Boolean(courseId),
    staleTime: 5_000,
    refetchOnMount: 'always',
  })

export const useFinalExamAttempt = (courseId?: string | null, attemptId?: string | null) =>
  useQuery({
    queryKey: courseId && attemptId ? finalExamQueryKeys.attempt(courseId, attemptId) : ['final-exam', 'attempt', 'disabled'],
    queryFn: async () => {
      const resolvedCourseId = courseId ?? ''
      const resolvedAttemptId = attemptId ?? ''
      const requestUrl = API_ENDPOINTS.courses.finalExam.attempt(resolvedCourseId, resolvedAttemptId)
      if (isFinalExamDebug) {
        console.log('[FinalExam] getAttempt request', {
          courseId: resolvedCourseId,
          attemptId: resolvedAttemptId,
          url: requestUrl,
        })
      }

      try {
        const attempt = await finalExamService.getAttempt(resolvedCourseId, resolvedAttemptId)
        if (!attempt) {
          throw new Error('Attempt could not be loaded.')
        }

        if (isFinalExamDebug) {
          console.log('[FinalExam] getAttempt response', {
            success: true,
            courseId: resolvedCourseId,
            requestAttemptId: resolvedAttemptId,
            responseAttemptId: attempt.id,
            attemptStatus: attempt.status,
          })
        }

        return attempt
      } catch (error) {
        const mappingError = error as Error & { code?: string, rawResponse?: unknown }
        if (mappingError.code === 'FINAL_EXAM_ATTEMPT_MAPPING_FAILED') {
          console.error('Attempt response received but mapper failed', {
            courseId: resolvedCourseId,
            attemptId: resolvedAttemptId,
            url: requestUrl,
            rawResponse: mappingError.rawResponse ?? null,
          })
        }

        const appError = normalizeApiError(error)
        if (isFinalExamDebug) {
          console.log('[FinalExam] getAttempt response', {
            success: false,
            courseId: resolvedCourseId,
            requestAttemptId: resolvedAttemptId,
            status: appError.httpStatus ?? null,
            message: appError.message,
          })
        }
        throw error
      }
    },
    enabled: Boolean(courseId && attemptId),
    refetchInterval: (query) => query.state.data?.status === 'IN_PROGRESS' ? 20_000 : false,
  })

export const useCreateOrUpdateFinalExam = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { values: UpsertFinalExamPayload, mode: 'create' | 'update' }) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      if (payload.mode === 'create') {
        return finalExamService.createFinalExam(courseId, payload.values)
      }

      return finalExamService.updateFinalExam(courseId, payload.values)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) }),
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.overview(courseId) }),
      ])
    },
  })
}

export const useDeleteFinalExam = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }
      await finalExamService.deleteFinalExam(courseId)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) }),
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.overview(courseId) }),
      ])
    },
  })
}

export const useCreateQuestion = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UpsertQuestionPayload) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }
      return finalExamService.createQuestion(courseId, payload)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) })
    },
  })
}

export const useUpdateQuestion = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { questionId: string, values: UpsertQuestionPayload }) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      return finalExamService.updateQuestion(courseId, payload.questionId, payload.values)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) })
    },
  })
}

export const useDeleteQuestion = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      await finalExamService.deleteQuestion(courseId, questionId)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) })
    },
  })
}

export const useUploadQuestionImage = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: { questionId: string, file: File, method?: 'POST' | 'PUT' }) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      await finalExamService.uploadQuestionImage(courseId, payload.questionId, payload.file, payload.method)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) })
    },
  })
}

export const useDeleteQuestionImage = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (questionId: string) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      await finalExamService.deleteQuestionImage(courseId, questionId)
    },
    onSuccess: async () => {
      if (!courseId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) })
    },
  })
}

export const useStartFinalExamAttempt = (courseId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { acceptedRules?: boolean }) => {
      if (!courseId) {
        throw new Error('Course id is required.')
      }

      return finalExamService.startAttempt(courseId, payload)
    },
    retry: false,
    onSuccess: async (response) => {
      if (!courseId) {
        return
      }

      const tasks: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.overview(courseId) }),
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.manage(courseId) }),
      ]

      if (response.attemptId) {
        tasks.push(queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.attempt(courseId, response.attemptId) }))
      }

      await Promise.all(tasks)
    },
  })
}

export const useSaveFinalExamAnswers = (courseId?: string | null, attemptId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: SaveAttemptAnswersPayload) => {
      if (!courseId || !attemptId) {
        throw new Error('Course id and attempt id are required.')
      }

      return finalExamService.saveAttemptAnswers(courseId, attemptId, payload)
    },
    onSuccess: async () => {
      if (!courseId || !attemptId) {
        return
      }

      await queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.attempt(courseId, attemptId) })
    },
  })
}

export const useSubmitFinalExamAttempt = (courseId?: string | null, attemptId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      if (!courseId || !attemptId) {
        throw new Error('Course id and attempt id are required.')
      }

      return finalExamService.submitAttempt(courseId, attemptId)
    },
    retry: false,
    onSuccess: async () => {
      if (!courseId || !attemptId) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.overview(courseId) }),
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.attempt(courseId, attemptId) }),
      ])
    },
  })
}

export const useTerminateFinalExamAttempt = (courseId?: string | null, attemptId?: string | null) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload?: { reason?: TerminateAttemptReason }) => {
      if (!courseId || !attemptId) {
        throw new Error('Course id and attempt id are required.')
      }

      return finalExamService.terminateAttempt(courseId, attemptId, payload)
    },
    retry: false,
    onSuccess: async () => {
      if (!courseId || !attemptId) {
        return
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.overview(courseId) }),
        queryClient.invalidateQueries({ queryKey: finalExamQueryKeys.attempt(courseId, attemptId) }),
      ])
    },
  })
}
