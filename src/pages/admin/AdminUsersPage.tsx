"use client"

// src/pages/admin/AdminUsersPage.tsx

import type React from "react"
import { useState, useEffect } from "react"
import { Users, Mail, Shield, Search, UserIcon } from "lucide-react"
import apiRequest from "../../core/axios"
import Swal from "sweetalert2"
import { getCookie, AUTH_TOKEN_KEY } from "../../utils/cookieUtils"
import Avatar from "../../components/Avatar"
import { useNavigate } from "react-router-dom" // NEW IMPORT

// Define base User interface from user.controller.ts response
interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "client"
  profileImage?: string
  createdAt: string
}

// Define the expected API Response structures
interface UsersResponse {
  success: true
  message: string
  data: User[]
  count: number
}

// PackageActivation and UserDetailResponse interfaces are removed as they are no longer needed

const COLORS = {
  primary: "#0873A1",    // Dark Blue
  darkest: "#035C84",    // Darkest Blue
  medium: "#2DA0CC",     // Medium Blue
  light: "#94CCE7",      // Light Blue
  white: "#FFFFFF",
  bgLight: "#F8FAFC",    // Page background
  grayBorder: "#E2E8F0", 
  grayText: "#64748B",
  success: "#10B981",    // Kept for status roles
  warning: "#F59E0B",
}

// const AdminUsersPage: React.FC = () => {
//   const navigate = useNavigate() // Initialize useNavigate
//   const [users, setUsers] = useState<User[]>([])
//   const [loading, setLoading] = useState(true)
//   const [searchTerm, setSearchTerm] = useState("")
//   const [selectedRole, setSelectedRole] = useState<"all" | "admin" | "client">("all")

//   // State variables for the right sidebar (selectedUser, userPackages, loadingPackages) are removed

//   useEffect(() => {
//     fetchUsers()
//   }, [])

//   const fetchUsers = async () => {
//     try {
//       setLoading(true)
//       const token = getCookie(AUTH_TOKEN_KEY)

//       if (!token) {
//         Swal.fire({
//           icon: "error",
//           title: "Authentication Required",
//           text: "Please log in to access this page",
//         })
//         return
//       }

//       const response = await apiRequest.get<UsersResponse>("/users")

//       if (response.success) {
//         setUsers(response.data)
//       }
//     } catch (error) {
//       console.error("Error fetching users:", error)
//       const axiosError = error as any
//       Swal.fire({
//         icon: "error",
//         title: "Error",
//         text: axiosError.response?.data?.message || "Failed to fetch users",
//       })
//     } finally {
//       setLoading(false)
//     }
//   }

//   // Function to handle navigation to client dashboard
//   const handleViewUserDashboard = (email: string) => {
//     // Navigate to the same route used in ReservationPage: /admin/clients/:email
//     navigate(`/admin/clients/${email}`)
//   }

//   const filteredUsers = users.filter((user) => {
//     const matchesSearch =
//       user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase())
//     const matchesRole = selectedRole === "all" || user.role === selectedRole
//     return matchesSearch && matchesRole
//   })

//   // getStatusColor function is removed

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.gray50 }}>
//         <div className="text-center">
//           <div
//             className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
//             style={{ borderColor: COLORS.primary }}
//           ></div>
//           <p className="text-xl font-semibold" style={{ color: COLORS.gray600 }}>
//             Loading users...
//           </p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="min-h-screen" style={{ backgroundColor: COLORS.gray50 }}>
//       {/* Header */}
//       <div className="p-4 md:p-6 border-b shadow-sm" style={{ backgroundColor: COLORS.white }}>
//         <div className="max-w-7xl mx-auto">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
//             <div>
//               <h1
//                 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3"
//                 style={{ color: COLORS.gray800 }}
//               >
//                 <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.primary}20` }}>
//                   <Users className="w-6 h-6 md:w-8 md:h-8" style={{ color: COLORS.primary }} />
//                 </div>
//                 User Management
//               </h1>
//               <p className="mt-2 text-xs md:text-sm font-medium" style={{ color: COLORS.gray600 }}>
//                 Manage users and view their roles
//               </p>
//             </div>
//           </div>

