// src/pages/LoginPage.tsx

import React, { useEffect, useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Mail, Lock } from "lucide-react";
// 💡 IMPORT THE REDUX-INTEGRATED HOOK
import { useAuth } from '../components/AuthProvider'; 

// --- MOCK AUTHENTICATION LOGIC (Moved to Redux Slice, but kept here for type reference) ---

interface MockUser {
    email: string;
    password: string;
    role: 'admin' | 'client';
}

// 1. Define Mock Users and Roles (Kept locally for login validation logic)
const MOCK_USERS: MockUser[] = [
    // Use these credentials to test:
    { email: "admin@theta.com", password: "password123", role: 'admin' },
    { email: "client@theta.com", password: "userpass", role: 'client' },
];

// --- CUSTOM STYLES (ORIGINAL UI STYLES PRESERVED) ---
// src/pages/LoginPage.tsx

const CustomStyle = `
  .text-dark-blue-600 { color: #035C84; }
  .bg-dark-blue-600 { background-color: #035C84; }
  .hover\\:bg-dark-blue-700:hover { background-color: #0873A1; }
  .text-dark-blue-800 { color: #003F5C; }
  .bg-light-blue-50 { background-color: #F0F8FF; } 
  .bg-light-blue-200 { background-color: #94CCE7; }
  .text-light-blue-400 { color: #2DA0CC; } 
  .focus\\:ring-dark-blue-600:focus { --tw-ring-color: #035C84; }
  .focus\\:border-dark-blue-600:focus { border-color: #035C84; }

  /* 💡 ADD THE GRADIENT COLOR STOPS HERE */
  .from-dark-blue-600 { 
    --tw-gradient-from: #035C84; 
    --tw-gradient-to: rgba(3, 92, 132, 0); /* Tailwind default behavior */
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
  }

  .to-dark-blue-700 { 
    --tw-gradient-to: #0873A1; 
  }

  /* REMOVE the manual .bg-gradient-to-r definitions */
`;

const LoginPage: React.FC = () => {
  // 💡 Use Redux state and actions
  const { isAuthenticated, userRole, login } = useAuth(); 
  
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check Redux state for authentication status and role
    if (isAuthenticated) {
        if (userRole === 'admin') {
            navigate("/admin/dashboard", { replace: true });
        } else if (userRole === 'client') {
            navigate("/", { replace: true });
        }
    }
    // NOTE: userRole is a dependency because it determines the navigation target
  }, [isAuthenticated, userRole, navigate]); 

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Find matching user
    const user = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
        // 2. Trigger Redux login action
        login(user.role);
        // Note: Navigation will be handled by the useEffect hook once the Redux state updates.
    } else {
        // 3. Handle invalid credentials
        setError("Invalid email or password. Please try again. (Test credentials: admin@theta.com/password123 or client@theta.com/userpass)");
        console.error("Invalid credentials.");
    }
  };

  return (
    <div className="flex items-center justify-center p-8 bg-light-blue-50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-dark-blue-600 rounded-full shadow-xl">
            <User2 className="h-8 w-8 text-white" />
          </div>
          
        </div>
        <h2 className="text-4xl font-serif font-bold text-dark-blue-800 mb-3 text-center leading-tight">
          Welcome Back
        </h2>
        <h3 className="text-center font-display font-medium text-gray-600 mb-8 text-lg">
          Sign in to your Theta Lounge account
        </h3>
        
        {/* Error Message Display */}
        {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-xl border border-red-300 text-sm font-medium">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-display font-semibold text-gray-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />{" "}
              <input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 font-sans transition-all duration-300"
                required
              />
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label
              htmlFor="password"
              className="block text-sm font-display font-semibold text-gray-700 mb-2"
            >
              Password{" "}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />{" "}
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 font-sans transition-all duration-300"
                required
              />
            </div>{" "}
          </div>{" "}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-dark-blue-600 to-dark-blue-700 text-white font-display font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
          >
            Log In{" "}
          </button>{" "}
        </form>{" "}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3 text-center">
          {" "}
          <p className="text-sm font-sans text-gray-600">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="font-display font-bold text-dark-blue-600 hover:text-light-blue-400 transition duration-150"
            >
              Sign up{" "}
            </NavLink>{" "}
          </p>{" "}
          <NavLink
            to="/"
            className="inline-flex items-center text-sm font-display font-semibold text-gray-500 hover:text-dark-blue-600 transition duration-150"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home{" "}
          </NavLink>{" "}
        </div>{" "}
        
      </div>{" "}
    </div>
  );
};

export default LoginPage;