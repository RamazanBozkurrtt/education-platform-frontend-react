import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import TopNavbar from '../components/navigation/TopNavbar'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'

const DashboardLayout = () => {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (!user) {
    return null
  }

  const pageTitle = pathname.startsWith('/courses/') && pathname.endsWith('/watch')
    ? t('routes.watchCourse')
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
    <div className="theme-app min-h-screen">
      <div className="page-shell mx-auto flex max-w-[1600px] gap-4 px-4 py-4">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />

        <div className="flex min-h-[calc(100vh-2rem)] flex-1 flex-col pb-8">
          <TopNavbar onOpenMobileMenu={() => setMobileOpen(true)} title={pageTitle} user={user} />
          <main className="mt-6 flex-1 pb-2">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
