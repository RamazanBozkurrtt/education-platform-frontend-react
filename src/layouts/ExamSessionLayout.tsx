import { Outlet } from 'react-router-dom'

const ExamSessionLayout = () => (
  <div className="theme-app min-h-screen bg-[color:var(--bg)]">
    <main className="min-h-screen px-3 py-3 sm:px-5 sm:py-5">
      <div className="mx-auto w-full max-w-[1280px]">
        <Outlet />
      </div>
    </main>
  </div>
)

export default ExamSessionLayout
