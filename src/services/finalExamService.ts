import api from './api'
import { API_ENDPOINTS } from './endpoints'
import { normalizeApiError } from '../shared/errors/normalizeApiError'
import type { ApiEnvelope } from '../utils/types'
import type {
  AttemptStatus,
  AttemptSummary,
  CertificateEligibility,
  ExamAttempt,
  ExamAttemptAnswer,
  ExamAttemptQuestion,
  ExamOption,
  ExamQuestion,
  FinalExam,
  FinalExamManageResponse,
  ResultStatus,
  StartExamAttemptResponse,
  StudentExamOverview,
  SubmitExamResponse,
  TerminateAttemptReason,
} from '../types/finalExam'

const requireEnvelopeData = <T>(envelope: ApiEnvelope<T>, fallbackMessage: string) => {
  if (typeof envelope.data !== 'undefined') {
    return envelope.data
  }

  throw new Error(envelope.message || fallbackMessage)
}

const toRecord = (value: unknown): Record<string, unknown> =>
  (typeof value === 'object' && value !== null) ? value as Record<string, unknown> : {}

const toText = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const toId = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(Math.trunc(value))
  }

  return toText(value)
}

const toNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) {
      return true
    }
    if (value === 0) {
      return false
    }
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLocaleLowerCase('en-US')
    if (['true', '1', 'yes', 'y'].includes(normalized)) {
      return true
    }
    if (['false', '0', 'no', 'n'].includes(normalized)) {
      return false
    }
  }

  return null
}

const normalizeAttemptId = (value: unknown) => {
  const id = toId(value)
  if (!id || id === '0' || id === '-1') {
    return null
  }

  return id
}

const toAttemptStatus = (value: unknown): AttemptStatus => {
  const normalized = (toText(value) ?? '')
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
    .toLocaleUpperCase('en-US')

  if (['SUBMITTED', 'COMPLETED', 'FINISHED', 'AUTO_SUBMITTED'].includes(normalized)) {
    return 'SUBMITTED'
  }
  if (['EXPIRED', 'TIMED_OUT', 'TIMEOUT'].includes(normalized)) {
    return 'EXPIRED'
  }
  if (['TERMINATED', 'CANCELLED', 'CANCELED', 'ABORTED', 'FORCE_TERMINATED', 'DISQUALIFIED'].includes(normalized)) {
    return 'TERMINATED'
  }
  if (['IN_PROGRESS', 'STARTED', 'ACTIVE'].includes(normalized)) {
    return 'IN_PROGRESS'
  }

  return 'IN_PROGRESS'
}

const toResultStatus = (value: unknown): ResultStatus => {
  const normalized = (toText(value) ?? '').toLocaleUpperCase('en-US')

  if (normalized === 'PASSED') {
    return 'PASSED'
  }
  if (normalized === 'FAILED') {
    return 'FAILED'
  }

  return 'NONE'
}

const toExamOption = (value: unknown, index: number): ExamOption | null => {
  const source = toRecord(value)
  const id = toId(source.id ?? source.optionId ?? source.option_id) ?? `option-${index + 1}`
  const text = toText(source.text ?? source.optionText ?? source.label)

  if (!text) {
    return null
  }

  return {
    id,
    text,
    orderIndex: Math.max(0, Math.trunc(toNumber(source.orderIndex ?? source.order_index) ?? index)),
  }
}

const toExamOptions = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as ExamOption[]
  }

  return value
    .map((item, index) => toExamOption(item, index))
    .filter((item): item is ExamOption => item !== null)
}

