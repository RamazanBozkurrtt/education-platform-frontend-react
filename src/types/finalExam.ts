export type AttemptStatus =
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'EXPIRED'
  | 'TERMINATED'

export type TerminateAttemptReason =
  | 'manual_exit'
  | 'timeout_ui'
  | 'tab_close'
  | 'route_guard'
  | 'fullscreen_exit'
  | 'visibility_hidden'
  | 'unknown'

export type ResultStatus =
  | 'NONE'
  | 'PASSED'
  | 'FAILED'

export interface ExamOption {
  id: string
  text: string
  orderIndex: number
}

export interface ExamQuestion {
  id: string
  questionText: string
  orderIndex: number
  imageUrl: string | null
  options: ExamOption[]
  correctOptionId?: string | null
}

export interface FinalExam {
  id: string
  courseId: string
  title: string
  description: string
  passingScore: number
  questionCount: number
  durationMinutes: number
  maxAttempts: number
  availabilityDays: number
  active: boolean
}

export interface FinalExamManageResponse {
  exam: FinalExam | null
  questions: ExamQuestion[]
}

export interface AttemptSummary {
  attemptId: string
  status: AttemptStatus
  resultStatus: ResultStatus
  score: number | null
  startedAt: string | null
  submittedAt: string | null
  remainingAttempts: number | null
}

export interface CertificateEligibility {
  eligible: boolean
  message?: string | null
}

export interface StudentExamOverview {
  exam: FinalExam | null
  isCourseCompleted: boolean
  courseCompleted: boolean | null
  completedVideos: number | null
  totalVideos: number | null
  completionPercentage: number | null
  canStartExam: boolean
  canStartReason: string | null
  maxAttempts: number | null
  remainingAttempts: number
  hasActiveAttempt: boolean | null
  attemptWindowDays: number | null
  alreadyPassed: boolean
  certificateEligible: boolean
  activeAttemptId: string | null
  attempts: AttemptSummary[]
}

export interface ExamAttemptQuestion {
  questionId: string
  orderIndex: number
  questionText: string
  imageUrl: string | null
  selectedOptionId?: string | null
  options: ExamOption[]
}

export interface ExamAttemptAnswer {
  questionId: string
  selectedOptionId: string | null
}

export interface ExamAttempt {
  id: string
  courseId: string
  examId: string
  status: AttemptStatus
  resultStatus: ResultStatus
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  score: number | null
  passingScore: number | null
  remainingAttempts: number | null
  certificateEligibility: CertificateEligibility
  questions: ExamAttemptQuestion[]
  answers: ExamAttemptAnswer[]
}

export interface StartExamAttemptResponse {
  attemptId: string
  attemptStatus: AttemptStatus
  status: AttemptStatus
  createdNewAttempt?: boolean | null
  courseId?: string | null
  remainingAttempts?: number | null
  message?: string | null
}

export interface SubmitExamResponse {
  attempt: ExamAttempt
  summary: AttemptSummary
  certificateEligibility: CertificateEligibility
}
