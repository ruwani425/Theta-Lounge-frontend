import type React from "react"
import { useState, useEffect } from "react" 
import { useNavigate } from 'react-router-dom'; // Requires React Router

// Import Firebase dependencies and utility functions (RUNTIME VALUES/FUNCTIONS)
import { auth, logout } from "../../firebase/firebase-config" // <-- ADJUST PATH AS NEEDED

// Import runtime functions from firebase/auth (VALUES)
import { 
  onAuthStateChanged, 
} from "firebase/auth" 

// Import type-only declarations from firebase/auth (TYPES)
import type { 
  User as FirebaseAuthUser, // Renamed to avoid conflict with lucide-react User icon
} from "firebase/auth" 

import {
  User, // lucide-react icon
  CalendarCheck,
  Bath,
  DollarSign,
  Settings,
  Shield,
  BookOpen,
  TrendingUp,
  Clock,
  Wallet,
  ArrowUp,
  ArrowDown,
  Waves,
  LogOut,
} from "lucide-react"

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts"
import AdminCard from "../../components/admin/AdminCard"

// --- THEME & DATA CONSTANTS ---

const THETA_COLORS = {
  darkestBlue: "#0F1F2E",
  darkBlue: "#1a3a52",
  mediumBlue: "#3a7ca5",
  lightBlue: "#6ab4dc",
  cyan: "#A0E7E5",
  lightCyan: "#D4F1F9",
  white: "#FFFFFF",
  bgLight: "#F5F8FC",
  bgLighter: "#FAFBFC",
}

const CHART_COLORS = ["#06B6D4", "#3B82F6", "#EC4899", "#F59E0B", "#10B981"]

const PIE_DATA = [
  { name: "60 Min Float", value: 400 },
  { name: "90 Min Float", value: 300 },
  { name: "Package Deal", value: 300 },
  { name: "Add-on Service", value: 200 },
]

const BAR_DATA = [
  { name: "Tank 1 (Neptune)", utilization: 85, ideal: 90 },
  { name: "Tank 2 (Orion)", utilization: 72, ideal: 90 },
  { name: "Tank 3 (Zen)", utilization: 92, ideal: 90 },
]

const LINE_DATA = [
  { name: "Wk 1", bookings: 45 },
  { name: "Wk 2", bookings: 60 },
  { name: "Wk 3", bookings: 52 },
  { name: "Wk 4", bookings: 75 },
]

const KPI_DATA = [
  {
    title: "Total Revenue",
    value: "$12,450",
    change: "+5.1%",
    trend: "up",
    icon: Wallet,
    color: THETA_COLORS.darkestBlue,
  },
  {
    title: "New Bookings",
    value: "145",
    change: "+12%",
    trend: "up",
    icon: CalendarCheck,
    color: THETA_COLORS.darkestBlue,
  },
  {
    title: "Tank Availability",
    value: "82%",
    change: "-2%",
    trend: "down",
    icon: Bath,
    color: THETA_COLORS.darkestBlue,
  },
  {
    title: "Avg Session",
    value: "75 min",
    change: "+3%",
    trend: "up",
    icon: Clock,
    color: THETA_COLORS.darkestBlue,
  },
]

const dashboardOptions = [
  {
    title: "Appointment Bookings",
    path: "/admin/reservations",
    description: "Manage all appointments and schedules.",
    icon: CalendarCheck,
  },
  {
    title: "Tank Management",
    path: "/admin/tank-management",
    description: "Monitor floating tank capacity and status.",
    icon: Bath,
  },
  {
    title: "User Accounts",
    path: "/admin/users",
    description: "Manage all system users and members.",
    icon: User,
  },
  {
    title: "Services & Pricing",
    path: "/admin/pricing",
    description: "Update therapy services and package rates.",
    icon: DollarSign,
  },
  {
    title: "Reports & Analytics",
    path: "/admin/reports",
    description: "View performance metrics and insights.",
    icon: TrendingUp,
  },
  {
    title: "Content Management",
    path: "/admin/content",
    description: "Edit website pages and blog posts.",
    icon: BookOpen,
  },
  {
    title: "Access Control",
    path: "/admin/roles",
    description: "Manage admin permissions and roles.",
    icon: Shield,
  },
  {
    title: "Global Settings",
    path: "/admin/system-settings",
    description: "Configure application settings.",
    icon: Settings,
  },
]

