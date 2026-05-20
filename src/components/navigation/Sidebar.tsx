import {
  BookOpen,
  BookOpenCheck,
  ChevronLeft,
  CreditCard,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { useLanguage } from '../../hooks/useLanguage'
import { APP_NAME, ROUTES } from '../../utils/constants'
import { cn } from '../../utils/helpers'
import { isInstructor } from '../../utils/roles'
import Button from '../ui/Button'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  onToggleCollapsed: () => void
}

const Sidebar = ({
  collapsed,
  mobileOpen,
  onCloseMobile,
  onToggleCollapsed,
}: SidebarProps) => {
  const { t } = useTranslation()
  const { itemCount } = useCart()
  const { user, claims } = useAuth()
  const { language } = useLanguage()
  const isCurrentUserInstructor = isInstructor(user, claims)
  const instructorMenuLabel = language === 'tr' ? 'Eğitmen Paneli' : 'Instructor Panel'
  const becomeInstructorLabel = language === 'tr' ? 'Eğitmen Ol' : 'Become Instructor'
  const paymentsLabel = language === 'tr' ? 'Ödemelerim' : 'My Payments'

  const navigationItems = [
    { label: t('nav.dashboard'), to: ROUTES.dashboard, icon: LayoutDashboard },
    isCurrentUserInstructor
      ? { label: instructorMenuLabel, to: ROUTES.instructorDashboard, icon: FolderKanban }
      : { label: becomeInstructorLabel, to: ROUTES.becomeInstructor, icon: GraduationCap },
    { label: t('nav.myCourses'), to: ROUTES.myCourses, icon: BookOpenCheck },
    { label: t('nav.courses'), to: ROUTES.courses, icon: BookOpen },
    { label: t('nav.cart'), to: ROUTES.cart, icon: ShoppingCart, badge: itemCount },
    { label: paymentsLabel, to: ROUTES.payments, icon: CreditCard },
    { label: t('nav.search'), to: ROUTES.search, icon: Search },
  ]

  return (
    <>
      <div
        className={cn(
          'theme-overlay fixed inset-0 z-30 backdrop-blur-[1px] transition-opacity lg:hidden',
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          'fixed inset-y-2 left-2 z-40 flex w-[286px] flex-col rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3.5 py-3.5 shadow-none transition-all duration-300 ease-out lg:static lg:inset-auto lg:h-[calc(100vh-1rem)]',
          collapsed ? 'lg:w-[104px]' : 'lg:w-[284px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-[115%] lg:translate-x-0',
        )}
      >
        <div className="mb-5 flex items-center justify-between border-b border-[color:var(--border)] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] text-[color:var(--primary)]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className={cn('min-w-0 overflow-hidden transition-all', collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100')}>
              <p className="theme-subtle text-[10px] font-semibold uppercase tracking-[0.22em]">{t('nav.workspace')}</p>
              <h2 className="theme-heading truncate text-base font-semibold tracking-tight">{APP_NAME}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button aria-label="Close menu" className="lg:hidden" onClick={onCloseMobile} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
            <Button
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:inline-flex"
              onClick={onToggleCollapsed}
              size="sm"
              variant="ghost"
            >
              <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
            </Button>
          </div>
        </div>

        <nav className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-sm border px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]',
                  isActive
                    ? 'border-[color:var(--primary)] bg-[color:var(--surface-soft)] text-[color:var(--text-heading)]'
                    : 'border-transparent text-[color:var(--text-muted)] hover:border-[color:var(--border)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-heading)]',
                  collapsed && 'lg:justify-center',
                )
              }
              onClick={onCloseMobile}
              to={item.to}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive ? 'text-[color:var(--primary)]' : 'text-[color:var(--text-subtle)] group-hover:text-[color:var(--text-heading)]',
                    )}
                  />
                  <span
                    className={cn(
                      'flex min-w-0 flex-1 items-center justify-between gap-3 transition-all',
                      collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100',
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    {item.badge && item.badge > 0 ? (
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--text)]">
                        {item.badge}
                      </span>
                    ) : null}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div
          className={cn(
            'mt-auto rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-3',
            collapsed && 'lg:hidden',
          )}
        >
          <p className="theme-subtle text-[10px] uppercase tracking-[0.18em]">{t('nav.workspace')}</p>
          <p className="theme-heading mt-1 text-sm font-semibold">{isCurrentUserInstructor ? instructorMenuLabel : becomeInstructorLabel}</p>
          <p className="theme-muted mt-1 text-xs">{t('nav.overview')}</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar


