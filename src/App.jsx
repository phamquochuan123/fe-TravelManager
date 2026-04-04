
import './App.css'
import { ToastContainer } from 'react-toastify'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home";
import Login from "./pages/Login";
import EmailVerify from "./pages/EmailVerify";
import ResetpassWord from './pages/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import EditRoom from './components/room/EditRoom';
import AddRoom from './components/room/AddRoom';
import HotelList from './pages/hotels/HotelList';
import HotelDetail from './pages/hotels/HotelDetail';
import BookRoom from './pages/hotels/BookRoom';
import MyBookings from './pages/hotels/MyBookings';


const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-passWord" element={<ResetpassWord />} />
        <Route path="/verify-email" element={<EmailVerify />} />

        {/* Hotel routes - public */}
        <Route path="/hotels" element={<HotelList />} />
        <Route path="/hotels/:hotelId" element={<HotelDetail />} />

        {/* Hotel booking - protected */}
        <Route path="/hotels/:hotelId/book/:roomId" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <BookRoom />
          </ProtectedRoute>
        } />

        {/* My bookings - protected */}
        <Route path="/my-bookings" element={
          <ProtectedRoute allowedRoles={["USER", "STAFF", "ADMIN"]}>
            <MyBookings />
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
