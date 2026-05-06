export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    register: '/api/v1/auth/register',
    refreshToken: '/api/v1/auth/refresh-token',
    logout: '/api/v1/auth/logout',
    changePassword: '/api/v1/auth/change-password',
    me: '/api/v1/auth/me',
    reactivateAccount: '/api/v1/auth/reactivate-account',
  },
  courses: {
    publicList: '/api/v1/courses/public',
    publicDetail: (courseId: string) => `/api/v1/courses/public/${courseId}`,
    authorizedDetail: (courseId: string) => `/api/v1/courses/${courseId}`,
    listForAdmin: '/api/v1/courses',
    myCourses: '/api/v1/courses/me',
    create: '/api/v1/courses',
    update: (courseId: string) => `/api/v1/courses/${courseId}`,
    remove: (courseId: string) => `/api/v1/courses/${courseId}`,
    publish: (courseId: string) => `/api/v1/courses/${courseId}/publish`,
    image: {
      public: (courseId: string) => `/api/v1/courses/public/${courseId}/image`,
      secured: (courseId: string) => `/api/v1/courses/${courseId}/image`,
    },
    lessons: {
      create: (courseId: string) => `/api/v1/courses/${courseId}/lessons`,
      update: (courseId: string, lessonId: string) => `/api/v1/courses/${courseId}/lessons/${lessonId}`,
      remove: (courseId: string, lessonId: string) => `/api/v1/courses/${courseId}/lessons/${lessonId}`,
      video: (courseId: string, lessonId: string) => `/api/v1/courses/${courseId}/lessons/${lessonId}/video`,
    },
  },
  enrollments: {
    create: '/api/v1/enrollments',
    me: '/api/v1/enrollments/me',
  },
  users: {
    me: '/api/v1/users/me',
    avatar: '/api/v1/users/me/avatar',
  },
} as const