//           {/* Stats */}
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
//             <div
//               className="p-3 md:p-4 rounded-xl border"
//               style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}
//             >
//               <div className="flex items-center gap-3">
//                 <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.primary }} />
//                 <div>
//                   <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>
//                     TOTAL USERS
//                   </p>
//                   <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.primary }}>
//                     {users.length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div
//               className="p-3 md:p-4 rounded-xl border"
//               style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}
//             >
//               <div className="flex items-center gap-3">
//                 <Shield className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.success }} />
//                 <div>
//                   <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>
//                     ADMINS
//                   </p>
//                   <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.success }}>
//                     {users.filter((u) => u.role === "admin").length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//             <div
//               className="p-3 md:p-4 rounded-xl border"
//               style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}
//             >
//               <div className="flex items-center gap-3">
//                 <UserIcon className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.warning }} />
//                 <div>
//                   <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>
//                     CLIENTS
//                   </p>
//                   <p className="text-xl md:text-2xl font-bold" style={{ color: COLORS.warning }}>
//                     {users.filter((u) => u.role === "client").length}
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto p-4 md:p-6">
//         <div className="grid grid-cols-1 gap-6">
//           {/* Users List - now full width (lg:col-span-3 implicit) */}
//           <div className="lg:col-span-3">
//             <div
//               className="rounded-xl border p-4 md:p-6 shadow-md"
//               style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}
//             >
//               {/* Search and Filter */}
//               <div className="flex flex-col md:flex-row gap-4 mb-6">
//                 <div className="flex-1 relative">
//                   <Search
//                     className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
//                     style={{ color: COLORS.gray600 }}
//                   />
//                   <input
//                     type="text"
//                     placeholder="Search by name or email..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
//                     style={{ borderColor: COLORS.gray200 }}
//                   />
//                 </div>
//                 <select
//                   value={selectedRole}
//                   onChange={(e) => setSelectedRole(e.target.value as "all" | "admin" | "client")}
//                   className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
//                   style={{ borderColor: COLORS.gray200 }}
//                 >
//                   <option value="all">All Roles</option>
//                   <option value="admin">Admin</option>
//                   <option value="client">Client</option>
//                 </select>
//               </div>

//               {/* Users List */}
//               <div className="space-y-3 max-h-[600px] overflow-y-auto">
//                 {filteredUsers.map((user) => (
//                   <div
//                     key={user._id}
//                     className="p-3 md:p-4 border rounded-lg hover:shadow-md transition-all"
//                     style={{
//                       backgroundColor: COLORS.white,
//                       borderColor: COLORS.gray200,
//                     }}
//                   >
//                     <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//                       <div className="flex items-center gap-3">
//                         <Avatar src={user.profileImage} name={user.name} size="md" fallbackColor={COLORS.primary} />
//                         <div className="min-w-0 flex-1">
//                           {/* MODIFIED: Make the user's name clickable */}
//                           <button
//                             type="button"
//                             onClick={() => handleViewUserDashboard(user.email)}
//                             className="font-bold cursor-pointer hover:underline text-sm md:text-base truncate block w-full text-left"
//                             style={{ color: COLORS.gray800 }}
//                             title={`View dashboard for ${user.name}`}
//                           >
//                             {user.name}
//                           </button>

//                           <div
//                             className="flex items-center gap-2 text-xs md:text-sm truncate"
//                             style={{ color: COLORS.gray600 }}
//                           >
//                             <Mail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
//                             <span className="truncate">{user.email}</span>
//                           </div>
//                         </div>
//                       </div>
//                       <div className="flex items-center gap-2 self-start sm:self-center">
//                         <span
//                           className="px-2 md:px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap"
//                           style={{
//                             backgroundColor: user.role === "admin" ? `${COLORS.success}20` : `${COLORS.primary}20`,
//                             color: user.role === "admin" ? COLORS.success : COLORS.primary,
//                           }}
//                         >
//                           {user.role === "admin" ? (
//                             <Shield className="w-3 h-3 inline mr-1" />
//                           ) : (
//                             <UserIcon className="w-3 h-3 inline mr-1" />
//                           )}
//                           {user.role.toUpperCase()}
//                         </span>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

