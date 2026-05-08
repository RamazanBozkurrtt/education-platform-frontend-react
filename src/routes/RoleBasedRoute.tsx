import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Loader from '../components/ui/Loader'
import { useAuth } from '../hooks/useAuth'
import { ROUTES } from '../utils/constants'
import { extractAuthRoles, hasRole } from '../utils/roles'

interface RoleBasedRouteProps {
  requiredRoles?: string[]
  children: ReactNode
}

const RoleBasedRoute = ({ children, requiredRoles = [] }: RoleBasedRouteProps) => {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, claims, isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <Loader fullScreen label={t('loader.restoringWorkspace')} />
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to={ROUTES.login} />
  }

  if (!user) {
    return <Loader fullScreen label={t('loader.restoringWorkspace')} />
  }

  const canAccess = requiredRoles.length === 0 || requiredRoles.some((requiredRole) =>
    hasRole(user, requiredRole) || hasRole(claims, requiredRole))

  if (!canAccess) {
    return (
      <Navigate
        replace
        state={{
          from: location.pathname,
          requiredRoles,
          currentRoles: extractAuthRoles(user, claims),
        }}
        to={ROUTES.unauthorized}
      />
    )
  }

  return <>{children}</>
}

export default RoleBasedRoute

