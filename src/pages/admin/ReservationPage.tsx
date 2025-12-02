"use client"
import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Search, Check, Clock, X, CheckCircle, Calendar, MessageSquare, Phone } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Swal from "sweetalert2" // Using SweetAlert for notifications

// Import your API Request file
import apiRequest from "../../core/axios" 

// Status Definitions (must match backend enum and keys used in getStatusBadge)
const STATUS_OPTIONS = [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

interface Appointment {
    id: string 
    clientName: string | null 
    email: string | null 
    contactNumber: string | null 
    sessionDate: string 
    sessionTime: string
    status: "pending" | "completed" | "cancelled"
    specialNote: string | null
    
    // Fields received from the backend:
    name: string; 
    date: string;
    time: string;
}

// --- API Service Extension ---
const reservationApiService = {
    // New service function to update appointment status
    updateAppointmentStatus: async (id: string, newStatus: string): Promise<boolean> => {
        try {
            // Assuming your backend route is PUT /api/appointments/:id/status
            const response = await apiRequest.put<{ success: boolean }>(`/appointments/${id}/status`, { 
                status: newStatus 
            });
            return response.success;
        } catch (error) {
            console.error("Failed to update status:", error);
            throw new Error("Failed to update status on server.");
        }
    }
};

// --- Status Dropdown Component ---
interface StatusDropdownProps {
    appointmentId: string;
    currentStatus: Appointment['status'];
    onStatusChangeSuccess: () => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({ appointmentId, currentStatus, onStatusChangeSuccess }) => {
    const [selectedStatus, setSelectedStatus] = useState(currentStatus);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = event.target.value as Appointment['status'];
        setSelectedStatus(newStatus);
        setIsUpdating(true);

        try {
            const success = await reservationApiService.updateAppointmentStatus(appointmentId, newStatus);
            if (success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: `Status for booking ${appointmentId} changed to ${newStatus}.`,
                    toast: true,
                    position: 'top-end',
                    timer: 3000,
                    showConfirmButton: false,
                });
                onStatusChangeSuccess(); // Trigger full data refresh in parent
            } else {
                throw new Error("Update failed.");
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Could not update status.',
            });
            // Revert state on failure
            setSelectedStatus(currentStatus); 
        } finally {
            setIsUpdating(false);
        }
    };
    
    const { styles } = getStatusBadge(selectedStatus); // Use local helper

    return (
        <div className={`relative ${isUpdating ? 'opacity-60' : ''}`}>
            <select
                value={selectedStatus}
                onChange={handleChange}
                disabled={isUpdating}
                className={`appearance-none rounded-full border px-3 py-1 text-xs font-medium cursor-pointer transition-colors focus:ring-2 focus:ring-primary focus:outline-none ${styles}`}
            >
                {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {isUpdating && <Clock className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin text-primary" />}
        </div>
    );
};


const getStatusBadge = (status: string) => {
    const statusStyles: Record<string, string> = {
        pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
        completed: "bg-blue-50 text-blue-700 border-blue-200",
        cancelled: "bg-red-50 text-red-700 border-red-200",
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


// --- Main Reservations Page Component ---
export default function ReservationsPage() {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [appointments, setAppointments] = useState<Appointment[]>([]) 
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

// ReservationsPage.tsx

// ... (existing code)

const fetchAppointments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
        const endpoint = "/appointments"; 

        const responseData = await apiRequest.get<{ success: boolean; data: any[] }>(endpoint);
        
        // --- FIX: Normalize status and map fields upon fetching ---
        const mappedAppointments = responseData.data.map((app: any) => ({
            id: app._id, 
            clientName: app.name || 'N/A', 
            email: app.email,
            contactNumber: app.contactNumber,
            specialNote: app.specialNote,
            sessionDate: app.date,
            sessionTime: app.time,
            // Normalize all incoming statuses to lowercase for frontend logic/dropdowns
            status: (app.status as string)?.toLowerCase() || 'pending', 
        })) as Appointment[];

        setAppointments(mappedAppointments); 

    } catch (err: any) {
    // ... (error handling)
    } finally {
        setIsLoading(false)
    }
  }, [])

// ... (rest of ReservationsPage.tsx remains the same)
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])

  // Filtering Logic (with Null Checks for Safety)
  const filteredAppointments = appointments.filter((appointment) => {
    
    const clientName = appointment.clientName || "";
    const email = appointment.email || "";
    const contactNumber = appointment.contactNumber || "";
    
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactNumber.includes(searchTerm);
      
    const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
    
    return !!appointment && matchesSearch && matchesStatus;
  });

  

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Reservations 📅</h1>
          <p className="mt-2 text-muted-foreground">Manage and view all client booking sessions</p>
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by client name, email, or contact number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter & Calendar Buttons */}
          <div className="flex gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-input bg-background px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="pending">pending</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>

            {/* Calendar Toggle Button */}
            <button
              onClick={() => navigate("/admin/calendar-management")}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-opacity-90 transition-all"
            >
              <Calendar className="h-5 w-5" />
              <span className="hidden sm:inline">View Calendar</span>
            </button>
          </div>
        </div>
        
        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center p-10 text-xl text-primary font-medium">
            Loading appointments... ⏳
          </div>
        )}
        {error && !isLoading && (
          <div className="text-center p-10 text-xl text-red-500 font-medium border border-red-300 bg-red-50 rounded-lg">
            Error: {error} ❌
          </div>
        )}
        
        {/* Bookings Table */}
        {!isLoading && !error && (
          <div className="rounded-lg border border-border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Client Name</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Email</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Contact No.</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Time</th>
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Special Note</th> 
                  <th className="px-6 py-4 text-left font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment) => {
                  return (
                    <tr key={appointment.id} className="border-b border-border hover:bg-muted transition-colors">
                      {/* Client Name Data */}
                      <td className="px-6 py-4 font-medium text-foreground">{appointment.clientName || 'N/A'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{appointment.email || 'N/A'}</td>
                      {/* Contact Number Data */}
                      <td className="px-6 py-4 text-foreground whitespace-nowrap">
                        <a 
                          href={`tel:${appointment.contactNumber || ''}`} 
                          className={`flex items-center gap-1 hover:underline ${appointment.contactNumber ? 'text-primary' : 'text-muted-foreground'}`}
                        >
                          <Phone className="h-4 w-4" />
                          {appointment.contactNumber || 'N/A'}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {appointment.sessionDate ? new Date(appointment.sessionDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-foreground">{appointment.sessionTime || 'N/A'}</td>
                      {/* Special Note Data */}
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" title={appointment.specialNote || 'N/A'}>
                        <MessageSquare className="inline h-4 w-4 mr-1 text-primary" />
                        {appointment.specialNote || "N/A"}
                      </td>
                      {/* Status Dropdown Integration */}
                      <td className="px-6 py-4">
                        <StatusDropdown 
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                          onStatusChangeSuccess={fetchAppointments} // Re-fetch data on success
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {filteredAppointments.length === 0 && !isLoading && !error && (
          <div className="mt-8 rounded-lg border border-border bg-card p-12 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">No bookings found</h3>
            <p className="mt-2 text-muted-foreground">There are no appointments to display. Try adjusting the filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}