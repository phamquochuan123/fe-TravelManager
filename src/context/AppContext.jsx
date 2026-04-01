import { createContext, useEffect, useState } from "react";
import { AppConstants } from "../util/constants";
import { toast } from "react-toastify";
import axios from "axios";

axios.defaults.withCredentials = true;

export const AppContext = createContext();
export const AppContextProvider = (props) => {

    const backend_Url = AppConstants.BACKEND_URL;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const getUserData = async () => {
        try {
            const response = await axios.get(backend_Url + "/profile");
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
    }, []);


    const contextValue = {
        backend_Url,
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