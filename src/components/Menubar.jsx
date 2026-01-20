import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { useContext, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useInsertionEffect } from "react";

const MenuBar = () => {
    const navigate = useNavigate();
    const { userData, backend_Url, setIsLoggedIn, setUserData } = useContext(AppContext);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropDownRef = useRef(null);

    useInsertionEffect(() => {
        const handleClickOutside = (event) => {
            if (dropDownRef.current && !dropDownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);

    }, []);

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
            toast.error(error.response.data.message);
        }
    }

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
            toast.error(error.response.data.message);
        }
    }

    return (
        <nav className="navbar bg-white px-5 py-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
                <img src={assets.logo_home} alt="logo" width={45} height={45} />
                <span className="fw-bold fs-4 text-dark">Travel Manager</span>
            </div>
            {userData ? (
                <div className="position-relative" ref={dropDownRef}>
                    <div className="bg-dark text-white rounded-circle d-flex justify-content-center align-items-center"
                        style={{
                            width: 40,
                            height: 40,
                            cursor: "pointer",
                            userSelect: "none",
                            fontWeight: 600,
                            fontSize: "18px",
                            lineHeight: 1
                        }}
                        onClick={() => setDropdownOpen((prev) => !prev)}
                    >
                        {userData?.name?.charAt(0).toUpperCase()}
                    </div>
                    {dropdownOpen && (
                        <div className="position-absolute shadow bg-white rounded p-2"
                            style={{
                                top: "50px",
                                right: 0,
                                width: "150px",
                                zIndex: 100,
                            }}
                        >
                            {!userData.isAccountVerified && (
                                <div className="dropdown-item py-1 px-2"
                                    style={{
                                        cursor: "pointer"
                                    }}
                                    onClick={sendVerificationOTP}
                                >
                                    Verify email
                                </div>
                            )}
                            <div className="dropdown-item py-1 px-2 text-danger"
                                style={{
                                    cursor: "pointer"
                                }}
                                onClick={handleLogout}
                            >
                                Logout
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="btn btn-outline-dark rounded-pill px-3"
                    onClick={() => navigate("/login")}>
                    Login<i className="bi bi-arrow-right ms-2"></i>
                </div >
            )}
        </nav >
    )
}
export default MenuBar;