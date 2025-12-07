"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Plus, X, Edit, Clock } from "lucide-react"; 
import Swal from "sweetalert2";
import apiRequest from "../../core/axios";

// --- THEME COLORS (Reusing the Light, Low-Contrast Theme) ---
const COLOR_BG_LIGHT = "#F0F8FF";
const COLOR_TEXT_DARK = "#1B4965";
const COLOR_ACCENT = "#A8D8EA";
const COLOR_MUTED = "#5E7B9D";
const COLOR_CARD_BG = "#FFFFFF";

// --- DATA STRUCTURES ---

interface PackageConfig {
  _id?: string;
  name: string;
  duration: "1-Month" | "6-Month" | "12-Month" | string;
  sessions: number;
  totalPrice: number;
  discount: number;
  isGenesisEligible: boolean;
  isActive: boolean;
}

// System Settings Interface (to match your backend schema)
interface SystemSettings {
  defaultFloatPrice: number;
  cleaningBuffer: number;
  sessionDuration: number | string;
  sessionsPerDay: number;
  openTime: string;
  closeTime: string;
  numberOfTanks: number;
  tankStaggerInterval: number;
  actualCloseTime?: string;
}

// Genesis Collective Configuration (Now only using static non-price data)
const GENESIS_CONFIG = {
  maxMembers: 100,
  minSessions: 48,
  lifetimeDiscount: 50,
  renewalWindowDays: 30,
  activeMembers: 78,
};

// Pagination interface
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// --- API Service Layer ---
const packageApiService = {
  fetchPackages: async (page: number = 1, limit: number = 10): Promise<{ data: PackageConfig[], pagination: PaginationInfo }> => {
    // Fetching packages with pagination
    const response: { data: PackageConfig[], pagination: PaginationInfo } = await apiRequest.get(
      `/packages/all?page=${page}&limit=${limit}`
    );
    return response;
  },
  createPackage: async (
    pkg: Partial<PackageConfig>
  ): Promise<{ data: PackageConfig }> => {
    // Note: pricePerSlot is handled on the backend based on defaultFloatPrice,
    // so we only send the fields that are directly editable/storable.
    const response = await apiRequest.post("/packages", pkg);
    return response as { data: PackageConfig };
  },
  updatePackage: async (
    id: string,
    pkg: Partial<PackageConfig>
  ): Promise<{ data: PackageConfig }> => {
    const response = await apiRequest.put(`/packages/${id}`, pkg);
    return response as { data: PackageConfig };
  },
};

// NEW API Service for System Settings
const settingsApiService = {
    getSystemSettings: async (): Promise<SystemSettings> => {
        // Uses the endpoint you provided: /api/system-settings (GET)
        const response = await apiRequest.get("/system-settings");
        return response as SystemSettings;
    }
}

// --- UTILITY FUNCTIONS ---

/**
 * Calculates the average discounted price per float using the dynamic base price.
 * @param totalPrice The final discounted price of the package.
 * @param sessions The total number of sessions.
 * @returns The formatted discounted price per float, or "N/A".
 */
