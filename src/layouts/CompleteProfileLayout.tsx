import { Outlet } from 'react-router-dom'
import { cn } from '../utils/helpers'
import profilePageBackground from '../assets/AuthPages/profile-page.png'

const CompleteProfileLayout = () => {
  return (
    <main className="page-shell relative min-h-[100dvh] overflow-y-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${profilePageBackground})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,245,238,0.62)_0%,rgba(255,245,238,0.78)_100%)]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100dvh-6rem)] max-w-[1240px] items-center justify-center py-6">
        <section
          className={cn(
            'w-full max-w-[760px] rounded-[var(--radius-cards)] border p-6 shadow-[var(--shadow-sm)] sm:p-8',
            'border-[color:var(--border)] bg-[color:var(--surface-white)]/96',
          )}
        >
          <Outlet />
        </section>
      </div>
    </main>
  )
}

export default CompleteProfileLayout
