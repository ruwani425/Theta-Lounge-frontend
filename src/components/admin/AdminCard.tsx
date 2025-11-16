// src/components/admin/AdminCard.tsx

import React from 'react';

interface AdminCardProps {
    title: string;
    description: string;
    path: string;
}

// const AdminCard: React.FC<AdminCardProps> = ({ title, description, hash }) => (
//     <a href={`#${hash}`} className="block bg-white p-6 rounded-xl shadow-xl hover:shadow-indigo-300/50 hover:scale-[1.03] transition duration-300 border-t-4 border-indigo-500">
//         <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
//         <p className="text-gray-500 text-sm">{description}</p>
//     </a>
// );


const AdminCard: React.FC<AdminCardProps> = ({ title, description, path }) => (
  <a
    href={path}
    className="block bg-white p-6 rounded-xl shadow-xl hover:shadow-indigo-300/50 hover:scale-[1.03] transition duration-300 border-t-4 border-indigo-500"
  >
    <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{description}</p>
  </a>
);

export default AdminCard;