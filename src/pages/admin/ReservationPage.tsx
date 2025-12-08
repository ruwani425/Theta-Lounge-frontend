"use client";
import type React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  Clock,
  X,
  CheckCircle,
  CalendarIcon,
  Phone, 
  ChevronLeft,
  ChevronRight,
  Eye,
  Package,
  User,
  Edit, 
  Save, 
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import apiRequest from "../../core/axios";

// --- THEME & CONSTANTS ---
const COLOR_BG_LIGHT = "#F0F8FF";
const COLOR_TEXT_DARK = "#1B4965";
const COLOR_ACCENT = "#A8D8EA";
const COLOR_MUTED = "#5E7B9D";
const COLOR_CARD_BG = "#FFFFFF";
const COLOR_EDIT_BLUE = "#3B82F6"; // Tailwind blue-500

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

// --- INTERFACES ---
interface PackageDetails {
  _id: string;
  packageName: string;
  totalSessions: number;
  usedCount: number;
  remainingSessions: number;
  startDate: string;
  expiryDate: string;
  status: string;
  packageId: {
    name: string;
    duration: string;
    sessions: number;
    totalPrice: number;
  };
}

interface Appointment {
  reservationId: string;
  id: string;
  clientName: string | null;
  email: string | null;
  contactNumber: string | null;
  sessionDate: string;
  sessionTime: string;
  status: "pending" | "completed" | "cancelled";
  specialNote: string | null;
  name: string;
  date: string;
  time: string;
  isPackageUser: boolean;
  packageDetails: PackageDetails | null;
}

interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// --- API SERVICE ---
const reservationApiService = {
  updateAppointmentStatus: async (
    id: string,
    newStatus: string
  ): Promise<boolean> => {
    try {
      const response = await apiRequest.put<{ success: boolean }>(
        `/appointments/${id}/status`,
        {
          status: newStatus,
        }
      );
      return response.success;
    } catch (error) {
      console.error("Failed to update status:", error);
      throw new Error("Failed to update status on server.");
    }
  },

  // API METHOD: Update Date and Time
  updateAppointmentDetails: async (
    id: string,
    date: string,
    time: string
  ): Promise<Appointment | null> => {
    try {
      const response = await apiRequest.put<{ success: boolean; data: any }>(
        `/appointments/${id}`, 
        { date, time }
      );
      if (response.success && response.data) {
        const app = response.data;
        // Re-map the response, converting time to 24hr format for state consistency
        return {
          id: app._id,
          reservationId: app.reservationId,
          clientName: app.name || "N/A",
          email: app.email,
          contactNumber: app.contactNumber,
          specialNote: app.specialNote,
          sessionDate: app.date,
          sessionTime: convert12hrTo24hr(app.time), // Use helper for consistency
          status: (app.status as string)?.toLowerCase() || "pending",
          name: app.name,
          date: app.date,
          time: app.time, // The original 12hr/24hr format is here, but we use sessionTime below
          isPackageUser: app.isPackageUser || false,
          packageDetails: app.packageDetails || null,
        } as Appointment;
      }
      return null;
    } catch (error) {
      console.error("Failed to update appointment details:", error);
      throw error;
    }
  },

  getAppointments: async (
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string
  ) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await apiRequest.get<{
        success: boolean;
        data: any[];
        pagination: PaginationMeta;
      }>(`/appointments?${params.toString()}`);
      return response;
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      throw error;
    }
  },
};


// --- HELPER FUNCTIONS ---

const getStatusBadge = (status: string) => {
  // Keeping badge colors light and contrasting against the card background
  const statusStyles: Record<string, string> = {
    pending: `bg-yellow-100 text-yellow-700 border-yellow-200`, // Soft Yellow
    completed: `bg-teal-100 text-teal-700 border-teal-200`, // Soft Teal
    cancelled: `bg-red-100 text-red-700 border-red-200`, // Soft Red
  };
  const statusIcons: Record<string, React.ReactNode> = {
    pending: <Clock className="h-4 w-4" />,
    completed: <CheckCircle className="h-4 w-4" />,
    cancelled: <X className="h-4 w-4" />,
  };
  return {
    styles: statusStyles[status] || statusStyles.pending,
    icon: statusIcons[status],
  };
};

