import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export function ProtectedRoute() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading)  // Wait for session restore before deciding
    {
        return null;
    }

    // Also check the service directly to handle the brief React state timing gap after login
    return (isAuthenticated || authService.isAuthenticated()) ? <Outlet /> : <Navigate to="/login" replace />;
}