const AdminUsersPage: React.FC = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRole, setSelectedRole] = useState<"all" | "admin" | "client">("all")

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = getCookie(AUTH_TOKEN_KEY)

      if (!token) {
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "Please log in to access this page",
        })
        return
      }

      const response = await apiRequest.get<UsersResponse>("/users")

      if (response.success) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      const axiosError = error as any
      Swal.fire({
        icon: "error",
        title: "Error",
        text: axiosError.response?.data?.message || "Failed to fetch users",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewUserDashboard = (email: string) => {
    navigate(`/admin/clients/${email}`)
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = selectedRole === "all" || user.role === selectedRole
    return matchesSearch && matchesRole
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bgLight }}>
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4"
            style={{ borderColor: COLORS.primary }}
          ></div>
          <p className="text-xl font-semibold" style={{ color: COLORS.primary }}>
            Loading users...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bgLight }}>
      {/* Header */}
      <div className="p-4 md:p-6 border-b shadow-sm" style={{ backgroundColor: COLORS.white }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1
                className="text-2xl md:text-3xl font-extrabold flex items-center gap-3"
                style={{ color: COLORS.darkest }}
              >
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.light}30` }}>
                  <Users className="w-6 h-6 md:w-8 md:h-8" style={{ color: COLORS.primary }} />
                </div>
                User Management
              </h1>
              <p className="mt-2 text-xs md:text-sm font-bold uppercase tracking-wider" style={{ color: COLORS.medium }}>
                Floating Theraphy Operations
              </p>
            </div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            <div
              className="p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ backgroundColor: COLORS.white, borderColor: `${COLORS.light}40` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.primary}15` }}>
                  <Users className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: COLORS.grayText }}>Total Users</p>
                  <p className="text-xl md:text-2xl font-black" style={{ color: COLORS.darkest }}>{users.length}</p>
                </div>
              </div>
            </div>

            <div
              className="p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ backgroundColor: COLORS.white, borderColor: `${COLORS.light}40` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.medium}15` }}>
                  <Shield className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.medium }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: COLORS.grayText }}>Admins</p>
                  <p className="text-xl md:text-2xl font-black" style={{ color: COLORS.medium }}>
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="p-3 md:p-4 rounded-xl border-2 transition-all hover:shadow-md"
              style={{ backgroundColor: COLORS.white, borderColor: `${COLORS.light}40` }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.light}40` }}>
                  <UserIcon className="w-5 h-5 md:w-6 md:h-6" style={{ color: COLORS.primary }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: COLORS.grayText }}>Clients</p>
                  <p className="text-xl md:text-2xl font-black" style={{ color: COLORS.primary }}>
                    {users.filter((u) => u.role === "client").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: COLORS.grayBorder }}>
          {/* Filter Bar */}
          <div className="p-4 md:p-6 border-b bg-slate-50/50" style={{ borderColor: COLORS.grayBorder }}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
                  style={{ color: COLORS.medium }}
                />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-offset-1 transition-all outline-none text-sm md:text-base"
                  style={{ 
                    borderColor: COLORS.grayBorder,
                    "--tw-ring-color": COLORS.light 
                  } as any}
                />
              </div>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as "all" | "admin" | "client")}
                className="px-4 py-2.5 border rounded-xl font-medium outline-none transition-all"
                style={{ borderColor: COLORS.grayBorder, color: COLORS.darkest }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>

          {/* User List Table-like view */}
          <div className="p-4 md:p-6 space-y-3 max-h-[700px] overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="group p-4 border rounded-2xl hover:border-sky-300 hover:shadow-lg hover:shadow-sky-900/5 transition-all"
                  style={{
                    backgroundColor: COLORS.white,
                    borderColor: COLORS.grayBorder,
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Avatar 
                        src={user.profileImage} 
                        name={user.name} 
                        size="lg" 
                        fallbackColor={COLORS.primary} 
                      />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => handleViewUserDashboard(user.email)}
                          className="font-bold text-lg hover:text-sky-600 transition-colors truncate block w-full text-left"
                          style={{ color: COLORS.darkest }}
                        >
                          {user.name}
                        </button>
                        <div className="flex items-center gap-2 mt-1" style={{ color: COLORS.grayText }}>
                          <Mail className="w-4 h-4" />
                          <span className="text-sm truncate font-medium">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span
                        className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm"
                        style={{
                          backgroundColor: user.role === "admin" ? `${COLORS.darkest}10` : `${COLORS.light}30`,
                          color: user.role === "admin" ? COLORS.darkest : COLORS.primary,
                        }}
                      >
                        {user.role === "admin" ? (
                          <Shield className="w-3.5 h-3.5 inline mr-1.5" />
                        ) : (
                          <UserIcon className="w-3.5 h-3.5 inline mr-1.5" />
                        )}
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold" style={{ color: COLORS.grayText }}>No users found matches your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsersPage
