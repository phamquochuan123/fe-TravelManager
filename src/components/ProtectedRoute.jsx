import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isLoggedIn, userData, isLoading } = useContext(AppContext);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin"></span>
            </div>
        );
    }

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(userData?.roleName)) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
