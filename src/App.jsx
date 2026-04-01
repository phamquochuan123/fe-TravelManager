
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


const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-passWord" element={<ResetpassWord />} />
        <Route path="/verify-email" element={<EmailVerify />} />

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
