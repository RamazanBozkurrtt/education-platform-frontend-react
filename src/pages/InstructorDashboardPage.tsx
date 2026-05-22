import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CirclePlay, PlusCircle, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardPageHeader from '../components/dashboard/DashboardPageHeader'
import DashboardSection from '../components/dashboard/DashboardSection'
import EmptyState from '../components/dashboard/EmptyState'
import MetricTile from '../components/dashboard/MetricTile'
import StatusBadge from '../components/dashboard/StatusBadge'
import TableShell from '../components/dashboard/TableShell'
import Button from '../components/ui/Button'
import Loader from '../components/ui/Loader'
import QueryErrorState from '../components/ui/QueryErrorState'
import { useLanguage } from '../hooks/useLanguage'
import { courseService } from '../services/courseService'
import { ROUTES } from '../utils/constants'
import { getCourseCategoryLabel } from '../utils/courseCategory'

const InstructorDashboardPage = () => {
  const { language } = useLanguage()
  const copy = language === 'tr'
    ? {
      eyebrow: 'Egitmen paneli',
      title: 'Kurs yonetimi',
      description: 'Kurslarini, ders planini ve video yukleme surecini bu sayfadan yonet.',
      myCourses: 'Kurslar',
      newCourse: 'Yeni kurs',
      profile: 'Profil',
      totalCourses: 'Toplam kurs',
      publishedCourses: 'Yayindaki kurs',
      totalLessons: 'Toplam ders',
      totalStudents: 'Ogrenci',
      noCourse: 'Henuz kurs olusturmadin.',
      noCourseHint: 'Ilk kursunu olusturarak paneldeki yonetim alanlarini aktif hale getirebilirsin.',
      goToCourseCreate: 'Ilk kursunu olustur',
      addVideo: 'Yonet',
      tableCourse: 'Kurs',
      tableCategory: 'Kategori',
      tableLevel: 'Seviye',
      tableLessons: 'Ders',
      tableStudents: 'Ogrenci',
      tableStatus: 'Durum',
      tableActions: 'Islem',
      statusPublished: 'Yayinda',
      statusDraft: 'Taslak',
      panelHint: 'Ders/video yonetimi icin ilgili kursu acip icerik ekranina gecebilirsin.',
    }
    : {
      eyebrow: 'Instructor panel',
      title: 'Course operations',
      description: 'Manage course delivery, lesson plans, and video uploads from one place.',
      myCourses: 'Courses',
      newCourse: 'New course',
      profile: 'Profile',
      totalCourses: 'Total courses',
      publishedCourses: 'Published courses',
      totalLessons: 'Total lessons',
      totalStudents: 'Learners',
      noCourse: 'No courses yet.',
      noCourseHint: 'Create your first course to unlock course management and lesson workflows.',
      goToCourseCreate: 'Create first course',
      addVideo: 'Manage',
      tableCourse: 'Course',
      tableCategory: 'Category',
      tableLevel: 'Level',
      tableLessons: 'Lessons',
      tableStudents: 'Learners',
      tableStatus: 'Status',
      tableActions: 'Action',
      statusPublished: 'Published',
      statusDraft: 'Draft',
      panelHint: 'Open a course to manage lessons and upload video content.',
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
      { label: copy.totalCourses, value: totalCourses.toString(), tone: 'neutral' as const },
      { label: copy.publishedCourses, value: publishedCourses.toString(), tone: 'success' as const },
      { label: copy.totalLessons, value: totalLessons.toString(), tone: 'primary' as const },
      { label: copy.totalStudents, value: Math.round(totalStudents).toLocaleString('en-US'), tone: 'warning' as const },
    ]
  }, [copy.publishedCourses, copy.totalCourses, copy.totalLessons, copy.totalStudents, courses])

  if (error) {
    return <QueryErrorState error={error} />
  }

  if (isLoading || !courses) {
    return <Loader label={language === 'tr' ? 'Egitmen paneli yukleniyor...' : 'Loading instructor dashboard...'} />
  }

  return (
    <div className="space-y-8">
      <DashboardPageHeader
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

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <MetricTile key={stat.label} label={stat.label} tone={stat.tone} value={stat.value} />
        ))}
      </section>

      <DashboardSection title={copy.myCourses}>
        {courses.length === 0 ? (
          <EmptyState
            action={(
              <Link className="inline-flex" to={ROUTES.instructorNewCourse}>
                <Button asChild>{copy.goToCourseCreate}</Button>
              </Link>
            )}
            description={copy.noCourseHint}
            title={copy.noCourse}
          />
        ) : (
          <TableShell>
            <table className="min-w-[780px] w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--surface-soft)] text-left">
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableCourse}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableCategory}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableLevel}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableLessons}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableStudents}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableStatus}</th>
                  <th className="theme-subtle px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em]">{copy.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {courses.slice(0, 6).map((course) => (
                  <tr className="border-b border-[color:var(--border)] last:border-b-0" key={course.id}>
                    <td className="px-4 py-3.5">
                      <p className="theme-heading font-medium">{course.title}</p>
                    </td>
                    <td className="theme-muted px-4 py-3.5">{getCourseCategoryLabel(course)}</td>
                    <td className="theme-muted px-4 py-3.5">{course.level.levelName}</td>
                    <td className="theme-muted px-4 py-3.5">{course.lessons}</td>
                    <td className="theme-muted px-4 py-3.5">{course.students}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge tone={course.progress > 0 ? 'success' : 'default'}>
                        {course.progress > 0 ? copy.statusPublished : copy.statusDraft}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link to={ROUTES.instructorNewCourseVideo(course.id)}>
                        <Button size="sm" variant="secondary">
                          <CirclePlay className="h-4 w-4" />
                          {copy.addVideo}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </DashboardSection>

      <div className="border-t border-[color:var(--border)] pt-4">
        <p className="theme-muted text-sm">{copy.panelHint}</p>
      </div>
    </div>
  )
}

export default InstructorDashboardPage

