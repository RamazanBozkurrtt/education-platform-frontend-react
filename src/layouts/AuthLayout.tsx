import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import ThemeToggle from '../components/ui/ThemeToggle'
import { APP_NAME } from '../utils/constants'

const AuthLayout = () => {
  const { t } = useTranslation()

  return (
    <main className="surface-grid page-shell flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),transparent_45%)]" />
      <div className="glass-panel relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[28px] border border-white/10 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="hidden flex-col justify-between border-r border-white/8 bg-slate-950/30 p-10 lg:flex">
        <div>
          <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">
            {t('auth.badge')}
          </span>
          <h1 className="theme-heading mt-6 max-w-md text-5xl font-semibold leading-tight">
            {t('auth.heroTitle')}
          </h1>
          <p className="theme-muted mt-6 max-w-xl text-base leading-8">
            {t('auth.heroDescription', { appName: APP_NAME })}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { value: '84%', label: t('auth.completionRate') },
            { value: '12k', label: t('auth.lessonsWatched') },
            { value: '4.9', label: t('auth.learnerRating') },
          ].map((item) => (
            <div key={item.label} className="rounded-[24px] border border-white/8 bg-white/5 p-4">
              <p className="theme-heading text-2xl font-semibold">{item.value}</p>
              <p className="theme-muted mt-2 text-sm">{item.label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="p-6 sm:p-10">
        <div className="mb-8 flex flex-wrap justify-end gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
        <Outlet />
      </section>
    </div>
  </main>
  )
}

export default AuthLayout
