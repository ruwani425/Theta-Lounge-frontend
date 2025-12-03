"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Clock,
  X,
  CheckCircle,
  CalendarIcon,
  MessageSquare,
  Phone,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2"
import apiRequest from "../../core/axios"

// --- THEME COLORS (Derived from the Theta Lounge image - Light Theme) ---
// Primary Background: A soft, cool white/light blue for low contrast.
const COLOR_BG_LIGHT = "#F0F8FF" // Off-white/Cool White
// Primary Text/Darkest Shade: The deepest blue from the palette.
const COLOR_TEXT_DARK = "#1B4965" // Primary dark blue
// Accent/Interactive: A soft, light cyan/blue for subtle highlights and CTAs.
const COLOR_ACCENT = "#A8D8EA" // Soft cyan/light blue
// Muted Text/Border: A medium-dark, desaturated grey-blue for main body text.
const COLOR_MUTED = "#5E7B9D" // Muted grey-blue
// Card/Panel Background: Pure white for a clean, raised look.
const COLOR_CARD_BG = "#FFFFFF"

// Status Definitions
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

interface Appointment {
  id: string
  clientName: string | null
  email: string | null
  contactNumber: string | null
  sessionDate: string
  sessionTime: string
  status: "pending" | "completed" | "cancelled"
  specialNote: string | null
  name: string
  date: string
  time: string
}

interface PaginationMeta {
  currentPage: number
  totalPages: number
  totalRecords: number
  recordsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// NOTE: reservationApiService remains unchanged as it is backend related.

const reservationApiService = {
  updateAppointmentStatus: async (id: string, newStatus: string): Promise<boolean> => {
    try {
      const response = await apiRequest.put<{ success: boolean }>(`/appointments/${id}/status`, {
        status: newStatus,
      })
      return response.success
    } catch (error) {
      console.error("Failed to update status:", error)
      throw new Error("Failed to update status on server.")
    }
  },
  getAppointments: async (page = 1, limit = 20, startDate?: string, endDate?: string) => {
    try {
      const params = new URLSearchParams()
      params.append("page", page.toString())
      params.append("limit", limit.toString())
      if (startDate) params.append("startDate", startDate)
      if (endDate) params.append("endDate", endDate)

      const response = await apiRequest.get<{
        success: boolean
        data: any[]
        pagination: PaginationMeta
      }>(`/appointments?${params.toString()}`)
      return response
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      throw error
    }
  },
}

interface StatusDropdownProps {
  appointmentId: string
  currentStatus: Appointment["status"]
  onStatusChangeSuccess: () => void
}

const getStatusBadge = (status: string) => {
  // Keeping badge colors light and contrasting against the card background
  const statusStyles: Record<string, string> = {
    pending: `bg-yellow-100 text-yellow-700 border-yellow-200`, // Soft Yellow
    completed: `bg-teal-100 text-teal-700 border-teal-200`, // Soft Teal
    cancelled: `bg-red-100 text-red-700 border-red-200`, // Soft Red
  }
  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4" />,
    cancelled: <X className="h-4 w-4" />,
  }
  return {
    styles: statusStyles[status] || statusStyles.pending,
    icon: statusIcons[status],
  }
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ appointmentId, currentStatus, onStatusChangeSuccess }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as Appointment["status"]
    setSelectedStatus(newStatus)
    setIsUpdating(true)

    try {
      const success = await reservationApiService.updateAppointmentStatus(appointmentId, newStatus)
      if (success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: `Status changed to ${newStatus}.`,
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
          // Use theme colors for SweetAlert
          background: COLOR_CARD_BG,
          color: COLOR_TEXT_DARK,
        })
        onStatusChangeSuccess()
      } else {
        throw new Error("Update failed.")
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not update status.",
        // Use theme colors for SweetAlert
        background: COLOR_CARD_BG,
        color: COLOR_TEXT_DARK,
      })
      setSelectedStatus(currentStatus)
    } finally {
      setIsUpdating(false)
    }
  }

  const { styles } = getStatusBadge(selectedStatus)

  return (
    <div className={`relative ${isUpdating ? "opacity-60" : ""}`}>
      <select
        value={selectedStatus}
        onChange={handleChange}
        disabled={isUpdating}
        // CORRECTED: Using style attribute for borderColor and safe Tailwind classes
        className={`appearance-none rounded-md border px-3 py-2 text-xs font-medium cursor-pointer transition-colors focus:ring-2 focus:outline-none 
          text-gray-800 bg-white ${styles}`}
        style={{
          borderColor: COLOR_MUTED, // Muted blue border
          // Using a known utility class for the ring color, or directly setting ring color if needed
          boxShadow: `0 0 0 2px ${COLOR_CARD_BG}, 0 0 0 4px ${COLOR_ACCENT}50`, 
        }}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-white text-gray-800">
            {option.label}
          </option>
        ))}
      </select>
      {/* CORRECTED: Using style attribute for dynamic color */}
      {isUpdating && <Clock className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin" style={{ color: COLOR_MUTED }} />}
    </div>
  )
}