const toExamQuestion = (value: unknown, index: number): ExamQuestion | null => {
  const source = toRecord(value)
  const id = toId(source.id ?? source.questionId ?? source.question_id) ?? `question-${index + 1}`
  const questionText = toText(source.questionText ?? source.text ?? source.question)
  const rawOptions = source.options ?? source.choices ?? source.answers
  const options: ExamOption[] = []
  const explicitCorrectOptionId = toId(source.correctOptionId ?? source.correctAnswerOptionId ?? source.correct_option_id)
  let inferredCorrectOptionId: string | null = null

  if (Array.isArray(rawOptions)) {
    rawOptions.forEach((rawOption, optionIndex) => {
      const mappedOption = toExamOption(rawOption, optionIndex)

      if (!mappedOption) {
        return
      }

      options.push(mappedOption)

      const optionRecord = toRecord(rawOption)
      const isCorrect = toBoolean(optionRecord.correct ?? optionRecord.isCorrect ?? optionRecord.is_correct)

      if (isCorrect === true && !inferredCorrectOptionId) {
        inferredCorrectOptionId = mappedOption.id
      }
    })
  }

  if (!questionText || options.length < 2) {
    return null
  }

  return {
    id,
    questionText,
    orderIndex: Math.max(0, Math.trunc(toNumber(source.orderIndex ?? source.order_index) ?? index)),
    imageUrl: toText(source.imageUrl ?? source.questionImageUrl),
    options,
    correctOptionId: explicitCorrectOptionId ?? inferredCorrectOptionId,
  }
}

const toExamQuestions = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as ExamQuestion[]
  }

  return value
    .map((item, index) => toExamQuestion(item, index))
    .filter((item): item is ExamQuestion => item !== null)
    .sort((left, right) => left.orderIndex - right.orderIndex)
}

const toFinalExam = (value: unknown, fallbackCourseId?: string): FinalExam | null => {
  const source = toRecord(value)
  const id = toId(source.id ?? source.examId ?? source.exam_id ?? source.finalExamId ?? source.final_exam_id) ?? 'final-exam'
  const courseId = toId(source.courseId ?? source.course_id) ?? fallbackCourseId ?? null
  const title = toText(source.title ?? source.examTitle ?? source.exam_title) ?? 'Final sinav'

  if (!id || !courseId) {
    return null
  }

  return {
    id,
    courseId,
    title,
    description: toText(source.description) ?? '',
    passingScore: Math.max(
      0,
      toNumber(
        source.passingScore
        ?? source.passing_score
        ?? source.passScore
        ?? source.pass_score
        ?? source.minimumPassingScore
        ?? source.minimum_passing_score
        ?? source.minPassingScore
        ?? source.min_passing_score
        ?? source.requiredScore
        ?? source.required_score
        ?? source.passMark
        ?? source.pass_mark,
      ) ?? 0,
    ),
    questionCount: Math.max(0, Math.trunc(toNumber(source.questionCount ?? source.question_count ?? source.totalQuestions ?? source.total_questions) ?? 0)),
    durationMinutes: Math.max(1, Math.trunc(toNumber(source.durationMinutes ?? source.duration_minutes ?? source.duration) ?? 1)),
    maxAttempts: Math.max(1, Math.trunc(toNumber(source.maxAttempts ?? source.max_attempts) ?? 3)),
    availabilityDays: Math.max(1, Math.trunc(toNumber(source.availabilityDays ?? source.availability_days ?? source.attemptWindowDays ?? source.attempt_window_days) ?? 3)),
    active: toBoolean(source.active ?? source.isActive ?? source.is_active) ?? true,
  }
}

const toCertificateEligibility = (value: unknown): CertificateEligibility => {
  const source = toRecord(value)
  const eligible = toBoolean(source.eligible ?? source.certificateEligible) ?? false

  return {
    eligible,
    message: toText(source.message ?? source.reason),
  }
}

const toAttemptSummary = (value: unknown): AttemptSummary | null => {
  const source = toRecord(value)
  const attemptId = toId(source.attemptId ?? source.id)

  if (!attemptId) {
    return null
  }

  return {
    attemptId,
    status: toAttemptStatus(source.status ?? source.attemptStatus ?? source.attempt_status),
    resultStatus: toResultStatus(source.resultStatus ?? source.result_status ?? source.result),
    score: toNumber(source.score ?? source.totalScore ?? source.total_score ?? source.earnedScore ?? source.earned_score),
    startedAt: toText(source.startedAt ?? source.started_at ?? source.startAt ?? source.start_at),
    submittedAt: toText(source.submittedAt ?? source.submitted_at ?? source.completedAt ?? source.completed_at),
    remainingAttempts: toNumber(source.remainingAttempts ?? source.remaining_attempts ?? source.attemptsLeft ?? source.attempts_left),
  }
}

const toAttemptSummaries = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as AttemptSummary[]
  }

  return value
    .map((item) => toAttemptSummary(item))
    .filter((item): item is AttemptSummary => item !== null)
}

