"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet } from "lucide-react";
import { signInWithGoogle } from "../firebase/firebase-config";
import { useDispatch, useSelector } from "react-redux";
import apiRequest from "../core/axios";
import {
  loginAction,
  setAdminPermissionsAction,
  type AuthUser,
} from "../redux/authSlice";
import type { RootState } from "../redux/store";

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const userRole = useSelector((state: RootState) => state.auth.userRole);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  type UserRole = "admin" | "client";

  interface UserProfileResponse {
    success: boolean;
    message: string;
    data: AuthUser;
  }

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/");
    }
  }, [isAuthenticated, userRole, navigate]);

  const fetchPermissionsAndLogin = async (
    token: string,
    role: UserRole,
    baseUser: AuthUser
  ) => {
    dispatch(loginAction({ token, role, user: baseUser }));

    if (role === "admin" && baseUser.permissions) {
      dispatch(setAdminPermissionsAction(baseUser.permissions));
      navigate("/admin/dashboard");
    } else if (role === "admin") {
      try {
        const profileResponse = await apiRequest.get<UserProfileResponse>(
          "/users/me"
        );
        if (profileResponse.success && profileResponse.data) {
          const permissions = profileResponse.data.permissions || [];
          dispatch(setAdminPermissionsAction(permissions));
          navigate("/admin/dashboard");
        }
      } catch (profileError) {
        setError("Admin login failed: Could not load permissions.");
      }
    } else {
      navigate("/");
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const firebaseUser = await signInWithGoogle();

      if (!firebaseUser.email || !firebaseUser.uid) {
        throw new Error("Google sign-in did not return required user data.");
      }

      const googleUserData = {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        profileImage: firebaseUser.photoURL,
        uid: firebaseUser.uid,
      };

      const backendResponse = (await apiRequest.post(
        "/auth/google-auth",
        googleUserData
      )) as any;

      if (!backendResponse || !backendResponse.user) {
        throw new Error("Invalid response from backend authentication.");
      }

      const { token, user: backendUser } = backendResponse;
      const role: UserRole = backendUser?.role;

      const baseUser: AuthUser = {
        _id: backendUser._id,
        name: backendUser.name,
        email: backendUser.email,
        profileImage: backendUser.profileImage,
        role: role,
        permissions: backendUser.permissions || [],
      };

      await fetchPermissionsAndLogin(token, role, baseUser);
    } catch (error) {
      const errorMessage =
        (error as any).response?.data?.message ||
        (error as Error).message ||
        "Unknown error";
      setError("Login failed: " + errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen overflow-x-hidden flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Left Section - Login */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full">
                <Droplet className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
              Floating Theraphy
            </h1>
            <p className="text-lg text-slate-600 font-light">
              Welcome to Your Sanctuary
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-700 text-center">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-md p-8 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            <p className="text-center text-slate-500 mb-6 text-sm">
              Please sign in with your Google account to access your dashboard.
            </p>
            
            <button
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-2xl px-6 py-4 border-2 border-slate-100 transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
              onClick={handleGoogleSignIn}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6.75c1.66 0 3.14.57 4.31 1.69l3.23-3.23C17.46 2.98 14.97 2 12 2 7.7 2 3.99 4.47 2.18 7.07l3.66 2.84C6.71 7.47 9.14 6.75 12 6.75z"
                />
              </svg>
              <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
            </button>
          </div>

          <div className="text-center px-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline">Terms</a> and{" "}
              <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section - Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img
          src="/peaceful-person-floating-in-calm-water-spa-therapy.jpg"
          alt="Floating Therapy Sanctuary"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-800/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-white space-y-4">
          <h2 className="text-5xl font-bold leading-tight">Find Your Inner Peace</h2>
          <p className="text-xl opacity-90 max-w-sm">
            Experience the transformative power of floatation therapy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;