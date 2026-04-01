import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  Search,
  ShoppingCart,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { APP_NAME, ROUTES } from '../../utils/constants'
import { cn } from '../../utils/helpers'
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

  const navigationItems = [
    { label: t('nav.dashboard'), to: ROUTES.dashboard, icon: LayoutDashboard },
    { label: t('nav.courses'), to: ROUTES.courses, icon: BookOpen },
    { label: t('nav.cart'), to: ROUTES.cart, icon: ShoppingCart, badge: itemCount },
    { label: t('nav.payment'), to: ROUTES.payment, icon: CreditCard },
    { label: t('nav.search'), to: ROUTES.search, icon: Search },
  ]

  return (
    <>
    <div
      className={cn(
        'theme-overlay fixed inset-0 z-30 backdrop-blur-sm transition-opacity lg:hidden',
        mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
      )}
      onClick={onCloseMobile}
    />

    <aside
      className={cn(
        'glass-panel fixed inset-y-4 left-4 z-40 flex w-[280px] flex-col rounded-[24px] border border-white/8 px-4 py-5 transition-all duration-300 ease-out lg:static lg:inset-auto lg:m-4 lg:h-[calc(100vh-2rem)]',
        collapsed ? 'lg:w-[96px]' : 'lg:w-[280px]',
        mobileOpen ? 'translate-x-0' : '-translate-x-[115%] lg:translate-x-0',
      )}
    >
      <div className="mb-8 flex items-center justify-between">
        <div className={cn('overflow-hidden transition-all', collapsed ? 'lg:w-0 lg:opacity-0' : 'w-auto opacity-100')}>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">{t('nav.workspace')}</p>
          <h2 className="theme-heading mt-2 text-xl font-semibold">{APP_NAME}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button className="lg:hidden" onClick={onCloseMobile} size="sm" variant="ghost">
            <X className="h-4 w-4" />
          </Button>
          <Button className="hidden lg:inline-flex" onClick={onToggleCollapsed} size="sm" variant="ghost">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <nav className="space-y-2">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-white/6 hover:text-white',
                isActive && 'border border-sky-400/20 bg-sky-500/10 text-sky-100',
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
                <span className="rounded-full border border-sky-400/18 bg-sky-400/10 px-2 py-0.5 text-[11px] font-semibold text-sky-100">
                  {item.badge}
                </span>
              ) : null}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-[22px] border border-sky-400/12 bg-sky-500/8 p-4">
        <div className={cn(collapsed ? 'lg:hidden' : 'block')}>
          <p className="text-xs uppercase tracking-[0.24em] text-cyan-200">{t('nav.performance')}</p>
          <p className="theme-text mt-3 text-sm leading-6">
            {t('nav.engagementSummary')}
          </p>
        </div>
      </div>
    </aside>
  </>
  )
}

export default Sidebar
