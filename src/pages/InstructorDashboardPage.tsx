import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CirclePlay, PlusCircle, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import InfoBadge from '../components/ui/InfoBadge'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import SectionHeader from '../components/ui/SectionHeader'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'

const InstructorDashboardPage = () => {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? {
      eyebrow: 'Eğitmen paneli',
      title: 'Kurslarini yonet',
      description: 'Kurs olusturma, ders/video yonetimi ve profil guncelleme adimlarini buradan yonetebilirsin.',
      myCourses: 'Kurslarim',
      newCourse: 'Yeni kurs',
      profile: 'Profil',
      totalCourses: 'Toplam kurs',
      publishedCourses: 'Yayındaki kurs',
      totalLessons: 'Toplam ders',
      totalStudents: 'Öğrenci',
      noCourse: 'Henuz kurs olusturmadin.',
      noCourseHint: 'Ilk kursunu olusturarak egitmen panelini kullanmaya baslayabilirsin.',
      goToCourseCreate: 'Ilk kursunu olustur',
      addVideo: 'Yonet',
    }
    : {
      eyebrow: 'Instructor panel',
      title: 'Manage your courses',
      description: 'Create courses, upload lesson videos, and keep your instructor profile updated.',
      myCourses: 'Your courses',
      newCourse: 'New course',
      profile: 'Profile',
      totalCourses: 'Total courses',
      publishedCourses: 'Published courses',
      totalLessons: 'Total lessons',
      totalStudents: 'Learners',
      noCourse: 'You have not created any courses yet.',
      goToCourseCreate: 'Create first course',
      addVideo: 'Manage',
    }

  const { data: courses, error, isLoading } = useQuery({
    queryKey: ['instructor-dashboard-courses', language],
    queryFn: () => courseService.getMyCourses(language, { audience: 'instructor' }),
  })

  const stats = useMemo(() => {
    const list = courses ?? []
    const totalCourses = list.length
    const publishedCourses = list.filter((course) => course.progress > 0).length
    const totalLessons = list.reduce((sum, course) => sum + course.lessons, 0)
    const totalStudents = list.reduce((sum, course) => {
      const asNumber = Number(course.students.replace(/[^0-9.]/g, ''))

      if (Number.isNaN(asNumber)) {
        return sum
      }

      const multiplier = course.students.toLocaleLowerCase('en-US').includes('k') ? 1000 : 1
      return sum + (asNumber * multiplier)
    }, 0)

    return [
      { label: copy.totalCourses, value: totalCourses.toString() },
      { label: copy.publishedCourses, value: publishedCourses.toString() },
      { label: copy.totalLessons, value: totalLessons.toString() },
      { label: copy.totalStudents, value: Math.round(totalStudents).toLocaleString('en-US') },
    ]
  }, [copy.publishedCourses, copy.totalCourses, copy.totalLessons, copy.totalStudents, courses])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !courses) {
    return <Loader label={language === 'tr' ? 'Eğitmen paneli yükleniyor...' : 'Loading instructor dashboard...'} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link to={ROUTES.instructorNewCourse}>
              <Button asChild>
                <PlusCircle className="h-4 w-4" />
                {copy.newCourse}
              </Button>
            </Link>
            <Link to={ROUTES.instructorProfile}>
              <Button asChild variant="secondary">
                <UserRound className="h-4 w-4" />
                {copy.profile}
              </Button>
            </Link>
          </>
        }
        description={copy.description}
        eyebrow={copy.eyebrow}
        title={copy.title}
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="theme-muted text-sm">{stat.label}</p>
            <p className="theme-heading mt-1 text-2xl font-semibold">{stat.value}</p>
          </Card>
        ))}
      </section>

      <Card>
        <SectionHeader title={copy.myCourses} />

        {courses.length === 0 ? (
          <div className="mt-4 rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] p-4">
            <p className="theme-heading text-sm font-semibold">{copy.noCourse}</p>
            <p className="theme-muted mt-2 text-sm">{copy.noCourseHint}</p>
            <Link className="mt-3 inline-flex" to={ROUTES.instructorNewCourse}>
              <Button asChild>{copy.goToCourseCreate}</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {courses.slice(0, 6).map((course) => (
              <div key={course.id} className="rounded-[var(--radius-buttons)] border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="theme-heading font-medium">{course.title}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <InfoBadge>{getCourseCategoryLabel(course)}</InfoBadge>
                      <InfoBadge>{course.level}</InfoBadge>
                    </div>
                  </div>
                  <Link to={ROUTES.instructorNewCourseVideo(course.id)}>
                    <Button size="sm" variant="secondary">
                      <CirclePlay className="h-4 w-4" />
                      {copy.addVideo}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-[color:var(--primary)]" />
          <p className="theme-muted text-sm">
            {language === 'tr'
              ? 'Ders/video yonetimi icin kurs secip ilgili kurs ekranina gec.'
              : 'Choose a course and open its management page to upload videos.'}
          </p>
        </div>
      </Card>
    </div>
  )
}

export default InstructorDashboardPage
