// src/pages/LoginPage.tsx

import React, { useEffect, useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { ArrowLeft, User2, Mail, Lock } from "lucide-react";
import { useAuth } from '../components/AuthProvider'; 
import { signInWithGoogle } from "../firebase/firebase-config";


// --- MOCK AUTHENTICATION LOGIC (Omitted for brevity, kept same) ---
interface MockUser {
    email: string;
    password: string;
    role: 'admin' | 'client';
}

const MOCK_USERS: MockUser[] = [
    { email: "admin@theta.com", password: "password123", role: 'admin' },
    { email: "client@theta.com", password: "userpass", role: 'client' },
];

// --- CUSTOM STYLES (UPDATED background-image URL) ---
/*
  BASED ON THETA LOUNGE PALETTE (approximation of main blues):
  Dark Blue: #07476D (Darkest color from the top color palette row)
  Medium Blue: #196D9C (A mid-tone blue from the palette)
  Light Blue Accent: #94CCE7 (Light blue from the palette, used for borders/accents)
  Text/Light BG: #F0F8FF (Approximation of very light blue/off-white)
*/
const CustomStyle = `
  .text-dark-blue-800 { color: #07476D; }
  .bg-dark-blue-800 { background-color: #07476D; }
  .hover\\:bg-medium-blue-700:hover { background-color: #196D9C; }
  .text-medium-blue-700 { color: #196D9C; } 
  .bg-light-blue-200 { background-color: #94CCE7; }
  .text-light-gray-50 { color: #F0F8FF; } 
  .focus\\:ring-dark-blue-800:focus { --tw-ring-color: #07476D; }
  .focus\\:border-dark-blue-800:focus { border-color: #07476D; }

  /* Gradient for Left Panel */
  .from-theta-dark { 
    --tw-gradient-from: #07476D; 
    --tw-gradient-to: rgba(7, 71, 109, 0);
    --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
  }
  .to-theta-medium { 
    --tw-gradient-to: #196D9C; 
  }
  .via-theta-dark {
    --tw-gradient-via: #07476D;
  }

  /* Custom background image class with reliable placeholder */
  .auth-bg-image {
    /* Using a simple placeholder service with a dark blue background color: #07476D */
    background-image: url('https://placehold.co/1000x800/07476D/FFFFFF?text=Background%20Image'); 
  }
`;

// Google Icon Component (Simplified SVG) - UNCHANGED
const GoogleIcon: React.FC = () => (
  <svg 
    version="1.1" 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 48 48" 
    className="w-5 h-5"
    fill="currentColor"
  >
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.06l7.98 6.19C12.43 13.75 17.5 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-.67-.06-1.34-.17-2H24v4.61h12.48c-.51 2.94-2.26 5.4-4.78 7.04l6.85 5.29c4.04-3.73 6.39-9.25 6.39-16.94z" />
    <path fill="#FBBC05" d="M9.98 36.29C9.28 34.3 8.94 32.22 8.94 30.09c0-2.13.34-4.21 1.04-6.2l-7.98-6.19C1.13 18.91 0 21.37 0 24.09c0 3.81.97 7.42 2.69 10.6l7.29 5.66L9.98 36.29z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.77l-6.85-5.29c-2.07 1.39-4.83 2.2-9.04 2.2-6.52 0-11.58-4.25-13.48-10.37l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);


const LoginPage: React.FC = () => {
  const { isAuthenticated, userRole, login } = useAuth(); 
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
        if (userRole === 'admin') {
            navigate("/admin/dashboard", { replace: true });
        } else if (userRole === 'client') {
            navigate("/", { replace: true });
        }
    }
  }, [isAuthenticated, userRole, navigate]); 

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    const user = MOCK_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (user) {
        login(user.role);
    } else {
        setError("Invalid email or password. Please try again. (Test credentials: admin@theta.com/password123 or client@theta.com/userpass)");
        console.error("Invalid credentials.");
    }
  };

  const handleGoogleSignIn =async () => {
   try {
      await signInWithGoogle();
    } catch (error) {
      // Error handling is done in firebase-config, but you can add UI feedback here
      console.error("Failed to sign in via Google.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Login UI - UPDATED GRADIENT & TEXT COLOR */}
      <div className="flex-1 **bg-gradient-to-br from-theta-dark via-theta-dark to-theta-medium** flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="max-w-md w-full space-y-10">
          {/* Heading - UPDATED TEXT COLOR */}
          <div className="text-center">
            <h1 className="text-5xl font-extrabold **text-white** tracking-tight">
              Welcome Back
            </h1>
            <p className="mt-3 **text-light-gray-50** text-lg">
              Sign in to continue your journey
            </p>
          </div>

          {/* Google Button Card - UPDATED TEXT COLOR */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-white/20">
            <button 
              className="w-full flex items-center justify-center gap-4 bg-white text-gray-800 font-medium rounded-2xl px-8 py-5 hover:shadow-xl transition-all duration-300 group"
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
              <span className="text-lg">Continue with Google</span>
            </button>

            <p className="mt-8 text-center text-sm **text-light-gray-50**">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-white">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-white">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image - UNCHANGED */}
      <div className="hidden lg:block flex-1 relative overflow-hidden bg-gray-900">
        <img
          src="/creative-thinking-w800.png"
          alt="Welcome"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        
        <div className="absolute bottom-12 left-12 text-white max-w-lg">
          <h2 className="text-5xl font-bold mb-4">Start Something Amazing</h2>
          <p className="text-xl opacity-90">
            Join thousands of creators building the future.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;