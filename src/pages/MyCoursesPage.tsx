import { ArrowRight, BookOpenCheck, CirclePlay, GraduationCap, LayoutGrid, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import MetaRow from '../components/ui/MetaRow'
import TagList from '../components/ui/TagList'
import { useLibrary } from '../hooks/useLibrary'
import { ROUTES } from '../utils/constants'

const MyCoursesPage = () => {
  const { t } = useTranslation()
  const { purchasedCourses } = useLibrary()
  const hasCourses = purchasedCourses.length > 0
  const totalLessons = purchasedCourses.reduce((sum, course) => sum + course.lessons, 0)
  const averageProgress = hasCourses
    ? Math.round(
      purchasedCourses.reduce((sum, course) => sum + course.progress, 0) / purchasedCourses.length,
    )
    : 0
  const categoryCount = new Set(purchasedCourses.map((course) => course.category)).size

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link to={ROUTES.courses}>
            <Button asChild variant="secondary">
              {t('myCourses.exploreMore')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
        description={t('myCourses.description')}
        eyebrow={t('myCourses.eyebrow')}
        title={t('myCourses.title')}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--primary)] text-white">
            <BookOpenCheck className="h-5 w-5" />
          </div>
          <p className="theme-muted mt-3 text-sm">{t('myCourses.stats.purchased')}</p>
          <p className="theme-heading mt-1 text-2xl font-semibold">{purchasedCourses.length}</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--surface-sky-haze)] text-[color:var(--primary)]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <p className="theme-muted mt-3 text-sm">{t('myCourses.stats.lessons')}</p>
          <p className="theme-heading mt-1 text-2xl font-semibold">{totalLessons}</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--surface-muted-mandarin)] text-[color:var(--text-heading)]">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="theme-muted mt-3 text-sm">{t('myCourses.stats.progress')}</p>
          <p className="theme-heading mt-1 text-2xl font-semibold">%{averageProgress}</p>
        </Card>

        <Card>
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--surface-soft-peach)] text-[color:var(--text-heading)]">
            <LayoutGrid className="h-5 w-5" />
          </div>
          <p className="theme-muted mt-3 text-sm">{t('myCourses.stats.categories')}</p>
          <p className="theme-heading mt-1 text-2xl font-semibold">{categoryCount}</p>
        </Card>
      </section>

      {hasCourses ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {purchasedCourses.map((course) => (
            <Card key={course.id}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="theme-muted rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs font-medium">
                  {course.category}
                </span>
                <span className="theme-muted rounded-full border border-[color:var(--border)] bg-[color:var(--surface-muted)] px-3 py-1 text-xs">
                  {course.level}
                </span>
              </div>

              <h2 className="theme-heading mt-4 text-xl font-semibold">{course.title}</h2>
              <p className="theme-muted mt-2 text-sm leading-6">{course.summary}</p>

              <MetaRow
                className="mt-4"
                items={[
                  { key: 'duration', label: t('myCourses.courseCard.duration'), value: course.duration },
                  { key: 'lessons', label: t('myCourses.courseCard.lessons'), value: t('courseCard.lessonsValue', { count: course.lessons }) },
                  { key: 'progress', label: t('myCourses.courseCard.progress'), value: t('dashboard.progressComplete', { progress: course.progress }) },
                ]}
              />

              <div className="mt-4">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="theme-muted">{t('myCourses.courseCard.resumeLabel')}</span>
                  <span className="theme-heading font-medium">{t('dashboard.progressComplete', { progress: course.progress })}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-[color:var(--surface-muted)]">
                  <div
                    className="h-2 rounded-full bg-[color:var(--primary)]"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 border-t border-[color:var(--border)] pt-4">
                <TagList hideWhenEmpty label="Etiketler" tags={course.tags.slice(0, 3)} />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link className="flex-1" to={ROUTES.coursePlayer(course.slug)}>
                  <Button asChild className="w-full justify-center">
                    <CirclePlay className="h-4 w-4" />
                    {t('myCourses.continueLearning')}
                  </Button>
                </Link>
                <Link className="flex-1" to={ROUTES.courseDetail(course.slug)}>
                  <Button asChild className="w-full justify-center" variant="ghost">
                    {t('common.viewDetails')}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </section>
      ) : (
        <Card className="px-6 py-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[color:var(--surface-sky-haze)] text-[color:var(--primary)]">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <h2 className="theme-heading mt-4 text-xl font-semibold">{t('myCourses.emptyTitle')}</h2>
          <p className="theme-muted mx-auto mt-2 max-w-2xl text-sm leading-6">
            {t('myCourses.emptyDescription')}
          </p>
          <Link className="mt-5 inline-flex" to={ROUTES.courses}>
            <Button asChild>
              {t('myCourses.exploreMore')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      )}
    </div>
  )
}

export default MyCoursesPage
