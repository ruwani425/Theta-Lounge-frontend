// src/pages/SignupPage.tsx

import React, { useState, type FormEvent } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  UserPlus,
  ArrowLeft,
  User, // For Username
  CreditCard, // For NIC
  Calendar, // For DOB
  Mail, // For Email
  Phone, // For Contact
  MapPin, // For Address
  Lock, // For Password
  Users, // For Gender
  Eye, // 💡 New: For showing password
  EyeOff, // 💡 New: For hiding password
} from "lucide-react";

// Add CustomStyle variable here for the page to work independently and define the colors
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

  /* Gradient adapted to the new palette */
  .bg-gradient-to-r.from-dark-blue-600 { 
    background-image: linear-gradient(to right, #035C84, #0873A1); 
  }
`;

const SignupPage: React.FC = () => {
  const navigate = useNavigate();

  // 💡 Updated State for all required fields
  const [username, setUsername] = useState<string>("");
  const [nic, setNic] = useState<string>(""); // National Identity Card
  const [dob, setDob] = useState<string>(""); // Date of Birth
  const [gender, setGender] = useState<string>("");
  const [contact, setContact] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // 💡 New State: To track password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password Confirmation Check
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please check your entries.");
      return;
    }

    // ⚠️ TODO: Replace this placeholder logic with actual API call to register user
    const formData = {
      username,
      nic,
      dob,
      gender,
      contact,
      address,
      email,
      password,
    };
    console.log("Attempting to sign up with:", formData);

    // Simulate successful registration and redirect to login
    // Note: Replaced alert with a console log as alerts are problematic in the environment.
    console.log(
      `Registration successful for ${username}! Redirecting to login.`
    );
    navigate("/login");
  };

  /**
   * Helper component to wrap the input and icon for cleaner JSX
   * @param param0.Icon - The Lucide icon component
   * @param param0.children - The input, select, or textarea element
   * @param param0.isPassword - Flag to apply special styling/icons for password fields
   */
  const FieldWithIcon: React.FC<{
    Icon: React.ElementType;
    children: React.ReactNode;
    isPassword?: boolean; // 💡 Added prop for conditional rendering
  }> = ({ Icon, children, isPassword = false }) => (
    <div className="relative">
      {/* Absolute positioned Left icon (e.g., Lock) */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>

      {/* Absolute positioned Right icon (Eye/EyeOff) for password fields */}
      {isPassword && (
        <div
          className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
          onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? (
            <EyeOff className="h-5 w-5 text-gray-500 hover:text-dark-blue-600" />
          ) : (
            <Eye className="h-5 w-5 text-gray-500 hover:text-dark-blue-600" />
          )}
        </div>
      )}

      {/* Input element (with pl-10 for left icon and pr-10 for right password icon) */}
      {children}
    </div>
  );

  {/* Updated focus colors: focus:ring-dark-blue-600 focus:border-dark-blue-600 */}
  const passwordInputClass =
    "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 font-sans transition-all duration-300";
  const regularInputClass =
    "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 font-sans transition-all duration-300";

  return (
    <div className="flex items-center justify-center p-8 bg-light-blue-50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
      <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-2xl border border-gray-100">
        {/* Sign Up Icon: Updated bg-indigo-500 to bg-dark-blue-600 */}
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-dark-blue-600 rounded-full shadow-xl">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Updated text-indigo-800 to text-dark-blue-800 */}
        <h2 className="text-4xl font-serif font-bold text-dark-blue-800 mb-3 text-center leading-tight">
          Create Your Account
          </h2>
        <h3 className="text-center font-display font-medium text-gray-600 mb-8 text-lg">
          Join the Theta Lounge community with your details
        </h3>

        {/* Error message display */}
        {error && (
          <div className="mb-4 p-3 text-sm font-display font-semibold text-red-700 bg-red-100 border border-red-400 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* 🚀 FORM: Using Grid for Row/Column Design 🚀 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Username Field (Col 1) */}
            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Username
              </label>
              <FieldWithIcon Icon={User}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  className={regularInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                NIC / Passport ID
              </label>
              <FieldWithIcon Icon={CreditCard}>
                <input
                  type="text"
                  value={nic}
                  onChange={(e) => setNic(e.target.value)}
                  placeholder="Enter ID number"
                  className={regularInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <FieldWithIcon Icon={Mail}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={regularInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Date of Birth
              </label>
              <FieldWithIcon Icon={Calendar}>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className={regularInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Gender
              </label>
              <FieldWithIcon Icon={Users}>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 appearance-none font-sans transition-all duration-300"
                  required
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </FieldWithIcon>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Contact Number
              </label>
              <FieldWithIcon Icon={Phone}>
                <input
                  type="tel"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. 0771234567"
                  className={regularInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Address
              </label>
              <div className="relative">
                <div className="absolute top-0 left-0 pl-3 pt-3 flex items-start pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  placeholder="Enter your full mailing address"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-dark-blue-600 focus:border-dark-blue-600 resize-none font-sans transition-all duration-300"
                  required
                ></textarea>
              </div>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Password
              </label>
              <FieldWithIcon Icon={Lock} isPassword={true}>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className={passwordInputClass}
                  required
                />
              </FieldWithIcon>
            </div>

            <div>
              <label className="block text-sm font-display font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <FieldWithIcon Icon={Lock} isPassword={true}>
                <input
                  type={isPasswordVisible ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  className={passwordInputClass}
                  required
                />
              </FieldWithIcon>
            </div>
          </div>

          {/* Updated button colors: from-dark-blue-600 to-dark-blue-700 */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-dark-blue-600 to-dark-blue-700 text-white font-display font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 mt-6 sm:col-span-2"
          >
            Sign Up
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-200 space-y-3 text-center">
          <p className="text-sm font-sans text-gray-600">
            Already have an account?{" "}
            {/* Updated text-indigo-600 to text-dark-blue-600, hover:text-indigo-500 to hover:text-light-blue-400 */}
            <NavLink
              to="/login"
              className="font-display font-bold text-dark-blue-600 hover:text-light-blue-400 transition duration-150"
            >
              Log In
            </NavLink>
          </p>

          <NavLink
            to="/"
            className="inline-flex items-center text-sm font-display font-semibold text-gray-500 hover:text-dark-blue-600 transition duration-150"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;