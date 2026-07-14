import axios from "axios";
import { jwtDecode } from "jwt-decode";

const API_URL = import.meta.env.VITE_API_URL || "/api";

interface JwtPayload {
    sub: string;
    exp: number;
    [key: string]: unknown;
}

type FailedRequest = {
    resolve: (token: string) => void;
    reject: (error: unknown) => void;
};

class AuthService {
    private accessToken: string | null = null;
    private isRefreshing = false;
    private failedQueue: FailedRequest[] = [];

    constructor() {
        // Restore token from sessionStorage on page load
        this.accessToken = sessionStorage.getItem('accessToken');
        // Send cookies (refresh token) with every request
        axios.defaults.baseURL = API_URL;
        axios.defaults.withCredentials = true;
        this.setupInterceptors();
    }

    // --- Token helpers ---

    setAccessToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            sessionStorage.setItem('accessToken', token);
        } else {
            sessionStorage.removeItem('accessToken');
        }
    }

    getAccessToken(): string | null {
        return this.accessToken;
    }

    isAuthenticated(): boolean {
        if (!this.accessToken) return false;
        try {
            const { exp } = jwtDecode<JwtPayload>(this.accessToken);
            return Date.now() < exp * 1000;
        } catch {
            return false;
        }
    }

    getUser(): JwtPayload | null {
        if (!this.accessToken) return null;
        try {
            return jwtDecode<JwtPayload>(this.accessToken);
        } catch {
            return null;
        }
    }

    // --- API calls ---

    async login(email: string, password: string): Promise<void> {
        const body = new URLSearchParams({ Email: email, Password: password });
        const { data } = await axios.post("/auth/login", body);
        this.setAccessToken(data.jwtToken);
    }

    async register(organizationName: string, email: string, password: string): Promise<void> {
        const body = new URLSearchParams({ OrganizationName: organizationName, OwnerEmail: email, Password: password });
        await axios.post("/auth/register", body);
    }

    async logout(): Promise<void> {
        try {
            await axios.post("/auth/logout");
        } finally {
            this.setAccessToken(null);
        }
    }

    async refreshToken(): Promise<string> {
        const { data } = await axios.post("/auth/refresh");
        const token = data.jwtToken ?? data.accessToken;
        this.setAccessToken(token);
        return token;
    }

    // --- Axios interceptors ---

    private processQueue(error: unknown, token: string | null) {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) reject(error);
            else resolve(token!);
        });
        this.failedQueue = [];
    }

    private setupInterceptors() {
        // Attach access token to every request
        axios.interceptors.request.use((config) => {
            if (this.accessToken) {
                config.headers.Authorization = `Bearer ${this.accessToken}`;
            }
            return config;
        });

        // On 401, try to refresh once then retry the original request
        axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const original = error.config;
                if (error.response?.status !== 401 || original._retry) {
                    return Promise.reject(error);
                }

                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    }).then((token) => {
                        original.headers.Authorization = `Bearer ${token}`;
                        return axios(original);
                    });
                }

                original._retry = true;
                this.isRefreshing = true;

                try {
                    const token = await this.refreshToken();
                    this.processQueue(null, token);
                    original.headers.Authorization = `Bearer ${token}`;
                    return axios(original);
                } catch (refreshError) {
                    this.processQueue(refreshError, null);
                    this.setAccessToken(null);
                    return Promise.reject(refreshError);
                } finally {
                    this.isRefreshing = false;
                }
            }
        );
    }
}

export const authService = new AuthService();
