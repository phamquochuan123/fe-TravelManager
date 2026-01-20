import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { useContext } from "react";


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
                //register api
                const response = await axios.post(`${backend_Url}/register`, { name, email, passWord });
                if (response.status === 201) {
                    navigate("/");
                    toast.success("Account created successfully.");
                } else {
                    toast.error("Email already exists.");
                }
            } else {
                //login api
                const response = await axios.post(`${backend_Url}/login`, { email, passWord });
                if (response.status === 200) {
                    setIsLoggedIn(true);
                    getUserData();
                    navigate("/");
                } else {
                    toast.error("Email/PassWord is incorrect.");
                }
            }
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="position-relative min-vh-100 d-flex justify-content-center align-items-center"
            style={{ background: "linear-gradient(90deg,#6a5af9,#8268f9)", border: "none" }}>
            <div style={{ position: "absolute", top: "20px", left: "30px", display: "flex", alignItems: "center" }}>
                <Link to="/" style={{
                    display: "flex",
                    gap: 5,
                    alignItems: "center",
                    fontWeight: "bold",
                    fontSize: "24px",
                    textDecoration: "none"
                }}>
                    <img src={assets.logo} alt="Logo" style={{ width: "40px", height: "40px" }} />
                    <span className="fw-bold fs-4 text-light">Travel Manager</span>
                </Link>
            </div>
            <div className="card p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h2 className="text-center mb-4">
                    {isCreateAccount ? "Create Account" : "Login to Your Account"}
                </h2>
                <form onSubmit={onSubmitHandler}>
                    {
                        isCreateAccount && (
                            <div className="mb-3">
                                <label htmlFor="fullName" className="form-label">Full Name</label>
                                <input type="text"
                                    id="fullName"
                                    className="form-control"
                                    placeholder="Enter full name"
                                    required
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                            </div>
                        )
                    }
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email Id</label>
                        <input type="text"
                            id="email"
                            className="form-control"
                            placeholder="Enter email"
                            required
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="passWord" className="form-label">PassWord</label>
                        <input type="passWord"
                            id="passWord"
                            className="form-control"
                            placeholder="Enter PassWord"
                            required
                            onChange={(e) => setpassWord(e.target.value)}
                            value={passWord}
                        />
                    </div>
                    <div className="d-flex justify-content-between mb-3">
                        <Link to="/reset-passWord" className="text-decoration-none">
                            Forgot PassWord?
                        </Link>
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading} >
                        {loading ? "Please wait..." : isCreateAccount ? "Sign up" : "Login"}
                    </button>
                </form>
                <div className="text-center mt-3">
                    <p className="mb-0">
                        {isCreateAccount ?
                            (<>
                                Already have an account?{""}
                                <span
                                    onClick={() => setIsCreateAccount(false)}
                                    className="text-decoration-underline" style={{ cursor: "pointer" }}>
                                    Login
                                </span>
                            </>
                            ) : (<>
                                Don't have an account?{" "}
                                <span
                                    onClick={() => setIsCreateAccount(true)}
                                    className="text-decoration-underline" style={{ cursor: "pointer" }}>
                                    Sign Up
                                </span>
                            </>)
                        }
                    </p>
                </div>
            </div>
        </div>
    )
}
export default Login;