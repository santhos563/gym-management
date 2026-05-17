// import { createContext, useContext, useState, useEffect, useCallback } from "react";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//     const [user, setUser] = useState(null);
//     const [token, setToken] = useState(null);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);
//     const [loading, setLoading] = useState(true);

//     // Check for existing session on mount
//     useEffect(() => {
//         const storedToken = localStorage.getItem("authToken");
//         const storedUser = localStorage.getItem("user");

//         console.log("AuthProvider - Checking stored session:", { storedToken: !!storedToken, storedUser: !!storedUser });

//         if (storedToken && storedUser) {
//             setToken(storedToken);
//             setUser(JSON.parse(storedUser));
//             setIsAuthenticated(true);
//         }
//         setLoading(false);
//     }, []);

//     const login = useCallback(async (username, password) => {
//         try {
//             const response = await fetch("http://192.168.1.11:8000/api/login/", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({ username, password }),
//             });

//             const data = await response.json();
//             console.log("Login response:", data);

//             if (response.ok) {
//                 // FIX: Backend returns 'access' field, not 'token'
//                 if (data.access) {  // Changed from data.token
//                     localStorage.setItem("authToken", data.access);
//                     setToken(data.access);
//                 }
//                 if (data.refresh) {
//                     localStorage.setItem("refreshToken", data.refresh);
//                 }
//                 if (data.user) {
//                     localStorage.setItem("user", JSON.stringify(data.user));
//                     setUser(data.user);
//                 }
//                 setIsAuthenticated(true);
//                 return { success: true };
//             } else {
//                 let errorMessage = "Login failed";
//                 // Handle error messages from your backend structure
//                 if (data.message) errorMessage = data.message;
//                 else if (data.errors) {
//                     // Your backend returns errors in 'errors' object
//                     const errorValues = Object.values(data.errors);
//                     if (errorValues.length > 0) errorMessage = errorValues[0][0];
//                 }
//                 else if (data.non_field_errors) errorMessage = data.non_field_errors[0];
//                 else if (data.detail) errorMessage = data.detail;

//                 return { success: false, error: errorMessage };
//             }
//         } catch (error) {
//             console.error("Login error:", error);
//             return { success: false, error: "Network error. Please check your connection." };
//         }
//     }, []);

//     const logout = useCallback(() => {
//         localStorage.removeItem("authToken");
//         localStorage.removeItem("refreshToken");
//         localStorage.removeItem("user");
//         localStorage.removeItem("username");
//         setToken(null);
//         setUser(null);
//         setIsAuthenticated(false);
//     }, []);

//     return (
//         <AuthContext.Provider
//             value={{
//                 user,
//                 token,
//                 isAuthenticated,
//                 loading,
//                 login,
//                 logout,
//             }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export const useAuth = () => {
//     const ctx = useContext(AuthContext);
//     if (!ctx) throw new Error("useAuth must be used within AuthProvider");
//     return ctx;
// };


import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedToken = localStorage.getItem("authToken");
        const storedUser = localStorage.getItem("user");

        console.log("AuthProvider - Initial check:", {
            hasToken: !!storedToken,
            hasUser: !!storedUser,
            tokenValue: storedToken?.substring(0, 20) + "..."
        });

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setToken(storedToken);
                setUser(parsedUser);
                setIsAuthenticated(true);
                console.log("AuthProvider - User restored:", parsedUser);
            } catch (error) {
                console.error("Error parsing user:", error);
                localStorage.removeItem("user");
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (username, password) => {
        try {
            const response = await fetch("http://192.168.1.11:8000/api/login/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            console.log("Login response:", data);

            if (response.ok) {
                let authToken = null;

                if (data.access) {
                    authToken = data.access;
                    localStorage.setItem("authToken", data.access);
                } else if (data.token) {
                    authToken = data.token;
                    localStorage.setItem("authToken", data.token);
                }

                if (authToken) {
                    setToken(authToken);
                }

                if (data.refresh) {
                    localStorage.setItem("refreshToken", data.refresh);
                }

                let userData = null;
                if (data.user) {
                    userData = data.user;
                    localStorage.setItem("user", JSON.stringify(data.user));
                } else if (data.username) {
                    userData = { username: data.username };
                    localStorage.setItem("user", JSON.stringify(userData));
                } else {
                    userData = { username: username };
                    localStorage.setItem("user", JSON.stringify(userData));
                }

                setUser(userData);
                setIsAuthenticated(true);

                console.log("Auth state updated:", { isAuthenticated: true, user: userData });
                return { success: true };
            } else {
                let errorMessage = "Login failed";
                if (data.message) errorMessage = data.message;
                else if (data.errors) {
                    const errorValues = Object.values(data.errors);
                    if (errorValues.length > 0) errorMessage = errorValues[0][0];
                }
                else if (data.non_field_errors) errorMessage = data.non_field_errors[0];
                else if (data.detail) errorMessage = data.detail;

                return { success: false, error: errorMessage };
            }
        } catch (error) {
            console.error("Login error:", error);
            return { success: false, error: "Network error. Please check your connection." };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        localStorage.removeItem("username");
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};