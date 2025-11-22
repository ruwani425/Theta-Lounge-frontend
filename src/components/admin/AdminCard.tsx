// src/components/admin/AdminCard.tsx

import React, { type FC } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react'; 

interface AdminCardProps {
  title: string;
  path: string;
  description: string;
  Icon: LucideIcon;
  animationDelay?: number; 
}

const CustomCardStyles = `
  /* 💡 THETA LOUNGE BLUE THEME */
  .text-theta-primary { color: #233547; } 
  .bg-theta-light { background-color: #92B8D9; } 
  .text-theta-secondary { color: #475D73; } 

  /* Keyframe animations */
  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .animate-fade-in-scale {
    animation: fadeInScale 0.4s ease-out forwards;
  }
`;

const AdminCard: FC<AdminCardProps> = ({ title, path, description, Icon, animationDelay = 0 }) => {
  return (
    <NavLink
      to={path}
      // 💡 FIX: Added aspect-square class to enforce 1:1 ratio
      className="block p-3 bg-white/80 border border-gray-200 rounded-2xl shadow-xl h-full
                 hover:shadow-2xl hover:bg-theta-light/90 transition-all duration-300 transform 
                 hover:-translate-y-2 group relative overflow-hidden animate-fade-in-scale
                 aspect-square" 
      style={{ animationDelay: `${animationDelay}s` }}
    >
      <style dangerouslySetInnerHTML={{ __html: CustomCardStyles }} />
      
      {/* Subtle inner gradient hover effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center h-full">
        {/* Icon container: Fixed size content */}
        <div className="p-1 mb-1 rounded-full bg-theta-light group-hover:bg-white transition-colors duration-300 shadow-md">
          <Icon className="w-6 h-6 text-theta-primary group-hover:text-gray-800" />
        </div>
        
        {/* Title: Fixed size */}
        <h3 className="text-sm font-bold text-theta-primary group-hover:text-gray-900 transition-colors duration-300 mb-0.5">
          {title}
        </h3>
        {/* Description: Fixed size */}
        <p className="text-xs text-theta-secondary px-1 leading-tight">
          {description}
        </p>
      </div>
    </NavLink>
  );
};

export default AdminCard;