const ACTIVE_ATTEMPT_ID_KEYS = [
  'activeAttemptId',
  'active_attempt_id',
  'currentAttemptId',
  'current_attempt_id',
  'ongoingAttemptId',
  'ongoing_attempt_id',
  'inProgressAttemptId',
  'in_progress_attempt_id',
  'attemptId',
  'attempt_id',
] as const

const ACTIVE_ATTEMPT_CONTAINER_KEYS = [
  'activeAttempt',
  'active_attempt',
  'currentAttempt',
  'current_attempt',
  'ongoingAttempt',
  'ongoing_attempt',
  'inProgressAttempt',
  'in_progress_attempt',
  'attempt',
  'overview',
  'data',
  'result',
  'payload',
] as const

const findActiveAttemptId = (value: unknown, depth = 0): string | null => {
  if (depth > 5) {
    return null
  }

  const source = toRecord(value)

  for (const key of ACTIVE_ATTEMPT_ID_KEYS) {
    const candidate = normalizeAttemptId(source[key])
    if (candidate) {
      return candidate
    }
  }

  for (const key of ACTIVE_ATTEMPT_CONTAINER_KEYS) {
    if (!(key in source)) {
      continue
    }

    const candidate = findActiveAttemptId(source[key], depth + 1)
    if (candidate) {
      return candidate
    }
  }

  return null
}

const resolveOverviewSource = (value: unknown) => {
  const source = toRecord(value)
  const nestedSource = toRecord(source.overview ?? source.data ?? source.result ?? source.payload)

  if (Object.keys(nestedSource).length === 0) {
    return source
  }

  const hasOverviewShape =
    typeof nestedSource.canStartExam !== 'undefined' ||
    typeof nestedSource.can_start_exam !== 'undefined' ||
    typeof nestedSource.hasActiveAttempt !== 'undefined' ||
    typeof nestedSource.has_active_attempt !== 'undefined' ||
    typeof nestedSource.exam !== 'undefined' ||
    typeof nestedSource.finalExam !== 'undefined'

  return hasOverviewShape ? nestedSource : source
}

const toAttemptAnswer = (value: unknown): ExamAttemptAnswer | null => {
  const source = toRecord(value)
  const questionId = toId(source.questionId ?? source.question_id ?? source.id)

  if (!questionId) {
    return null
  }

  return {
    questionId,
    selectedOptionId: toId(source.selectedOptionId ?? source.selected_option_id ?? source.optionId ?? source.answerOptionId),
  }
}

const toAttemptAnswers = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as ExamAttemptAnswer[]
  }

  return value
    .map((item) => toAttemptAnswer(item))
    .filter((item): item is ExamAttemptAnswer => item !== null)
}

const toAttemptQuestion = (value: unknown, index: number): ExamAttemptQuestion | null => {
  const source = toRecord(value)
  const questionId = toId(source.questionId ?? source.question_id ?? source.id)
  const questionText = toText(source.questionText ?? source.text ?? source.question) ?? ''
  const options = toExamOptions(source.options ?? source.choices ?? source.answers)

  if (!questionId) {
    return null
  }

  return {
    questionId,
    orderIndex: Math.max(0, Math.trunc(toNumber(source.orderIndex ?? source.order_index) ?? index)),
    questionText,
    imageUrl: toText(source.imageUrl ?? source.questionImageUrl),
    selectedOptionId: toId(source.selectedOptionId ?? source.selected_option_id ?? source.optionId ?? source.answerOptionId),
    options,
  }
}

const toAttemptQuestions = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as ExamAttemptQuestion[]
  }

  return value
    .map((item, index) => toAttemptQuestion(item, index))
    .filter((item): item is ExamAttemptQuestion => item !== null)
    .sort((left, right) => left.orderIndex - right.orderIndex)
}

