"use client"

// src/pages/admin/AdminDashboard.tsx

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "../../redux/store"
import apiRequest from "../../core/axios"

import { auth, logout } from "../../firebase/firebase-config"

import { onAuthStateChanged } from "firebase/auth"

import type { User as FirebaseAuthUser } from "firebase/auth"

import {
  User,
  CalendarCheck,
  Bath,
  DollarSign,
  Settings,
  Shield,
  BookOpen,
  TrendingUp,
  // ArrowUp,
  // ArrowDown,
  Waves,
  LogOut,
  Package,
} from "lucide-react"

import {
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
import { motion, type Variants } from "framer-motion"
import { PerformanceOverview } from "../../components/admin/PerformanceOverview"
import { AUTH_TOKEN_KEY, removeCookie } from "../../utils/cookieUtils"

const THETA_COLORS = {
  darkestBlue: "#035C84",
  darkBlue: "#0873A1",
  mediumBlue: "#2DA0CC",
  lightBlue: "#94CCE7",
  white: "#FFFFFF",
  bgLight: "#F8FAFC",
  bgLighter: "#FFFFFF",
}

const CHART_COLORS = ["#06B6D4", "#3B82F6", "#EC4899", "#F59E0B", "#10B981"]

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
}

interface KPIData {
  value: string
  change: string
  trend: "up" | "down"
}

interface DashboardStats {
  kpis: {
    totalRevenue: KPIData
    newBookings: KPIData
    tankAvailability: KPIData
    avgSession: KPIData
  }
  weeklyTrends: Array<{ name: string; bookings: number }>
  tankUtilization: Array<{ name: string; utilization: number; ideal: number }>
  revenueBreakdown: Array<{ name: string; value: number }>
}

const dashboardOptions = [
  {
    title: "Appointment Bookings",
    path: "/admin/reservations",
    description: "Manage all appointments and schedules.",
    icon: CalendarCheck,
    permissionKey: "reservations",
  },
  {
    title: "Tank Management",
    path: "/admin/tank-management",
    description: "Monitor floating tank capacity and status.",
    icon: Bath,
    permissionKey: "tanks",
  },
  {
    title: "User Accounts",
    path: "/admin/users",
    description: "Manage all system users and members.",
    icon: User,
    permissionKey: "users",
  },
  {
    title: "Services & Pricing",
    path: "/admin/package-management",
    description: "Update therapy services and package rates.",
    icon: DollarSign,
    permissionKey: "packages",
  },
  {
    title: "Package Activations",
    path: "/admin/package-activations",
    description: "Manage customer package activation requests.",
    icon: Package,
    permissionKey: "activations",
  },
  {
    title: "Reports & Analytics",
    path: "/admin/reports",
    description: "View performance metrics and insights.",
    icon: TrendingUp,
    permissionKey: "reports",
  },
  {
    title: "Content Management",
    path: "/admin/content",
    description: "Edit website pages and blog posts.",
    icon: BookOpen,
    permissionKey: "content",
  },
  {
    title: "Access Control",
    path: "/admin/access-controll",
    description: "Manage admin permissions and roles.",
    icon: Shield,
    permissionKey: "access_control",
  },
  {
    title: "Global Settings",
    path: "/admin/system-settings",
    description: "Configure application settings.",
    icon: Settings,
    permissionKey: "settings",
  },
]

// interface StatCardProps {
//   title: string
//   value: string
//   change: string
//   trend: "up" | "down"
//   icon: React.ElementType
//   color: string
// }

// const StatCard: React.FC<StatCardProps> = ({ title, value, change, trend, icon: Icon }) => (
//   <motion.div
//     variants={itemVariants}
//     whileHover={{ y: -5, transition: { duration: 0.2 } }}
//     className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-shadow duration-300 flex flex-col"
//   >
//     <div className="flex items-start justify-between mb-4">
//       <div className="flex-1">
//         <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: THETA_COLORS.mediumBlue }}>
//           {title}
//         </p>
//         <h4 className="text-3xl font-bold mb-2" style={{ color: THETA_COLORS.darkestBlue }}>
//           {value}
//         </h4>
//         <div
//           className={`flex items-center text-xs font-semibold ${trend === "up" ? "text-emerald-600" : "text-red-600"}`}
//         >
//           {trend === "up" ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
//           {change} vs last period
//         </div>
//       </div>
//       <div className="p-3 rounded-xl shadow-inner" style={{ backgroundColor: `${THETA_COLORS.lightBlue}20` }}>
//         <Icon className="w-6 h-6" style={{ color: THETA_COLORS.darkBlue }} />
//       </div>
//     </div>
//   </motion.div>
// )

