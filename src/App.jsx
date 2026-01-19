
import './App.css'
import { ToastContainer } from 'react-toastify'
import { Route, Routes } from 'react-router-dom'
import Home from "./pages/Home";
import Login from "./pages/Login";

import EmailVerify from "./pages/EmailVerify";
import ResetpassWord from './pages/ResetPassword';


const App = () => {
  return (
    <div>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-passWord" element={<ResetpassWord />} />
        <Route path="/verify-email" element={<EmailVerify />} />
      </Routes>
    </div>
  )
}



export default App
