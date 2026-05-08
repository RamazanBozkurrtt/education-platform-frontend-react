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
  const instructorMenuLabel = language === 'tr' ? 'Egitmen Paneli' : 'Instructor Panel'
  const becomeInstructorLabel = language === 'tr' ? 'Egitmen Ol' : 'Become Instructor'

  const navigationItems = [
    { label: t('nav.dashboard'), to: ROUTES.dashboard, icon: LayoutDashboard },
    isCurrentUserInstructor
      ? { label: instructorMenuLabel, to: ROUTES.instructorDashboard, icon: FolderKanban }
      : { label: becomeInstructorLabel, to: ROUTES.becomeInstructor, icon: GraduationCap },
    { label: t('nav.myCourses'), to: ROUTES.myCourses, icon: BookOpenCheck },
    { label: t('nav.courses'), to: ROUTES.courses, icon: BookOpen },
    { label: t('nav.cart'), to: ROUTES.cart, icon: ShoppingCart, badge: itemCount },
    { label: t('nav.payment'), to: ROUTES.payment, icon: CreditCard },
    { label: t('nav.search'), to: ROUTES.search, icon: Search },
  ]

  return (
    <>
    <div
      className={cn(
        'theme-overlay fixed inset-0 z-30 transition-opacity lg:hidden',
        mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onCloseMobile}
    />

    <aside
      className={cn(
        'glass-panel fixed inset-y-4 left-4 z-40 flex w-[288px] flex-col rounded-lg border border-white/10 px-4 py-5 transition-all duration-300 ease-out lg:static lg:inset-auto lg:h-[calc(100vh-2rem)]',
        collapsed ? 'lg:w-[96px]' : 'lg:w-[280px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-[115%] lg:translate-x-0',
      )}
    >
      <div className="mb-6 flex items-center justify-between border-b border-white/8 pb-5">
        <button
          className={cn(
            'flex items-center gap-3 rounded-md bg-transparent p-0 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[color:var(--primary)]/35',
            collapsed ? 'cursor-pointer' : 'cursor-default',
          )}
          disabled={!collapsed}
          onClick={collapsed ? onToggleCollapsed : undefined}
          title={collapsed ? 'Expand sidebar' : undefined}
          type="button"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-muted)] text-[color:var(--primary)]">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className={cn('overflow-hidden transition-all', collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100')}>
            <p className="theme-subtle text-[11px] uppercase tracking-[0.28em]">{t('nav.workspace')}</p>
            <h2 className="theme-heading mt-1 text-lg font-semibold tracking-tight">{APP_NAME}</h2>
            <p className="theme-muted mt-1 text-xs"></p>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <Button className="lg:hidden" onClick={onCloseMobile} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
          <Button
            className={cn('hidden lg:inline-flex', collapsed && 'lg:hidden')}
            onClick={onToggleCollapsed}
            size="sm"
            variant="ghost"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md border border-transparent px-3 py-3 text-sm font-medium text-slate-400 transition-colors hover:border-white/8 hover:bg-[color:var(--surface-muted)] hover:text-slate-100',
                isActive && 'border-white/10 bg-[color:var(--surface-muted)] text-slate-100',
                collapsed && 'lg:justify-center',
              )
            }
            onClick={onCloseMobile}
            to={item.to}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span
              className={cn(
                'flex min-w-0 flex-1 items-center justify-between gap-3 transition-all',
                collapsed ? 'lg:w-0 lg:overflow-hidden lg:opacity-0' : 'opacity-100',
              )}
            >
              <span className="truncate">{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="rounded-md border border-white/10 bg-[color:var(--surface-muted)] px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                  {item.badge}
                </span>
              ) : null}
            </span>
          </NavLink>
        ))}
      </nav>
    </aside>
  </>
  )
}

export default Sidebar
