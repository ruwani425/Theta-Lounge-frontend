"use client"

import type React from "react"
import { useEffect, useState, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, Lock, Droplet } from "lucide-react"
import axios from "axios"
import { signInWithGoogle } from "../firebase/firebase-config"
import { useAuth } from "../components/AuthProvider"


type UserCredential = {
  user: {
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
    uid: string;
  };
};

// const mockSignInWithGoogle = async (): Promise<UserCredential> => {
//     console.log("MOCK: Attempting Google Sign-In...");
//     await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
//     return {
//         user: {
//             displayName: "Mocked User",
//             email: "mock.google.user@example.com",
//             photoURL: "https://placehold.co/50x50/4285F4/ffffff?text=G",
//             uid: "mock-firebase-uid-12345",
//         }
//     };
// };


// Backend API Configuration
const GOOGLE_API_URL = "http://localhost:5000/api/auth/google-auth"; 

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, userRole } = useAuth();
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      if (userRole === "admin") navigate("/admin/dashboard");
      else navigate("/");
    }
  }, [isAuthenticated, userRole, navigate]);


  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  

  type UserRole = "admin" | "client"

  // interface TestUser {
  //   email: string
  //   password: string
  //   role: UserRole
  // }


  // TEMPORARY USERS ARRAY (Frontend Only) - Only for the handleSubmit function
  // const testUsers:TestUser[]= [
  //   {
  //     email: "admin@theta.com",
  //     password: "password123",
  //     role: "admin",
  //   },
  //   {
  //     email: "client@theta.com",
  //     password: "userpass",
  //     role: "client",
  //   },
  // ];

const handleGoogleSignIn = async () => {
  setError(null);
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

    console.log("Sending real Firebase user to backend:", googleUserData);

    const backendResponse = await axios.post(GOOGLE_API_URL, googleUserData);

    const { token, user: backendUser } = backendResponse.data;

    console.log("Token from backend:", token);

    const role: UserRole = backendUser?.email?.includes("admin")
      ? "admin"
      : "client";

    login(role, token);

    if (role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }
  } catch (error) {
    console.error("Google Auth Integration Error:", error);

    let errorMsg;

    if (axios.isAxiosError(error)) {
      errorMsg = `Backend Error: ${
        error.response?.data?.message || "Server issue"
      }`;
    } else if (error instanceof Error) {
      errorMsg = `Client Error: ${error.message}`;
    } else {
      errorMsg = "Unknown error occurred.";
    }

    setError(errorMsg);
  }
};


  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("/api/auth/login", { email, password });
      const { token, user } = response.data;

      if (!user?.role || !token) {
        setError("Invalid login response from server");
        return;
      }

      login(user.role, token);

      if (user.role === "admin") navigate("/admin/dashboard");
      else navigate("/");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Server error");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    }
  };



  return (
    <div className="min-h-screen w-screen overflow-x-hidden flex flex-col lg:flex-row bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-16">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-3">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full">
                <Droplet className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Theta Lounge</h1>
            <p className="text-lg text-slate-600 font-light">Welcome to Your Sanctuary</p>
            <p className="text-sm text-slate-500">Experience the power of floating therapy</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-md p-6 border border-blue-100 hover:shadow-lg transition-shadow duration-300">
            <button
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-50 to-slate-50 hover:from-blue-100 hover:to-slate-100 text-slate-900 font-medium rounded-2xl px-6 py-3.5 border border-blue-200 transition-all duration-300"
              onClick={handleGoogleSignIn}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-sm text-slate-500">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="you@example.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none ${
                      focusedField === "email"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none ${
                      focusedField === "password"
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 bg-white hover:border-blue-300"
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
              >
                Sign In to Theta Lounge
              </button>
            </form>
          </div>

          <div className="text-center space-y-3">
            <p className="text-sm text-slate-600">
              By signing in, you agree to our{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Privacy Policy
              </a>
            </p>
            <p className="text-xs text-slate-500">Test: admin@theta.com / password123 or client@theta.com / userpass</p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900">
        <img
          src="/peaceful-person-floating-in-calm-water-spa-therapy.jpg"
          alt="Floating Therapy Sanctuary"
          className="absolute inset-0 h-full w-full object-cover opacity-90"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-blue-800/40 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-12 text-white space-y-4">
          <h2 className="text-5xl font-bold leading-tight text-pretty">Find Your Inner Peace</h2>
          <p className="text-xl opacity-95 max-w-sm text-pretty">
            Experience the transformative power of floatation therapy and unlock your true potential.
          </p>

          <div className="pt-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-300" />
              <span className="text-sm opacity-90">Deep relaxation and stress relief</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-300" />
              <span className="text-sm opacity-90">Enhanced mental clarity</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-300" />
              <span className="text-sm opacity-90">Physical recovery & wellness</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage