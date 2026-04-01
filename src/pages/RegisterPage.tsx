import { type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Mail, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'

const RegisterPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { register } = useAuth()
  const [name, setName] = useState('Avery Coleman')
  const [email, setEmail] = useState('avery@lumaacademy.dev')
  const [password, setPassword] = useState('password123')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      await register({ name, email, password })
      navigate(ROUTES.dashboard, { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col justify-center">
      <p className="text-sm uppercase tracking-[0.24em] text-cyan-200">{t('auth.createWorkspace')}</p>
      <h2 className="mt-4 text-4xl font-semibold text-white">{t('auth.registerTitle')}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-400">
        {t('auth.registerDescription')}
      </p>

      <form className="mt-10 space-y-5" onSubmit={handleSubmit}>
        <Input
          icon={<UserRound className="h-4 w-4" />}
          id="name"
          label={t('auth.fullName')}
          onChange={(event) => setName(event.target.value)}
          placeholder={t('auth.fullNamePlaceholder')}
          value={name}
        />
        <Input
          icon={<Mail className="h-4 w-4" />}
          id="register-email"
          label={t('auth.email')}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('auth.emailPlaceholder')}
          type="email"
          value={email}
        />
        <Input
          icon={<Lock className="h-4 w-4" />}
          id="register-password"
          label={t('auth.password')}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('auth.registerPasswordPlaceholder')}
          type="password"
          value={password}
        />
        <Button className="w-full" size="lg" type="submit">
          {submitting ? t('auth.creatingAccount') : t('auth.createAccount')}
        </Button>
      </form>

      <p className="mt-8 text-sm text-slate-400">
        {t('auth.alreadyHaveAccess')}{' '}
        <Link className="font-semibold text-cyan-200 transition hover:text-cyan-100" to={ROUTES.login}>
          {t('auth.signIn')}
        </Link>
      </p>
    </div>
  )
}

export default RegisterPage
