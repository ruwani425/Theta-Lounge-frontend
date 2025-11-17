// src/pages/admin/AdminDashboard.tsx

import React from "react";
import AdminCard from "../../components/admin/AdminCard";
import { useAuth } from "../../context/AuthContext";

const AdminDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-indigo-800 mb-6">
        <i className="lucide-lock inline-block w-8 h-8 mr-3"></i>
        Admin Dashboard {isAuthenticated ? "This is admin" : "This isn't admin"}
      </h1>
      <p className="text-lg text-gray-700 mb-8">
        This is a **secure, protected** route: <code>/admin/dashboard</code>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <AdminCard
          title="Users"
          path="/admin/users"
          description="Manage all system users."
        />
        <AdminCard
          title="Products"
          path="/admin/products"
          description="View and modify product catalog."
        />
        <AdminCard
          title="Settings"
          path="/admin/settings"
          description="Configure global application settings."
        />
      </div>
    </div>
  );
};
export default AdminDashboard;
