import { createContext, useEffect, useState } from "react";
import { AppConstants } from "../util/constants";
import { toast } from "react-toastify";
import axios from "axios";

export const AppContext = createContext();
export const AppContextProvider = (props) => {

    axios.defaults.withCredentials = true;

    const backend_Url = AppConstants.BACKEND_URL;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(false);

    const getUserData = async () => {
        try {
            const response = await axios.get(backend_Url + "/profile");
            if (response.status === 200) {
                setUserData(response.data);
            } else {
                toast.error("Unable to retrieve profile");
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    const getAuthState = async () => {
        try {
            const response = await axios.get(backend_Url + "/is-authenticated");
            if (response.status === 200 && response.data === true) {
                setIsLoggedIn(true);
                await getUserData();
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            if (error.response) {
                const msg = error.response.data?.message || "Authentication check failed";
                toast.error(msg);
            } else {
                toast.error(error.message);
            }
            setIsLoggedIn(false);
        }
    }

    useEffect(() => {
        getAuthState();
    }, []);


    const contextValue = {
        backend_Url,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData,
        getUserData
    }
    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    )
}