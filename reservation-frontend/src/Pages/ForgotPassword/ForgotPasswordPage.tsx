import { useState } from "react";
import { Link } from "react-router-dom";
import authStyle from "../../styles/authForm.module.css";
import { authService } from "../../services/authService";

export function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            await authService.forgotPassword(email);
            setSent(true);
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className={authStyle.wrapper}>
            <h2>Reset password</h2>
            {sent ? (
                <>
                    <p>
                        If an account exists for <strong>{email}</strong>, a reset link is on its way.
                        The link is valid for one hour.
                    </p>
                    <Link className={authStyle.link} to="/login">Back to login</Link>
                </>
            ) : (
                <form onSubmit={handleSubmit} className={authStyle.formWrapper}>
                    <input
                        className={authStyle.input}
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {error && <p className={authStyle.error}>{error}</p>}
                    <button className={authStyle.button} type="submit" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send reset link"}
                    </button>
                    <Link className={authStyle.link} to="/login">Back to login</Link>
                </form>
            )}
        </div>
    );
}
