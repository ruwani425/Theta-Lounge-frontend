import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom"; // REMOVED TO PREVENT CONFLICT WITH MOCK IMPLEMENTATIONS
import ClientPage from "./pages/ClientPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import { AuthProvider } from "./context/AuthContext";
import { Layout } from "./components/layout/NavBar";
import { ProtectedRoute } from "./components/ProtectedRoute";

// =========================================================================
// 1. TYPESCRIPT INTERFACES
// =========================================================================

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

//==============================================================

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* The root path applies the common Layout (NavBar, etc.) */}
          <Route path="/" element={<Layout />}>
            {/* PUBLIC ROUTES: Accessible to everyone */}
            <Route index element={<ClientPage />} />
            <Route path="login" element={<LoginPage />} />

            {/* PROTECTED ADMIN ROUTES: Protected by the <ProtectedRoute /> element */}
            <Route path="admin" element={<ProtectedRoute />}>
              {/* These routes are only accessible if ProtectedRoute allows rendering the Outlet */}
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="products" element={<AdminProductsPage />} />

              {/* Redirect /admin to /admin/dashboard */}
              <Route index element={<Navigate to="dashboard" replace />} />
            </Route>

            {/* 404 Catch-all: For any unmatched path */}
            <Route
              path="*"
              element={
                <div className="text-center text-xl p-10 text-gray-500">
                  404 | Page Not Found
                </div>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
