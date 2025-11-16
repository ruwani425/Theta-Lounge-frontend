// src/pages/admin/AdminUsersPage.tsx

import React from "react";

const AdminUsersPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-indigo-800 mb-4">
      <i className="lucide-users inline-block w-6 h-6 mr-2"></i>
      User Management
    </h1>
    <p className="text-gray-600 mb-6">
      This is a nested protected route: <code>/admin/users</code>
    </p>
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
      <p className="font-semibold">User List Data Mockup:</p>
      <ul className="mt-2 list-disc list-inside space-y-1 text-gray-700">
        <li>Alice Johnson (Admin)</li>
        <li>Bob Smith (Editor)</li>
        <li>Charlie Brown (Guest)</li>
      </ul>
    </div>
  </div>
);

export default AdminUsersPage;
