import { type FormEvent, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'

const LoginPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail] = useState('avery@lumaacademy.dev')
  const [password, setPassword] = useState('password123')
  const [submitting, setSubmitting] = useState(false)

  const redirectPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? ROUTES.dashboard

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await login({ email, password })
      navigate(redirectPath, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">{t('auth.welcomeBack')}</p>
      <h2 className="mt-4 text-4xl font-semibold text-white">{t('auth.signInTitle')}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">
        {t('auth.signInDescription')}
      </p>

      <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
        <Input
          icon={<Mail className="h-4 w-4" />}
          id="email"
          label={t('auth.email')}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          type="email"
          value={email}
        />
        <Input
          icon={<Lock className="h-4 w-4" />}
          id="password"
          label={t('auth.password')}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('auth.passwordPlaceholder')}
          type="password"
          value={password}
        />
        <Button className="w-full" size="lg" type="submit">
          {submitting ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
      </form>

      <div className="mt-6 rounded-3xl border border-white/8 bg-white/5 p-4 text-sm text-slate-400">
        {t('auth.demoNotice')}
      </div>

      <p className="mt-8 text-sm text-slate-400">
        {t('auth.needAccount')}{' '}
        <Link className="font-semibold text-cyan-200 transition hover:text-cyan-100" to={ROUTES.register}>
          {t('auth.createOne')}
        </Link>
      </p>
    </div>
  )
}

export default LoginPage
