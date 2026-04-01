import { Bell, Menu, Search, ShoppingCart } from 'lucide-react'
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
    <header className="glass-panel sticky top-4 z-20 flex items-center justify-between gap-4 rounded-[22px] border border-white/8 px-4 py-4">
      <div className="flex items-center gap-3">
        <Button className="lg:hidden" onClick={onOpenMobileMenu} size="sm" variant="ghost">
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="theme-subtle text-xs uppercase tracking-[0.22em]">{t('nav.overview')}</p>
          <h1 className="theme-heading mt-1 text-lg font-semibold md:text-2xl">{title}</h1>
        </div>
      </div>

      <div className="hidden flex-1 justify-center lg:flex">
        <div className="theme-surface-strong theme-muted flex h-11 w-full max-w-md items-center gap-3 rounded-2xl border border-white/10 px-4">
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
        <button className="theme-surface-muted theme-text relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 transition hover:bg-white/10">
          <Bell className="h-4 w-4" />
          <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-cyan-300" />
        </button>
        <Link
          className="hidden rounded-2xl border border-sky-300/18 bg-sky-400/10 px-3 py-2 text-sm text-sky-100 transition hover:border-sky-300/28 hover:bg-sky-400/14 sm:flex sm:items-center sm:gap-2"
          to={ROUTES.cart}
        >
          <ShoppingCart className="h-4 w-4" />
          {t('cart.courseCount', { count: itemCount })}
        </Link>
        <div className="theme-surface-muted flex items-center gap-3 rounded-2xl border border-white/10 px-3 py-2">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br ${user.avatarColor} text-sm font-semibold text-slate-950`}>
            {user.initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="theme-heading text-sm font-semibold">{user.name}</p>
            <p className="theme-muted text-xs">{t(user.roleLabelKey)}</p>
          </div>
        </div>
      </div>
    </header>
  )
}

export default TopNavbar
