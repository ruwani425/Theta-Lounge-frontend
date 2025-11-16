import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { ReactNode } from "react";

/**
 * The ProtectedRoute component acts as the authorization guard for child routes.
 * It uses the <Outlet /> pattern (simulated here).
 */ export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated === false) {
    // Redirect if unauthenticated (Using hash redirect)
    if (typeof window !== "undefined") {
      window.location.hash = "#login";
    }
    return (
      <div className="text-center p-8 text-red-500">
        Not Authorized. Redirecting to Login...
      </div>
    );
  }

  if (isAuthenticated === true) {
    // If authenticated, render the children (the protected content)
    return <>{children}</>;
  }

  return null;
};
