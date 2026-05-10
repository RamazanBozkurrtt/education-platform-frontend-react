import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import TopNavbar from '../components/navigation/TopNavbar'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../hooks/useLanguage'
import { ROUTES } from '../utils/constants'

const DashboardLayout = () => {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isInstructorRoute = pathname.startsWith('/instructor')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (!user) {
    return null
  }

  const customTitles = language === 'tr'
    ? {
      becomeInstructor: 'Egitmen Ol',
      unauthorized: 'Yetkisiz Erisim',
      instructorDashboard: 'Egitmen Paneli',
      instructorProfile: 'Egitmen Profilim',
      instructorNewCourse: 'Yeni Kurs Olustur',
      instructorVideo: 'Video Yukle',
    }
    : {
      becomeInstructor: 'Become Instructor',
      unauthorized: 'Unauthorized',
      instructorDashboard: 'Instructor Panel',
      instructorProfile: 'Instructor Profile',
      instructorNewCourse: 'Create New Course',
      instructorVideo: 'Upload Video',
    }

  const pageTitle = pathname.startsWith('/courses/') && pathname.endsWith('/watch')
    ? t('routes.watchCourse')
    : pathname === ROUTES.becomeInstructor
      ? customTitles.becomeInstructor
      : pathname === ROUTES.unauthorized
        ? customTitles.unauthorized
      : pathname === ROUTES.instructorDashboard
        ? customTitles.instructorDashboard
      : pathname === ROUTES.instructorProfile
        ? customTitles.instructorProfile
      : pathname === ROUTES.instructorNewCourse
        ? customTitles.instructorNewCourse
      : pathname.includes('/videos/new') && isInstructorRoute
        ? customTitles.instructorVideo
    : pathname.startsWith('/courses/')
      ? t('routes.courseDetails')
      : pathname === ROUTES.profile
        ? t('routes.profile')
    : (
        {
          [ROUTES.dashboard]: t('routes.dashboard'),
          [ROUTES.myCourses]: t('routes.myCourses'),
          '/courses': t('routes.courses'),
          '/cart': t('routes.cart'),
          '/payment': t('routes.payment'),
          '/search': t('routes.search'),
        }[pathname] ?? t('routes.workspace')
      )

  return (
    <div className="theme-app min-h-screen overflow-x-clip">
      <div className="dashboard-shell mx-auto flex min-h-screen w-full max-w-[1680px] gap-4 px-3 py-3 sm:px-4 lg:gap-6 lg:px-6 lg:py-5">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />

        <div className="flex min-h-0 flex-1 flex-col pb-6 lg:pb-8">
          <TopNavbar onOpenMobileMenu={() => setMobileOpen(true)} title={pageTitle} user={user} />
          <main className="dashboard-content min-w-0 flex-1 pt-6 lg:pt-8">
            <div className="mx-auto w-full max-w-[1380px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
