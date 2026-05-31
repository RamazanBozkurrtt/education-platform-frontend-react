import type { ReactNode } from 'react'
import DashboardSection from '../dashboard/DashboardSection'
import EmptyState from '../dashboard/EmptyState'
import type { RecommendationCourse } from '../../utils/types'
import RecommendationCourseCard from './RecommendationCourseCard'
import RecommendationSkeleton from './RecommendationSkeleton'

interface RecommendationSectionProps {
  title: string
  description: string
  language: 'en' | 'tr'
  recommendations: RecommendationCourse[]
  isLoading?: boolean
  errorMessage?: string | null
  emptyTitle: string
  emptyDescription: string
  action?: ReactNode
}

const RecommendationSection = ({
  action,
  description,
  emptyDescription,
  emptyTitle,
  errorMessage,
  isLoading = false,
  language,
  recommendations,
  title,
}: RecommendationSectionProps) => (
  <DashboardSection action={action} description={description} title={title}>
    {isLoading ? (
      <RecommendationSkeleton count={3} />
    ) : errorMessage ? (
      <EmptyState
        description={errorMessage}
        title={language === 'tr' ? 'Oneriler su anda yuklenemedi.' : 'Recommendations are unavailable right now.'}
      />
    ) : recommendations.length === 0 ? (
      <EmptyState
        description={emptyDescription}
        title={emptyTitle}
      />
    ) : (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {recommendations.map((item) => (
          <RecommendationCourseCard item={item} key={`${item.courseId}-${item.title}`} language={language} />
        ))}
      </div>
    )}
  </DashboardSection>
)

export default RecommendationSection