// --- CHART AND CARD COMPONENTS ---

const StatCard: React.FC<(typeof KPI_DATA)[0] & { icon: React.ElementType }> = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}) => (
  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg hover:border-slate-300 transition-all duration-300 flex flex-col">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: THETA_COLORS.mediumBlue }}>
          {title}
        </p>
        <h4 className="text-3xl font-bold mb-3" style={{ color: THETA_COLORS.darkestBlue }}>
          {value}
        </h4>
        <div
          className={`flex items-center text-xs font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}
        >
          {trend === "up" ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
          {change} vs last period
        </div>
      </div>
      <div className="p-4 rounded-xl" style={{ backgroundColor: THETA_COLORS.lightCyan }}>
        <Icon className="w-6 h-6" style={{ color: THETA_COLORS.darkestBlue }} />
      </div>
    </div>
  </div>
)

const BookingTrendLineChart: React.FC = () => (
  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
    <div className="relative z-10">
      <h3 className="text-lg font-bold mb-6" style={{ color: THETA_COLORS.darkestBlue }}>
        Weekly Booking Trends
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={LINE_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis stroke="#64748b" />
          <Tooltip
            contentStyle={{ backgroundColor: THETA_COLORS.white, border: `1px solid ${THETA_COLORS.lightBlue}` }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="bookings"
            stroke={CHART_COLORS[0]}
            strokeWidth={3}
            activeDot={{ r: 8 }}
            name="Total Bookings"
            dot={{ fill: CHART_COLORS[0], r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const TankUtilizationBarChart: React.FC = () => (
  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
    <div className="relative z-10">
      <h3 className="text-lg font-bold mb-6" style={{ color: THETA_COLORS.darkestBlue }}>
        Tank Utilization
        </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={BAR_DATA} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="name" stroke="#64748b" />
          <YAxis unit="%" domain={[0, 100]} stroke="#64748b" />
          <Tooltip formatter={(value) => [`${value}%`, ""]} contentStyle={{ backgroundColor: THETA_COLORS.white }} />
          <Legend />
          <Bar dataKey="utilization" fill={CHART_COLORS[1]} name="Actual Utilization" radius={[8, 8, 0, 0]} />
          <Bar dataKey="ideal" fill={CHART_COLORS[3]} name="Ideal Target" radius={[8, 8, 0, 0]} opacity={0.5} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)

const RevenuePieChart: React.FC = () => (
  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
    <div className="relative z-10">
      <h3 className="text-lg font-bold mb-6" style={{ color: THETA_COLORS.darkestBlue }}>
        Revenue Breakdown by Service
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={PIE_DATA}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={85}
            labelLine={false}
            label={(props: any) => {
              if (props.percent !== undefined) {
                return `${(props.percent * 100).toFixed(0)}%`
              }
              return ""
            }}
          >
            {PIE_DATA.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: THETA_COLORS.white }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </div>
)


// --- ADMIN DASHBOARD MAIN COMPONENT ---

const AdminDashboard: React.FC = () => {
  // 1. STATE TO HOLD CURRENT FIREBASE USER
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null)
  
  // Hook for navigation (Requires 'react-router-dom')
  const navigate = useNavigate(); 

  // 2. EFFECT TO LISTEN FOR AUTH CHANGES
  useEffect(() => {
    // Use the exported 'auth' instance
    const unsubscribe = onAuthStateChanged(auth, (user) => { 
      setCurrentUser(user)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  // 3. HANDLERS
  const handleProfileClick = () => {
    console.log("Navigating to user profile.")
    // navigate('/admin/profile'); // Example: Implement actual navigation logic here
  }

  const handleLogoutClick = async () => {
    try {
      await logout(); // Call the exported Firebase logout utility
      console.log("Logout Successful. Redirecting...");
      navigate('/'); // Redirect to the main page or login page
    } catch (error) {
      console.error("Error during logout:", error);
      alert("Failed to log out. Please try again.");
    }
  }


  // --- JSX RENDER ---
  return (
    <div style={{ backgroundColor: THETA_COLORS.bgLight }} className="min-h-screen">
      <div className="w-full mx-auto p-6 md:p-8 max-w-7xl">
        <header className="mb-10">
          <div className="flex justify-between items-start">
            {/* Logo/Title Section */}
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 rounded-xl" style={{ backgroundColor: THETA_COLORS.lightCyan }}>
                  <Waves className="w-7 h-7" style={{ color: THETA_COLORS.darkestBlue }} />
                </div>
                <h1 className="text-4xl font-bold" style={{ color: THETA_COLORS.darkestBlue }}>
                  Admin Dashboard
                </h1>
              </div>
              <p
                className="text-sm font-semibold uppercase tracking-wider ml-16"
                style={{ color: THETA_COLORS.mediumBlue }}
              >
                Manage Your Theta Lounge Operations
              </p>
            </div>

            {/* Profile and Logout Section */}
            <div className="flex items-center gap-4 mt-1">
              {/* Profile Icon Button: CONDITIONAL RENDER FOR GOOGLE PHOTO */}
              <button
                onClick={handleProfileClick}
                className="p-1 rounded-full transition-all duration-200 hover:opacity-85 overflow-hidden border-2 border-slate-300 shadow-md"
                style={{ backgroundColor: THETA_COLORS.darkestBlue, width: '48px', height: '48px' }}
                aria-label="View Profile"
                title={currentUser ? `View Profile (${currentUser.displayName || 'Admin'})` : "View Profile"}
              >
                {currentUser && currentUser.photoURL ? (
                  // Display Google Profile Image
                  <img
                    src={currentUser.photoURL}
                    alt="User Profile"
                    referrerPolicy="no-referrer" // Important for Google images
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  // Fallback User Icon
                  <User className="w-8 h-8 mx-auto" style={{ color: THETA_COLORS.white }} /> 
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 p-3 rounded-xl font-semibold text-sm transition-all duration-200 hover:opacity-90 shadow-md"
                style={{ backgroundColor: THETA_COLORS.mediumBlue, color: THETA_COLORS.white }}
                aria-label="Logout"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* --- QUICK ACCESS SECTION --- */}
        <section className="mb-12">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: THETA_COLORS.mediumBlue }}>
              Quick Access
            </p>
            <h2 className="text-3xl font-bold" style={{ color: THETA_COLORS.darkestBlue }}>
              Management Tools
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dashboardOptions.map((option, index) => (
              <AdminCard
                key={option.title}
                title={option.title}
                path={option.path}
                description={option.description}
                Icon={option.icon}
                animationDelay={index * 0.05}
              />
            ))}
          </div>
        </section>

        {/* --- PERFORMANCE OVERVIEW SECTION --- */}
        <section className="mb-12">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: THETA_COLORS.mediumBlue }}>
              Performance Overview
            </p>
            <h2 className="text-3xl font-bold" style={{ color: THETA_COLORS.darkestBlue }}>
              Quick Stats
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {KPI_DATA.map((kpi) => (
              <StatCard
                key={kpi.title}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                trend={kpi.trend}
                icon={kpi.icon}
                color={kpi.color}
              />
            ))}
          </div>
        </section>

        {/* --- ANALYTICS SECTION --- */}
        <section>
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: THETA_COLORS.mediumBlue }}>
              Analytics
            </p>
            <h2 className="text-3xl font-bold" style={{ color: THETA_COLORS.darkestBlue }}>
              Performance Insights
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BookingTrendLineChart />
            <TankUtilizationBarChart />
            <RevenuePieChart />
            <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-center items-center text-center hover:shadow-lg transition-all duration-300 relative overflow-hidden">
              <div className="relative z-10">
                <TrendingUp className="w-12 h-12 mb-4" style={{ color: THETA_COLORS.darkestBlue }} />
                <p className="font-bold text-lg" style={{ color: THETA_COLORS.darkestBlue }}>
                  More analytics coming soon
                </p>
                <p className="text-sm mt-2" style={{ color: THETA_COLORS.mediumBlue }}>
                  Enhanced reporting features in development
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AdminDashboard