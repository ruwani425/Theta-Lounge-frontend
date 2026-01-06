"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Package,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Swal from "sweetalert2";
import apiRequest from "../../core/axios";
import Avatar from "../../components/Avatar";

// --- THEME COLORS ---
const COLORS = {
  primary: "#1B4965",
  accent: "#2DA0CC",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  gray: "#6B7280",
  lightGray: "#F3F4F6",
  white: "#FFFFFF",
};

// --- INTERFACES ---
interface PackageActivation {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  fullName: string;
  email: string;
  phone: string;
  address: string;
  message?: string;
  // NOTE: packageId is defined as an object in the interface,
  // but the runtime error suggests it can be null/undefined.
  // We will treat it as potentially nullable in the runtime logic.
  packageId: {
    _id: string;
    name: string;
    duration: string;
    sessions: number;
    totalPrice: number;
  } | null; // Added | null for safety
  packageName: string;
  totalSessions: number;
  usedCount: number;
  remainingSessions: number;
  preferredDate: string;
  status: "Pending" | "Contacted" | "Confirmed" | "Rejected";
  startDate?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// --- API SERVICE ---
const activationApiService = {
  fetchActivations: async (
    page: number = 1,
    limit: number = 20,
    status?: string
  ): Promise<{ data: PackageActivation[]; pagination: PaginationInfo }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    if (status && status !== "All") {
      params.append("status", status);
    }

    const response: any = await apiRequest.get(
      `/package-activations?${params.toString()}`
    );
    console.log("📦 [fetchActivations] Response:", response);
    return {
      data: response.data || [],
      pagination: response.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    };
  },

// 🛑 MODIFIED: updateStatus now accepts an optional startDate
  updateStatus: async (
    id: string,
    status: string,
    startDate?: string // New optional parameter
  ): Promise<{ success: boolean; data: PackageActivation }> => {
    const payload: { status: string; startDate?: string } = { status };
    if (startDate) { // Send startDate if provided, regardless of whether it's the first time confirming.
        payload.startDate = startDate;
    }

    const response: any = await apiRequest.patch(
        `/package-activations/${id}/status`,
        payload,
        {}
    );
    return response;
},
};

