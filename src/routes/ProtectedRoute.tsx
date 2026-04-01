import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/ui/Loader'

const ProtectedRoute = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <Loader fullScreen label={t('loader.restoringWorkspace')} />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTES.login} />
  }

  return <Outlet />
}

export default ProtectedRoute
