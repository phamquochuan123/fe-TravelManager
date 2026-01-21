import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const Login = () => {
    const [isCreateAccount, setIsCreateAccount] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [passWord, setpassWord] = useState("");
    const [loading, setLoading] = useState(false);

    const { backend_Url, setIsLoggedIn, getUserData } = useContext(AppContext);
    const navigate = useNavigate();

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        axios.defaults.withCredentials = true;
        setLoading(true);
        try {
            if (isCreateAccount) {
                const response = await axios.post(`${backend_Url}/register`, { name, email, passWord });
                if (response.status === 201) {
                    navigate("/");
                    toast.success("Account created successfully.");
                }
            } else {
                const response = await axios.post(`${backend_Url}/login`, { email, passWord });
                if (response.status === 200) {
                    setIsLoggedIn(true);
                    getUserData();
                    navigate("/");
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 font-['Outfit'] px-4 py-12">

            {/* Logo ở góc trên - Style đồng nhất */}
            <Link to="/" className="absolute top-8 left-8 flex items-center gap-3 no-underline group">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg">
                    <img src={assets.logo_home} alt="Logo" className="w-8 h-8 invert" />
                </div>
                <span className="text-2xl font-black text-white tracking-tighter hidden md:block">Travel Manager</span>
            </Link>

            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] w-full max-w-md border border-white/20 animate-in fade-in zoom-in duration-500">

                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">
                        {isCreateAccount ? "Join Us!" : "Welcome Back"}
                    </h2>
                    <p className="text-gray-500 font-medium">
                        {isCreateAccount ? "Create an account to start your journey" : "Please enter your details to login"}
                    </p>
                </div>

                <form onSubmit={onSubmitHandler} className="space-y-5">
                    {isCreateAccount && (
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                    <i className="bi bi-person text-lg"></i>
                                </div>
                                <input type="text"
                                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                    placeholder="Enter your name"
                                    required
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <i className="bi bi-envelope text-lg"></i>
                            </div>
                            <input type="email"
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                placeholder="name@example.com"
                                required
                                onChange={(e) => setEmail(e.target.value)}
                                value={email}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-600 transition-colors">
                                <i className="bi bi-lock text-lg"></i>
                            </div>
                            <input type="password"
                                className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                                placeholder="••••••••"
                                required
                                onChange={(e) => setpassWord(e.target.value)}
                                value={passWord}
                            />
                        </div>
                    </div>

                    {!isCreateAccount && (
                        <div className="flex justify-end">
                            <Link to="/reset-passWord"
                                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors no-underline">
                                Forgot Password?
                            </Link>
                        </div>
                    )}

                    <button type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 group">
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                {isCreateAccount ? "Create Account" : "Sign In"}
                                <i className="bi bi-arrow-right group-hover:translate-x-1 transition-transform"></i>
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 font-medium">
                        {isCreateAccount ? "Already have an account?" : "Don't have an account?"}
                        <button
                            onClick={() => setIsCreateAccount(!isCreateAccount)}
                            className="ml-2 text-indigo-600 font-black hover:underline focus:outline-none"
                        >
                            {isCreateAccount ? "Login" : "Sign Up"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;