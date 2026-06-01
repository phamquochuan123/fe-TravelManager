import { lazy, Suspense, useEffect } from 'react'
import './App.css'
import { ToastContainer } from 'react-toastify'
import { Route, Routes, useLocation } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'

// Scroll to top on every route change
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// ─── Eager (critical landing page) ───────────────────────────────────────────
import HomePage from './pages/user/HomePage'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
const LoginPage        = lazy(() => import('./pages/auth/LoginPage'))
const RegisterPage     = lazy(() => import('./pages/auth/RegisterPage'))
const ForgotPassword   = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPassword    = lazy(() => import('./pages/auth/ResetPassword'))
const EmailVerify      = lazy(() => import('./pages/auth/EmailVerify'))

const HotelList      = lazy(() => import('./pages/hotels/HotelsPage'))
const HotelDetail    = lazy(() => import('./pages/hotels/HotelDetailPage'))
const BookHotelPage  = lazy(() => import('./pages/hotels/BookHotelPage'))

const ToursPage      = lazy(() => import('./pages/tours/ToursPage'))
const TourDetailPage = lazy(() => import('./pages/tours/TourDetailPage'))
const BookingPage    = lazy(() => import('./pages/tours/BookingPage'))
const PaymentSuccessPage = lazy(() => import('./pages/payment/PaymentSuccessPage'))
const PaymentFailPage    = lazy(() => import('./pages/payment/PaymentFailPage'))

const RestaurantList    = lazy(() => import('./pages/restaurants/RestaurantsPage'))
const RestaurantDetail  = lazy(() => import('./pages/restaurants/RestaurantDetailPage'))
const BookRestaurant    = lazy(() => import('./pages/restaurants/BookRestaurant'))

const DestinationDetail = lazy(() => import('./pages/destinations/DestinationDetailPage'))


const MyOrdersPage         = lazy(() => import('./pages/user/MyOrdersPage'))
const ProfilePage          = lazy(() => import('./pages/user/ProfilePage'))
const PaymentResultPage    = lazy(() => import('./pages/payment/PaymentResultPage'))
const PaymentHistoryPage   = lazy(() => import('./pages/payment/PaymentHistoryPage'))

// ─── Admin section (nested layout) ───────────────────────────────────────────
const AdminLayout           = lazy(() => import('./components/layout/AdminLayout'))
const AdminDashboardPage    = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminToursPage        = lazy(() => import('./pages/admin/AdminToursPage'))
const AdminSchedulesPage    = lazy(() => import('./pages/admin/AdminSchedulesPage'))
const AdminOrdersPage       = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminHotelsPage       = lazy(() => import('./pages/admin/AdminHotelsPage'))
const AdminRestaurantsPage  = lazy(() => import('./pages/admin/AdminRestaurantsPage'))
const AdminUsersPage        = lazy(() => import('./pages/admin/AdminUsersPage'))
const AdminStaffPage        = lazy(() => import('./pages/admin/AdminStaffPage'))
const AdminReviewsPage      = lazy(() => import('./pages/admin/AdminReviewsPage'))
const AdminReportsPage      = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminPermissionsPage  = lazy(() => import('./pages/admin/AdminPermissionsPage'))
const AdminRolesPage        = lazy(() => import('./pages/admin/AdminRolesPage'))
const AdminCouponsPage      = lazy(() => import('./pages/admin/AdminCouponsPage'))
const AdminIncidentsPage    = lazy(() => import('./pages/admin/AdminIncidentsPage'))
const AdminDestinationsPage = lazy(() => import('./pages/admin/AdminDestinationsPage'))
const AdminPaymentsPage     = lazy(() => import('./pages/admin/AdminPaymentsPage'))

// ─── Staff section (nested layout) ───────────────────────────────────────────
const StaffLayout       = lazy(() => import('./components/layout/StaffLayout'))
const StaffDashboardPage = lazy(() => import('./pages/staff/StaffDashboardPage'))
const StaffSchedulePage  = lazy(() => import('./pages/staff/StaffSchedulePage'))
const IncidentReportPage = lazy(() => import('./pages/staff/IncidentReportPage'))

// ─── Full-page loading fallback ───────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <span className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
  </div>
)

const App = () => {
  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense fallback={<PageLoader />}>
        <ScrollToTop />
        <Routes>
          {/* Public */}
          <Route path="/"                element={<HomePage />} />
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-passWord"  element={<ResetPassword />} />
          <Route path="/verify-email"    element={<EmailVerify />} />

          {/* Destinations */}
          <Route path="/destinations/:id" element={<DestinationDetail />} />

          {/* Hotels */}
          <Route path="/hotels"                        element={<HotelList />} />
          <Route path="/hotels/:hotelId"               element={<HotelDetail />} />
          <Route path="/hotels/:hotelId/book/:roomId"  element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <BookHotelPage />
            </ProtectedRoute>
          } />

          {/* Tours */}
          <Route path="/tours"              element={<ToursPage />} />
          <Route path="/tours/:tourId"      element={<TourDetailPage />} />
          <Route path="/tours/:tourId/book" element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <BookingPage />
            </ProtectedRoute>
          } />

          {/* Restaurants */}
          <Route path="/restaurants"                       element={<RestaurantList />} />
          <Route path="/restaurants/:restaurantId"         element={<RestaurantDetail />} />
          <Route path="/restaurants/:restaurantId/book"    element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <BookRestaurant />
            </ProtectedRoute>
          } />

{/* User */}
          <Route path="/my-orders" element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <MyOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/my-bookings" element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <MyOrdersPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* Payment */}
          <Route path="/payment/result"  element={<PaymentResultPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/fail"    element={<PaymentFailPage />} />
          <Route path="/payment/history" element={
            <ProtectedRoute allowedRoles={['USER', 'STAFF', 'ADMIN']}>
              <PaymentHistoryPage />
            </ProtectedRoute>
          } />

          {/* Admin (nested layout) */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index                      element={<AdminDashboardPage />} />
            <Route path="tours"               element={<AdminToursPage />} />
            <Route path="departures"          element={<AdminSchedulesPage />} />
            <Route path="hotels"              element={<AdminHotelsPage />} />
            <Route path="restaurants"         element={<AdminRestaurantsPage />} />
            <Route path="orders">
              <Route index                    element={<AdminOrdersPage />} />
              <Route path="tours"             element={<AdminOrdersPage defaultServiceType="TOUR" />} />
              <Route path="rooms"             element={<AdminOrdersPage defaultServiceType="HOTEL" />} />
              <Route path="restaurants"       element={<AdminOrdersPage defaultServiceType="RESTAURANT" />} />
            </Route>
            <Route path="customers"           element={<AdminUsersPage />} />
            <Route path="staff"               element={<AdminStaffPage />} />
            <Route path="reviews"             element={<AdminReviewsPage />} />
            <Route path="analytics"           element={<AdminReportsPage />} />
            <Route path="permissions"         element={<AdminPermissionsPage />} />
            <Route path="roles"               element={<AdminRolesPage />} />
            <Route path="coupons"             element={<AdminCouponsPage />} />
            <Route path="incidents"           element={<AdminIncidentsPage />} />
            <Route path="destinations"        element={<AdminDestinationsPage />} />
            <Route path="payments"            element={<AdminPaymentsPage />} />
          </Route>
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['ADMIN', 'STAFF']}>
              <StaffLayout />
            </ProtectedRoute>
          }>
            <Route index          element={<StaffDashboardPage />} />
            <Route path="schedule"  element={<StaffSchedulePage />} />
            <Route path="incidents" element={<IncidentReportPage />} />
          </Route>
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
