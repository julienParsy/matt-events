// @feature auth — Contexte d'authentification
import { createContext } from "react";

export const AuthContext = createContext({
    token: null,
    user: null,
    login: () => { },
    logout: () => { },
});
