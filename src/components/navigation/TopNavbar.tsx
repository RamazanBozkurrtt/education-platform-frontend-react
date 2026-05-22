import { Menu, Search, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useCart } from '../../hooks/useCart'
import { ROUTES } from '../../utils/constants'
import type { User } from '../../utils/types'
import Button from '../ui/Button'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import ThemeToggle from '../ui/ThemeToggle'

interface TopNavbarProps {
  onOpenMobileMenu: () => void
  user: User
  title: string
}

const TopNavbar = ({ onOpenMobileMenu, title, user }: TopNavbarProps) => {
  const { t } = useTranslation()
  const { itemCount } = useCart()
  const profileRoleLabel = user.headline?.trim() || t(user.roleLabelKey)

  return (
    <header className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--surface-strong)] px-3 py-3 shadow-none lg:flex-nowrap lg:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button aria-label="Open menu" className="lg:hidden" onClick={onOpenMobileMenu} size="sm" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="theme-subtle text-[11px] font-semibold uppercase tracking-[0.2em]">{t('nav.overview')}</p>
          <h1 className="theme-heading truncate text-lg font-semibold md:text-xl">{title}</h1>
        </div>
      </div>

      <div className="order-3 flex w-full justify-center lg:order-none lg:flex-1 lg:px-4">
        <div className="theme-surface-soft theme-muted flex h-10 w-full max-w-2xl items-center gap-3 rounded-sm border border-[color:var(--border)] px-3.5 transition focus-within:border-[color:var(--border-strong)] focus-within:bg-[color:var(--surface-hover)]">
          <Search className="h-4 w-4" />
          <input
            aria-label={t('nav.searchPlaceholder')}
            className="theme-text theme-placeholder w-full bg-transparent text-sm outline-none"
            placeholder={t('nav.searchPlaceholder')}
            type="search"
          />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div className="hidden xl:block">
          <LanguageSwitcher compact />
        </div>
        <ThemeToggle compact />
        <Link
          className="hidden items-center gap-2 rounded-sm border border-[color:var(--border)] bg-[color:var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--text)] transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)] sm:flex"
          to={ROUTES.cart}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.courseCount', { count: itemCount })}
        </Link>
        <Link
          className="theme-surface-soft flex items-center gap-3 rounded-sm border border-[color:var(--border)] px-2.5 py-2 transition hover:border-[color:var(--border-strong)] hover:bg-[color:var(--surface-hover)]"
          to={ROUTES.profile}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm border border-[color:var(--border)] bg-[color:var(--primary)] text-sm font-semibold text-white">
            {user.avatarUrl ? (
              <img alt={user.name} className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              user.initials
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="theme-heading text-sm font-semibold">{user.name}</p>
            <p className="theme-muted text-xs">{profileRoleLabel}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}

export default TopNavbar
