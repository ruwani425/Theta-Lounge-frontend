// src/components/layout/NavBar.tsx

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet } from "react-router-dom";
import type { AdminCardProps } from "../../types";

const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  // Use an empty string for SSR/mock environment
  const currentPath =
    typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";

  const isActive = (path: string): string =>
    currentPath.startsWith(path)
      ? "text-white bg-indigo-700"
      : "text-indigo-200 hover:bg-indigo-600";

  return (
    <nav className="bg-indigo-800 p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <a href="/" className="text-2xl font-bold text-white tracking-wider">
          SecureApp
        </a>
        <div className="flex space-x-4">
          <a
            href="/"
            className={`px-3 py-2 rounded-lg font-medium transition duration-150 ${
              // Check for exact root path to prevent admin sub-routes from also highlighting the client link
              currentPath === "/"
                ? "text-white bg-indigo-700"
                : "text-indigo-200 hover:bg-indigo-600"
            }`}
          >
            Client Web
          </a>
          <a
            href="/admin/dashboard"
            className={`px-3 py-2 rounded-lg font-medium transition duration-150 ${isActive(
              "/admin"
            )}`}
          >
            Admin Panel
          </a>

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition duration-150"
            >
              Logout
            </button>
          ) : (
            <a
              href="/login"
              className={`px-3 py-2 rounded-lg font-medium transition duration-150 ${isActive(
                "/login"
              )}`}
            >
              Login
            </a>
          )}
        </div>
      </div>
    </nav>
  );
};

export const Layout: React.FC = () => (
  <div className="min-h-screen bg-gray-50 font-inter">
    <NavBar />
    <main className="max-w-7xl mx-auto py-6">
      <Outlet />
    </main>
  </div>
);

export default NavBar;
