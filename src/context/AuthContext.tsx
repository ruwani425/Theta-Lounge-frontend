import { createContext, useContext, useEffect, useState } from "react";
import type { AuthContextType, AuthProviderProps } from "../types";
import {
  AUTH_TOKEN_KEY,
  getCookie,
  removeCookie,
  setCookie,
  TOKEN_LIFESPAN_DAYS,
} from "../utils/cookieUtils";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const login = (token?: string): void => {
    setCookie(
      AUTH_TOKEN_KEY,
      token || "simulated_jwt_token_12345",
      TOKEN_LIFESPAN_DAYS
    );
    setIsAuthenticated(true);
  };

  const logout = (): void => {
    removeCookie(AUTH_TOKEN_KEY);
    setIsAuthenticated(false);
  };

  // Check for cookie on initial load
  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_KEY);
    setIsAuthenticated(!!token);
  }, []);

  const value: AuthContextType = { isAuthenticated, login, logout };

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500"></div>
        <p className="ml-4 text-gray-700">Loading authentication status...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
