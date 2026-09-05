import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../../context/appContextObject";
import { toast } from "react-toastify";
import api from "../../api/axiosInstance";

const EmailVerify = () => {
    const inputRef = useRef([]);
    const [loading, setloading] = useState(false);
    const { getUserData, isLoggedIn, userData } = useContext(AppContext);
    const navigate = useNavigate();

    const pendingEmail = localStorage.getItem("pendingVerifyEmail");

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

    const handleVerify = async () => {
        const otp = inputRef.current.map(input => input.value).join("");
        if (otp.length !== 6) {
            toast.error("Vui lòng nhập đủ 6 chữ số OTP");
            return;
        }
        const email = pendingEmail || userData?.email;
        if (!email) {
            toast.error("Không xác định được email. Vui lòng đăng nhập lại.");
            navigate("/login");
            return;
        }
        setloading(true);
        try {
            await api.post("/verify-otp", { otp, email });
            toast.success("Xác thực email thành công!");
            localStorage.removeItem("pendingVerifyEmail");
            await getUserData();
            navigate("/login");
        } catch (error) {
            toast.error(error.message || "OTP không hợp lệ");
        } finally {
            setloading(false);
        }
    }

    const handleResend = async () => {
        const email = pendingEmail || userData?.email;
        if (!email) {
            toast.error("Không xác định được email.");
            return;
        }
        try {
            await api.post("/send-otp", { email });
            toast.success("Đã gửi lại mã OTP. Kiểm tra email của bạn.");
        } catch (error) {
            toast.error(error.message || "Không thể gửi lại OTP");
        }
    }

    useEffect(() => {
        if (isLoggedIn && userData?.isAccountVerified) navigate("/");
    }, [isLoggedIn, userData, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 relative overflow-hidden">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-cyan-400/10 rounded-full" />

            {/* Logo */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 no-underline group">
                <div className="bg-white/20 backdrop-blur-md p-2.5 rounded group-hover:scale-110 transition-transform border border-white/30">
                    <img src={assets.logo_home} alt="logo" className="w-7 h-7 invert" />
                </div>
                <span className="text-xl font-black text-white tracking-tighter">
                    Travel<span className="text-cyan-300">Manager</span>
                </span>
            </Link>

            {/* Main Card */}
            <div className="bg-white rounded-sm shadow-2xl p-8 md:p-12 w-full max-w-md border border-gray-100 animate-in fade-in zoom-in duration-500 relative z-10">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-100 to-blue-100 text-sky-600 rounded mb-4 shadow-sm">
                        <i className="bi bi-shield-lock-fill text-3xl"></i>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Xác thực Email</h2>
                    <p className="text-gray-500 font-medium">
                        Mã 6 chữ số đã được gửi đến{" "}
                        <span className="font-bold text-sky-600">
                            {pendingEmail || userData?.email || "email của bạn"}
                        </span>
                    </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                    {[...Array(6)].map((_, i) => (
                        <input
                            key={i}
                            type="text"
                            maxLength={1}
                            ref={(el) => (inputRef.current[i] = el)}
                            onChange={(e) => handleChange(e, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            className="w-12 h-16 md:w-14 md:h-20 text-center text-2xl font-bold bg-[#f8f5ee] border-2 border-transparent rounded focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 transition-all outline-none text-gray-800 shadow-sm"
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    className={`w-full py-4 rounded font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2
                        ${loading
                            ? 'bg-sky-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:shadow-sky-200 hover:-translate-y-0.5'
                        }`}
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Đang xác thực...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-shield-check-fill" />
                            Xác thực Email
                        </>
                    )}
                </button>

                {/* Resend */}
                <p className="mt-8 text-center text-sm text-gray-400 font-medium">
                    Chưa nhận được mã?{" "}
                    <button
                        onClick={handleResend}
                        className="text-sky-500 hover:text-sky-600 hover:underline font-bold transition-colors"
                    >
                        Gửi lại
                    </button>
                </p>

                <p className="mt-4 text-center text-xs text-gray-400">
                    <Link to="/login" className="text-gray-500 hover:text-sky-500 transition-colors font-medium">
                        <i className="bi bi-arrow-left mr-1" /> Quay lại đăng nhập
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default EmailVerify;
