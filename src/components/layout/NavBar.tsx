// src/components/layout/NavBar.tsx

import React from "react";
import { useAuth } from "../../context/AuthContext";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import type { AdminCardProps } from "../../types";

const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper function to determine the NavLink active class
  const getNavLinkClass = ({ isActive, isPending }: { isActive: boolean, isPending: boolean }, checkPrefix: string = ""): string => {
    // If checkPrefix is provided, use path prefix check instead of NavLink's exact isActive
    const pathPrefixMatch = checkPrefix && location.pathname.toLowerCase().startsWith(checkPrefix.toLowerCase());

    const activeClassName = "text-white bg-indigo-700";
    const baseClassName = "text-indigo-200 hover:bg-indigo-600";
    const pendingClassName = "opacity-75"; // Optional class for pending state

    // Logic: check for path prefix match (for Admin Panel) OR standard isActive (for others)
    const isLinkActive = checkPrefix ? pathPrefixMatch : isActive;

    return `px-3 py-2 rounded-lg font-medium transition duration-150 ${
      isPending ? pendingClassName : ""
    } ${
      isLinkActive
        ? activeClassName
        : baseClassName
    }`;
  };

  const handleLogout = () => {
    logout();
    navigate("/"); // Navigate to the home page or login page after logout
  };

  return (
    <nav className="bg-indigo-800 p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <NavLink to="/" className="text-2xl font-bold text-white tracking-wider">
          SecureApp
        </NavLink>
        <div className="flex space-x-4">
          <NavLink
            to="/"
            className={({ isActive, isPending }) => {
                // Special check for exact root path to prevent sub-routes from highlighting the client link
                const isExactRoot = location.pathname.toLowerCase() === "/";
                const activeClassName = "text-white bg-indigo-700";
                const baseClassName = "text-indigo-200 hover:bg-indigo-600";
                const pendingClassName = "opacity-75";

                return `px-3 py-2 rounded-lg font-medium transition duration-150 ${
                  isPending ? pendingClassName : ""
                } ${
                  isExactRoot
                    ? activeClassName
                    : baseClassName
                }`;
            }}
          >
            Client Web
          </NavLink>
          <NavLink
            to="/admin/dashboard"
            // Use an anonymous function in className prop to pass the location context for prefix checking
            className={(state) => getNavLinkClass(state, "/admin")}
          >
            Admin Panel
          </NavLink>

          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition duration-150"
            >
              Logout
            </button>
          ) : (
            <NavLink
              to="/login"
              className={getNavLinkClass}
            >
              Login
            </NavLink>
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