const toExamAttempt = (value: unknown): ExamAttempt | null => {
  const source = toRecord(value)
  const examRecord = toRecord(source.exam ?? source.finalExam ?? source.final_exam)
  const examConfigRecord = toRecord(examRecord.config ?? examRecord.settings ?? source.examConfig ?? source.exam_config)
  const id = toId(source.attemptId ?? source.attempt_id ?? source.id)
  const courseId = toId(source.courseId ?? source.course_id ?? examRecord.courseId ?? examRecord.course_id)
  const examId = toId(
    source.finalExamId
    ?? source.final_exam_id
    ?? source.examId
    ?? source.exam_id
    ?? examRecord.id
    ?? examRecord.examId
    ?? examRecord.exam_id,
  )

  if (!id || !courseId || !examId) {
    return null
  }

  const questions = toAttemptQuestions(source.questions ?? source.items)
  const explicitAnswers = toAttemptAnswers(source.answers ?? source.selectedAnswers ?? source.selected_answers)
  const derivedAnswers = questions.map((question) => ({
    questionId: question.questionId,
    selectedOptionId: question.selectedOptionId ?? null,
  })) satisfies ExamAttemptAnswer[]

  return {
    id,
    courseId,
    examId,
    status: toAttemptStatus(source.attemptStatus ?? source.attempt_status ?? source.status),
    resultStatus: toResultStatus(source.resultStatus ?? source.result_status ?? source.result),
    startedAt: toText(source.startedAt ?? source.started_at ?? source.startAt ?? source.start_at),
    expiresAt: toText(source.expiresAt ?? source.expires_at),
    submittedAt: toText(source.submittedAt ?? source.submitted_at ?? source.completedAt ?? source.completed_at),
    score: toNumber(source.score ?? source.totalScore ?? source.total_score ?? source.earnedScore ?? source.earned_score),
    passingScore: toNumber(
      source.passingScore
      ?? source.passing_score
      ?? source.passScore
      ?? source.pass_score
      ?? source.requiredScore
      ?? source.required_score
      ?? source.minimumPassingScore
      ?? source.minimum_passing_score
      ?? source.minPassingScore
      ?? source.min_passing_score
      ?? source.passMark
      ?? source.pass_mark
      ?? examRecord.passingScore
      ?? examRecord.passing_score
      ?? examRecord.passScore
      ?? examRecord.pass_score
      ?? examRecord.minimumPassingScore
      ?? examRecord.minimum_passing_score
      ?? examRecord.passMark
      ?? examRecord.pass_mark
      ?? examConfigRecord.passingScore
      ?? examConfigRecord.passing_score
      ?? examConfigRecord.passScore
      ?? examConfigRecord.pass_score
    ),
    remainingAttempts: toNumber(
      source.remainingAttempts
      ?? source.remaining_attempts
      ?? source.attemptsLeft
      ?? source.attempts_left
      ?? source.remainingTry
      ?? source.remaining_try,
    ),
    certificateEligibility: toCertificateEligibility(source.certificateEligibility ?? source),
    questions,
    answers: explicitAnswers.length > 0 ? explicitAnswers : derivedAnswers,
  }
}