const calculateDiscountedPerFloat = (totalPrice: number, sessions: number): string => {
  if (sessions === 0 || totalPrice === 0) return "N/A";
  return (totalPrice / sessions)
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const getEligibilityStatus = (
  sessions: number,
  isEligible: boolean
): string => {
  if (sessions >= GENESIS_CONFIG.minSessions && isEligible) {
    return "Eligible";
  }
  return "Not Eligible";
};

// --- TOGGLE BUTTON COMPONENT (Unchanged) ---

interface ActiveToggleProps {
  pkgId: string;
  initialState: boolean;
  onToggleSuccess: () => void;
}

const ActiveToggle: React.FC<ActiveToggleProps> = ({
  pkgId,
  initialState,
  onToggleSuccess,
}) => {
  const [isActive, setIsActive] = useState(initialState);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async () => {
    if (!pkgId) return;

    const newStatus = !isActive;
    setIsUpdating(true);

    try {
      // Call the general update route to toggle isActive
      await packageApiService.updatePackage(pkgId, { isActive: newStatus });

      setIsActive(newStatus);
      Swal.fire({
        icon: "success",
        title: "Status Updated!",
        text: `Package set to ${newStatus ? "Active" : "Inactive"}.`,
        toast: true,
        position: "top-end",
        timer: 3000,
        showConfirmButton: false,
      });
      onToggleSuccess();
    } catch (error) {
      Swal.fire("Error", "Failed to change package status.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isUpdating}
      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        isActive ? "bg-green-500" : "bg-gray-400"
      }`}
      style={
        {
          opacity: isUpdating ? 0.6 : 1,
          // Using theme colors for focus ring
          "--tw-ring-color": isActive ? COLOR_TEXT_DARK : COLOR_MUTED,
        } as React.CSSProperties
      }
      aria-checked={isActive}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
          isActive ? "translate-x-5" : "translate-x-0"
        }`}
      />
      {isUpdating && (
        <Clock className="absolute top-1/2 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 animate-spin text-gray-700" />
      )}
    </button>
  );
};

// --- MAIN COMPONENT ---

const PackageManagementPage: React.FC = () => {
  const [packages, setPackages] = useState<PackageConfig[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PackageConfig | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // NEW STATE: To hold the default base price fetched from settings
  const [defaultBasePrice, setDefaultBasePrice] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const itemsPerPage = 10;

  // --- Data Fetching ---

  // New function to fetch settings
  const fetchSettings = useCallback(async () => {
    try {
        const settings = await settingsApiService.getSystemSettings();
        // Assuming the API returns null if no settings are found, use a fallback of 15000
        setDefaultBasePrice(settings?.defaultFloatPrice || 15000);
    } catch (err: any) {
        console.error("❌ Failed to fetch system settings:", err);
        // Set a fallback price if API fails
        setDefaultBasePrice(15000);
        setError("Could not load base price. Using default fallback.");
    }
  }, []);

  const fetchPackages = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    try {
        const response = await packageApiService.fetchPackages(page, itemsPerPage);
        setPackages(response.data);
        setPagination(response.pagination);
        setCurrentPage(page);
    } catch (err: any) {
        console.error("❌ Failed to fetch packages:", err);
        setError(err.message || "Failed to load packages from the server.");
    } finally {
        setIsLoading(false);
    }
  }, [itemsPerPage]);

  // Combined effect hook for initial loading
  useEffect(() => {
    // 1. Fetch System Settings first
    fetchSettings();
    // 2. Fetch Packages
    fetchPackages(1);
  }, [fetchSettings, fetchPackages]);

  // Show loading indicator until base price is loaded
  const isInitialLoading = isLoading || defaultBasePrice === null;
  if (defaultBasePrice === null) {
      // Return loading state while waiting for base price
      return (
          <div className="min-h-screen p-6 flex justify-center items-center" style={{ backgroundColor: COLOR_BG_LIGHT }}>
              <div className="text-center p-10 text-xl font-medium" style={{ color: COLOR_TEXT_DARK }}>
                  Loading configuration... ⚙️
              </div>
          </div>
      );
  }
  
  // --- Handlers ---
  const handleCreateOrUpdate = async (pkg: PackageConfig) => {
    setIsLoading(true);
    try {
      if (pkg._id) {
        // UPDATE: Send all updatable fields
        const { _id, ...updates } = pkg;
        const response = await packageApiService.updatePackage(_id, updates);
        Swal.fire(
          "Updated!",
          `Package ${response.data.name} updated successfully.`,
          "success"
        );
      } else {
        // CREATE
        // Only send necessary fields to backend. Backend will calculate totalPrice based on sessions, discount, and system settings base price.
        const { name, duration, sessions, discount, isActive } = pkg;
        const response = await packageApiService.createPackage({
          name,
          duration,
          sessions,
          discount,
          isActive,
        } as Partial<PackageConfig>); 
        Swal.fire(
          "Created!",
          `Package ${response.data.name} created successfully.`,
          "success"
        );
      }

      setIsModalOpen(false);
      setEditingPackage(null);
      fetchPackages(currentPage); // Reload current page after successful operation
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to save package details.";
      Swal.fire("Error", errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (pkg: PackageConfig | null = null) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: COLOR_BG_LIGHT }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-4xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
            Membership & Package Management
          </h1>
          <button
            onClick={() =>
              handleOpenModal({
                name: "",
                duration: "1-Month",
                sessions: 0,
                totalPrice: 0,
                discount: 0,
                isGenesisEligible: false,
                isActive: true,
              } as PackageConfig)
            } // Pre-fill new package with 'Active: true'
            className="flex items-center gap-2 px-4 py-2 font-medium rounded-lg shadow-md transition-all hover:opacity-90"
            style={{ backgroundColor: COLOR_TEXT_DARK, color: COLOR_CARD_BG }}
            disabled={isInitialLoading}
          >
            <Plus className="w-5 h-5" />
            Create New Package
          </button>
        </div>

        {/* Loading / Error States */}
        {isLoading && packages.length === 0 && (
          <div
            className="text-center p-10 text-xl font-medium"
            style={{ color: COLOR_TEXT_DARK }}
          >
            Loading packages... ⏳
          </div>
        )}
        {error && (
          <div
            className="text-center p-10 text-xl font-medium border border-red-500 rounded-lg"
            style={{ color: "#dc2626", backgroundColor: "#fee2e2" }}
          >
            Error: {error}
          </div>
        )}

        {/* Packages Table View */}
        {!isLoading && packages.length > 0 && (
          <div
            className="rounded-xl border shadow-lg overflow-hidden"
            style={{
              backgroundColor: COLOR_CARD_BG,
              borderColor: COLOR_MUTED + "30",
            }}
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr
                  style={{
                    backgroundColor: COLOR_BG_LIGHT,
                    borderBottom: `1px solid ${COLOR_MUTED}30`,
                  }}
                >
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Package
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Sessions
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Duration
                  </th>
                  {/* REMOVED Per Float Rate (Average, Discounted) COLUMN HEADER */}
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Total Price (LKR)
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Discount
                  </th>
                  <th
                    className="px-6 py-4 text-left font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Status
                  </th>
                  <th
                    className="px-6 py-4 text-right font-semibold"
                    style={{ color: COLOR_TEXT_DARK }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr
                    key={pkg._id}
                    className="transition-colors border-b"
                    style={{ borderColor: COLOR_MUTED + "10" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        COLOR_BG_LIGHT + "80")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = COLOR_CARD_BG)
                    }
                  >
                    <td
                      className="px-6 py-4 font-medium"
                      style={{ color: COLOR_TEXT_DARK }}
                    >
                      {pkg.name}
                    </td>
                    <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>
                      {pkg.sessions}
                    </td>
                    <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>
                      {pkg.duration}
                    </td>
                    {/* REMOVED Per Float Rate (Average, Discounted) COLUMN DATA */}
                    <td
                      className="px-6 py-4 font-semibold"
                      style={{ color: COLOR_TEXT_DARK }}
                    >
                      {pkg.totalPrice.toLocaleString("en-US")}
                    </td>
                    <td className="px-6 py-4" style={{ color: COLOR_MUTED }}>
                      {pkg.discount}%
                    </td>

                    {/* Status Toggle */}
                    <td className="px-6 py-4">
                      {pkg._id ? (
                        <ActiveToggle
                          pkgId={pkg._id}
                          initialState={pkg.isActive}
                          onToggleSuccess={() => fetchPackages(currentPage)}
                        />
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: COLOR_MUTED }}
                        >
                          N/A
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        className="text-blue-500 hover:text-blue-700 mr-3"
                        aria-label="Edit"
                      >
                        <Edit className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && pagination && pagination.totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            {/* Pagination Info */}
            <div className="text-sm" style={{ color: COLOR_MUTED }}>
              Showing{" "}
              <span
                className="font-semibold"
                style={{ color: COLOR_TEXT_DARK }}
              >
                {packages.length}
              </span>{" "}
              of{" "}
              <span
                className="font-semibold"
                style={{ color: COLOR_TEXT_DARK }}
              >
                {pagination.total}
              </span>{" "}
              packages
            </div>

            {/* Pagination Buttons */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => fetchPackages(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: pagination.hasPrevPage
                    ? COLOR_TEXT_DARK
                    : COLOR_MUTED + "40",
                  color: COLOR_CARD_BG,
                }}
              >
                Previous
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => fetchPackages(page)}
                    className={`px-3 py-2 rounded-lg font-medium transition-all ${
                      page === currentPage ? "ring-2" : ""
                    }`}
                    style={{
                      backgroundColor:
                        page === currentPage ? COLOR_TEXT_DARK : COLOR_BG_LIGHT,
                      color:
                        page === currentPage ? COLOR_CARD_BG : COLOR_TEXT_DARK,
                      borderColor: COLOR_ACCENT,
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => fetchPackages(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: pagination.hasNextPage
                    ? COLOR_TEXT_DARK
                    : COLOR_MUTED + "40",
                  color: COLOR_CARD_BG,
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && packages.length === 0 && (
          <div
            className="p-10 text-center rounded-xl border"
            style={{
              color: COLOR_MUTED,
              backgroundColor: COLOR_CARD_BG,
              borderColor: COLOR_MUTED + "30",
            }}
          >
            <p className="text-lg">No packages currently configured. 📦</p>
            <p className="text-sm mt-2">
              Click 'Create New Package' to add your first membership tier.
            </p>
          </div>
        )}

        {/* Modal for Create/Edit */}
        {isModalOpen && (
          <PackageModal
            pkg={editingPackage}
            onClose={() => setIsModalOpen(false)}
            onSave={handleCreateOrUpdate}
            isLoading={isLoading}
            defaultBasePrice={defaultBasePrice} // Pass base price to modal
          />
        )}
      </div>
    </div>
  );
};

// --- MODAL COMPONENT (Adjusted) ---

interface PackageModalProps {
  pkg: PackageConfig | null;
  onClose: () => void;
  onSave: (pkg: PackageConfig) => void;
  isLoading: boolean;
  defaultBasePrice: number; // New required prop
}

const PackageModal: React.FC<PackageModalProps> = ({
  pkg,
  onClose,
  onSave,
  isLoading,
  defaultBasePrice, // Destructure new prop
}) => {
    // Define a new interface for form data to allow string for empty states
    interface FormDataState extends Omit<PackageConfig, 'sessions' | 'discount' | 'totalPrice' | 'isGenesisEligible'> {
      sessions: number | string;
      discount: number | string;
      totalPrice: number; // Keep this as number for the calculation display
      isGenesisEligible: boolean;
    }
    
    // Default state for a new package
    const initialNewPackageState: FormDataState = {
      name: "",
      duration: "1-Month",
      sessions: "", // Default to empty string
      totalPrice: 0,
      discount: "", // Default to empty string
      isGenesisEligible: false,
      isActive: true,
    };

    const [formData, setFormData] = useState<FormDataState>(
      // If editing, use package data; otherwise, use the empty state
      pkg 
        ? { ...pkg, sessions: pkg.sessions, discount: pkg.discount } as FormDataState 
        : initialNewPackageState
    );

  const isEditing = !!pkg;

    // Safely convert sessions and discount to numbers for calculation and validation
    const sessionsNum = Number(formData.sessions) || 0;
    const discountNum = Number(formData.discount) || 0;


  // Calculate Per Float Rate (Discounted) for display in the modal
  const finalPricePerFloatDisplay = calculateDiscountedPerFloat(
    formData.totalPrice,
    sessionsNum
  );

  // Recalculate totalPrice whenever sessions or discount changes.
  useEffect(() => {
    // Ensure calculation uses numerical values
    const sessionsForCalc = Number(formData.sessions) || 0;
    const discountForCalc = Number(formData.discount) || 0;

    // USE DYNAMIC BASE PRICE: This is the equivalent of the old sessions * pricePerSlot
    const originalTotal = sessionsForCalc * defaultBasePrice;
    const discountFactor = (100 - discountForCalc) / 100;

    const calculatedTotal = originalTotal * discountFactor;

    const isEligible = sessionsForCalc >= GENESIS_CONFIG.minSessions;

    // We must update the state using the defined FormDataState structure
    setFormData((prev) => ({
      ...prev,
      totalPrice: Math.round(calculatedTotal), // Round to nearest LKR
      isGenesisEligible: isEligible,
    }));
  }, [formData.sessions, formData.discount, defaultBasePrice]); // Dependency on defaultBasePrice

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;

    if (type === "number") {
      // If the value is an empty string, set the state value to an empty string to clear the input
      newValue = value === "" ? "" : (parseInt(value) || 0);
    }

    // Ensure we only update fields present in FormDataState
    setFormData((prev) => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sessionsFinal = Number(formData.sessions);
    // Discount defaults to 0 if empty
    const discountFinal = Number(formData.discount) || 0; 
    
    if (
      !formData.name ||
      sessionsFinal <= 0 ||
      formData.totalPrice <= 0
    ) {
      Swal.fire(
        "Error",
        "Please ensure Package Name, Sessions (must be > 0), and Discount are entered correctly.",
        "error"
      );
      return;
    }
    
    // Create the final package object for submission, ensuring number types
    const packageToSave: PackageConfig = {
        ...formData,
        sessions: sessionsFinal,
        discount: discountFinal,
    } as PackageConfig;
    
    onSave(packageToSave);
  };

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div
        className="rounded-xl w-full max-w-xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: COLOR_CARD_BG, color: COLOR_TEXT_DARK }}
      >
        <div
          className="p-6 border-b flex justify-between items-center"
          style={{ borderColor: COLOR_MUTED + "30" }}
        >
          <h2 className="text-xl font-bold">
            {isEditing ? `Edit Package: ${pkg?.name}` : "Create New Package"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: COLOR_MUTED }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: COLOR_MUTED }}
              >
                Package Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                style={{
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_TEXT_DARK,
                }}
              />
            </div>
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: COLOR_MUTED }}
              >
                Duration
              </label>
              <select
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                style={{
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_TEXT_DARK,
                }}
              >
                <option value="1-Month">1-Month</option>
                <option value="6-Month">6-Month</option>
                <option value="12-Month">12-Month</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: COLOR_MUTED }}
              >
                Total Sessions
              </label>
              <input
                type="number"
                name="sessions"
                value={formData.sessions}
                onChange={handleChange}
                min="1"
                className="w-full border rounded-lg px-3 py-2"
                style={{
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_TEXT_DARK,
                }}
              />
            </div>
            
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: COLOR_MUTED }}
              >
                Discount (%)
              </label>
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full border rounded-lg px-3 py-2"
                style={{
                  borderColor: COLOR_MUTED + "40",
                  color: COLOR_TEXT_DARK,
                }}
              />
            </div>
          </div>

          {/* Calculated Field: Total Price (Read-Only) - Reflects Discount */}
          <div
            className="p-3 rounded-lg border flex justify-between items-center"
            style={{
              backgroundColor: COLOR_BG_LIGHT,
              borderColor: COLOR_ACCENT + "60",
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: COLOR_TEXT_DARK }}
            >
              Total Price (After Discount)
            </p>
            <input
              type="text"
              name="totalPrice"
              value={formData.totalPrice.toLocaleString("en-US")}
              readOnly
              className="text-lg font-bold w-1/2 text-right bg-transparent focus:outline-none"
              style={{ color: COLOR_TEXT_DARK }}
            />
          </div>

          {/* Per Float Rate (Secondary Calculated Field - Updated text) */}
          <div
            className="p-3 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center"
            style={{
              backgroundColor: COLOR_BG_LIGHT,
              borderColor: COLOR_ACCENT + "60",
            }}
          >
            <p
              className="text-sm font-semibold mb-1 md:mb-0"
              style={{ color: COLOR_TEXT_DARK }}
            >
              Per Float Rate (Average, Discounted)
            </p>
            <p className="text-lg font-bold text-right" style={{ color: COLOR_TEXT_DARK }}>
              {finalPricePerFloatDisplay} LKR
              <span
                className="text-xs font-medium block md:inline md:ml-2"
                style={{ color: COLOR_MUTED }}
              >
                (Base Rate: {defaultBasePrice.toLocaleString(
                  "en-US"
                )}{" "}
                LKR)
              </span>
            </p>
          </div>

          {/* Genesis Eligibility Indicator */}
          <div
            className={`p-3 rounded-lg border ${
              formData.isGenesisEligible
                ? "bg-teal-50 border-teal-300"
                : "bg-red-50 border-red-300"
            }`}
          >
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isGenesisEligible"
                checked={formData.isGenesisEligible}
                onChange={handleChange}
                disabled={true} // Read-only: controlled by sessions count
                className={`w-4 h-4 rounded ${
                  formData.isGenesisEligible
                    ? "text-teal-600"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              />
              <span
                className="text-sm font-semibold"
                style={{
                  color: formData.isGenesisEligible
                    ? COLOR_TEXT_DARK
                    : COLOR_MUTED,
                }}
              >
                Qualifies for Genesis Collective?
              </span>
            </label>
            <p
              className="text-xs mt-1"
              style={{ color: formData.isGenesisEligible ? "green" : "red" }}
            >
              Required sessions for eligibility: {GENESIS_CONFIG.minSessions}.
              Current: {formData.sessions}.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg font-medium transition-all hover:bg-gray-100"
              style={{ borderColor: COLOR_MUTED + "40", color: COLOR_MUTED }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-medium transition-all shadow-md flex items-center gap-2"
              style={{ backgroundColor: COLOR_TEXT_DARK, color: COLOR_CARD_BG }}
              disabled={isLoading}
            >
              {isLoading && <Clock className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Package"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PackageManagementPage;