import type { ReactNode } from "react";

interface AuthContextType {
  isAuthenticated: boolean | null;
  login: (token?: string) => void;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

interface AdminCardProps {
  title: string;
  description: string;
  path: string;
}

export type { AuthContextType, AuthProviderProps, AdminCardProps };
