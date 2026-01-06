// src/components/layout/NavBar.tsx

import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Flower,
  CalendarCheck,
  Phone,
  Menu,
  X,
  LogOut,
  User,
} from "lucide-react";
import { useAuth } from "../AuthProvider";

// Define path constants
const APPOINTMENT_PATH = "/appointments";
const PRICING_PATH = "/pricing";

// --- Client Navigation Component ---
const ClientNavigation: React.FC<{
  location: ReturnType<typeof useLocation>;
}> = ({ location }) => {
  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `relative px-3 py-1 text-sm text-gray-600 hover:text-theta-blue transition-all duration-300 ${
      isActive ? "text-theta-blue font-semibold" : "font-medium"
    } ${
      isActive
        ? "after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-theta-blue after:rounded-full"
        : ""
    }`;
  };

  return (
    <nav className="hidden lg:flex items-center space-x-6">
      <Link to="/" className={getLinkClassName("/")}>
        Home
      </Link>
      <Link to="/about" className={getLinkClassName("/about")}>
        About
      </Link>
      <Link to="/service" className={getLinkClassName("/service")}>
        Services
      </Link>
      <Link to={PRICING_PATH} className={getLinkClassName(PRICING_PATH)}>
        Pricing
      </Link>
      <Link to="/blog" className={getLinkClassName("/blog")}>
        Blog
      </Link>
      <Link to="/contact-us" className={getLinkClassName("/contact-us")}>
        Contact
      </Link>
    </nav>
  );
};

// --- Main NavBar Component ---
const NavBar: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section - Smaller and more compact */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="p-1.5 bg-gradient-to-br from-theta-blue to-theta-blue-dark rounded-lg shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-105">
              <Flower className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg font-bold text-gray-800 group-hover:text-theta-blue transition-colors duration-300 leading-none">
                Floating Theraphy
              </span>
              <span className="text-[10px] font-medium text-gray-500 tracking-wide hidden sm:block leading-none mt-0.5">
                Physical Therapy
              </span>
            </div>
          </Link>

          {/* Main Navigation - Desktop */}
          <ClientNavigation location={location} />

          {/* Action Buttons - Desktop */}
          <div className="hidden lg:flex items-center gap-2.5">
            {/* Phone Number */}
            <a
              href="tel:4228208200"
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-theta-blue transition-colors duration-300 rounded-lg hover:bg-blue-50"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">(422) 820 820</span>
            </a>

            {/* Appointment Button */}
            <Link
              to={APPOINTMENT_PATH}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-theta-blue to-theta-blue-dark text-white text-sm font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Appointment</span>
            </Link>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {/* Profile Button */}
                <Link
                  to="/profile"
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-theta-blue text-theta-blue text-sm font-semibold rounded-full hover:bg-theta-blue hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden xl:inline">Profile</span>
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-200 transition-all duration-300"
                  aria-label="Logout"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-theta-blue-light text-theta-blue text-sm font-semibold rounded-full hover:bg-theta-blue hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
              >
                Log In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-theta-blue hover:bg-blue-50 transition-all duration-300"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`lg:hidden fixed top-16 left-0 right-0 bg-white border-t border-gray-100 shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
          {/* Mobile Navigation Links */}
          <Link
            to="/"
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === "/"
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            Home
          </Link>
          <Link
            to="/about"
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === "/about"
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            About
          </Link>
          <Link
            to="/service"
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === "/service"
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            Services
          </Link>
          <Link
            to={PRICING_PATH}
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === PRICING_PATH
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            Pricing
          </Link>
          <Link
            to="/blog"
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === "/blog"
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            Blog
          </Link>
          <Link
            to="/contact-us"
            onClick={closeMobileMenu}
            className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-300 ${
              location.pathname === "/contact-us"
                ? "bg-theta-blue text-white shadow-md"
                : "text-gray-700 hover:bg-blue-50 hover:text-theta-blue"
            }`}
          >
            Contact
          </Link>

          {/* Divider */}
          <div className="pt-3 pb-2 border-t border-gray-200 my-3"></div>

          {/* Mobile Phone Number */}
          <a
            href="tel:4228208200"
            className="flex items-center gap-2.5 py-2.5 px-3 text-gray-600 hover:text-theta-blue hover:bg-blue-50 transition-all duration-300 rounded-lg"
          >
            <Phone className="w-4 h-4 text-theta-blue" />
            <div>
              <p className="text-[10px] text-gray-500 font-medium">Call Us</p>
              <p className="text-sm font-semibold">(422) 820 820</p>
            </div>
          </a>

          {/* Mobile Action Buttons */}
          <div className="space-y-2 pt-3">
            {isAuthenticated ? (
              <>
                {/* Mobile Profile Button */}
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-theta-blue bg-white border border-theta-blue text-sm font-semibold rounded-lg hover:bg-theta-blue hover:text-white transition-all duration-300 shadow-sm"
                >
                  <User className="w-4 h-4" />
                  <span>My Profile</span>
                </Link>

                {/* Mobile Appointment Button */}
                <Link
                  to={APPOINTMENT_PATH}
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-theta-blue to-theta-blue-dark text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Appointment</span>
                </Link>

                {/* Mobile Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-200 transition-all duration-300"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                {/* Mobile Appointment Button */}
                <Link
                  to={APPOINTMENT_PATH}
                  onClick={closeMobileMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-theta-blue to-theta-blue-dark text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Book Appointment</span>
                </Link>

                {/* Mobile Login Button */}
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="w-full block text-center px-4 py-2.5 bg-theta-blue-light text-theta-blue text-sm font-semibold rounded-lg hover:bg-theta-blue hover:text-white transition-all duration-300 shadow-sm"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default NavBar;
