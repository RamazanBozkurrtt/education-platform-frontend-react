import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'
import ProtectedRoute from './ProtectedRoute'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import DashboardPage from '../pages/DashboardPage'
import CourseListPage from '../pages/CourseListPage'
import CourseDetailPage from '../pages/CourseDetailPage'
import CoursePlayerPage from '../pages/CoursePlayerPage'
import CartPage from '../pages/CartPage'
import PaymentPage from '../pages/PaymentPage'
import SearchPage from '../pages/SearchPage'
import NotFoundPage from '../pages/NotFoundPage'
import { ROUTES } from '../utils/constants'

const AppRouter = () => (
  <Routes>
    <Route element={<AuthLayout />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.courses} element={<CourseListPage />} />
        <Route path={ROUTES.courseDetail()} element={<CourseDetailPage />} />
        <Route path={ROUTES.coursePlayer()} element={<CoursePlayerPage />} />
        <Route path={ROUTES.cart} element={<CartPage />} />
        <Route path={ROUTES.payment} element={<PaymentPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path="/enrollment" element={<Navigate replace to={ROUTES.cart} />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
    <Route path="/home" element={<Navigate replace to={ROUTES.dashboard} />} />
  </Routes>
)

export default AppRouter