/**
 * Utility function to format Sri Lankan numbers for WhatsApp.
 */
const formatSLNumberForWhatsApp = (contactNumber: string | null): string => {
    if (!contactNumber) return "";
    
    // 1. Remove non-digit characters (for safety)
    let cleanedNumber = contactNumber.replace(/\D/g, '');
    
    // 2. Check for the domestic leading zero and remove it
    if (cleanedNumber.startsWith('0')) {
        cleanedNumber = cleanedNumber.substring(1);
    }

    // 3. Prepend the hardcoded Sri Lankan country code '94'
    return '94' + cleanedNumber;
};


// NEW FIX: Converts 12hr format (e.g., "12:20 PM") to 24hr format (e.g., "12:20")
const convert12hrTo24hr = (time12h: string): string => {
    // Check if the format is already 24-hour (e.g., "20:21")
    if (time12h.includes(':') && !time12h.includes('M')) {
        return time12h;
    }
    
    // Attempt to handle 12-hour format
    const parts = time12h.split(' ');
    const time = parts[0];
    const period = parts.length > 1 ? parts[1].toUpperCase() : '';

    if (!time) return "00:00"; 

    const [hoursStr, minutes] = time.split(':');
    let h = parseInt(hoursStr, 10);
    
    if (period === 'PM' && h !== 12) {
        h += 12;
    } else if (period === 'AM' && h === 12) {
        h = 0; // Midnight (12:xx AM)
    }

    // Ensure minutes are present and padded
    const paddedMinutes = (minutes || '00').padStart(2, '0');
    return `${String(h).padStart(2, '0')}:${paddedMinutes}`;
};


// --- SUB-COMPONENTS ---

interface StatusDropdownProps {
  appointmentId: string;
  currentStatus: Appointment["status"];
  onStatusChangeSuccess: () => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  appointmentId,
  currentStatus,
  onStatusChangeSuccess,
}) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value as Appointment["status"];
    setSelectedStatus(newStatus);
    setIsUpdating(true);

    try {
      const success = await reservationApiService.updateAppointmentStatus(
        appointmentId,
        newStatus
      );
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
        });
        onStatusChangeSuccess();
      } else {
        throw new Error("Update failed.");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Could not update status.",
        // Use theme colors for SweetAlert
        background: COLOR_CARD_BG,
        color: COLOR_TEXT_DARK,
      });
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const { styles } = getStatusBadge(selectedStatus);

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
          <option
            key={option.value}
            value={option.value}
            className="bg-white text-gray-800"
          >
            {option.label}
          </option>
        ))}
      </select>
      {/* CORRECTED: Using style attribute for dynamic color */}
      {isUpdating && (
        <Clock
          className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-spin"
          style={{ color: COLOR_MUTED }}
        />
      )}
    </div>
  );
};


interface AppointmentDetailsModalProps {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: (updatedAppointment: Appointment) => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  onClose,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // FIXED: NewDate and NewTime are already correctly initialized as YYYY-MM-DD and HH:MM 
  // because they were converted in fetchAppointments (via sessionDate/sessionTime).
  const [newDate, setNewDate] = useState(appointment.sessionDate);
  const [newTime, setNewTime] = useState(appointment.sessionTime);

