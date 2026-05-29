import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from '../layouts/DashboardLayout'
import AuthLayout from '../layouts/AuthLayout'
import CompleteProfileLayout from '../layouts/CompleteProfileLayout'
import ExamSessionLayout from '../layouts/ExamSessionLayout'
import ProtectedRoute from './ProtectedRoute'
import RoleBasedRoute from './RoleBasedRoute'
import LandingPage from '../pages/LandingPage'
import PublicCatalogPage from '../pages/PublicCatalogPage'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import ForgotPasswordPage from '../pages/ForgotPasswordPage'
import ResetPasswordPage from '../pages/ResetPasswordPage'
import ReactivateAccountPage from '../pages/ReactivateAccountPage'
import CompleteProfilePage from '../pages/CompleteProfilePage'
import DashboardPage from '../pages/DashboardPage'
import MyCoursesPage from '../pages/MyCoursesPage'
import CourseListPage from '../pages/CourseListPage'
import CourseDetailPage from '../pages/CourseDetailPage'
import CoursePlayerPage from '../pages/CoursePlayerPage'
import CourseFinalExamOverviewPage from '../pages/CourseFinalExamOverviewPage'
import CourseFinalExamAttemptPage from '../pages/CourseFinalExamAttemptPage'
import CourseFinalExamResultPage from '../pages/CourseFinalExamResultPage'
import CartPage from '../pages/CartPage'
import PaymentPage from '../pages/PaymentPage'
import MyPaymentsPage from '../pages/MyPaymentsPage'
import SearchPage from '../pages/SearchPage'
import ProfilePage from '../pages/ProfilePage'
import BecomeInstructorPage from '../pages/BecomeInstructorPage'
import InstructorDashboardPage from '../pages/InstructorDashboardPage'
import InstructorProfilePage from '../pages/InstructorProfilePage'
import InstructorCourseCreatePage from '../pages/InstructorCourseCreatePage'
import InstructorCourseVideoUploadPage from '../pages/InstructorCourseVideoUploadPage'
import UnauthorizedPage from '../pages/UnauthorizedPage'
import NotFoundPage from '../pages/NotFoundPage'
import { ROUTES } from '../utils/constants'

const AppRouter = () => (
  <Routes>
    <Route path={ROUTES.home} element={<LandingPage />} />
    <Route path={ROUTES.catalog} element={<PublicCatalogPage />} />

    <Route element={<AuthLayout />}>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
      <Route path={ROUTES.resetPassword} element={<ResetPasswordPage />} />
      <Route path={ROUTES.reactivateAccount} element={<ReactivateAccountPage />} />
    </Route>

    <Route element={<ProtectedRoute />}>
      <Route element={<CompleteProfileLayout />}>
        <Route path={ROUTES.completeProfile} element={<CompleteProfilePage />} />
      </Route>

      <Route element={<ExamSessionLayout />}>
        <Route path={ROUTES.courseFinalExamAttempt()} element={<CourseFinalExamAttemptPage />} />
      </Route>

      <Route path={ROUTES.coursePlayer()} element={<CoursePlayerPage />} />

      <Route element={<DashboardLayout />}>
        <Route path={ROUTES.dashboard} element={<DashboardPage />} />
        <Route path={ROUTES.myCourses} element={<MyCoursesPage />} />
        <Route path={ROUTES.courses} element={<CourseListPage />} />
        <Route path={ROUTES.courseDetail()} element={<CourseDetailPage />} />
        <Route path={ROUTES.courseFinalExamOverview()} element={<CourseFinalExamOverviewPage />} />
        <Route path={ROUTES.courseFinalExamResult()} element={<CourseFinalExamResultPage />} />
        <Route path={ROUTES.cart} element={<CartPage />} />
        <Route path={ROUTES.payment} element={<PaymentPage />} />
        <Route path={ROUTES.payments} element={<MyPaymentsPage />} />
        <Route path={ROUTES.search} element={<SearchPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.becomeInstructor} element={<BecomeInstructorPage />} />
        <Route path="/dashboard/instructor" element={<Navigate replace to={ROUTES.instructorDashboard} />} />
        <Route path={ROUTES.unauthorized} element={<UnauthorizedPage />} />
        <Route
          path={ROUTES.instructorDashboard}
          element={(
            <RoleBasedRoute requiredRoles={['ROLE_INSTRUCTOR']}>
              <InstructorDashboardPage />
            </RoleBasedRoute>
          )}
        />
        <Route
          path={ROUTES.instructorProfile}
          element={(
            <RoleBasedRoute requiredRoles={['ROLE_INSTRUCTOR']}>
              <InstructorProfilePage />
            </RoleBasedRoute>
          )}
        />
        <Route
          path={ROUTES.instructorNewCourse}
          element={(
            <RoleBasedRoute requiredRoles={['ROLE_INSTRUCTOR']}>
              <InstructorCourseCreatePage />
            </RoleBasedRoute>
          )}
        />
        <Route
          path={ROUTES.instructorNewCourseVideo()}
          element={(
            <RoleBasedRoute requiredRoles={['ROLE_INSTRUCTOR']}>
              <InstructorCourseVideoUploadPage />
            </RoleBasedRoute>
          )}
        />
        <Route path="/enrollment" element={<Navigate replace to={ROUTES.cart} />} />
      </Route>
    </Route>

    <Route path="*" element={<NotFoundPage />} />
    <Route path="/home" element={<Navigate replace to={ROUTES.home} />} />
  </Routes>
)

export default AppRouter
