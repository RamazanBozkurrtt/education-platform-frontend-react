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

  return (
    <header className="glass-panel sticky top-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/10 px-4 py-4 !bg-[color:var(--surface-strong)] lg:flex-nowrap lg:px-5">
      <div className="flex items-center gap-3">
        <Button className="lg:hidden" onClick={onOpenMobileMenu} size="sm" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="theme-subtle text-xs uppercase tracking-[0.24em]">{t('nav.overview')}</p>
          <h1 className="theme-heading mt-1 text-lg font-semibold md:text-[1.65rem]">{title}</h1>
        </div>
      </div>

      <div className="order-3 flex w-full justify-center lg:order-none lg:flex-1">
        <div className="theme-surface-strong theme-muted flex h-11 w-full max-w-xl items-center gap-3 rounded-md border border-white/10 px-4">
          <Search className="h-4 w-4" />
          <input
            className="theme-text w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            placeholder={t('nav.searchPlaceholder')}
            type="search"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden xl:block">
          <LanguageSwitcher compact />
        </div>
        <ThemeToggle compact />
        <Link
          className="hidden rounded-md border border-white/10 bg-[color:var(--surface-muted)] px-4 py-2.5 text-sm text-slate-200 transition hover:border-white/16 hover:bg-[color:var(--surface-hover)] sm:flex sm:items-center sm:gap-2"
          to={ROUTES.cart}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.courseCount', { count: itemCount })}
        </Link>
        <Link
          className="theme-surface-muted flex items-center gap-3 rounded-md border border-white/10 px-2.5 py-2 transition hover:border-white/16 hover:bg-[color:var(--surface-hover)]"
          to={ROUTES.profile}
        >
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-white/10 bg-[color:var(--primary)] text-sm font-semibold text-white">
            {user.avatarUrl ? (
              <img alt={user.name} className="h-full w-full object-cover" src={user.avatarUrl} />
            ) : (
              user.initials
            )}
          </div>
          <div className="hidden text-left sm:block">
            <p className="theme-heading text-sm font-semibold">{user.name}</p>
            <p className="theme-muted text-xs">{t(user.roleLabelKey)}</p>
          </div>
        </Link>
      </div>
    </header>
  )
}

export default TopNavbar
