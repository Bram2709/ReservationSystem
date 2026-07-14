import authStyle from '../../styles/authForm.module.css';
import { authService } from '../../services/authService';
import { useState } from 'react';

export function RegisterPage() {
    const [organizationName , setOrganizationName] = useState("");
    const [email , setEmail] = useState("");
    const [password , setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setIsLoading(true);
        try {
            await authService.register(organizationName, email, password);
        } catch (error) {
            setError("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={authStyle.wrapper}>
            <h2>Register</h2>
            <form onSubmit={handleRegister} className={authStyle.formWrapper}>
                <input className={authStyle.input} type="text" placeholder="Organization Name" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
                <input className={authStyle.input} type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={authStyle.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                {error && <p className={authStyle.error}>{error}</p>}
                <button className={authStyle.button} type="submit" disabled={isLoading}>
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>
        </div>
    );
}