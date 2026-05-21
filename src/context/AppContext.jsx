import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import api from "../api/axiosInstance";

export const AppContext = createContext();
export const AppContextProvider = (props) => {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUserData = async () => {
        try {
            const response = await api.get("/profile");
            setUserData(response.data);
            return response.data;
        } catch (error) {
            toast.error(error.message);
            return null;
        }
    }

    const getAuthState = async () => {
        try {
            const data = await getUserData();
            setIsLoggedIn(!!data);
        } catch {
            setIsLoggedIn(false);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        getAuthState();
        // Re-fetch khi user quay lại tab — tránh hiển thị dữ liệu cũ
        const handleFocus = () => { if (document.visibilityState === "visible") getAuthState(); };
        document.addEventListener("visibilitychange", handleFocus);
        return () => document.removeEventListener("visibilitychange", handleFocus);
    }, []);


    const contextValue = {
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData,
        isLoading
    }
    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    )
}