const BookingTrendLineChart: React.FC<{
  data: Array<{ name: string; bookings: number }>
}> = ({ data }) => {
  const hasData = data.some((item) => item.bookings > 0)

  return (
    <motion.div
      variants={itemVariants}
      className="p-4 sm:p-5 md:p-6 lg:p-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="relative z-10">
        <h3
          className="text-base sm:text-base md:text-lg lg:text-lg font-bold mb-4 sm:mb-6"
          style={{ color: THETA_COLORS.darkestBlue }}
        >
          Weekly Booking Trends
        </h3>
        {hasData || data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: THETA_COLORS.white,
                  border: `1px solid ${THETA_COLORS.lightBlue}`,
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Line
                type="monotone"
                dataKey="bookings"
                stroke={CHART_COLORS[0]}
                strokeWidth={2}
                activeDot={{ r: 6 }}
                name="Total Bookings"
                dot={{ fill: CHART_COLORS[0], r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <CalendarCheck
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3 sm:mb-4 opacity-30"
              style={{ color: THETA_COLORS.mediumBlue }}
            />
            <p className="text-sm font-semibold" style={{ color: THETA_COLORS.mediumBlue }}>
              No booking data yet
            </p>
            <p className="text-xs mt-2 opacity-70" style={{ color: THETA_COLORS.mediumBlue }}>
              Booking trends will appear once appointments are made
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const TankUtilizationBarChart: React.FC<{
  data: Array<{ name: string; utilization: number; ideal: number }>
}> = ({ data }) => {
  const hasData = data && data.length > 0

  return (
    <motion.div
      variants={itemVariants}
      className="p-4 sm:p-5 md:p-6 lg:p-6 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm border border-slate-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden"
    >
      <div className="relative z-10">
        <h3
          className="text-base sm:text-base md:text-lg lg:text-lg font-bold mb-4 sm:mb-6"
          style={{ color: THETA_COLORS.darkestBlue }}
        >
          Tank Utilization
        </h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis unit="%" domain={[0, 100]} stroke="#64748b" allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}%`, ""]}
                contentStyle={{ backgroundColor: THETA_COLORS.white }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar dataKey="utilization" fill={CHART_COLORS[1]} name="Actual Utilization" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ideal" fill={CHART_COLORS[3]} name="Ideal Target" radius={[6, 6, 0, 0]} opacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[250px]">
            <Bath
              className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3 sm:mb-4 opacity-30"
              style={{ color: THETA_COLORS.mediumBlue }}
            />
            <p className="text-sm font-semibold" style={{ color: THETA_COLORS.mediumBlue }}>
              No tank data available
            </p>
            <p className="text-xs mt-2 opacity-70" style={{ color: THETA_COLORS.mediumBlue }}>
              Tank utilization will be calculated once system is configured
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

const AdminDashboard: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<FirebaseAuthUser | null>(null)
  const navigate = useNavigate()
  const adminPermissions = useSelector((state: RootState) => state.auth.adminPermissions)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)


  const visibleDashboardOptions = useMemo(() => {
    if (!adminPermissions || adminPermissions.length === 0) return []
    return dashboardOptions.filter((option) => adminPermissions.includes(option.permissionKey))
  }, [adminPermissions])

  const fetchDashboardStats = async () => {
    try {
      setIsLoadingStats(true)
      const response = await apiRequest.get<{ success: boolean; data: DashboardStats }>("/dashboard/stats")
      if (response.success) setDashboardStats(response.data)
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user))
    fetchDashboardStats()
    return () => unsubscribe()
  }, [])

  const handleLogoutClick = async () => {
    try {
      await logout()
      removeCookie(AUTH_TOKEN_KEY)
      navigate("../../login")
    } catch (error) {
      alert("Failed to log out.")
    }
  }

  return (
    <div style={{ backgroundColor: THETA_COLORS.bgLight }} className="min-h-screen font-sans">
      <div className="w-full mx-auto p-4 md:p-8 max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-10"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-2xl shadow-lg shadow-blue-900/10"
                style={{ backgroundColor: THETA_COLORS.darkestBlue }}
              >
                <Waves className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: THETA_COLORS.darkestBlue }}>
                  Admin Dashboard
                </h1>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: THETA_COLORS.mediumBlue }}>
                  Floating Theraphy Operations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/admin/profile")}
                className="w-10 h-10 rounded-full border-2 border-white shadow-md overflow-hidden bg-white"
              >
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL || "/placeholder.svg"} alt="User" />
                ) : (
                  <User className="m-auto mt-2 text-slate-400" />
                )}
              </button>
              <button
                onClick={handleLogoutClick}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-blue-900/10 transition-transform active:scale-95"
                style={{ backgroundColor: THETA_COLORS.darkBlue }}
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </motion.header>

        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          <section className="mb-12">
            <h2
              className="text-sm font-black uppercase tracking-widest mb-6"
              style={{ color: THETA_COLORS.mediumBlue }}
            >
              Management Hub
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleDashboardOptions.map((option, index) => (
                <motion.div key={option.title} variants={itemVariants} className="col-span-1">
                  <AdminCard {...option} Icon={option.icon} animationDelay={index * 0.05} />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2
              className="text-sm font-black uppercase tracking-widest mb-6"
              style={{ color: THETA_COLORS.mediumBlue }}
            >
              Performance Overview
            </h2>
            {isLoadingStats ? (
              <div className="h-40 flex items-center justify-center bg-white rounded-2xl border border-slate-100">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              dashboardStats && <PerformanceOverview stats={dashboardStats.kpis} />
            )}
          </section>

          <section>
            <h2
              className="text-sm font-black uppercase tracking-widest mb-6"
              style={{ color: THETA_COLORS.mediumBlue }}
            >
              Data Insights
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div key="booking-trend" variants={itemVariants} className="col-span-1">
                <BookingTrendLineChart data={dashboardStats?.weeklyTrends || []} />
              </motion.div>
              <motion.div key="tank-utilization" variants={itemVariants} className="col-span-1">
                <TankUtilizationBarChart data={dashboardStats?.tankUtilization || []} />
              </motion.div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  )
}

export default AdminDashboard