export default function ReservationsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta | null>(null)

  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const fetchAppointments = useCallback(
    async (page = 1) => {
      setIsLoading(true)
      setError(null)
      try {
        const queryStart = startDate
        const queryEnd = endDate || startDate

        const response = await reservationApiService.getAppointments(
          page,
          20,
          queryStart || undefined,
          queryEnd || undefined,
        )

        const mappedAppointments = response.data.map((app: any) => ({
          id: app._id,
          clientName: app.name || "N/A",
          email: app.email,
          contactNumber: app.contactNumber,
          specialNote: app.specialNote,
          sessionDate: app.date,
          sessionTime: app.time,
          status: (app.status as string)?.toLowerCase() || "pending",
        })) as Appointment[]

        setAppointments(mappedAppointments)
        setPagination(response.pagination)
        setCurrentPage(page)
      } catch (err: any) {
        console.error("Error fetching appointments:", err)
        setError(err?.message || "Failed to load appointments")
      } finally {
        setIsLoading(false)
      }
    },
    [startDate, endDate],
  )

  useEffect(() => {
    fetchAppointments(1)
  }, [startDate, endDate, fetchAppointments])

  // Filtering Logic remains unchanged

  const filteredAppointments = appointments.filter((appointment) => {
    const clientName = appointment.clientName || ""
    const email = appointment.email || ""
    const contactNumber = appointment.contactNumber || ""

    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactNumber.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter

    return !!appointment && matchesSearch && matchesStatus
  })

  const handlePreviousPage = () => {
    if (pagination?.hasPrevPage) {
      fetchAppointments(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      fetchAppointments(currentPage + 1)
    }
  }

  const handleClearDateFilter = () => {
    setStartDate("")
    setEndDate("")
  }

  const getDateFilterText = () => {
    if (!startDate) {
      return "No date filter applied"
    }
    if (!endDate || startDate === endDate) {
      return `Showing reservations for ${startDate}`
    }
    return `Showing reservations from ${startDate} to ${endDate}`
  }

  return (
    // Background Color
    <div className="min-h-screen" style={{ backgroundColor: COLOR_BG_LIGHT }}>
      <div className="mx-auto max-w-7xl p-6">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ color: COLOR_TEXT_DARK }}>Reservations</h1>
          <p className="mt-2" style={{ color: COLOR_MUTED }}>Manage and view all client booking sessions</p>
        </div>

        {/* Date Filter Card */}
        {/* Card Style: White background, subtle muted blue border, soft shadow */}
        <div className="mb-6 rounded-xl border p-4 shadow-sm" style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + '30' }}>
          <h2 className="mb-4 text-sm font-semibold" style={{ color: COLOR_TEXT_DARK }}>Filter by Date</h2>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" style={{ color: COLOR_TEXT_DARK }} />
              <span className="text-sm" style={{ color: COLOR_MUTED }}>From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
                style={{ 
                  backgroundColor: COLOR_BG_LIGHT, 
                  borderColor: COLOR_MUTED + '40', 
                  color: COLOR_TEXT_DARK,
                  // CORRECTED: Using boxShadow for the custom focus ring style
                  boxShadow: `0 0 0 2px ${COLOR_BG_LIGHT}, 0 0 0 4px ${COLOR_ACCENT}50`,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" style={{ color: COLOR_TEXT_DARK }} />
              <span className="text-sm" style={{ color: COLOR_MUTED }}>To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!startDate}
                className="rounded-md border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2"
                 style={{ 
                  backgroundColor: COLOR_BG_LIGHT, 
                  borderColor: COLOR_MUTED + '40', 
                  color: COLOR_TEXT_DARK,
                  // CORRECTED: Using boxShadow for the custom focus ring style
                  boxShadow: `0 0 0 2px ${COLOR_BG_LIGHT}, 0 0 0 4px ${COLOR_ACCENT}50`,
                }}
              />
            </div>

            {startDate && (
              <button
                onClick={handleClearDateFilter}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-all hover:opacity-80"
                style={{ 
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + '40',
                  color: COLOR_MUTED,
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
          </div>

          <p className="mt-3 text-sm" style={{ color: COLOR_MUTED }}>
            {getDateFilterText()} • Total: {pagination?.totalRecords || 0} reservations
          </p>
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{ color: COLOR_MUTED }} />
            <input
              type="text"
              placeholder="Search by client name, email, or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border pl-10 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLOR_CARD_BG,
                borderColor: COLOR_MUTED + '40',
                color: COLOR_TEXT_DARK,
                // CORRECTED: Using boxShadow for the custom focus ring style
                boxShadow: `0 0 0 2px ${COLOR_CARD_BG}, 0 0 0 4px ${COLOR_ACCENT}50`, 
              }}
            />
          </div>

          {/* Filter & Calendar Buttons */}
          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border px-4 py-2 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLOR_CARD_BG,
                borderColor: COLOR_MUTED + '40',
                color: COLOR_TEXT_DARK,
                // CORRECTED: Using boxShadow for the custom focus ring style
                boxShadow: `0 0 0 2px ${COLOR_CARD_BG}, 0 0 0 4px ${COLOR_ACCENT}50`,
              }}
            >
              <option value="all" className="bg-white text-gray-800">
                All Status
              </option>
              <option value="pending" className="bg-white text-gray-800">
                Pending
              </option>
              <option value="completed" className="bg-white text-gray-800">
                Completed
              </option>
              <option value="cancelled" className="bg-white text-gray-800">
                Cancelled
              </option>
            </select>

            {/* Calendar Toggle Button */}
            <button
              onClick={() => navigate("/admin/calendar-management")}
              className="flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-all shadow-md hover:shadow-lg"
              style={{ 
                  backgroundColor: COLOR_ACCENT, 
                  color: COLOR_TEXT_DARK,
                  boxShadow: `0 4px 6px -1px ${COLOR_ACCENT}40, 0 2px 4px -2px ${COLOR_ACCENT}40` // Soft shadow with accent color
              }}
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">View Calendar</span>
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center p-10 text-xl font-medium" style={{ color: COLOR_TEXT_DARK }}>Loading appointments... ⏳</div>
        )}
        {error && !isLoading && (
          <div className="text-center p-10 text-xl font-medium border border-red-300 rounded-lg" style={{ backgroundColor: COLOR_CARD_BG, color: '#dc2626' }}>
            Error: {error} ❌
          </div>
        )}

        {/* Bookings Table */}
        {!isLoading && !error && (
          <div className="rounded-xl border overflow-x-auto shadow-md" style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + '30' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ backgroundColor: COLOR_BG_LIGHT, borderColor: COLOR_MUTED + '30' }}>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Client Name</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Email</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Contact No.</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Date</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Time</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Special Note</th>
                  <th className="px-6 py-4 text-left font-semibold" style={{ color: COLOR_TEXT_DARK }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => {
                  return (
                    <tr
                      key={appointment.id}
                      className="border-b transition-colors"
                      style={{ borderColor: COLOR_MUTED + '20', backgroundColor: COLOR_CARD_BG }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLOR_BG_LIGHT}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLOR_CARD_BG}
                    >
                      <td className="px-6 py-4 font-medium" style={{ color: COLOR_TEXT_DARK }}>{appointment.clientName || "N/A"}</td>
                      <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>{appointment.email || "N/A"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          href={`tel:${appointment.contactNumber || ""}`}
                          className={`flex items-center gap-1 hover:opacity-80 transition-colors ${appointment.contactNumber ? "" : ""}`}
                          style={{ color: COLOR_MUTED }}
                        >
                          <Phone className="h-4 w-4" />
                          {appointment.contactNumber || "N/A"}
                        </a>
                      </td>
                      <td className="px-6 py-4" style={{ color: COLOR_TEXT_DARK }}>
                        {appointment.sessionDate
                          ? new Date(appointment.sessionDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4" style={{ color: COLOR_TEXT_DARK }}>{appointment.sessionTime || "N/A"}</td>
                      <td
                        className="px-6 py-4 max-w-xs truncate"
                        title={appointment.specialNote || "N/A"}
                        style={{ color: COLOR_MUTED }}
                      >
                        <MessageSquare className="inline h-4 w-4 mr-1" style={{ color: COLOR_MUTED }} />
                        {appointment.specialNote || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                          onStatusChangeSuccess={() => fetchAppointments(currentPage)}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && pagination && (
          <div className="mt-6 flex flex-col gap-4 items-center justify-between rounded-xl border p-4 md:flex-row shadow-sm" style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + '30' }}>
            <div className="text-sm" style={{ color: COLOR_MUTED }}>
              Showing {(currentPage - 1) * pagination.recordsPerPage + 1} to{" "}
              {Math.min(currentPage * pagination.recordsPerPage, pagination.totalRecords)} of {pagination.totalRecords}{" "}
              records
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + '40',
                  color: COLOR_MUTED,
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium" style={{ color: COLOR_TEXT_DARK }}>
                Page {currentPage} of {pagination.totalPages}
              </div>

              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                 style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + '40',
                  color: COLOR_MUTED,
                }}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredAppointments.length === 0 && (
          <div className="text-center p-10 text-xl font-medium border rounded-lg" style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + '30', color: COLOR_MUTED }}>
            No reservations found. Try adjusting your filters. 🔍
          </div>
        )}
      </div>
    </div>
  )
}