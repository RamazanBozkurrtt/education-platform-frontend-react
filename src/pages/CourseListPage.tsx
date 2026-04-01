import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCard from '../components/CourseCard'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'

const CourseListPage = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [activeCategory, setActiveCategory] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['courses', language],
    queryFn: () => courseService.getCourses(language),
  })

  useEffect(() => {
    setActiveCategory('')
  }, [language])

  if (isLoading || !data) {
    return <Loader label={t('loader.courseCatalog')} />
  }

  const categories = [...new Set(data.map((course) => course.category))]
  const filteredCourses =
    activeCategory === ''
      ? data
      : data.filter((course) => course.category === activeCategory)

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

      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            activeCategory === ''
              ? 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100'
              : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
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
                ? 'border-cyan-300/30 bg-cyan-400/12 text-cyan-100'
                : 'border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white'
            }`}
            onClick={() => setActiveCategory(category)}
            type="button"
          >
            {category}
          </button>
        ))}
      </div>

      <section className="grid auto-rows-fr gap-6 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </section>
    </div>
  )
}

export default CourseListPage
