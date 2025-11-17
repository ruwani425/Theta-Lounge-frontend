// src/pages/LoginPage.tsx

import React, { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Mail, Lock } from "lucide-react";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (email === "admin" && password === "password") {
      login();
    } else {
      console.error("Invalid credentials. Use admin/password for testing.");
    }
  };

  return (
    <div className="flex items-center justify-center p-8 bg-gray-50 min-h-screen">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-indigo-500 rounded-full shadow-xl">
            <User2 className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-indigo-800 mb-2 text-center">
          Welcome Back
        </h2>
        <h3 className="text-center text-gray-600 mb-6">
          Sign in to your Theta Lounge account
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>{" "}
          </div>{" "}
          <div>
            {" "}
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>{" "}
          </div>{" "}
          <button
            type="submit"
            className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300 transform hover:scale-[1.01]"
          >
            Log In{" "}
          </button>{" "}
        </form>{" "}
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3 text-center">
          {" "}
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <NavLink
              to="/signup"
              className="font-semibold text-indigo-600 hover:text-indigo-500 transition duration-150"
            >
              Sign up{" "}
            </NavLink>{" "}
          </p>{" "}
          <NavLink
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition duration-150"
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