const toStudentOverview = (value: unknown, fallbackCourseId?: string): StudentExamOverview => {
  const source = resolveOverviewSource(value)
  const rawExamSource = source.exam ?? source.finalExam ?? source.final_exam
  const normalizedExamSource = toRecord(rawExamSource)
  const examSource = Object.keys(normalizedExamSource).length > 0 ? normalizedExamSource : source
  const exam = toFinalExam(examSource, fallbackCourseId)
  const attempts = toAttemptSummaries(source.attempts ?? source.attemptHistory ?? source.attempt_history ?? source.history)
  const inferredInProgressAttemptId = attempts.find((attempt) => attempt.status === 'IN_PROGRESS')?.attemptId ?? null
  const normalizedActiveAttemptId = findActiveAttemptId(source) ?? inferredInProgressAttemptId
  const courseCompleted = toBoolean(source.courseCompleted ?? source.isCourseCompleted ?? source.course_completed ?? source.is_course_completed)
  const completedVideosRaw = toNumber(source.completedVideos ?? source.completed_videos)
  const totalVideosRaw = toNumber(source.totalVideos ?? source.total_videos)
  const completionPercentageRaw = toNumber(source.completionPercentage ?? source.completion_percentage)
  const hasActiveAttemptFromResponse = toBoolean(
    source.hasActiveAttempt
    ?? source.has_active_attempt
    ?? source.activeAttemptExists
    ?? source.active_attempt_exists
    ?? source.hasOngoingAttempt
    ?? source.has_ongoing_attempt,
  )
  const maxAttempts = toNumber(source.maxAttempts ?? source.max_attempts ?? source.examMaxAttempts ?? source.exam_max_attempts)
  const remainingAttemptsRaw = toNumber(source.remainingAttempts ?? source.remaining_attempts ?? source.attemptsLeft ?? source.attempts_left)
  const startedAttemptCount = attempts.filter((attempt) => attempt.status !== 'IN_PROGRESS').length
  const fallbackRemainingAttempts = maxAttempts === null
    ? 0
    : Math.max(0, Math.trunc(maxAttempts - startedAttemptCount))
  const remainingAttempts = Math.max(
    0,
    Math.trunc(remainingAttemptsRaw ?? fallbackRemainingAttempts),
  )
  const canStartFromResponse = toBoolean(source.canStartExam ?? source.canStart ?? source.can_start_exam ?? source.can_start)
  const canStartExam = canStartFromResponse ?? Boolean((courseCompleted ?? false) && remainingAttempts > 0 && !normalizedActiveAttemptId)
  const hasActiveAttempt = hasActiveAttemptFromResponse ?? Boolean(normalizedActiveAttemptId)

  return {
    exam,
    isCourseCompleted: courseCompleted ?? false,
    courseCompleted,
    completedVideos: completedVideosRaw === null ? null : Math.max(0, Math.trunc(completedVideosRaw)),
    totalVideos: totalVideosRaw === null ? null : Math.max(0, Math.trunc(totalVideosRaw)),
    completionPercentage: completionPercentageRaw === null ? null : Math.max(0, Math.min(100, completionPercentageRaw)),
    canStartExam,
    canStartReason: toText(source.canStartReason ?? source.can_start_reason ?? source.message ?? source.reason),
    maxAttempts,
    remainingAttempts,
    hasActiveAttempt,
    attemptWindowDays: toNumber(source.attemptWindowDays ?? source.attempt_window_days ?? source.availabilityDays ?? source.availability_days),
    alreadyPassed: toBoolean(source.alreadyPassed ?? source.already_passed) ?? false,
    certificateEligible: toBoolean(source.certificateEligible ?? source.certificate_eligible) ?? false,
    activeAttemptId: normalizedActiveAttemptId,
    attempts,
  }
}

export interface UpsertFinalExamPayload {
  title: string
  description: string
  passingScore: number
  questionCount: number
  durationMinutes: number
  maxAttempts: number
  availabilityDays: number
  active: boolean
}

export interface UpsertQuestionPayload {
  questionText: string
  points?: number
  active: boolean
  options: Array<{
    id?: string
    optionText: string
    isCorrect: boolean
    orderIndex: number
  }>
  orderIndex: number
}

export interface SaveAttemptAnswersPayload {
  answers: Array<{
    questionId: string
    selectedOptionId: string
  }>
}

