// src/pages/LoginPage.tsx

import React, { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("admin");
  const [password, setPassword] = useState<string>("password");

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      // Simulates <Navigate to="/admin/dashboard" replace />
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "password") {
      // Successful login -> updates state and triggers redirect
      login();
    } else {
      console.error("Invalid credentials. Use admin/password for testing.");
    }
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        <h2 className="text-3xl font-bold text-indigo-800 mb-6 text-center">
          Admin Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.01]"
          >
            Log In (Test Mode)
          </button>
          <p className="text-center text-sm text-gray-500 pt-2">
            Use: **admin / password**
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
