import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Filter, SlidersHorizontal, Star, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCatalogList from '../components/dashboard/CourseCatalogList'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { getCourseCategoryEntries, getCourseCategoryFilterKeys } from '../utils/courseCategory'
import { parseStudentCount } from '../utils/helpers'

const chipClass = (active: boolean) => {
  if (active) {
    return 'inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-[color:var(--primary)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm font-semibold text-[color:var(--primary)]'
  }

  return 'inline-flex min-h-8 items-center gap-1.5 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm font-medium theme-muted transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
}

const CourseListPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('')
  const [activeLevel, setActiveLevel] = useState('')

  const copy = language === 'tr'
    ? {
      eyebrow: 'Kurs katalogu',
      title: 'Kurslar',
      description: 'Kategori ve seviyeye göre filtreleyerek uygun kursları karşılaştır.',
      programs: 'Kurs',
      enrolledLearners: 'Öğrenci',
      averageRating: 'Ortalama puan',
      categoryFilterTitle: 'Kategori',
      levelFilterTitle: 'Seviye',
      filterToolbarTitle: 'Katalog filtreleri',
      activeFilters: 'Aktif filtre',
      filteredResults: 'Sonuç',
      noResultsTitle: 'Filtreye uygun kurs bulunamadı',
      noResultsDescription: 'Kategori veya seviye seçimini değiştirip tekrar dene.',
    }
    : {
      eyebrow: 'Course catalog',
      title: 'Courses',
      description: 'Filter by category and level to compare the right courses.',
      programs: 'Courses',
      enrolledLearners: 'Learners',
      averageRating: 'Average rating',
      categoryFilterTitle: 'Category',
      levelFilterTitle: 'Level',
      filterToolbarTitle: 'Catalog filters',
      activeFilters: 'Active filters',
      filteredResults: 'Results',
      noResultsTitle: 'No courses match this filter',
      noResultsDescription: 'Try changing the selected category or level.',
    }

  const { data, error, isLoading } = useQuery({
    queryKey: ['courses', language],
    queryFn: () => courseService.getCourses(language),
  })

  useEffect(() => {
    setActiveCategory('')
    setActiveLevel('')
  }, [language])

  const categories = useMemo(() => {
    if (!data) {
      return []
    }

    return Array.from(
      data.reduce<Map<string, { key: string; label: string; count: number }>>((map, course) => {
        const entries = getCourseCategoryEntries(course)

        entries.forEach(({ key, label }) => {
          const current = map.get(key)

          map.set(key, {
            key,
            label,
            count: (current?.count ?? 0) + 1,
          })
        })

        return map
      }, new Map()).values(),
    )
  }, [data])

  const levels = useMemo(
    () => {
      if (!data) {
        return []
      }

      return Array.from(
        data.reduce<Map<string, { key: string; label: string; count: number }>>((map, course) => {
          const current = map.get(course.levelKey)

          map.set(course.levelKey, {
            key: course.levelKey,
            label: course.level.levelName,
            count: (current?.count ?? 0) + 1,
          })

          return map
        }, new Map()).values(),
      )
    },
    [data],
  )

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseCatalog')} />
  }

  const filteredByCategory = activeCategory === ''
    ? data
    : data.filter((course) => getCourseCategoryFilterKeys(course).includes(activeCategory))
  const filteredCourses = activeLevel === ''
    ? filteredByCategory
    : filteredByCategory.filter((course) => course.levelKey === activeLevel)
  const totalStudents = data.reduce((sum, course) => sum + (course.studentsCount ?? parseStudentCount(course.students) ?? 0), 0)
  const ratedCourses = data.filter((course) => (course.ratingCount ?? 0) > 0 || course.rating > 0)
  const averageRating = ratedCourses.length > 0
    ? (ratedCourses.reduce((sum, course) => sum + course.rating, 0) / ratedCourses.length).toFixed(1)
    : (language === 'tr' ? 'Yok' : 'N/A')
  const activeFilterCount = [activeCategory, activeLevel].filter(Boolean).length
  const summaryMetrics = [
    {
      icon: BookOpen,
      label: copy.programs,
      value: String(data.length),
    },
    {
      icon: UsersRound,
      label: copy.enrolledLearners,
      value: totalStudents.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US'),
    },
    {
      icon: Star,
      label: copy.averageRating,
      value: averageRating,
    },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        actions={(
          <Button variant="secondary">
            <Filter className="h-4 w-4" />
            {t('common.advancedFilters')}
          </Button>
        )}
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <section
        aria-label={copy.programs}
        className="grid overflow-hidden rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] md:grid-cols-3"
      >
        {summaryMetrics.map((metric) => {
          const Icon = metric.icon

          return (
            <div className="flex items-center gap-3 border-b border-[color:var(--border)] px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0" key={metric.label}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)]">
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="theme-subtle truncate text-[11px] font-semibold uppercase tracking-[0.08em]">{metric.label}</p>
                <p className="theme-heading mt-0.5 text-xl font-semibold leading-tight">{metric.value}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)]">
        <div className="flex flex-col gap-3 border-b border-[color:var(--border)] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[color:var(--text-muted)]" />
            <p className="theme-heading text-sm font-semibold">{copy.filterToolbarTitle}</p>
          </div>
          <div className="theme-subtle flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span>{copy.activeFilters}: {activeFilterCount}</span>
            <span>{copy.filteredResults}: {filteredCourses.length}</span>
          </div>
        </div>

        <div className="grid gap-4 px-4 py-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.72fr)]">
          <div>
            <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em]">{copy.categoryFilterTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={chipClass(activeCategory === '')} onClick={() => setActiveCategory('')} type="button">
                {t('common.all')}
                <span className="theme-subtle text-xs">{data.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  className={chipClass(activeCategory === category.key)}
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  type="button"
                >
                  {category.label}
                  <span className="theme-subtle text-xs">{category.count}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.08em]">{copy.levelFilterTitle}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className={chipClass(activeLevel === '')} onClick={() => setActiveLevel('')} type="button">
                {t('common.all')}
                <span className="theme-subtle text-xs">{data.length}</span>
              </button>
              {levels.map((level) => (
                <button
                  className={chipClass(activeLevel === level.key)}
                  key={level.key}
                  onClick={() => setActiveLevel(level.key)}
                  type="button"
                >
                  {level.label}
                  <span className="theme-subtle text-xs">{level.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <DashboardSection
        description={`${filteredCourses.length} / ${data.length}`}
        title={t('routes.courses')}
      >
        {filteredCourses.length > 0 ? (
          <CourseCatalogList courses={filteredCourses} />
        ) : (
          <EmptyState description={copy.noResultsDescription} title={copy.noResultsTitle} />
        )}
      </DashboardSection>
    </div>
  )
}

export default CourseListPage
