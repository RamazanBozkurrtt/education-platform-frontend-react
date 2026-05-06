import { Outlet } from 'react-router-dom'
import ThemeToggle from '../components/ui/ThemeToggle'
import { useTheme } from '../hooks/useTheme'
import { cn } from '../utils/helpers'
import profilePageBackground from '../assets/AuthPages/profile-page.png'

const CompleteProfileLayout = () => {
  const { theme } = useTheme()
  const isLight = theme === 'light'

  return (
    <main className="page-shell relative min-h-[100dvh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${profilePageBackground})` }}
      />
      <div
        className={cn(
          'absolute inset-0',
          isLight
            ? 'bg-[radial-gradient(circle_at_top,rgba(15,76,129,0.08),transparent_34%),linear-gradient(180deg,rgba(247,249,252,0.52)_0%,rgba(238,243,248,0.7)_100%)]'
            : 'bg-[radial-gradient(circle_at_top,rgba(41,65,107,0.16),transparent_30%),linear-gradient(180deg,rgba(13,21,33,0.52)_0%,rgba(17,27,42,0.72)_100%)]',
        )}
      />

      <div className="relative z-10 mx-auto flex max-w-[1240px] justify-end">
        <ThemeToggle />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-6rem)] max-w-[1240px] items-center justify-center py-6">
        <section
          className={cn(
            'w-full max-w-[760px] rounded-[34px] border p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-sm sm:p-8',
            isLight
              ? 'border-slate-900/10 bg-white/55'
              : 'border-white/10 bg-[linear-gradient(180deg,rgba(10,17,30,0.5),rgba(15,23,36,0.42))]',
          )}
        >
          <Outlet />
        </section>
      </div>
    </main>
  )
}

export default CompleteProfileLayout
