import { createContext, useState } from "react";
import { AppConstants } from "../util/constants";

export const AppContext = createContext();
export const AppContextProvider = (props) => {

    const backend_Url = AppConstants.BACKEND_URL;
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(false);


    const contextValue = {
        backend_Url,
        isLoggedIn,
        setIsLoggedIn,
        userData,
        setUserData
    }
    return (
        <AppContext.Provider value={contextValue}>
            {props.children}
        </AppContext.Provider>
    )
}