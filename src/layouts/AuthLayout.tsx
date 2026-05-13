import { Link, Outlet } from 'react-router-dom'
import LanguageSwitcher from '../components/ui/LanguageSwitcher'
import ThemeToggle from '../components/ui/ThemeToggle'
import { APP_NAME, ROUTES } from '../utils/constants'
import { cn } from '../utils/helpers'
import authBackground from '../assets/AuthPages/auth_background.png'

const AuthLayout = () => {
  return (
    <main className="auth-shell page-shell relative h-[100dvh] overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div
        className="auth-shell-bg absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="auth-shell-overlay absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-[1480px] justify-end">
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitcher />
          <ThemeToggle compact />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid h-[calc(100dvh-5.5rem)] w-full max-w-[1480px] items-center gap-8 lg:grid-cols-[1fr_520px]">
        <section className="hidden h-full items-center lg:flex">
          <div className="max-w-3xl">
            <Link
              aria-label={`${APP_NAME} landing page`}
              className={cn(
                'group relative inline-flex rounded-[var(--radius-cards)] px-6 py-4 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[color:var(--surface-white)]',
              )}
              to={ROUTES.home}
            >
              <span
                className={cn(
                  'pointer-events-none absolute inset-x-6 bottom-3 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100',
                  'bg-[color:var(--primary)]',
                )}
              />
              <h1
                className={cn(
                  'theme-heading text-7xl font-semibold leading-none tracking-[-0.08em] transition-all duration-300 group-hover:-translate-y-1 group-focus-visible:-translate-y-0.5 xl:text-[7.5rem]',
                  'group-hover:text-[color:var(--text-heading)]',
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
              'w-full max-w-[520px] rounded-[var(--radius-cards)] border p-6 shadow-[var(--shadow-sm)] sm:p-8',
              'border-[color:var(--border)] bg-[color:var(--surface-white)]/95',
            )}
          >
            <div className="mb-8 lg:hidden">
              <Link
                aria-label={`${APP_NAME} landing page`}
                className={cn(
                  'group relative inline-flex rounded-[var(--radius-navigation)] px-2 py-1 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'focus-visible:ring-[color:var(--focus-ring)] focus-visible:ring-offset-[color:var(--surface-white)] hover:bg-[color:var(--surface-soft)]',
                )}
                to={ROUTES.home}
              >
                <span
                  className={cn(
                    'pointer-events-none absolute inset-x-2 bottom-0 h-[2px] origin-left scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100 group-focus-visible:scale-x-100',
                    'bg-[color:var(--primary)]',
                  )}
                />
                <h1
                  className={cn(
                    'theme-heading text-4xl font-semibold tracking-[-0.06em] transition-all duration-300 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5',
                    'group-hover:text-[color:var(--text-heading)]',
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
