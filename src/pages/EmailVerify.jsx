import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useContext, useEffect, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import axios from "axios";

const EmailVerify = () => {
    const inputRef = useRef([]);
    const [loading, setloading] = useState(false);
    const { getUserData, isLoggedIn, userData, backend_Url } = useContext(AppContext);
    const navigate = useNavigate();


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
            toast.error("Please enter a valid 6-digit of the OTP");
            return;
        }
        setloading(true);
        try {
            const response = await axios.post(backend_Url + "/verify-otp", { otp });
            if (response.status === 200) {
                toast.success("OTP verified successfully");
                getUserData();
                navigate("/");
            } else {
                toast.error("Invalid OTP. Please try again.");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "OTP verification failed");
        } finally {
            setloading(false);
        }
    }

    useEffect(() => {
        isLoggedIn && userData && userData.isAccountVerified && navigate("/");
    }, [isLoggedIn, userData]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 font-['Outfit']">

            {/* Logo Home Link */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 no-underline group">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl group-hover:scale-110 transition-transform">
                    <img src={assets.logo_home} alt="logo" className="w-8 h-8 invert" />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter">Travel Manager</span>
            </Link>

            {/* Main Card */}
            <div className="bg-white/90 backdrop-blur-2xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] w-full max-w-md border border-white/30 animate-in fade-in zoom-in duration-500">

                {/* Header Text */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl mb-4 shadow-inner">
                        <i className="bi bi-shield-lock-fill text-3xl"></i>
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Email Verification</h2>
                    <p className="text-gray-500 font-medium">
                        We've sent a 6-digit code to your email. Please enter it below.
                    </p>
                </div>

                {/* OTP Input Fields */}
                <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
                    {[...Array(6)].map((_, i) => (
                        <input
                            key={i}
                            type="text"
                            maxLength={1}
                            ref={(el) => (inputRef.current[i] = el)}
                            onChange={(e) => handleChange(e, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            className="w-12 h-16 md:w-14 md:h-20 text-center text-2xl font-bold bg-gray-50 border-2 border-transparent rounded-2xl focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-gray-800 shadow-sm"
                        />
                    ))}
                </div>

                {/* Verify Button */}
                <button
                    onClick={handleVerify}
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2
                        ${loading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1'}`}
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Verifying...
                        </>
                    ) : (
                        "Verify Email"
                    )}
                </button>

                {/* Back to Login / Resend info */}
                <p className="mt-8 text-center text-sm text-gray-400 font-medium">
                    Didn't receive the code?
                    <button className="text-indigo-600 hover:underline ml-1 font-bold">Resend</button>
                </p>
            </div>
        </div>
    );
}

export default EmailVerify;