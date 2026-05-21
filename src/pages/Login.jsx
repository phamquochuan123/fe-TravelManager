import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useState, useContext } from "react";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import api from "../api/axiosInstance";

const Login = () => {
    const [email, setEmail] = useState("");
    const [passWord, setpassWord] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);

    const { setIsLoggedIn, getUserData } = useContext(AppContext);
    const navigate = useNavigate();

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post("/login", { email, passWord });
            if (response.status === 200) {
                setIsLoggedIn(true);
                await getUserData();
                navigate("/");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex font-['Outfit']">
            {/* Left panel - decorative */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-sky-600 via-blue-700 to-cyan-600 relative overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djZoNnYtNmgtNnptNiA2djZoNnYtNmgtNnptLTEyIDB2Nmg2di02aC02em0tNiAwdjZoNnYtNmgtNnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

                <div className="relative z-10 text-center">
                    <Link to="/" className="flex items-center justify-center gap-3 mb-12 group">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl group-hover:rotate-12 transition-transform shadow-xl">
                            <img src={assets.logo_home} alt="Logo" className="w-10 h-10 invert" />
                        </div>
                        <span className="text-3xl font-black text-white tracking-tighter">Travel Manager</span>
                    </Link>

                    <div className="space-y-6 text-left max-w-sm mx-auto">
                        {[
                            { icon: "bi-building", title: "500+ Khách sạn", desc: "Từ resort 5 sao đến homestay ấm cúng" },
                            { icon: "bi-map", title: "200+ Tour", desc: "Hành trình khám phá khắp Việt Nam" },
                            { icon: "bi-cup-hot", title: "300+ Nhà hàng", desc: "Trải nghiệm ẩm thực đặc sắc" },
                        ].map(item => (
                            <div key={item.title} className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                                    <i className={`bi ${item.icon} text-white text-xl`} />
                                </div>
                                <div>
                                    <p className="font-bold text-white">{item.title}</p>
                                    <p className="text-white/60 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right panel - form */}
            <div className="flex-1 flex items-center justify-center px-6 py-12 bg-gray-50">
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
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Chào mừng trở lại</h2>
                            <p className="text-gray-500 mt-1.5">Đăng nhập để tiếp tục khám phá</p>
                        </div>

                        <form onSubmit={onSubmitHandler} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Email</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-envelope text-lg" />
                                    </div>
                                    <input
                                        type="email"
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-sm"
                                        placeholder="name@example.com"
                                        required
                                        onChange={e => setEmail(e.target.value)}
                                        value={email}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-gray-700">Mật khẩu</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-sky-500 transition-colors">
                                        <i className="bi bi-lock text-lg" />
                                    </div>
                                    <input
                                        type={showPw ? "text" : "password"}
                                        className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none text-sm"
                                        placeholder="••••••••"
                                        required
                                        onChange={e => setpassWord(e.target.value)}
                                        value={passWord}
                                    />
                                    <button type="button" onClick={() => setShowPw(p => !p)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-sky-500 transition-colors">
                                        <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"} text-lg`} />
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <Link to="/reset-passWord" className="text-sm font-bold text-sky-500 hover:text-sky-600 transition-colors no-underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-xl shadow-sky-200 transition-all active:scale-95 flex items-center justify-center gap-2 group"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        Đăng nhập
                                        <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-gray-500 text-sm">
                                Chưa có tài khoản?{" "}
                                <Link to="/register" className="text-sky-500 font-black hover:underline no-underline">
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
