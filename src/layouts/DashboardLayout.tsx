import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/navigation/Sidebar'
import TopNavbar from '../components/navigation/TopNavbar'
import { useAuth } from '../hooks/useAuth'

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
    : (
        {
          '/': t('routes.dashboard'),
          '/courses': t('routes.courses'),
          '/cart': t('routes.cart'),
          '/payment': t('routes.payment'),
          '/search': t('routes.search'),
        }[pathname] ?? t('routes.workspace')
      )

  return (
    <div className="theme-app min-h-screen">
      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          onToggleCollapsed={() => setCollapsed((current) => !current)}
        />

        <div className="page-shell flex min-h-screen flex-1 flex-col px-4 pb-8 pt-4 lg:pr-6">
          <TopNavbar onOpenMobileMenu={() => setMobileOpen(true)} title={pageTitle} user={user} />
          <main className="mt-6 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
