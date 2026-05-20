import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCatalogList from '../components/dashboard/CourseCatalogList'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import MetricTile from '../components/dashboard/MetricTile'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { getCourseCategoryEntries, getCourseCategoryFilterKeys } from '../utils/courseCategory'

const parseStudentCount = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (normalized.endsWith('k')) {
    return Math.round(Number.parseFloat(normalized) * 1000)
  }

  return Number.parseInt(normalized.replace(/,/g, ''), 10)
}

const chipClass = (active: boolean) => {
  if (active) {
    return 'rounded-sm border border-[color:var(--primary)] bg-[color:var(--surface-soft)] px-3 py-1.5 text-sm font-medium text-[color:var(--primary)]'
  }

  return 'rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-1.5 text-sm font-medium theme-muted transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
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
      description: 'Kategori ve seviyeye gore filtreleyerek uygun kurslari karsilastir.',
      programs: 'Kurs',
      enrolledLearners: 'Ogrenci',
      averageRating: 'Ortalama puan',
      categoryFilterTitle: 'Kategori',
      categoryFilterDescription: 'Listede gormek istedigin kategoriyi sec.',
      levelFilterTitle: 'Seviye',
      levelFilterDescription: 'Kurs seviyesine gore filtrele.',
      noResultsTitle: 'Filtreye uygun kurs bulunamadi',
      noResultsDescription: 'Kategori veya seviye secimini degistirip tekrar dene.',
    }
    : {
      eyebrow: 'Course catalog',
      title: 'Courses',
      description: 'Filter by category and level to compare the right courses.',
      programs: 'Courses',
      enrolledLearners: 'Learners',
      averageRating: 'Average rating',
      categoryFilterTitle: 'Category',
      categoryFilterDescription: 'Choose the category you want to see.',
      levelFilterTitle: 'Level',
      levelFilterDescription: 'Filter courses by level.',
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
      data.reduce<Map<string, { key: string; label: string }>>((map, course) => {
        const entries = getCourseCategoryEntries(course)

        entries.forEach(({ key, label }) => {
          if (!map.has(key)) {
            map.set(key, {
              key,
              label,
            })
          }
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
        data.reduce<Map<string, { key: string; label: string }>>((map, course) => {
          if (!map.has(course.levelKey)) {
            map.set(course.levelKey, {
              key: course.levelKey,
              label: course.level.levelName,
            })
          }

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
  const totalStudents = data.reduce((sum, course) => sum + parseStudentCount(course.students), 0)
  const averageRating = (data.reduce((sum, course) => sum + course.rating, 0) / data.length).toFixed(1)

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

      <section className="grid gap-3 md:grid-cols-3">
        <MetricTile hint={copy.programs} label={copy.programs} tone="primary" value={String(data.length)} />
        <MetricTile hint={copy.enrolledLearners} label={copy.enrolledLearners} tone="neutral" value={totalStudents.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} />
        <MetricTile hint={copy.averageRating} label={copy.averageRating} tone="warning" value={averageRating} />
      </section>

      <DashboardSection title={t('common.advancedFilters')}>
        <div className="space-y-5">
          <div>
            <p className="theme-heading text-sm font-semibold">{copy.categoryFilterTitle}</p>
            <p className="theme-muted mt-1 text-sm">{copy.categoryFilterDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={chipClass(activeCategory === '')} onClick={() => setActiveCategory('')} type="button">
                {t('common.all')}
              </button>
              {categories.map((category) => (
                <button
                  className={chipClass(activeCategory === category.key)}
                  key={category.key}
                  onClick={() => setActiveCategory(category.key)}
                  type="button"
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-[color:var(--border)] pt-4">
            <p className="theme-heading text-sm font-semibold">{copy.levelFilterTitle}</p>
            <p className="theme-muted mt-1 text-sm">{copy.levelFilterDescription}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className={chipClass(activeLevel === '')} onClick={() => setActiveLevel('')} type="button">
                {t('common.all')}
              </button>
              {levels.map((level) => (
                <button
                  className={chipClass(activeLevel === level.key)}
                  key={level.key}
                  onClick={() => setActiveLevel(level.key)}
                  type="button"
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection title={t('routes.courses')}>
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

