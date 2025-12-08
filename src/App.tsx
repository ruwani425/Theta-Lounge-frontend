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
import ReservationsPage from "./pages/admin/ReservationPage";
import CalendarManagement from "./pages/admin/CalenderManage";
import SystemSettings from "./pages/admin/SystemSettingPage";
import AppointmentsPage from "./pages/admin/AdminAppointmentViewPage";
import PackageManagementPage from "./pages/admin/PackageManagementView";
import PackageActivationManage from "./pages/admin/PackageActivationManage";
import PricingPage from "./pages/PricingPage";
import PackageAppointmentPage from "./pages/PackageAppointmentPage";
import UserProfilePage from "./pages/UserProfilePage";
import ClientDashboardPage from "./pages/admin/ClientDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<ClientPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="About" element={<AboutPage />} />
            <Route path="contact-us" element={<ContactPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="service" element={<ServicesPage />} />
            <Route path="appointments" element={<ClientAppointmentPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="package-appointments" element={<PackageAppointmentPage />} />
            <Route path="profile" element={<UserProfilePage />} />
            <Route
              path="*"
              element={
                <div className="text-center text-xl p-10 text-gray-500">
                  404 | Page Not Found
                </div>
              }
            />
          </Route>

          <Route path="admin" element={<ProtectedRoute />}>
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tank-management" element={<TankManagementPage />} />
            <Route path="add-tank" element={<AddTankPage />} />
            <Route path="add-tank/edit/:id" element={<AddTankPage />} /> 
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="system-settings" element={<SystemSettings/>}/>
            <Route path="package-management" element={<PackageManagementPage/>}/>
            <Route path="package-activations" element={<PackageActivationManage/>}/>
            <Route
              path="calendar-management"
              element={<CalendarManagement />}
            />
            <Route path="view-appointments" element={<AppointmentsPage/>}/>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="clients/:email" element={<ClientDashboardPage/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
