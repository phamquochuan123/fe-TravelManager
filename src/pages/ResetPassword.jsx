import { useContext, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { assets } from "../assets/assets";
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
    axios.defaults.withCredentials = true;

    const { backend_Url } = useContext(AppContext) || { backend_Url: "" };

    // --- Giữ nguyên Logic điều hướng OTP ---
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

    // --- Giữ nguyên Logic API ---
    const onSubmitEmail = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(backend_Url + "/send-reset-otp?email=" + email);
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
            const response = await axios.post(backend_Url + "/reset-password", { email, otp, newPassword });
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
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden font-['Outfit'] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6">

            {/* Logo Brand ở góc trên */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 no-underline group">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg">
                    <img src={assets.logo_home} alt="logo" className="w-8 h-8 invert" />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter hidden md:block">Travel Manager</span>
            </Link>

            {/* Glass Card chính */}
            <div className="w-full max-w-[450px] bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-12 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] border border-white/20 animate-in fade-in zoom-in duration-500">

                {/* BƯỚC 1: NHẬP EMAIL */}
                {!isEmailSent && (
                    <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <i className="bi bi-envelope-paper-fill text-4xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Forgot Password?</h2>
                        <p className="text-gray-500 font-medium mb-8">No worries! Enter your email and we'll send a code.</p>

                        <form onSubmit={onSubmitEmail} className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <i className="bi bi-envelope text-lg"></i>
                                </div>
                                <input
                                    type="email"
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 group" type="submit" disabled={loading}>
                                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Send Reset OTP"}
                            </button>
                            <Link to="/login" className="inline-block text-sm font-bold text-indigo-600 hover:underline">Back to Login</Link>
                        </form>
                    </div>
                )}

                {/* BƯỚC 2: NHẬP OTP */}
                {!isOtpSubmitted && isEmailSent && (
                    <div className="text-center animate-in slide-in-from-right-4 duration-500">
                        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <i className="bi bi-shield-lock-fill text-4xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Verify OTP</h2>
                        <p className="text-gray-500 font-medium mb-8 leading-relaxed">Code sent to: <br /><span className="text-indigo-600 font-bold">{email}</span></p>

                        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                            {[...Array(6)].map((_, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    maxLength={1}
                                    ref={(el) => (inputRef.current[i] = el)}
                                    className="w-12 h-16 md:w-14 md:h-16 text-center text-2xl font-black bg-gray-50 border-2 border-transparent rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none shadow-sm"
                                    onChange={(e) => handleChange(e, i)}
                                    onKeyDown={(e) => handleKeyDown(e, i)}
                                />
                            ))}
                        </div>
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 mb-6" onClick={handleVerify} disabled={loading}>
                            Verify OTP
                        </button>
                        <p className="text-sm text-gray-400 font-medium">
                            Didn't get the code? <button type="button" onClick={onSubmitEmail} className="text-indigo-600 font-black hover:underline ml-1">Resend</button>
                        </p>
                    </div>
                )}

                {/* BƯỚC 3: NHẬP MẬT KHẨU MỚI */}
                {isOtpSubmitted && isEmailSent && (
                    <div className="text-center animate-in slide-in-from-right-4 duration-500">
                        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <i className="bi bi-check-all text-5xl"></i>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Secure Now</h2>
                        <p className="text-gray-500 font-medium mb-8">Set a strong new password to protect your account.</p>

                        <form onSubmit={onSubmitNewPassword} className="space-y-6">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <i className="bi bi-lock-fill text-lg"></i>
                                </div>
                                <input
                                    type="password"
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800"
                                    placeholder="Enter new password (8+ chars)"
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95" type="submit" disabled={loading}>
                                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : "Update Password"}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ResetpassWord;