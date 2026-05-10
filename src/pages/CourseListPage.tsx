import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Filter, GraduationCap, Star, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import PageHeader from '../components/PageHeader'
import CourseCard from '../components/CourseCard'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { getCourseCategoryFilterKey, getCourseCategoryLabel } from '../utils/courseCategory'

const parseStudentCount = (value: string) => {
  const normalized = value.trim().toLowerCase()

  if (normalized.endsWith('k')) {
    return Math.round(Number.parseFloat(normalized) * 1000)
  }

  return Number.parseInt(normalized.replace(/,/g, ''), 10)
}

const CourseListPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('')

  const copy = language === 'tr'
    ? {
      eyebrow: 'Kursları keşfet',
      title: 'Kurslar',
      description: 'Kategoriye gore filtrele ve kurslari karsilastir.',
      programs: 'Kurs',
      enrolledLearners: 'Ogrenci',
      averageRating: 'Ortalama puan',
      filterTitle: 'Kategori',
      filterDescription: 'Listede gormek istedigin kategoriyi sec.',
    }
    : {
      eyebrow: 'Explore courses',
      title: 'Courses',
      description: 'Filter by category and compare courses.',
      programs: 'Courses',
      enrolledLearners: 'Learners',
      averageRating: 'Average rating',
      filterTitle: 'Category',
      filterDescription: 'Choose the category you want to see.',
    }

  const { data, error, isLoading } = useQuery({
    queryKey: ['courses', language],
    queryFn: () => courseService.getCourses(language),
  })

  useEffect(() => {
    setActiveCategory('')
  }, [language])

  const categories = useMemo(() => {
    if (!data) {
      return []
    }

    return Array.from(
      data.reduce<Map<string, { key: string; label: string }>>((map, course) => {
        const key = getCourseCategoryFilterKey(course)

        if (!map.has(key)) {
          map.set(key, {
            key,
            label: getCourseCategoryLabel(course),
          })
        }

        return map
      }, new Map()).values(),
    )
  }, [data])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseCatalog')} />
  }

  const filteredCourses = activeCategory === ''
    ? data
    : data.filter((course) => getCourseCategoryFilterKey(course) === activeCategory)
  const totalStudents = data.reduce((sum, course) => sum + parseStudentCount(course.students), 0)
  const averageRating = (data.reduce((sum, course) => sum + course.rating, 0) / data.length).toFixed(1)

  return (
    <div className="space-y-7">
      <PageHeader
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

      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-navigation)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
              <GraduationCap className="h-4 w-4" />
            </div>
            <p className="theme-muted mt-3 text-sm">{copy.programs}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">{data.length}</p>
          </div>
          <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-navigation)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
              <UsersRound className="h-4 w-4" />
            </div>
            <p className="theme-muted mt-3 text-sm">{copy.enrolledLearners}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">{totalStudents.toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')}</p>
          </div>
          <div className="rounded-[var(--radius-cards)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-navigation)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
              <Star className="h-4 w-4" />
            </div>
            <p className="theme-muted mt-3 text-sm">{copy.averageRating}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">{averageRating}</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="theme-heading text-sm font-semibold">{copy.filterTitle}</p>
        <p className="theme-muted mt-1 text-sm">{copy.filterDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-[var(--radius-badges)] border px-4 py-2 text-sm font-medium transition ${
              activeCategory === ''
                ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
            }`}
            onClick={() => setActiveCategory('')}
            type="button"
          >
            {t('common.all')}
          </button>
          {categories.map((category) => (
            <button
              className={`rounded-[var(--radius-badges)] border px-4 py-2 text-sm font-medium transition ${
                activeCategory === category.key
                  ? 'border-[color:var(--primary)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]'
                  : 'border-[color:var(--border)] bg-[color:var(--surface-strong)] theme-muted hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]'
              }`}
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              type="button"
            >
              {category.label}
            </button>
          ))}
        </div>
      </Card>

      {filteredCourses.length > 0 ? (
        <section className="grid auto-rows-fr gap-6 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard course={course} key={course.id} />
          ))}
        </section>
      ) : (
        <Card className="text-center">
          <h2 className="theme-heading text-xl font-semibold">
            {language === 'tr' ? 'Filtreye uygun kurs bulunamadi' : 'No courses match this filter'}
          </h2>
          <p className="theme-muted mt-2 text-sm">
            {language === 'tr' ? 'Kategori secimini degistirip tekrar dene.' : 'Try changing the selected category.'}
          </p>
        </Card>
      )}
    </div>
  )
}

export default CourseListPage
