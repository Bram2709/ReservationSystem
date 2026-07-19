import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authStyle from "../../styles/authForm.module.css";
import { authService } from "../../services/authService";
import { apiErrorMessage } from "../../utils/apiError";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Both arrive via the emailed link: /reset-password?email=…&token=…
    const email = searchParams.get("email") ?? "";
    const token = searchParams.get("token") ?? "";

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const linkBroken = !email || !token;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            await authService.resetPassword(email, token, password);
            navigate("/login");
        } catch (err) {
            setError(apiErrorMessage(err, "This reset link is invalid or has expired."));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={authStyle.wrapper}>
            <h2>Choose a new password</h2>
            {linkBroken ? (
                <>
                    <p>This reset link is incomplete. Please use the link from your email.</p>
                    <Link className={authStyle.link} to="/forgot-password">Request a new link</Link>
                </>
            ) : (
                <form onSubmit={handleSubmit} className={authStyle.formWrapper}>
                    <input
                        className={authStyle.input}
                        type="password"
                        placeholder="New password (min 8 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={8}
                        required
                    />
                    <input
                        className={authStyle.input}
                        type="password"
                        placeholder="Repeat new password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        minLength={8}
                        required
                    />
                    {error && <p className={authStyle.error}>{error}</p>}
                    <button className={authStyle.button} type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Set new password"}
                    </button>
                    <Link className={authStyle.link} to="/login">Back to login</Link>
                </form>
            )}
        </div>
    );
}