export const finalExamService = {
  async getManage(courseId: string) {
    try {
      const response = await api.get<ApiEnvelope<unknown>>(
        API_ENDPOINTS.courses.finalExam.manage(courseId),
        { skipGlobalErrorHandling: true },
      )
      const payload = requireEnvelopeData(response.data, 'Final exam manage response is missing data.')
      const source = toRecord(payload)
      const exam = toFinalExam(source.exam ?? source.finalExam ?? source, courseId)
      const questions = toExamQuestions(source.questions ?? source.items ?? source.examQuestions)

      return {
        exam,
        questions,
      } satisfies FinalExamManageResponse
    } catch (error) {
      if (normalizeApiError(error).httpStatus === 404) {
        return {
          exam: null,
          questions: [],
        } satisfies FinalExamManageResponse
      }

      throw error
    }
  },

  async createFinalExam(courseId: string, payload: UpsertFinalExamPayload) {
    const requestPayload = {
      title: payload.title,
      description: payload.description,
      passingScore: payload.passingScore,
      questionCount: payload.questionCount,
      durationMinutes: payload.durationMinutes,
      maxAttempts: payload.maxAttempts,
      availabilityDays: payload.availabilityDays,
      active: payload.active,
    }

    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.base(courseId), requestPayload)
    return toFinalExam(requireEnvelopeData(response.data, 'Final exam create response is missing data.'), courseId)
  },

  async updateFinalExam(courseId: string, payload: UpsertFinalExamPayload) {
    const requestPayload = {
      title: payload.title,
      description: payload.description,
      passingScore: payload.passingScore,
      questionCount: payload.questionCount,
      durationMinutes: payload.durationMinutes,
      maxAttempts: payload.maxAttempts,
      availabilityDays: payload.availabilityDays,
      active: payload.active,
    }

    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.base(courseId), requestPayload)
    return toFinalExam(requireEnvelopeData(response.data, 'Final exam update response is missing data.'), courseId)
  },

  async deleteFinalExam(courseId: string) {
    await api.delete(API_ENDPOINTS.courses.finalExam.base(courseId))
  },

  async createQuestion(courseId: string, payload: UpsertQuestionPayload) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.questions(courseId), payload)
    return toExamQuestion(requireEnvelopeData(response.data, 'Final exam question create response is missing data.'), 0)
  },

  async updateQuestion(courseId: string, questionId: string, payload: UpsertQuestionPayload) {
    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.question(courseId, questionId), payload)
    return toExamQuestion(requireEnvelopeData(response.data, 'Final exam question update response is missing data.'), 0)
  },

  async deleteQuestion(courseId: string, questionId: string) {
    await api.delete(API_ENDPOINTS.courses.finalExam.question(courseId, questionId))
  },

  async uploadQuestionImage(
    courseId: string,
    questionId: string,
    file: File,
    method: 'POST' | 'PUT' = 'POST',
  ) {
    const formData = new FormData()
    formData.append('file', file)

    if (method === 'PUT') {
      await api.put(API_ENDPOINTS.courses.finalExam.questionImage(courseId, questionId), formData)
      return
    }

    await api.post(API_ENDPOINTS.courses.finalExam.questionImage(courseId, questionId), formData)
  },

  async deleteQuestionImage(courseId: string, questionId: string) {
    await api.delete(API_ENDPOINTS.courses.finalExam.questionImage(courseId, questionId))
  },

  async getOverview(courseId: string) {
    const response = await api.get<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.overview(courseId))
    const payload = requireEnvelopeData(response.data, 'Final exam overview response is missing data.')
    return toStudentOverview(payload, courseId)
  },

  async startAttempt(courseId: string, payload?: { acceptedRules?: boolean }) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.attempts(courseId), payload ?? {})
    const source = toRecord(requireEnvelopeData(response.data, 'Final exam attempt start response is missing data.'))
    const nestedPayload = toRecord(source.data)
    const nestedAttempt = toRecord(
      source.attempt
      ?? source.activeAttempt
      ?? source.currentAttempt
      ?? nestedPayload.attempt
      ?? nestedPayload.activeAttempt
      ?? nestedPayload.currentAttempt
      ?? source.data,
    )
    const attemptId = normalizeAttemptId(
      toRecord(source.attempt).attemptId
      ?? toRecord(source.attempt).attempt_id
      ?? toRecord(nestedPayload.attempt).attemptId
      ?? toRecord(nestedPayload.attempt).attempt_id
      ?? source.attemptId
      ?? source.attempt_id
      ?? source.id
      ?? source.activeAttemptId
      ?? nestedAttempt.attemptId
      ?? nestedAttempt.attempt_id
      ?? nestedAttempt.id,
    ) ?? ''
    const attemptStatus = toAttemptStatus(
      toRecord(source.attempt).status
      ?? toRecord(nestedPayload.attempt).status
      ?? source.attemptStatus
      ?? source.attempt_status
      ?? source.status
      ?? nestedAttempt.status,
    )

    return {
      attemptId,
      attemptStatus,
      status: attemptStatus,
      createdNewAttempt: toBoolean(source.createdNewAttempt ?? source.created_new_attempt ?? nestedPayload.createdNewAttempt ?? nestedPayload.created_new_attempt),
      courseId: toId(source.courseId ?? source.course_id ?? nestedAttempt.courseId ?? nestedAttempt.course_id),
      remainingAttempts: toNumber(source.remainingAttempts ?? source.remaining_attempts ?? nestedAttempt.remainingAttempts ?? nestedAttempt.remaining_attempts),
      message: toText(source.message ?? source.reason ?? source.errorMessage ?? nestedPayload.message),
    } satisfies StartExamAttemptResponse
  },

  async getAttempt(courseId: string, attemptId: string) {
    const response = await api.get<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.attempt(courseId, attemptId))
    const payload = requireEnvelopeData(response.data, 'Final exam attempt response is missing data.')
    const mappedData = toExamAttempt(payload)

    if (mappedData) {
      return mappedData
    }

    const mappingError = new Error('Attempt response received but mapper failed')
    ;(mappingError as Error & { code?: string, rawResponse?: unknown }).code = 'FINAL_EXAM_ATTEMPT_MAPPING_FAILED'
    ;(mappingError as Error & { code?: string, rawResponse?: unknown }).rawResponse = response.data
    throw mappingError
  },

  async saveAttemptAnswers(courseId: string, attemptId: string, payload: SaveAttemptAnswersPayload) {
    const response = await api.put<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.attemptAnswers(courseId, attemptId), payload)
    const data = requireEnvelopeData(response.data, 'Final exam answer save response is missing data.')
    return toExamAttempt(data)
  },

  async submitAttempt(courseId: string, attemptId: string) {
    const response = await api.post<ApiEnvelope<unknown>>(API_ENDPOINTS.courses.finalExam.attemptSubmit(courseId, attemptId), {})
    const source = toRecord(requireEnvelopeData(response.data, 'Final exam submit response is missing data.'))
    const summaryFromPayload = toAttemptSummary(source.summary ?? source.attemptSummary ?? source)
    const nestedData = toRecord(source.data)
    const nestedResult = toRecord(source.result)
    const attemptPayload =
      source.attempt
      ?? source.currentAttempt
      ?? nestedData.attempt
      ?? nestedData.currentAttempt
      ?? nestedResult.attempt
      ?? source
    let attempt = toExamAttempt(attemptPayload)

    if (!attempt) {
      try {
        attempt = await finalExamService.getAttempt(courseId, attemptId)
      } catch {
        attempt = null
      }
    }

    if (!attempt) {
      const fallbackSummary = summaryFromPayload ?? {
        attemptId,
        status: toAttemptStatus(source.status ?? 'SUBMITTED'),
        resultStatus: toResultStatus(source.resultStatus ?? source.result),
        score: toNumber(source.score),
        startedAt: toText(source.startedAt ?? source.started_at),
        submittedAt: toText(source.submittedAt ?? source.submitted_at),
        remainingAttempts: toNumber(source.remainingAttempts ?? source.remaining_attempts),
      }

      attempt = {
        id: fallbackSummary.attemptId || attemptId,
        courseId,
        examId: toId(source.finalExamId ?? source.final_exam_id ?? source.examId ?? source.exam_id) ?? 'final-exam',
        status: fallbackSummary.status,
        resultStatus: fallbackSummary.resultStatus,
        startedAt: fallbackSummary.startedAt,
        expiresAt: null,
        submittedAt: fallbackSummary.submittedAt,
        score: fallbackSummary.score,
        passingScore: toNumber(source.passingScore ?? source.passing_score),
        remainingAttempts: fallbackSummary.remainingAttempts,
        certificateEligibility: toCertificateEligibility(source.certificateEligibility ?? source),
        questions: [],
        answers: [],
      }
    }

    const summary = summaryFromPayload ?? {
      attemptId: attempt.id,
      status: attempt.status,
      resultStatus: attempt.resultStatus,
      score: attempt.score,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      remainingAttempts: attempt.remainingAttempts,
    }

    return {
      attempt,
      summary,
      certificateEligibility: toCertificateEligibility(source.certificateEligibility ?? attempt.certificateEligibility),
    } satisfies SubmitExamResponse
  },

  async terminateAttempt(courseId: string, attemptId: string, payload?: { reason?: TerminateAttemptReason }) {
    const response = await api.post<ApiEnvelope<unknown>>(
      API_ENDPOINTS.courses.finalExam.attemptTerminate(courseId, attemptId),
      {},
      {
        params: payload?.reason ? { reason: payload.reason } : undefined,
      },
    )
    const source = toRecord(requireEnvelopeData(response.data, 'Final exam terminate response is missing data.'))
    const attempt = toExamAttempt(source.attempt ?? source)

    if (attempt) {
      return attempt
    }

    return null
  },
}
