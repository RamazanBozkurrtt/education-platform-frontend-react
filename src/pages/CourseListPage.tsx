import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { GraduationCap, SlidersHorizontal, Star, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCard from '../components/CourseCard'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'

const CourseListPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('')

  const copy = language === 'tr'
    ? {
      catalogLabel: 'Kurs kataloğu',
      title: 'Kursları karşılaştır',
      description: 'Kategorilere göre filtrele, içerikleri karşılaştır ve sana uygun kursu seç.',
      programs: 'Kurs',
      enrolledLearners: 'Katılımcı',
      averageRating: 'Ortalama puan',
      filterTitle: 'Kategori',
      filterDescription: 'Listede görmek istediğin kategoriyi seç.',
    }
    : {
      catalogLabel: 'Course catalog',
      title: 'Compare courses',
      description: 'Filter by category, compare course details, and pick what fits your goal.',
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

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !data) {
    return <Loader label={t('loader.courseCatalog')} />
  }

  const categories = [...new Set(data.map((course) => course.category))]
  const filteredCourses = activeCategory === ''
    ? data
    : data.filter((course) => course.category === activeCategory)
  const totalStudents = data.reduce((sum, course) => sum + Number.parseFloat(course.students), 0).toFixed(1)
  const averageRating = (data.reduce((sum, course) => sum + course.rating, 0) / data.length).toFixed(1)

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button variant="secondary">
            <SlidersHorizontal className="h-4 w-4" />
            {t('common.advancedFilters')}
          </Button>
        }
        description={t('courseList.description')}
        eyebrow={t('courseList.eyebrow')}
        title={t('courseList.title')}
      />

      <Card>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{copy.catalogLabel}</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">{copy.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">{copy.description}</p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[color:var(--primary)] text-white">
              <GraduationCap className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm text-slate-400">{copy.programs}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{data.length}</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white">
              <UsersRound className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm text-slate-400">{copy.enrolledLearners}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{totalStudents}k</p>
          </div>
          <div className="rounded-lg border border-white/8 bg-[color:var(--surface-muted)] p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-amber-400 text-slate-900">
              <Star className="h-4 w-4" />
            </div>
            <p className="mt-3 text-sm text-slate-400">{copy.averageRating}</p>
            <p className="mt-1 text-2xl font-semibold text-white">{averageRating}</p>
          </div>
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-white">{copy.filterTitle}</p>
        <p className="mt-1 text-sm text-slate-400">{copy.filterDescription}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategory === ''
                ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                : 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
            }`}
            onClick={() => setActiveCategory('')}
            type="button"
          >
            {t('common.all')}
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                activeCategory === category
                  ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100'
                  : 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
              }`}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </Card>

      <section className="grid auto-rows-fr gap-6 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </section>
    </div>
  )
}

export default CourseListPage
