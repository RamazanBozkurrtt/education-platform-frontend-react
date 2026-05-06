import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BriefcaseBusiness, GraduationCap, SlidersHorizontal, Star, UsersRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import CourseCard from '../components/CourseCard'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
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
      title: 'İlgilendiğin alandaki kursları karşılaştır',
      description:
        'Kursların seviye, süre, eğitmen ve puan bilgilerini incele. Sana uygun eğitimleri kategoriye göre filtreleyebilirsin.',
      programs: 'Kurs',
      enrolledLearners: 'Katılımcı',
      averageRating: 'Ortalama puan',
      sidebarTitle: 'Kurs seçimini kolaylaştır',
      sidebarDescription: 'Disipline ve seviyeye göre daha uygun kursları kısa listeye al.',
      collectionFocus: 'Katalog odağı',
      tracks: 'Ürün, veri, tasarım ve mühendislik kursları',
      trackDescription:
        'Katalog, farklı hedeflere uygun kursları sakin ve okunabilir bir düzende sunar.',
    }
    : {
      catalogLabel: 'Course catalog',
      title: 'Compare courses in the area you want to improve',
      description:
        'Review level, duration, instructor, and rating details. Use categories to narrow the catalog to courses that fit your goal.',
      programs: 'Courses',
      enrolledLearners: 'Learners',
      averageRating: 'Average rating',
      sidebarTitle: 'Make course selection easier',
      sidebarDescription: 'Shortlist courses by discipline and level.',
      collectionFocus: 'Catalog focus',
      tracks: 'Product, data, design, and engineering courses',
      trackDescription:
        'The catalog presents courses for different goals in a clean, easy-to-scan layout.',
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
  const filteredCourses =
    activeCategory === ''
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

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="glass-panel overflow-hidden rounded-[24px] border border-white/10">
          <div className="border-b border-white/8 px-6 py-6 md:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">{copy.catalogLabel}</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-[2.45rem]">
              {copy.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 md:text-base">
              {copy.description}
            </p>
          </div>
          <div className="grid gap-4 px-6 py-6 md:grid-cols-3 md:px-8">
            <div className="rounded-[20px] border border-white/8 bg-[color:var(--surface-muted)] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--primary)] text-white">
                <GraduationCap className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{copy.programs}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{data.length}</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-[color:var(--surface-muted)] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <UsersRound className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{copy.enrolledLearners}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{totalStudents}k</p>
            </div>
            <div className="rounded-[20px] border border-white/8 bg-[color:var(--surface-muted)] p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-slate-900">
                <Star className="h-5 w-5" />
              </div>
              <p className="mt-4 text-sm text-slate-500">{copy.averageRating}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{averageRating}</p>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[24px] border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--primary)] text-white">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{copy.sidebarTitle}</p>
              <p className="mt-1 text-sm text-slate-400">{copy.sidebarDescription}</p>
            </div>
          </div>
          <div className="mt-6 rounded-[20px] border border-dashed border-white/10 bg-[color:var(--surface-muted)] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{copy.collectionFocus}</p>
            <p className="mt-3 text-lg font-semibold text-white">{copy.tracks}</p>
            <p className="mt-3 text-sm leading-7 text-slate-400">
              {copy.trackDescription}
            </p>
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[24px] border border-white/10 p-5">
        <div className="flex flex-wrap gap-3">
          <button
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              activeCategory === ''
                ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
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
                  ? 'border-white/14 bg-[color:var(--surface-strong)] text-slate-100 shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
                  : 'border-white/10 bg-[color:var(--surface-muted)] text-slate-400 hover:border-white/16 hover:text-white'
              }`}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="grid auto-rows-fr gap-6 xl:grid-cols-3">
        {filteredCourses.map((course) => (
          <CourseCard course={course} key={course.id} />
        ))}
      </section>
    </div>
  )
}

export default CourseListPage
