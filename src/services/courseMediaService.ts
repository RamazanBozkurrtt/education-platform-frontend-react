import api from './api'
import { API_ENDPOINTS } from './endpoints'

const COURSE_IMAGE_ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp', 'image/svg+xml']
const LESSON_VIDEO_ALLOWED_TYPES = ['video/mp4']

const assertAllowedFileType = (file: File, allowedTypes: string[], label: string) => {
  if (allowedTypes.includes(file.type)) {
    return
  }

  throw new Error(`${label} file type is not supported: ${file.type || 'unknown'}.`)
}

const createMultipartPayload = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return formData
}

export const courseMediaService = {
  async uploadCourseImage(courseId: string, file: File) {
    assertAllowedFileType(file, COURSE_IMAGE_ALLOWED_TYPES, 'Course image')

    await api.put(API_ENDPOINTS.courses.image.secured(courseId), createMultipartPayload(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60_000,
    })
  },

  async deleteCourseImage(courseId: string) {
    await api.delete(API_ENDPOINTS.courses.image.secured(courseId))
  },

  async uploadLessonVideo(courseId: string, lessonId: string, file: File) {
    assertAllowedFileType(file, LESSON_VIDEO_ALLOWED_TYPES, 'Lesson video')

    await api.put(API_ENDPOINTS.courses.lessons.video(courseId, lessonId), createMultipartPayload(file), {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 5 * 60_000,
    })
  },

  async deleteLessonVideo(courseId: string, lessonId: string) {
    await api.delete(API_ENDPOINTS.courses.lessons.video(courseId, lessonId))
  },

  async downloadLessonVideoBlob(courseId: string, lessonId: string) {
    const response = await api.get<Blob>(API_ENDPOINTS.courses.lessons.video(courseId, lessonId), {
      responseType: 'blob',
      timeout: 5 * 60_000,
      skipGlobalErrorHandling: true,
    })

    return response.data
  },
}