  const handleSave = async () => {
    if (isSaving) return;

    if (newDate === appointment.sessionDate && newTime === appointment.sessionTime) {
      Swal.fire({
        icon: "info",
        title: "No Changes",
        text: "Date and time are unchanged.",
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const updatedData = await reservationApiService.updateAppointmentDetails(
        appointment.id,
        newDate,
        newTime
      );

      if (updatedData) {
        Swal.fire({
          icon: "success",
          title: "Rescheduled!",
          text: `Appointment moved to ${newDate} at ${newTime}.`,
          toast: true,
          position: "top-end",
          timer: 3000,
          showConfirmButton: false,
        });
        onUpdate(updatedData); // Notify parent to refresh/update table data
        setIsEditing(false);
      } else {
        throw new Error("Update response was invalid.");
      }
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Could not save changes.",
        background: COLOR_CARD_BG,
        color: COLOR_TEXT_DARK,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Data pairs for read-only fields
  const readOnlyFields = [
    { label: "Reservation ID", value: appointment.reservationId, icon: "mdi:identifier" },
    { label: "Client Name", value: appointment.clientName || "N/A", icon: "lucide:user" },
    { label: "Email", value: appointment.email || "N/A", icon: "lucide:mail" },
    { label: "Contact No.", value: appointment.contactNumber || "N/A", icon: "lucide:phone" },
    { label: "User Type", value: appointment.isPackageUser ? "Package User" : "Single Float", icon: "lucide:package" },
    { label: "Status", value: appointment.status.toUpperCase(), icon: "lucide:clock" },
    { label: "Notes", value: appointment.specialNote || "None", icon: "mdi:note-text-outline" },
  ];

  // Utility for displaying status badge in the modal
  const { styles: statusStyles } = getStatusBadge(appointment.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={onClose}>
      <div
        className="relative max-w-3xl w-full rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100"
        style={{ backgroundColor: COLOR_CARD_BG }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
      >
        {/* Header */}
        <div
          className="sticky top-0 flex items-center justify-between p-6 border-b"
          style={{
            backgroundColor: COLOR_TEXT_DARK,
            borderColor: COLOR_MUTED + "30",
          }}
        >
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-white" />
            <h2 className="text-2xl font-bold text-white">
              Appointment Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
          
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold" style={{ color: COLOR_TEXT_DARK }}>
              Session: {appointment.reservationId}
            </h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusStyles}`}>
              {appointment.status.toUpperCase()}
            </span>
          </div>

          {/* Editable Fields: Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-lg" style={{ backgroundColor: COLOR_BG_LIGHT }}>
            {/* Date Field */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLOR_MUTED }}>
                Date
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                disabled={!isEditing || isSaving}
                className="w-full rounded-md border p-2 font-semibold transition-all disabled:opacity-80"
                style={{ borderColor: COLOR_MUTED + "40", color: COLOR_TEXT_DARK }}
              />
            </div>

            {/* Time Field */}
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: COLOR_MUTED }}>
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                disabled={!isEditing || isSaving}
                className="w-full rounded-md border p-2 font-semibold transition-all disabled:opacity-80"
                style={{ borderColor: COLOR_MUTED + "40", color: COLOR_TEXT_DARK }}
              />
            </div>
          </div>

          {/* Read-Only Details Grid */}
          <h3 className="text-lg font-bold mt-6 mb-4" style={{ color: COLOR_TEXT_DARK }}>
            Client & Details (Read-Only)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readOnlyFields.map((field) => (
              <div key={field.label} className="border-b pb-2" style={{ borderColor: COLOR_MUTED + "20" }}>
                <p className="text-xs font-medium" style={{ color: COLOR_MUTED }}>
                  {field.label}
                </p>
                <div className="flex items-center gap-2">
                  <Icon icon={field.icon} className="h-4 w-4" style={{ color: COLOR_MUTED }} />
                  <p className="text-sm font-semibold truncate" style={{ color: COLOR_TEXT_DARK }} title={field.value}>
                    {field.label === "Status" ? field.value : field.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Action Buttons */}
        <div className="sticky bottom-0 p-6 border-t flex justify-end gap-3" style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + "30" }}>
          
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all border"
                style={{ backgroundColor: COLOR_CARD_BG, color: COLOR_MUTED, borderColor: COLOR_MUTED }}
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all hover:opacity-90"
                style={{ backgroundColor: COLOR_EDIT_BLUE, color: 'white' }}
              >
                <Save className="h-5 w-5" />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all hover:opacity-90"
              style={{ backgroundColor: COLOR_EDIT_BLUE, color: 'white' }}
            >
              <Edit className="h-5 w-5" />
              Edit Date/Time
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


// --- MAIN COMPONENT ---
export default function ReservationsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedPackageDetails, setSelectedPackageDetails] =
    useState<PackageDetails | null>(null);
  const [showPackageModal, setShowPackageModal] = useState(false);

  // NEW STATE: For Appointment Details Modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Function to handle opening the appointment modal
  const handleOpenAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsDetailsModalOpen(true);
  };

  // Function to handle closing the appointment modal and clearing state
  const handleCloseAppointmentModal = () => {
    setSelectedAppointment(null);
    setIsDetailsModalOpen(false);
  };

  // Function to update the table data after a successful edit
  const handleAppointmentUpdate = (updatedAppointment: Appointment) => {
    setAppointments(prevAppointments => 
      prevAppointments.map(app => 
        app.id === updatedAppointment.id ? updatedAppointment : app
      )
    );
    // Also update the currently viewed appointment in the modal for seamless interaction
    setSelectedAppointment(updatedAppointment); 
  };


  const fetchAppointments = useCallback(
    async (page = 1) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryStart = startDate;
        const queryEnd = endDate || startDate;

        const response = await reservationApiService.getAppointments(
          page,
          20,
          queryStart || undefined,
          queryEnd || undefined
        );

        const mappedAppointments = response.data.map((app: any) => ({
          id: app._id,
          reservationId: app.reservationId,
          clientName: app.name || "N/A",
          email: app.email,
          contactNumber: app.contactNumber,
          specialNote: app.specialNote,
          sessionDate: app.date,
          // FIXED: Convert time to 24hr format for state and editable input consistency
          sessionTime: convert12hrTo24hr(app.time), 
          status: (app.status as string)?.toLowerCase() || "pending",
          isPackageUser: app.isPackageUser || false,
          packageDetails: app.packageDetails || null,
        })) as Appointment[];

        setAppointments(mappedAppointments);
        setPagination({
                  ...response.pagination,
                  recordsPerPage: response.pagination.limit, // Map 'limit' to 'recordsPerPage'
        });
        setCurrentPage(page);
      } catch (err: any) {
      console.error("Error fetching appointments:", err);
      setError(err?.message || "Failed to load appointments");
      } finally {
      setIsLoading(false);
      }
      },
      [startDate, endDate]
      );

  useEffect(() => {
  fetchAppointments(1);
  }, [startDate, endDate, fetchAppointments]);

// FIXED: Define filteredAppointments using useMemo for efficient filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const clientName = appointment.clientName || "";
      const email = appointment.email || "";
      const contactNumber = appointment.contactNumber || "";

      const matchesSearch =
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        appointment.reservationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contactNumber.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || appointment.status === statusFilter;

      return !!appointment && matchesSearch && matchesStatus;
    });
  }, [appointments, searchTerm, statusFilter]);

  const handlePreviousPage = () => {
    if (pagination?.hasPrevPage) {
      fetchAppointments(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNextPage) {
      fetchAppointments(currentPage + 1);
    }
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  const getDateFilterText = () => {
    if (!startDate) {
      return "No date filter applied";
    }
    if (!endDate || startDate === endDate) {
      return `Showing reservations for ${startDate}`;
    }
    return `Showing reservations from ${startDate} to ${endDate}`;
  };

  return (
    // Background Color
    <div className="min-h-screen" style={{ backgroundColor: COLOR_BG_LIGHT }}>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
            Reservations
          </h1>
          <p className="mt-2" style={{ color: COLOR_MUTED }}>
            Manage and view all client booking sessions
          </p>
        </div>

        {/* Date Filter Card */}
        {/* Card Style: White background, subtle muted blue border, soft shadow */}
        <div
          className="mb-6 rounded-xl border p-4 shadow-sm"
          style={{
            backgroundColor: COLOR_CARD_BG,
            borderColor: COLOR_MUTED + "30",
          }}
        >
          <h2
            className="mb-4 text-sm font-semibold"
            style={{ color: COLOR_TEXT_DARK }}
          >
            Filter by Date
          </h2>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-center gap-2">
              <CalendarIcon
                className="h-4 w-4"
                style={{ color: COLOR_TEXT_DARK }}
              />
              <span className="text-sm" style={{ color: COLOR_MUTED }}>
                From:
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border px-3 py-2 focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_TEXT_DARK,
                  // CORRECTED: Using boxShadow for the custom focus ring style
                  boxShadow: `0 0 0 2px ${COLOR_BG_LIGHT}, 0 0 0 4px ${COLOR_ACCENT}50`,
                }}
              />
            </div>

            <div className="flex items-center gap-2">
              <CalendarIcon
                className="h-4 w-4"
                style={{ color: COLOR_TEXT_DARK }}
              />
              <span className="text-sm" style={{ color: COLOR_MUTED }}>
                To:
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!startDate}
                className="rounded-md border px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2"
                style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + "40",
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
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_MUTED,
                }}
              >
                <X className="h-4 w-4" />
                Clear
              </button>
            )}
            </div>

          <p className="mt-3 text-sm" style={{ color: COLOR_MUTED }}>
            {getDateFilterText()} • Total: {pagination?.totalRecords || 0}{" "}
            reservations
          </p>
        </div>

        {/* Top Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2"
              style={{ color: COLOR_MUTED }}
            />
            <input
              type="text"
              placeholder="Search by client name, email, contact number, or Reservation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border pl-10 pr-4 py-2 placeholder:text-gray-400 focus:outline-none focus:ring-2"
              style={{
                backgroundColor: COLOR_CARD_BG,
                borderColor: COLOR_MUTED + "40",
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
                borderColor: COLOR_MUTED + "40",
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
                boxShadow: `0 4px 6px -1px ${COLOR_ACCENT}40, 0 2px 4px -2px ${COLOR_ACCENT}40`, // Soft shadow with accent color
              }}
            >
              <CalendarIcon className="h-5 w-5" />
              <span className="hidden sm:inline">View Calendar</span>
            </button>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div
            className="text-center p-10 text-xl font-medium"
            style={{ color: COLOR_TEXT_DARK }}
          >
            Loading appointments... ⏳
          </div>
        )}
        {error && !isLoading && (
          <div
            className="text-center p-10 text-xl font-medium border border-red-300 rounded-lg"
            style={{ backgroundColor: COLOR_CARD_BG, color: "#dc2626" }}
          >
            Error: {error} ❌
          </div>
        )}

        {/* Bookings Table */}
        {!isLoading && !error && (
          <div
            className="rounded-xl border overflow-x-auto shadow-md"
            style={{
              backgroundColor: COLOR_CARD_BG,
              borderColor: COLOR_MUTED + "30",
            }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: COLOR_BG_LIGHT,
                    borderColor: COLOR_MUTED + "30",
                  }}
                >
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Reservation ID{" "}
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Client Name
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Email
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Contact No.
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    User Type
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Date
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Time
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Special Note
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment, index) => {
                  // Prepare the number for the WhatsApp link
                  const whatsappNumber = formatSLNumberForWhatsApp(appointment.contactNumber);
                  // Display the number in domestic format with the country code visible
                  const displayContact = appointment.contactNumber ? `+94 ${appointment.contactNumber.substring(1)}` : "N/A";

                  return (
                    <tr
                      key={appointment.id}
                      className="border-b transition-colors"
                      style={{
                        borderColor: COLOR_MUTED + "20",
                        backgroundColor: COLOR_CARD_BG,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = COLOR_BG_LIGHT)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = COLOR_CARD_BG)
                      }
                    >
                      <td
                        className="px-6 py-4 font-medium cursor-pointer hover:underline"
                        style={{ color: COLOR_TEXT_DARK }}
                        onClick={() => handleOpenAppointmentModal(appointment)} 
                      >
                        {appointment.reservationId}
                      </td>
                      <td
                        className="px-6 py-4 font-medium"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        <button
                          type="button"
                          // Use client's email for unique identification and navigation
                          onClick={() => navigate(`/admin/clients/${appointment.email}`)}
                          className="font-medium hover:underline"
                          style={{ color: COLOR_TEXT_DARK }}
                          title={`View full dashboard for ${appointment.clientName}`}
                        >
                          {appointment.clientName || "N/A"}
                        </button>
                      </td>
                      <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>
                        {appointment.email ? (
                          <a 
                            href={`mailto:${appointment.email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            title={`Email ${appointment.email}`}
                          >
                            {appointment.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <a
                          // MODIFIED: Uses the formatted number for WhatsApp link
                          href={`https://wa.me/${whatsappNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-1 hover:opacity-80 transition-colors ${
                            appointment.contactNumber ? "" : ""
                          }`}
                          style={{
                            // Highlight in green if a number exists
                            color: appointment.contactNumber ? "#10b981" : COLOR_MUTED,
                        }}
                        >
                          <Icon icon="mdi:whatsapp" className="h-4 w-4" />
                          {/* Display the formatted number (e.g., +94 703973327) */}
                          {appointment.contactNumber ? displayContact : "N/A"}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        {appointment.isPackageUser ? (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200 w-fit">
                            <Package className="h-3 w-3" />
                            Package User
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200 w-fit">
                            <User className="h-3 w-3" />
                            Single Float
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {appointment.sessionDate
                          ? new Date(
                              appointment.sessionDate
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "N/A"}
                      </td>
                      <td
                        className="px-6 py-4"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {appointment.sessionTime || "N/A"}
                      </td>
                      <td
                        className="px-6 py-4 max-w-xs truncate"
                        title={appointment.specialNote || "N/A"}
                        style={{ color: COLOR_MUTED }}
                      >
                        <Icon icon="mdi:note-text-outline"
                        className="inline h-4 w-4 mr-1"
                        style={{ color: COLOR_MUTED }}
                      />
                        {appointment.specialNote || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusDropdown
                          appointmentId={appointment.id}
                          currentStatus={appointment.status}
                          onStatusChangeSuccess={() =>
                            fetchAppointments(currentPage)
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        {appointment.isPackageUser &&
                        appointment.packageDetails ? (
                          <button
                            onClick={() => {
                              setSelectedPackageDetails(
                                appointment.packageDetails
                              );
                              setShowPackageModal(true);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all hover:opacity-80"
                            style={{
                              backgroundColor: COLOR_ACCENT,
                              color: COLOR_TEXT_DARK,
                            }}
                          >
                            <Eye className="h-3 w-3" />
                            View Package
                          </button>
                        ) : (
                          <span
                            className="text-xs"
                            style={{ color: COLOR_MUTED }}
                          >
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && !error && pagination && (
          <div
            className="mt-6 flex flex-col gap-4 items-center justify-between rounded-xl border p-4 md:flex-row shadow-sm"
            style={{
              backgroundColor: COLOR_CARD_BG,
              borderColor: COLOR_MUTED + "30",
            }}
          >
            <div className="text-sm" style={{ color: COLOR_MUTED }}>
              Showing {(currentPage - 1) * pagination.recordsPerPage + 1} to{" "}
              {Math.min(
                currentPage * pagination.recordsPerPage,
                pagination.totalRecords
              )}{" "}
              of {pagination.totalRecords} records
            </div>

            <div className="flex gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={!pagination.hasPrevPage}
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_MUTED,
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>

              <div
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
                style={{ color: COLOR_TEXT_DARK }}
              >
                Page {currentPage} of {pagination.totalPages}
              </div>

              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNextPage}
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:bg-gray-50"
                style={{
                  backgroundColor: COLOR_BG_LIGHT,
                  borderColor: COLOR_MUTED + "40",
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
          <div
            className="text-center p-10 text-xl font-medium border rounded-lg"
            style={{
              backgroundColor: COLOR_CARD_BG,
              borderColor: COLOR_MUTED + "30",
              color: COLOR_MUTED,
            }}
          >
            No reservations found. Try adjusting your filters. 🔍
          </div>
        )}

        {/* Package Details Modal */}
        {showPackageModal && selectedPackageDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div
              className="relative max-w-2xl w-full rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ backgroundColor: COLOR_CARD_BG }}
            >
              {/* Header */}
              <div
                className="sticky top-0 flex items-center justify-between p-6 border-b"
                style={{
                  backgroundColor: COLOR_TEXT_DARK,
                  borderColor: COLOR_MUTED + "30",
                }}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-6 w-6 text-white" />
                  <h2 className="text-2xl font-bold text-white">
                    Package Details
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setSelectedPackageDetails(null);
                  }}
                  className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Package Info */}
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: COLOR_BG_LIGHT,
                    borderColor: COLOR_MUTED + "30",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-4"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Package Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Package Name
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {selectedPackageDetails.packageName}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Duration
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {selectedPackageDetails.packageId.duration}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Total Price
                      </p>
                      <p className="font-semibold text-green-600">
                        LKR{" "}
                        {selectedPackageDetails.packageId.totalPrice.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Status
                      </p>
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                        {selectedPackageDetails.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Usage */}
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: COLOR_BG_LIGHT,
                    borderColor: COLOR_MUTED + "30",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-4"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Session Usage
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: COLOR_MUTED }}
                        >
                          Total Sessions
                        </p>
                        <p
                          className="text-2xl font-bold"
                          style={{ color: COLOR_TEXT_DARK }}
                        >
                          {selectedPackageDetails.totalSessions}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: COLOR_MUTED }}
                        >
                          Used
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {selectedPackageDetails.usedCount}
                        </p>
                      </div>
                      <div className="text-center">
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: COLOR_MUTED }}
                        >
                          Remaining
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {selectedPackageDetails.remainingSessions}
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div
                        className="flex justify-between text-sm mb-2"
                        style={{ color: COLOR_MUTED }}
                      >
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (selectedPackageDetails.usedCount /
                              selectedPackageDetails.totalSessions) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${
                              (selectedPackageDetails.usedCount /
                                selectedPackageDetails.totalSessions) *
                              100
                            }%`,
                            backgroundColor:
                              selectedPackageDetails.remainingSessions > 2
                                ? "#10b981"
                                : "#ef4444",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div
                  className="rounded-lg border p-4"
                  style={{
                    backgroundColor: COLOR_BG_LIGHT,
                    borderColor: COLOR_MUTED + "30",
                  }}
                >
                  <h3
                    className="text-lg font-bold mb-4"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Important Dates
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Start Date
                      </p>
                      <p
                        className="font-semibold"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {new Date(
                          selectedPackageDetails.startDate
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p
                        className="text-sm font-medium mb-1"
                        style={{ color: COLOR_MUTED }}
                      >
                        Expiry Date
                      </p>
                      <p className="font-semibold text-orange-600">
                        {new Date(
                          selectedPackageDetails.expiryDate
                        ).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Days Remaining */}
                  <div
                    className="mt-4 p-3 rounded-lg"
                    style={{ backgroundColor: COLOR_CARD_BG }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: COLOR_MUTED }}
                    >
                      Days Remaining:
                      <span
                        className="ml-2 font-bold"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {Math.max(
                          0,
                          Math.ceil(
                            (new Date(
                              selectedPackageDetails.expiryDate
                            ).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          )
                        )}{" "}
                        days
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div
                className="sticky bottom-0 p-6 border-t"
                style={{
                  backgroundColor: COLOR_CARD_BG,
                  borderColor: COLOR_MUTED + "30",
                }}
              >
                <button
                  onClick={() => {
                    setShowPackageModal(false);
                    setSelectedPackageDetails(null);
                  }}
                  className="w-full px-4 py-3 rounded-lg font-semibold transition-all hover:opacity-90"
                  style={{
                    backgroundColor: COLOR_ACCENT,
                    color: COLOR_TEXT_DARK,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isDetailsModalOpen && selectedAppointment && (
          <AppointmentDetailsModal
            appointment={selectedAppointment}
            onClose={handleCloseAppointmentModal}
            onUpdate={handleAppointmentUpdate}
          />
        )}
      </div>
    </div>
  );
}