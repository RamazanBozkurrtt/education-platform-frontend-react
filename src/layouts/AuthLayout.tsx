import { Link, Outlet } from 'react-router-dom'
import { useTheme } from '../hooks/useTheme'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import ThemeToggle from '../components/ui/ThemeToggle'
import { APP_NAME, ROUTES } from '../utils/constants'
import { cn } from '../utils/helpers'
import authBackground from '../assets/AuthPages/auth_background.png'

const AuthLayout = () => {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <main className="page-shell relative h-[100dvh] overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div
        className={cn(
          'absolute inset-0',
          isLight
            ? 'bg-[radial-gradient(circle_at_left,rgba(15,76,129,0.08),transparent_30%),linear-gradient(180deg,rgba(247,249,252,0.38)_0%,rgba(238,243,248,0.5)_100%)]'
            : 'bg-[radial-gradient(circle_at_left,rgba(41,65,107,0.16),transparent_26%),linear-gradient(180deg,rgba(13,21,33,0.42)_0%,rgba(17,27,42,0.56)_100%)]',
        )}
      />

      <div className="relative z-10 mx-auto flex max-w-[1480px] justify-end">
        <div className="flex flex-wrap gap-3">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid h-[calc(100dvh-5.5rem)] w-full max-w-[1480px] items-center gap-8 lg:grid-cols-[1fr_520px]">
        <section className="hidden h-full items-center lg:flex">
          <div className="max-w-3xl">
            <Link
              aria-label={`${APP_NAME} landing page`}
              className={cn(
                'group relative inline-flex rounded-3xl px-6 py-4 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isLight
                  ? 'focus-visible:ring-sky-700/45 focus-visible:ring-offset-slate-50'
                  : 'focus-visible:ring-sky-300/45 focus-visible:ring-offset-slate-950',
              )}
              to={ROUTES.home}
            >
              <span
                className={cn(
                  'pointer-events-none absolute inset-x-6 bottom-3 h-[3px] origin-left scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100',
                  isLight
                    ? 'bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500'
                    : 'bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200',
                )}
              />
              <h1
                className={cn(
                  'theme-heading text-7xl font-semibold leading-none tracking-[-0.08em] transition-all duration-500 group-hover:-translate-y-1 group-focus-visible:-translate-y-1 xl:text-[7.5rem]',
                  isLight ? 'group-hover:text-sky-800' : 'group-hover:text-sky-50',
                )}
              >
                {APP_NAME}
              </h1>
            </Link>
          </div>
        </section>

        <section className="flex h-full items-center justify-center lg:justify-end">
          <div
            className={cn(
              'w-full max-w-[520px] rounded-[32px] border p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-8',
              isLight
                ? 'border-slate-900/10 bg-white/28'
                : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,17,30,0.32),rgba(15,23,36,0.24))]',
            )}
          >
            <div className="mb-8 lg:hidden">
              <Link
                aria-label={`${APP_NAME} landing page`}
                className={cn(
                  'group relative inline-flex rounded-2xl px-2 py-1 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  isLight
                    ? 'focus-visible:ring-sky-700/45 focus-visible:ring-offset-slate-50 hover:bg-white/35'
                    : 'focus-visible:ring-sky-300/45 focus-visible:ring-offset-slate-950 hover:bg-white/8',
                )}
                to={ROUTES.home}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute inset-x-2 bottom-0 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-500 group-hover:scale-x-100 group-focus-visible:scale-x-100',
                    isLight
                      ? 'bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500'
                      : 'bg-gradient-to-r from-sky-300 via-cyan-200 to-emerald-200',
                  )}
                />
                <h1
                  className={cn(
                    'theme-heading text-4xl font-semibold tracking-[-0.06em] transition-all duration-500 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5',
                    isLight ? 'group-hover:text-sky-800' : 'group-hover:text-sky-50',
                  )}
                >
                  {APP_NAME}
                </h1>
              </Link>
            </div>
            <Outlet />
          </div>
        </section>
      </div>
    </main>
  )
}

export default AuthLayout
