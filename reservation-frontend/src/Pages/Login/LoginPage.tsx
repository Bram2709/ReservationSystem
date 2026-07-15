import { useState } from "react";
import { useNavigate } from "react-router-dom";
import style from "./LoginPage.module.css";
import authStyle from "../../styles/authForm.module.css";
import { useAuth } from "../../context/AuthContext";

export function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await login(email, password);
            navigate("/dashboard");
        } catch {
            setError("Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={authStyle.wrapper}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className={authStyle.formWrapper}>
                <input
                    className={authStyle.input}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className={authStyle.input}
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && <p className={authStyle.error}>{error}</p>}
                <button className={authStyle.button} type="submit" disabled={isLoading}>
                    {isLoading ? "Logging in..." : "Login"}
                </button>
                <a className={`${authStyle.link} ${style.forgotPassword}`} href="/forgot-password">Forgot your password?</a>
            </form>
            <a className={`${authStyle.link} ${style.register}`} href="/register">Don't have an account? <u>Register here</u></a>
        </div>
    );
}