import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axiosInstance";

const Register = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [passWord, setPassWord] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        if (passWord !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp");
            return;
        }
        setLoading(true);
        try {
            const response = await api.post("/register", { name, email, passWord });
            if (response.status === 201) {
                localStorage.setItem("pendingVerifyEmail", email);
                toast.success("Đăng ký thành công! Vui lòng xác thực email.");
                navigate("/verify-email");
            }
        } catch (error) {
            toast.error(error.message || "Đăng ký thất bại");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex font-['Outfit']">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 relative overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

                <div className="relative z-10 text-center">
                    <Link to="/" className="flex items-center justify-center gap-3 mb-12 group">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl">
                            <img src={assets.logo_home} alt="Logo" className="w-10 h-10 invert" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter">Travel Manager</span>
                    </Link>

                    <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 text-left max-w-sm mx-auto">
                        <h3 className="text-xl font-black text-white mb-4">Bắt đầu hành trình của bạn</h3>
                        <ul className="space-y-3">
                            {[
                                "Đặt phòng khách sạn nhanh chóng",
                                "Tour du lịch hấp dẫn trên khắp VN",
                                "Nhà hàng & điểm đến nổi bật",
                                "Lịch sử đặt chỗ dễ quản lý",
                                "Hỗ trợ 24/7 tận tâm",
                            ].map(item => (
                                <li key={item} className="flex items-center gap-3 text-white/80 text-sm">
                                    <i className="bi bi-check-circle-fill text-sky-300 shrink-0" />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50 overflow-y-auto">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <Link to="/" className="flex items-center gap-3 mb-8 lg:hidden">
                        <div className="bg-gradient-to-br from-sky-500 to-blue-600 p-2 rounded-xl shadow-lg">
                            <img src={assets.logo_home} alt="Logo" className="w-7 h-7" />
                        </div>
                        <span className="text-2xl font-black text-gray-900">Travel<span className="text-sky-500">Manager</span></span>
                    </Link>

                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
                        <div className="mb-8">
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tạo tài khoản</h2>
                            <p className="text-gray-500 mt-1.5">Miễn phí và chỉ mất 1 phút</p>
                        </div>

                        <form onSubmit={onSubmitHandler} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Họ và tên</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-person text-lg" />
                                    </div>
                                    <input
                                        type="text"
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-sm"
                                        placeholder="Nguyễn Văn A"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-envelope text-lg" />
                                    </div>
                                    <input
                                        type="email"
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-sm"
                                        placeholder="example@email.com"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-lock text-lg" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-sm"
                                        placeholder="Tối thiểu 6 ký tự"
                                        required
                                        minLength={6}
                                        value={passWord}
                                        onChange={e => setPassWord(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowPassword(p => !p)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-500 transition-colors">
                                        <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-lg`} />
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Xác nhận mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-shield-lock text-lg" />
                                    </div>
                                    <input
                                        type={showConfirm ? "text" : "password"}
                                        className={`block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 rounded-2xl focus:bg-white focus:ring-4 transition-all outline-none text-sm ${
                                            confirmPassword && passWord !== confirmPassword
                                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                                : "border-transparent focus:border-sky-400 focus:ring-sky-100"
                                        }`}
                                        placeholder="••••••••"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-500 transition-colors">
                                        <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"} text-lg`} />
                                    </button>
                                </div>
                                {confirmPassword && passWord !== confirmPassword && (
                                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                                        <i className="bi bi-exclamation-circle" /> Mật khẩu không khớp
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-95 flex items-center justify-center gap-2 group mt-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Tạo tài khoản
                                        <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm">
                                Đã có tài khoản?{" "}
                                <Link to="/login" className="text-sky-500 font-black hover:underline no-underline">
                                    Đăng nhập
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
