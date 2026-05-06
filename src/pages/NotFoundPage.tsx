import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'

const NotFoundPage = () => {
  const { t } = useTranslation()
  const { isAuthenticated } = useAuth()
  const returnRoute = isAuthenticated ? ROUTES.dashboard : ROUTES.home

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">{t('notFound.code')}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{t('notFound.title')}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">{t('notFound.description')}</p>
        <Link className="mt-8 inline-flex" to={returnRoute}>
          <Button asChild>{t(isAuthenticated ? 'notFound.backToDashboard' : 'notFound.backToHome')}</Button>
        </Link>
      </Card>
    </main>
  )
}

export default NotFoundPage
