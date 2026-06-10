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
      becomeInstructor: 'Eğitmen Ol',
      unauthorized: 'Yetkisiz Erişim',
      instructorDashboard: 'Eğitmen Paneli',
      instructorProfile: 'Eğitmen Profilim',
      instructorNewCourse: 'Yeni Kurs Oluştur',
      instructorVideo: 'Video Yükle',
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
          [ROUTES.courses]: t('routes.courses'),
          [ROUTES.cart]: t('routes.cart'),
          [ROUTES.payment]: t('routes.payment'),
          [ROUTES.payments]: language === 'tr' ? 'Ödemelerim' : 'My Payments',
          [ROUTES.search]: t('routes.search'),
        }[pathname] ?? t('routes.workspace')
      )

  return (
    <div className="theme-app min-h-screen overflow-x-clip">
      <div className="dashboard-shell mx-auto flex min-h-screen w-full max-w-[1680px] gap-3 px-2 py-2 sm:px-3 lg:gap-4 lg:px-4 lg:py-4">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />

        <div className="flex min-h-0 flex-1 flex-col pb-6 lg:pb-8">
          <TopNavbar onOpenMobileMenu={() => setMobileOpen(true)} title={pageTitle} user={user} />
          <main className="dashboard-content min-w-0 flex-1 pt-4 lg:pt-5">
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
