import './App.css'
import { ToastContainer } from 'react-toastify'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home"
import Login from "./pages/Login"
import EmailVerify from "./pages/EmailVerify"
import ResetpassWord from './pages/ResetPassword'
import Register from './pages/Register'
import AdminDashboard from './pages/admin/AdminDashboard'
import StaffDashboard from './pages/staff/StaffDashboard'
import ProtectedRoute from './components/ProtectedRoute'
import EditRoom from './components/room/EditRoom'
import AddRoom from './components/room/AddRoom'

// Hotel
import HotelList from './pages/hotels/HotelList'
import HotelDetail from './pages/hotels/HotelDetail'
import BookRoom from './pages/hotels/BookRoom'

// Tour
import TourList from './pages/tours/TourList'
import TourDetail from './pages/tours/TourDetail'
import BookTour from './pages/tours/BookTour'

// Restaurant
import RestaurantList from './pages/restaurants/RestaurantList'
import RestaurantDetail from './pages/restaurants/RestaurantDetail'
import BookRestaurant from './pages/restaurants/BookRestaurant'

// Destination
import DestinationList from './pages/destinations/DestinationList'
import DestinationDetail from './pages/destinations/DestinationDetail'

// User
import MyBookings from './pages/MyBookings'
import UserProfile from './pages/UserProfile'

const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-passWord" element={<ResetpassWord />} />
        <Route path="/verify-email" element={<EmailVerify />} />

        {/* Hotel routes - public */}
        <Route path="/hotels" element={<HotelList />} />
        <Route path="/hotels/:hotelId" element={<HotelDetail />} />
        <Route path="/hotels/:hotelId/book/:roomId" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <BookRoom />
          </ProtectedRoute>
        } />

        {/* Tour routes - public */}
        <Route path="/tours" element={<TourList />} />
        <Route path="/tours/:tourId" element={<TourDetail />} />
        <Route path="/tours/:tourId/book" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <BookTour />
          </ProtectedRoute>
        } />

        {/* Restaurant routes - public */}
        <Route path="/restaurants" element={<RestaurantList />} />
        <Route path="/restaurants/:restaurantId" element={<RestaurantDetail />} />
        <Route path="/restaurants/:restaurantId/book" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <BookRestaurant />
          </ProtectedRoute>
        } />

        {/* Destination routes - public */}
        <Route path="/destinations" element={<DestinationList />} />
        <Route path="/destinations/:destinationId" element={<DestinationDetail />} />

        {/* User protected routes */}
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <MyBookings />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <UserProfile />
          </ProtectedRoute>
        } />

        {/* Room management */}
        <Route path="/add-room" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AddRoom />
          </ProtectedRoute>
        } />
        <Route path="/edit-room/:roomId" element={
          <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
            <EditRoom />
          </ProtectedRoute>
        } />

        {/* Dashboards */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={["ADMIN"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/staff" element={
          <ProtectedRoute allowedRoles={["ADMIN", "STAFF"]}>
            <StaffDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
