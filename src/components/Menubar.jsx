import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useContext, useRef, useState, useEffect } from "react"; // Đổi useInsertionEffect thành useEffect cho chuẩn React 18+ nếu cần
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";

const MenuBar = () => {
    const navigate = useNavigate();
    const { userData, backend_Url, setIsLoggedIn, setUserData } = useContext(AppContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropDownRef = useRef(null);

    // Giữ nguyên logic click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Giữ nguyên logic logout
    const handleLogout = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(backend_Url + "/logout");
            if (response.status === 200) {
                setIsLoggedIn(false);
                setUserData(null);
                navigate("/login");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    }

    // Giữ nguyên logic gửi OTP
    const sendVerificationOTP = async () => {
        try {
            axios.defaults.withCredentials = true;
            const response = await axios.post(backend_Url + "/send-otp");
            if (response.status === 200) {
                navigate("/verify-email");
                toast.success("OTP has been sent successfully to your email.");
            } else {
                toast.error("Failed to send OTP. Please try again.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Error sending OTP");
        }
    }

    return (
        <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 py-5 transition-all duration-300 bg-white/70 backdrop-blur-lg border-b border-white/20">
            {/* Logo Section */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-indigo-200">
                    {/* XÓA class invert để logo hiện màu vàng/xanh nguyên bản */}
                    <img src={assets.logo_home} alt="logo" className="w-8 h-8 object-contain" />
                </div>
                <span className="font-['Outfit'] font-black text-2xl tracking-tighter text-gray-900">
                    Travel<span className="text-indigo-600">Manager</span>
                </span>
            </div>

            {/* User Section - GIỮ NGUYÊN LOGIC userData ? ... : ... */}
            {userData ? (
                <div className="relative" ref={dropDownRef}>
                    <div
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex justify-center items-center font-bold text-lg shadow-md hover:shadow-indigo-300 transition-all cursor-pointer ring-2 ring-white"
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
                        {userData?.name?.charAt(0).toUpperCase()}
                    </div>

                    {dropdownOpen && (
                        <div className="absolute top-full right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                            <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Signed in as</p>
                                <p className="text-sm font-semibold text-gray-900 truncate">{userData.name}</p>
                            </div>

                            <div className="p-2">
                                {!userData.isAccountVerified && (
                                    <button onClick={sendVerificationOTP} className="w-full text-left px-3 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors flex items-center gap-2">
                                        <i className="bi bi-patch-check"></i> Verify Email
                                    </button>
                                )}
                                <button onClick={handleLogout} className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2">
                                    <i className="bi bi-box-arrow-right"></i> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <button className="flex items-center gap-2 bg-gray-900 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-gray-200" onClick={() => navigate("/login")}>
                    Login <i className="bi bi-arrow-right text-xs"></i>
                </button>
            )}
        </nav>
    );
}

export default MenuBar;