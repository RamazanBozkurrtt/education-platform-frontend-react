import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../utils/constants'
import { useAuth } from '../hooks/useAuth'
import Loader from '../components/ui/Loader'
import { authFlowLog } from '../shared/authFlowDebug'

const ProtectedRoute = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { isAuthenticated, isBootstrapping, user } = useAuth()
  authFlowLog('protected route decision:', {
    path: location.pathname,
    isBootstrapping,
    isAuthenticated,
    hasUser: Boolean(user),
    profileCompleted: user?.profileCompleted,
  })

  if (isBootstrapping) {
    return <Loader fullScreen label={t('loader.restoringWorkspace')} />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTES.login} />
  }

  if (!user) {
    return <Loader fullScreen label={t('loader.restoringWorkspace')} />
  }

  const isProfileCompletionRoute = location.pathname === ROUTES.completeProfile

  if (!user.profileCompleted && !isProfileCompletionRoute) {
    return <Navigate replace state={{ from: location }} to={ROUTES.completeProfile} />
  }

  if (user.profileCompleted && isProfileCompletionRoute) {
    return <Navigate replace to={ROUTES.dashboard} />
  }

  return <Outlet />
}

export default ProtectedRoute
