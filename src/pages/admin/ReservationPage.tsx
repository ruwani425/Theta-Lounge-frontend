"use client";
import type React from "react";
import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import apiRequest from "../../core/axios";

const COLOR_BG_LIGHT = "#F0F8FF";
const COLOR_TEXT_DARK = "#1B4965";
const COLOR_ACCENT = "#A8D8EA";
const COLOR_MUTED = "#5E7B9D";
const COLOR_CARD_BG = "#FFFFFF";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

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
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

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

interface StatusDropdownProps {
  appointmentId: string;
  currentStatus: Appointment["status"];
  onStatusChangeSuccess: () => void;
}

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

/**
 * Utility function to format Sri Lankan numbers for WhatsApp.
 * Assumes the input number is in the domestic format (e.g., "0703973327")
 * and converts it to the international format required by WhatsApp (e.g., "94703973327").
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
    // NOTE: This assumes all numbers are local Sri Lankan numbers.
    return '94' + cleanedNumber;
};


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
          clientName: app.name || "N/A",
          email: app.email,
          contactNumber: app.contactNumber,
          specialNote: app.specialNote,
          sessionDate: app.date,
          sessionTime: app.time,
          status: (app.status as string)?.toLowerCase() || "pending",
          isPackageUser: app.isPackageUser || false,
          packageDetails: app.packageDetails || null,
        })) as Appointment[];

        setAppointments(mappedAppointments);
        setPagination(response.pagination);
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

  // Filtering Logic remains unchanged

  const filteredAppointments = appointments.filter((appointment) => {
    const clientName = appointment.clientName || "";
    const email = appointment.email || "";
    const contactNumber = appointment.contactNumber || "";

    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactNumber.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || appointment.status === statusFilter;

    return !!appointment && matchesSearch && matchesStatus;
  });

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
              placeholder="Search by client name, email, or contact number..."
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
                        className="px-6 py-4 font-medium"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {"TLB-" + index + 1}
                      </td>
                      <td
                        className="px-6 py-4 font-medium"
                        style={{ color: COLOR_TEXT_DARK }}
                      >
                        {appointment.clientName || "N/A"}
                      </td>
                      <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>
                        {appointment.email || "N/A"}
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
      </div>
    </div>
  );
}