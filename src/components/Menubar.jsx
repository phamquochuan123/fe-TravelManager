import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useContext, useRef, useState, useEffect } from "react";
import { AppContext } from "../context/AppContext";
import api from "../api/axiosInstance";
import { toast } from "react-toastify";

const PUBLIC_LINKS = [
    { path: "/hotels", label: "Khách sạn", icon: "bi-building" },
    { path: "/tours", label: "Tour", icon: "bi-map" },
    { path: "/restaurants", label: "Nhà hàng", icon: "bi-cup-hot" },
    { path: "/destinations", label: "Điểm đến", icon: "bi-geo-alt" },
]
const NAV_LINKS = [
    ...PUBLIC_LINKS,
    { path: "/my-bookings", label: "Đặt chỗ", icon: "bi-calendar-check" },
]

const MenuBar = () => {
    const navigate = useNavigate();
    const { userData, setIsLoggedIn, setUserData } = useContext(AppContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const dropDownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleLogout = async () => {
        try {
            const response = await api.post("/logout");
            if (response.status === 200) {
                setIsLoggedIn(false);
                setUserData(null);
                navigate("/login");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Logout failed");
        }
    }

    const sendVerificationOTP = async () => {
        try {
            const response = await api.post("/send-otp");
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
        <>
            <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
                scrolled
                    ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-sky-100/20 border-b border-gray-100"
                    : "bg-white/80 backdrop-blur-lg border-b border-white/20"
            }`}>
                <div className="flex justify-between items-center px-6 md:px-12 h-16">
                    {/* Logo */}
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-sky-200">
                            <img src={assets.logo_home} alt="logo" className="w-7 h-7 object-contain" />
                        </div>
                        <span className="font-['Be_Vietnam_Pro'] font-black text-xl tracking-tighter text-gray-900">
                            Travel<span className="text-sky-500">Manager</span>
                        </span>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden lg:flex items-center gap-1">
                        {PUBLIC_LINKS.map(link => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-sky-500 transition-colors px-3 py-2 rounded hover:bg-sky-50"
                            >
                                <i className={`bi ${link.icon} text-xs`} /> {link.label}
                            </button>
                        ))}
                        {userData && (
                            <button
                                onClick={() => navigate("/my-bookings")}
                                className="flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-sky-500 transition-colors px-3 py-2 rounded hover:bg-sky-50"
                            >
                                <i className="bi bi-calendar-check text-xs" /> Đặt chỗ
                            </button>
                        )}
                        {userData && (userData.roleName === "ADMIN" || userData.roleName === "STAFF") && (
                            <button
                                onClick={() => navigate("/staff")}
                                className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors px-3 py-2 rounded bg-blue-50"
                            >
                                <i className="bi bi-person-badge text-xs" /> Staff
                            </button>
                        )}
                        {userData && userData.roleName === "ADMIN" && (
                            <button
                                onClick={() => navigate("/admin")}
                                className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 transition-colors px-3 py-2 rounded bg-red-50"
                            >
                                <i className="bi bi-shield-check text-xs" /> Admin
                            </button>
                        )}
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-3">
                        {userData ? (
                            <div className="relative" ref={dropDownRef}>
                                <button
                                    onClick={() => setDropdownOpen(p => !p)}
                                    className="flex items-center gap-2.5 pl-3 pr-4 py-2 rounded-full bg-[#f8f5ee] hover:bg-sky-50 border border-gray-200 hover:border-sky-200 transition-all group"
                                >
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow">
                                        {userData?.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700 hidden sm:block max-w-[100px] truncate">
                                        {userData?.name}
                                    </span>
                                    <i className={`bi bi-chevron-${dropdownOpen ? "up" : "down"} text-gray-400 text-xs transition-transform`} />
                                </button>

                                {dropdownOpen && (
                                    <div className="absolute top-full right-0 mt-2 w-60 bg-white rounded shadow-2xl shadow-sky-100/30 border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                                        {/* Header */}
                                        <div className="px-4 py-3.5 bg-gradient-to-r from-sky-50 to-blue-50 border-b border-gray-100">
                                            <p className="text-xs text-gray-400 uppercase font-bold tracking-widest">Đăng nhập với</p>
                                            <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{userData.name}</p>
                                            {userData.roleName && (
                                                <span className={`inline-block mt-1.5 px-2 py-0.5 text-xs font-bold rounded-full ${
                                                    userData.roleName === "ADMIN" ? "bg-red-100 text-red-600" :
                                                    userData.roleName === "STAFF" ? "bg-blue-100 text-blue-600" :
                                                    "bg-emerald-100 text-emerald-600"
                                                }`}>
                                                    {userData.roleName}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-2">
                                            <button onClick={() => { navigate("/profile"); setDropdownOpen(false); }}
                                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded transition-colors flex items-center gap-2.5">
                                                <i className="bi bi-person-circle text-sky-400" /> Hồ sơ cá nhân
                                            </button>
                                            <button onClick={() => { navigate("/my-bookings"); setDropdownOpen(false); }}
                                                className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-sky-50 hover:text-sky-600 rounded transition-colors flex items-center gap-2.5">
                                                <i className="bi bi-calendar-check text-sky-400" /> Lịch sử đặt chỗ
                                            </button>

                                            <div className="lg:hidden">
                                                {NAV_LINKS.map(link => (
                                                    <button key={link.path} onClick={() => { navigate(link.path); setDropdownOpen(false); }}
                                                        className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#f8f5ee] rounded transition-colors flex items-center gap-2.5">
                                                        <i className={`bi ${link.icon} text-gray-400`} /> {link.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {(userData.roleName === "ADMIN" || userData.roleName === "STAFF") && (
                                                <button onClick={() => { navigate("/staff"); setDropdownOpen(false); }}
                                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors flex items-center gap-2.5">
                                                    <i className="bi bi-person-badge text-blue-400" /> Staff Dashboard
                                                </button>
                                            )}
                                            {userData.roleName === "ADMIN" && (
                                                <button onClick={() => { navigate("/admin"); setDropdownOpen(false); }}
                                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors flex items-center gap-2.5">
                                                    <i className="bi bi-shield-check text-red-400" /> Admin Dashboard
                                                </button>
                                            )}
                                            {!userData.isAccountVerified && (
                                                <button onClick={sendVerificationOTP}
                                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded transition-colors flex items-center gap-2.5">
                                                    <i className="bi bi-patch-check text-amber-400" /> Xác thực Email
                                                </button>
                                            )}

                                            <div className="border-t border-gray-100 mt-1 pt-1">
                                                <button onClick={handleLogout}
                                                    className="w-full text-left px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded transition-colors flex items-center gap-2.5">
                                                    <i className="bi bi-box-arrow-right text-red-400" /> Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="text-sm font-semibold text-gray-600 hover:text-sky-500 px-4 py-2 rounded transition-colors hidden sm:block"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    onClick={() => navigate("/register")}
                                    className="flex items-center gap-1.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-lg shadow-sky-200 hover:shadow-sky-300 hover:scale-105 active:scale-95"
                                >
                                    Bắt đầu <i className="bi bi-arrow-right text-xs" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>
        </>
    );
}

export default MenuBar;
