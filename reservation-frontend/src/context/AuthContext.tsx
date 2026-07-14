import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authService } from "../services/authService";

interface AuthUser {
    sub: string;
    [key: string]: unknown;
}

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(() => authService.getUser());
    const [isLoading, setIsLoading] = useState(!authService.isAuthenticated());
    const hasRefreshed = useRef(false);

    // On mount, try to refresh in background to get a fresh token
    useEffect(() => {
        if (hasRefreshed.current) return;
        hasRefreshed.current = true;

        // If already authenticated via sessionStorage, refresh silently in background
        authService.refreshToken()
            .then(() => setUser(authService.getUser()))
            .catch(() => {
                // Only log out if there's no valid token already
                if (!authService.isAuthenticated()) setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        await authService.login(email, password);
        const loggedInUser = authService.getUser();
        setUser(loggedInUser);
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}
