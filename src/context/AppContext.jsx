import { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import { useAuthStore } from "../stores/authStore";
import { AppContext } from "./appContextObject";

export const AppContextProvider = (props) => {

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUserData = async () => {
        try {
            const response = await api.get("/profile", { skipAuthRedirect: true });
            setUserData(response.data);
            useAuthStore.getState().login(response.data);
            return response.data;
        } catch {
            return null;
        }
    }

    const getAuthState = async () => {
        const { logout: storeLogout } = useAuthStore.getState();
        try {
            const data = await getUserData();
            setIsLoggedIn(!!data);
            if (!data) storeLogout();
        } catch {
            setIsLoggedIn(false);
            storeLogout();
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let inFlight = false;
        const safeGetAuthState = () => {
            if (inFlight) return;
            inFlight = true;
            getAuthState().finally(() => { inFlight = false; });
        };
        safeGetAuthState();
        const handleFocus = () => { if (document.visibilityState === "visible") safeGetAuthState(); };
        document.addEventListener("visibilitychange", handleFocus);
        return () => document.removeEventListener("visibilitychange", handleFocus);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- cố ý chỉ chạy 1 lần lúc mount, getAuthState không cần trong deps
    }, []);


    const setUserDataSynced = (data) => {
        setUserData(data);
        const { login, logout: storeLogout } = useAuthStore.getState();
        if (data) login(data); else storeLogout();
    };

    // Nguồn logout duy nhất — luôn clear đồng thời AppContext lẫn Zustand authStore,
    // tránh trường hợp 2 nơi lưu state lệch nhau sau khi đăng xuất.
    const logout = () => {
        setIsLoggedIn(false);
        setUserDataSynced(null);
    };

    const contextValue = {
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData: setUserDataSynced,
        getUserData,
        logout,
        isLoading
    }
    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    )
}