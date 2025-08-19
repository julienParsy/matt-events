// frontend/src/contexts/AuthProvider.jsx
import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../services/axiosInstance";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "./AuthContext";

function decodeJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    if (!token) return true;
    try {
        const decoded = decodeJwt(token);
        if (!decoded) throw new Error("Impossible de décoder le token");
        return decoded.exp * 1000 < Date.now();
    } catch (e) {
        console.warn("⚠️ Erreur décodage JWT", e);
        return true;
    }
}



function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const t = localStorage.getItem("token");
        return t;
    });
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });
    const navigate = useNavigate();

    // Déconnexion auto si le token expire
    useEffect(() => {
        if (!token) return;
        const interval = setInterval(() => {
            const expired = isTokenExpired(token);
            if (expired) {
                console.warn("🚨 Déconnexion par EXPIRATION TOKEN à", new Date());
                setToken(null);
                setUser(null);
                navigate("/login");
                toast.info("Votre session a expiré, veuillez vous reconnecter.", {
                    autoClose: 4000,
                    pauseOnHover: true,
                    theme: "colored",
                });
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [token, navigate]);

    useEffect(() => {
        if (token) {
            axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
            localStorage.setItem("token", token);
            if (user) {
                localStorage.setItem("user", JSON.stringify(user));
            }
        } else {
            delete axiosInstance.defaults.headers.common["Authorization"];
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setUser(null);
        }
    }, [token, user]);

    // login prend le token ET le profil
    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
    };

    const logout = useCallback(
        (fromInterceptor = false) => {
            console.warn("🚪 Logout appelé (fromInterceptor:", fromInterceptor, ")");
            setToken(null);
            setUser(null);
            navigate("/login");
            if (fromInterceptor) {
                toast.info("Votre session a expiré, veuillez vous reconnecter.", {
                    autoClose: 4000,
                    pauseOnHover: true,
                    theme: "colored",
                });
            }
        },
        [navigate]
    );

    // Intercepteur axios pour déconnexion sur 401
    useEffect(() => {
        const responseInterceptor = axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.warn("🚨 Déconnexion par INTERCEPTOR AXIOS à", new Date(), error.config?.url);
                    logout(true);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axiosInstance.interceptors.response.eject(responseInterceptor);
        };
    }, [logout]);

    return (
        <AuthContext.Provider value={{ token, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthProvider;
