// src/pages/admin/AdminProductsPage.tsx

import React from "react";

const AdminProductsPage: React.FC = () => (
  <div className="p-8">
    <h1 className="text-3xl font-bold text-indigo-800 mb-4">
      <i className="lucide-package-open inline-block w-6 h-6 mr-2"></i>
      Product Catalog
    </h1>
    <p className="text-gray-600 mb-6">
      This is a nested protected route: <code>/admin/products</code>
    </p>
    <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-indigo-500">
      <p className="font-semibold">Product Inventory Mockup:</p>
      <p className="mt-2 text-gray-700">
        14 items in stock. Last updated 5 minutes ago.
      </p>
    </div>
  </div>
);

export default AdminProductsPage;
