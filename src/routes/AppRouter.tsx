import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'
import CompleteProfileLayout from '../layouts/CompleteProfileLayout'
import ProtectedRoute from './ProtectedRoute'
import LandingPage from '../pages/LandingPage'
import PublicCatalogPage from '../pages/PublicCatalogPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import CompleteProfilePage from '../pages/CompleteProfilePage'
import DashboardPage from '../pages/DashboardPage'
import MyCoursesPage from '../pages/MyCoursesPage'
import CourseListPage from '../pages/CourseListPage'
import CourseDetailPage from '../pages/CourseDetailPage'
import CoursePlayerPage from '../pages/CoursePlayerPage'
import CartPage from '../pages/CartPage'
import PaymentPage from '../pages/PaymentPage'
import SearchPage from '../pages/SearchPage'
import ProfilePage from '../pages/ProfilePage'
import NotFoundPage from '../pages/NotFoundPage'
import { ROUTES } from '../utils/constants'

const AppRouter = () => (
  <Routes>
    <Route path={ROUTES.home} element={<LandingPage />} />
    <Route path={ROUTES.catalog} element={<PublicCatalogPage />} />

    <Route element={<AuthLayout />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<CompleteProfileLayout />}>
        <Route path={ROUTES.completeProfile} element={<CompleteProfilePage />} />
      </Route>

      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.myCourses} element={<MyCoursesPage />} />
        <Route path={ROUTES.courses} element={<CourseListPage />} />
        <Route path={ROUTES.courseDetail()} element={<CourseDetailPage />} />
        <Route path={ROUTES.coursePlayer()} element={<CoursePlayerPage />} />
        <Route path={ROUTES.cart} element={<CartPage />} />
        <Route path={ROUTES.payment} element={<PaymentPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path="/enrollment" element={<Navigate replace to={ROUTES.cart} />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
    <Route path="/home" element={<Navigate replace to={ROUTES.home} />} />
  </Routes>
)

export default AppRouter