// --- STATUS BADGE COMPONENT ---
const StatusBadge: React.FC<{ status: PackageActivation["status"] }> = ({
  status,
}) => {
  const getStatusStyle = () => {
    switch (status) {
      case "Confirmed":
        return {
          bg: "bg-green-100",
          text: "text-green-700",
          icon: CheckCircle,
        };
      case "Contacted":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          icon: AlertCircle,
        };
      case "Rejected":
        return { bg: "bg-red-100", text: "text-red-700", icon: XCircle };
      case "Pending":
      default:
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-700",
          icon: Clock,
        };
    }
  };

  const { bg, text, icon: Icon } = getStatusStyle();

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${bg} ${text}`}
    >
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
};

// --- MAIN COMPONENT ---
const PackageActivationManage: React.FC = () => {
  const [activations, setActivations] = useState<PackageActivation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActivation, setSelectedActivation] =
    useState<PackageActivation | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Fetch activations
  const fetchActivations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await activationApiService.fetchActivations(
        currentPage,
        itemsPerPage,
        filterStatus
      );
      setActivations(response.data);
      setPagination(response.pagination);
      console.log("✅ [fetchActivations] Loaded:", response.data.length);
    } catch (error: any) {
      console.error("❌ [fetchActivations] Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load package activations.",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterStatus, itemsPerPage]);

  useEffect(() => {
    fetchActivations();
  }, [fetchActivations]);

  // Handle status change
  const handleStatusChange = async (
    activation: PackageActivation,
    newStatus: string
  ) => {
    // 🆕 NEW: Capture the current time if the status change is to 'Confirmed'
    // If it's already confirmed, we capture the time to allow recalculation if the status is changed back to Confirmed.
    const confirmDate = newStatus === 'Confirmed' ? new Date().toISOString() : undefined;
    const confirmationTime = confirmDate ? new Date(confirmDate).toLocaleTimeString() : '';

    const result = await Swal.fire({
      title: "Confirm Status Change",
      html: `
        <p>Change status for <strong>${activation.fullName}</strong>'s package request?</p>
        <p class="text-sm text-gray-600 mt-2">Package: ${activation.packageName}</p>
        <p class="text-sm mt-1">From: <strong>${activation.status}</strong> → To: <strong>${newStatus}</strong></p>
        ${
          newStatus === "Confirmed"
            ? `<p class="text-sm text-green-600 mt-3">✓ This will activate/re-activate the package and set the start/expiry dates at the current time: <strong>${confirmationTime}</strong>.</p>` // 🛑 MODIFIED: Updated confirmation text
            : ""
        }
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: COLORS.accent,
      cancelButtonColor: COLORS.gray,
      confirmButtonText: "Yes, update it!",
    });

    if (result.isConfirmed) {
      try {
        setLoading(true);
        // 🛑 MODIFIED: Pass the confirmDate to the updateStatus function
        await activationApiService.updateStatus(activation._id, newStatus, confirmDate);

        Swal.fire({
          icon: "success",
          title: "Status Updated!",
          text: `Package activation status changed to ${newStatus}.`,
          timer: 2000,
          showConfirmButton: false,
        });

        fetchActivations();
        setSelectedActivation(null);
      } catch (error: any) {
        console.error("❌ [handleStatusChange] Error:", error);
        Swal.fire({
          icon: "error",
          title: "Update Failed",
          text: error.response?.data?.message || "Failed to update status.",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Format date helper
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Status counts
  const statusCounts = {
    All: activations.length,
    Pending: activations.filter((a) => a.status === "Pending").length,
    Contacted: activations.filter((a) => a.status === "Contacted").length,
    Confirmed: activations.filter((a) => a.status === "Confirmed").length,
    Rejected: activations.filter((a) => a.status === "Rejected").length,
  };

  return (
    <div
      className="min-h-screen p-8"
      style={{ backgroundColor: COLORS.lightGray }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-3xl font-bold mb-1"
            style={{ color: COLORS.primary }}
          >
            Package Activations
          </h1>
          <p className="text-sm text-gray-600">
            Manage customer package activation requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(["All", "Pending", "Contacted", "Confirmed", "Rejected"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterStatus === status
                    ? "text-white shadow-md"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
                style={{
                  backgroundColor:
                    filterStatus === status ? COLORS.accent : undefined,
                }}
              >
                {status}
                <span className="ml-1.5 text-[10px]">
                  ({statusCounts[status] || 0})
                </span>
              </button>
            )
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {statusCounts.Pending}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Contacted</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statusCounts.Contacted}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-green-600">
                  {statusCounts.Confirmed}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-xs font-medium">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {statusCounts.Rejected}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 opacity-50" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activations Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold" style={{ color: COLORS.primary }}>
                    Activation Requests
                  </h2>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {pagination.total} total requests
                  </p>
                </div>
                <button
                  onClick={fetchActivations}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    style={{ color: COLORS.accent }}
                  />
                </button>
              </div>

              {loading ? (
                <div className="p-16 text-center">
                  <RefreshCw
                    className="w-10 h-10 animate-spin mx-auto mb-3"
                    style={{ color: COLORS.accent }}
                  />
                  <p className="text-sm text-gray-600">Loading activations...</p>
                </div>
              ) : activations.length === 0 ? (
                <div className="p-16 text-center">
                  <Package
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: COLORS.gray, opacity: 0.3 }}
                  />
                  <p className="text-sm text-gray-600">No activations found</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {filterStatus !== "All"
                      ? `Try changing the filter or selecting "All"`
                      : "Package activation requests will appear here"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Table */}
                  <div className="overflow-hidden">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[25%]">
                            Customer
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[18%]">
                            Package
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[15%]">
                            Sessions
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[12%]">
                            Status
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[12%]">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-[10px] font-semibold text-gray-600 uppercase tracking-wide w-[18%]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {activations.map((activation) => (
                          <tr
                            key={activation._id}
                            className={`hover:bg-gray-50 transition-colors cursor-pointer ${
                              selectedActivation?._id === activation._id
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={() => setSelectedActivation(activation)}
                          >
                            {/* Customer */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <Avatar
                                  src={activation.userId?.profilePicture}
                                  name={activation.fullName}
                                  size="sm"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 text-xs truncate">
                                    {activation.fullName}
                                  </p>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {activation.email}
                                  </p>
                              </div>
                              </div>
                            </td>

                            {/* Package */}
                            <td className="px-3 py-2">
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 text-xs truncate">
                                  {activation.packageName}
                                </p>
                                <p className="text-[10px] text-gray-500 truncate">
                                  {/* FIX 1: Safely access packageId.duration */}
                                  {activation.packageId?.duration || "N/A"} 
                                </p>
                              </div>
                            </td>

                            {/* Sessions */}
                            <td className="px-3 py-2">
                              {activation.status === "Confirmed" ? (
                                <div className="min-w-0">
                                  <p className="font-semibold text-green-600 text-xs truncate">
                                    {activation.remainingSessions} left
                                  </p>
                                  <p className="text-[10px] text-gray-500 truncate">
                                    {activation.usedCount}/{activation.totalSessions}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-xs text-gray-500">
                                  {activation.totalSessions}
                                </p>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-3 py-2">
                              <StatusBadge status={activation.status} />
                            </td>

                            {/* Date */}
                            <td className="px-3 py-2">
                              <div className="min-w-0">
                                <p className="text-xs text-gray-900 truncate">
                                  {formatDate(activation.createdAt)}
                                </p>
                                {activation.status === "Confirmed" &&
                                  activation.expiryDate && (
                                    <p className="text-[10px] text-orange-600 truncate">
                                      Exp: {formatDate(activation.expiryDate)}
                                    </p>
                                  )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1 flex-wrap">
                                {activation.status === "Pending" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStatusChange(activation, "Confirmed");
                                    }}
                                    className="px-2 py-1 rounded text-[10px] font-semibold text-white hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: COLORS.success }}
                                    title="Confirm activation"
                                  >
                                    Confirm
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedActivation(activation);
                                  }}
                                  className="text-[10px] font-semibold hover:underline"
                                  style={{ color: COLORS.accent }}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Enhanced Pagination */}
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      {/* Left side: Items per page and info */}
                      <div className="flex items-center gap-3">
                        {/* Items per page selector */}
                        <div className="flex items-center gap-2">
                          <label
                            htmlFor="itemsPerPage"
                            className="text-xs text-gray-600"
                          >
                            Show:
                          </label>
                          <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1); // Reset to first page
                            }}
                            className="px-2 py-1 border rounded-lg bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            style={{ borderColor: COLORS.gray }}
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </select>
                        </div>

                        {/* Pagination Info */}
                        <div className="text-xs text-gray-600">
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {(currentPage - 1) * itemsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold text-gray-900">
                            {Math.min(currentPage * itemsPerPage, pagination.total)}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {pagination.total}
                          </span>
                        </div>
                      </div>

                      {/* Pagination Controls */}
                      <div className="flex items-center gap-1">
                        {/* First Page */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                          title="First page"
                        >
                          <span className="text-xs font-semibold">First</span>
                        </button>

                        {/* Previous */}
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-1 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                          title="Previous page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1">
                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                            .filter((page) => {
                              // Show first page, last page, current page, and pages around current
                              return (
                                page === 1 ||
                                page === pagination.totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {/* Add ellipsis if there's a gap */}
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <span className="px-1 text-xs text-gray-500">...</span>
                                )}
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                    currentPage === page
                                      ? "text-white"
                                      : "bg-white hover:bg-gray-100"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      currentPage === page ? COLORS.accent : undefined,
                                    borderColor:
                                      currentPage === page ? COLORS.accent : undefined,
                                  }}
                                >
                                  {page}
                                </button>
                              </React.Fragment>
                            ))}
                        </div>

                        {/* Next */}
                        <button
                          onClick={() =>
                            setCurrentPage((p) =>
                              Math.min(pagination.totalPages, p + 1)
                            )
                          }
                          disabled={currentPage === pagination.totalPages}
                          className="p-1 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                          title="Next page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        {/* Last Page */}
                        <button
                          onClick={() => setCurrentPage(pagination.totalPages)}
                          disabled={currentPage === pagination.totalPages}
                          className="px-2 py-1 rounded-lg border bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                          title="Last page"
                        >
                          <span className="text-xs font-semibold">Last</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden sticky top-8">
              {selectedActivation ? (
                <>
                  <div
                    className="p-6 text-white"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <h2 className="text-xl font-bold mb-2">Request Details</h2>
                    <p className="text-sm opacity-90">
                      ID: {selectedActivation._id.slice(-8)}
                    </p>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Customer Info */}
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">
                        Customer Information
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-semibold">
                              {selectedActivation.fullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {selectedActivation.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {selectedActivation.phone}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-600">
                              {selectedActivation.address}
                            </p>
                          </div>
                        </div>
                        {selectedActivation.message && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Message:
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedActivation.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Package Info */}
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">
                        Package Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Name:</span>
                          <span className="font-semibold">
                            {selectedActivation.packageName}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Duration:</span>
                          <span className="font-semibold">
                            {/* FIX 2: Safely access packageId.duration in details panel */}
                            {selectedActivation.packageId?.duration || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Sessions:</span>
                          <span className="font-semibold">
                            {selectedActivation.totalSessions}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Price:</span>
                          <span className="font-bold text-green-600">
                            {/* FIX 3: Safely access packageId.totalPrice */}
                            {formatCurrency(selectedActivation.packageId?.totalPrice || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Session Tracking (if confirmed) */}
                    {selectedActivation.status === "Confirmed" && (
                      <div>
                        <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">
                          Session Usage
                        </h3>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Used:</span>
                            <span className="font-semibold text-red-600">
                              {selectedActivation.usedCount}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Remaining:
                            </span>
                            <span className="font-semibold text-green-600">
                              {selectedActivation.remainingSessions}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{
                                width: `${
                                  ((selectedActivation.totalSessions -
                                    selectedActivation.remainingSessions) /
                                    selectedActivation.totalSessions) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <div className="flex justify-between items-center pt-2">
                            <span className="text-sm text-gray-600">
                              Start Date:
                            </span>
                            <span className="text-sm font-semibold">
                              {/* FIX 4: Safely pass startDate to formatDate */}
                              {formatDate(selectedActivation.startDate)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Expiry Date:
                            </span>
                            <span className="text-sm font-semibold text-orange-600">
                              {/* FIX 5: Safely pass expiryDate to formatDate */}
                              {formatDate(selectedActivation.expiryDate)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Change Actions */}
                    <div>
                      <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">
                        Change Status
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          ["Pending", "Contacted", "Confirmed", "Rejected"] as const
                        ).map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleStatusChange(selectedActivation, status)
                            }
                            disabled={selectedActivation.status === status}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                              selectedActivation.status === status
                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                : "hover:shadow-md text-white"
                            }`}
                            style={{
                              backgroundColor:
                                selectedActivation.status === status
                                  ? undefined
                                  : status === "Confirmed"
                                  ? COLORS.success
                                  : status === "Contacted"
                                  ? COLORS.accent
                                  : status === "Rejected"
                                  ? COLORS.danger
                                  : COLORS.warning,
                            }}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                      {selectedActivation.status === 'Confirmed' && (
                        <div className="mt-4 text-xs text-gray-600 p-2 bg-yellow-50 rounded">
                            To update **Start/Expiry Dates** of a confirmed package, select the **Confirmed** button again. This will recalculate the expiry date from the current moment.
                        </div>
                    )}
                    </div>

                    {/* Timestamps */}
                    <div className="text-xs text-gray-500 space-y-1 pt-4 border-t">
                      <p>
                        Created: {formatDate(selectedActivation.createdAt)}
                      </p>
                      <p>
                        Updated: {formatDate(selectedActivation.updatedAt)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-16 text-center">
                  <Package
                    className="w-12 h-12 mx-auto mb-3"
                    style={{ color: COLORS.gray, opacity: 0.3 }}
                  />
                  <p className="text-sm text-gray-600">
                    Select an activation to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
        <div className="mt-8 text-center text-xs text-gray-500">
            Current Server Time (for reference): {new Date().toLocaleString()}
        </div>
    </div>
  );
};

export default PackageActivationManage;