import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

/**
 * The ProtectedRoute component acts as the authorization guard for child routes.
 * It uses the <Outlet /> pattern (simulated here).
 */
export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigation = useNavigate();

  if (isAuthenticated === false) {
    // Redirect if unauthenticated (Simulates <Navigate to="/login" replace />)
    if (typeof window !== "undefined") {
      navigation("/login");
    }
    return (
      <div className="text-center p-8 text-red-500">
        Not Authorized. Redirecting...
      </div>
    );
  }

  if (isAuthenticated === true) {
    // If authenticated, render the nested routes
    return <Outlet />;
  }

  return null;
};
