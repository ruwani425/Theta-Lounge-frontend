import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ClientPage from "./pages/ClientPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import SignupPage from "./pages/SignUpPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import BlogPage from "./pages/BlogPage";
import ServicesPage from "./pages/ServicesPage";
import { Layout } from "./components/layout/Layout";
import ClientAppointmentPage from "./pages/ClientAppointmentPage";
import { AuthProvider } from "./components/AuthProvider";
import TankManagementPage from "./pages/admin/TankManagementPage";
import AddTankPage from "./pages/admin/AddTankPage";

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
            <Route path="signup" element={<SignupPage />} />
            <Route path="About" element={<AboutPage />} />
            <Route path="contact-us" element={<ContactPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="service" element={<ServicesPage />} />
            <Route path="appointments" element={<ClientAppointmentPage />} />
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

          {/* PROTECTED ADMIN ROUTES: Protected by the <ProtectedRoute /> element */}
          <Route path="admin" element={<ProtectedRoute />}>
            {/* These routes are only accessible if ProtectedRoute allows rendering the Outlet */}
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="tank-management" element={<TankManagementPage />} /> 
            <Route path="add-tank" element={<AddTankPage />} />
            {/* Redirect /admin to /admin/dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
