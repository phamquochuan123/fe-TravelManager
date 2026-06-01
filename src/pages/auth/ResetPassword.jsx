import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axiosInstance";
import { assets } from "../../assets/assets";
import { toast } from "react-toastify";

const ResetpassWord = () => {
    const inputRef = useRef([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [isEmailSent, setIsEmailSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [isOtpSubmitted, setIsOtpSubmiited] = useState(false);

    const handleChange = (e, index) => {
        const value = e.target.value.replace(/\D/g, "").slice(-1);
        e.target.value = value;
        if (value && index < 5) inputRef.current[index + 1].focus();
    }

    const handleKeyDown = (e, index) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
            inputRef.current[index - 1].focus();
        }
    }

    const handlePaste = (e) => {
        e.preventDefault();
        const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6).split("");
        paste.forEach((digit, i) => {
            if (inputRef.current[i]) inputRef.current[i].value = digit;
        });
        const next = paste.length < 6 ? paste.length : 5;
        inputRef.current[next].focus();
    }

    const onSubmitEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post("/send-reset-otp?email=" + email);
            if (response.status === 200) {
                toast.success("Password reset OTP sent successfully.");
                setIsEmailSent(true);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false);
        }
    }

    const handleVerify = async () => {
        const otpValue = inputRef.current.map(i => i?.value || "").join("");
        if (otpValue.length !== 6) {
            toast.error("OTP must be 6 digits");
            return;
        }
        setOtp(otpValue);
        setIsOtpSubmiited(true);
    }

    const onSubmitNewPassword = async (e) => {
        e.preventDefault();
        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }
        try {
            setLoading(true);
            const response = await api.post("/reset-password", { email, otp, newPassword });
            if (response.status === 200) {
                toast.success("Password reset successfully.");
                navigate("/login");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-['Be_Vietnam_Pro'] bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 p-6">

            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            {/* Logo */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 no-underline group">
                <div className="bg-white/20 backdrop-blur-md p-2.5 rounded group-hover:scale-110 transition-transform border border-white/30">
                    <img src={assets.logo_home} alt="logo" className="w-7 h-7 invert" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter hidden md:block">
                    Travel<span className="text-cyan-300">Manager</span>
                </span>
            </Link>

            {/* Card */}
            <div className="w-full max-w-[450px] bg-white rounded-sm p-8 md:p-12 shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-500 relative z-10">

                {/* STEP 1: Email */}
                {!isEmailSent && (
                    <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 rounded flex items-center justify-center mx-auto mb-5">
                            <i className="bi bi-envelope-paper-fill text-3xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Quên mật khẩu?</h2>
                        <p className="text-gray-500 font-medium mb-8">Nhập email của bạn, chúng tôi sẽ gửi mã xác nhận.</p>

                        <form onSubmit={onSubmitEmail} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                    <i className="bi bi-envelope text-lg"></i>
                                </div>
                                <input
                                    type="email"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-[#f8f5ee] border-2 border-transparent rounded focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-gray-800"
                                    placeholder="Email của bạn"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-lg hover:shadow-sky-200 hover:-translate-y-0.5 text-white font-bold py-3.5 rounded transition-all active:scale-95 flex items-center justify-center gap-2"
                                type="submit" disabled={loading}
                            >
                                {loading
                                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    : <><i className="bi bi-send" /> Gửi mã OTP</>
                                }
                            </button>
                            <Link to="/login" className="inline-block text-sm font-bold text-sky-500 hover:underline transition-colors">
                                <i className="bi bi-arrow-left mr-1" /> Quay lại đăng nhập
                            </Link>
                        </form>
                    </div>
                )}

                {/* STEP 2: OTP */}
                {!isOtpSubmitted && isEmailSent && (
                    <div className="text-center animate-in slide-in-from-right-4 duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-600 rounded flex items-center justify-center mx-auto mb-5">
                            <i className="bi bi-shield-lock-fill text-3xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Xác nhận OTP</h2>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                            Mã đã gửi đến <span className="text-sky-600 font-bold">{email}</span>
                        </p>

                        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                            {[...Array(6)].map((_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    ref={(el) => (inputRef.current[i] = el)}
                                    className="w-12 h-16 md:w-14 md:h-16 text-center text-2xl font-bold bg-[#f8f5ee] border-2 border-transparent rounded focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100 transition-all outline-none"
                                    onChange={(e) => handleChange(e, i)}
                                    onKeyDown={(e) => handleKeyDown(e, i)}
                                />
                            ))}
                        </div>
                        <button
                            className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-200 hover:shadow-lg text-white font-bold py-3.5 rounded transition-all active:scale-95 mb-4"
                            onClick={handleVerify} disabled={loading}
                        >
                            Xác nhận OTP
                        </button>
                        <p className="text-sm text-gray-400 font-medium">
                            Chưa nhận được mã?{" "}
                            <button type="button" onClick={onSubmitEmail} className="text-sky-500 font-bold hover:underline">
                                Gửi lại
                            </button>
                        </p>
                    </div>
                )}

                {/* STEP 3: New password */}
                {isOtpSubmitted && isEmailSent && (
                    <div className="text-center animate-in slide-in-from-right-4 duration-500">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-green-100 text-emerald-600 rounded flex items-center justify-center mx-auto mb-5">
                            <i className="bi bi-lock-fill text-3xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Mật khẩu mới</h2>
                        <p className="text-gray-500 font-medium mb-8">Đặt mật khẩu mạnh để bảo vệ tài khoản.</p>

                        <form onSubmit={onSubmitNewPassword} className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                    <i className="bi bi-lock-fill text-lg"></i>
                                </div>
                                <input
                                    type="password"
                                    className="block w-full pl-11 pr-4 py-3.5 bg-[#f8f5ee] border-2 border-transparent rounded focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-gray-800"
                                    placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-200 hover:shadow-lg hover:-translate-y-0.5 text-white font-bold py-3.5 rounded transition-all active:scale-95 flex items-center justify-center gap-2"
                                type="submit" disabled={loading}
                            >
                                {loading
                                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    : <><i className="bi bi-check-circle" /> Cập nhật mật khẩu</>
                                }
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetpassWord;
