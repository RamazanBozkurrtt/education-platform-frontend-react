import { Link, useLocation } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { ROUTES } from '../utils/constants'
import { useLanguage } from '../hooks/useLanguage'

type UnauthorizedLocationState = {
  from?: string
}

const UnauthorizedPage = () => {
  const { language } = useLanguage()
  const location = useLocation()
  const state = (location.state as UnauthorizedLocationState | null) ?? null
  const copy = language === 'tr'
    ? {
      code: '403',
      title: 'Bu alana erisim iznin yok.',
      description: 'Bu sayfayi goruntulemek icin gerekli role sahip olmalisin.',
      back: 'Dashboarda Don',
      from: 'Talep edilen yol',
    }
    : {
      code: '403',
      title: 'You do not have access to this area.',
      description: 'You need the required role to open this page.',
      back: 'Back to Dashboard',
      from: 'Requested path',
    }

  return (
    <main className="flex min-h-[65vh] items-center justify-center px-4">
      <Card className="max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.24em] text-amber-200">{copy.code}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{copy.title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">{copy.description}</p>
        {state?.from ? (
          <p className="mt-3 text-xs text-slate-500">
            {copy.from}: {state.from}
          </p>
        ) : null}
        <Link className="mt-8 inline-flex" to={ROUTES.dashboard}>
          <Button asChild>{copy.back}</Button>
        </Link>
      </Card>
    </main>
  )
}

export default UnauthorizedPage

