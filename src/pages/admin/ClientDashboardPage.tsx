// src/pages/ClientDashboardPage.tsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import {
  User,
  Mail,
  Phone,
  CalendarCheck,
  Package,
  Clock,
  X,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import apiRequest from "../../core/axios";

const COLOR_BG_LIGHT = "#F0F8FF";
const COLOR_TEXT_DARK = "#1B4965";
const COLOR_ACCENT = "#A8D8EA";
const COLOR_MUTED = "#5E7B9D";
const COLOR_CARD_BG = "#FFFFFF";


interface ClientProfile {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "client";
  createdAt: string;
  // Add other user fields (e.g., profileImage) as needed
}

interface ClientReservation {
  _id: string;
  reservationId: string;
  date: string;
  time: string;
  status: "pending" | "completed" | "cancelled";
  specialNote?: string;
}

interface ClientPackage {
  _id: string;
  packageName: string;
  totalSessions: number;
  usedCount: number;
  remainingSessions: number;
  startDate?: string;
  expiryDate?: string;
  status: string;
  isActive: boolean; // Calculated on backend
  packageId: {
    name: string;
    duration: string;
    sessions: number;
    totalPrice: number;
  };
}

interface ClientDashboardData {
  profile: ClientProfile;
  reservations: ClientReservation[];
  packages: ClientPackage[];
  activePackagesCount: number;
  totalReservations: number;
}

interface ClientDashboardApiResponse {
  success: boolean;
  data: ClientDashboardData;
  message?: string;
}
// --- API FETCH FUNCTION ---
const fetchClientData = async (email: string): Promise<ClientDashboardData> => {
  try {
    const response = await apiRequest.get<ClientDashboardApiResponse>(
      `/users/dashboard/${email}`
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Failed to load client data.");
  } catch (error) {
    console.error("Failed to fetch client dashboard:", error);
    const errorMessage = (error as any).response?.data?.message || (error as Error).message || "Unknown error occurred.";
    throw new Error(errorMessage);
  }
};

// --- CLIENT DASHBOARD COMPONENT ---
const ClientDashboardPage: React.FC = () => {
  const { email } = useParams<{ email: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ClientDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setError("Client email not provided in URL.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetchClientData(email)
      .then((clientData) => {
        setData(clientData);
      })
      .catch((err) => {
        setError(err.message || "Failed to load client dashboard.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [email]);

  if (isLoading) {
    return (
      <div className="min-h-screen p-8 text-center" style={{ backgroundColor: COLOR_BG_LIGHT }}>
        <h1 className="text-3xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
          Loading Client Dashboard...
        </h1>
        <p style={{ color: COLOR_MUTED }}>Fetching details for {email} ⏳</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen p-8 text-center" style={{ backgroundColor: COLOR_BG_LIGHT }}>
        <h1 className="text-3xl font-bold text-red-600">Error Loading Data</h1>
        <p className="text-lg" style={{ color: COLOR_MUTED }}>
          {error}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-lg font-semibold"
          style={{ backgroundColor: COLOR_ACCENT, color: COLOR_TEXT_DARK }}
        >
          <ChevronLeft className="w-5 h-5 inline mr-2" /> Back to Reservations
        </button>
      </div>
    );
  }

  const { profile, reservations, packages, activePackagesCount } = data;

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: COLOR_BG_LIGHT }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
            Client Dashboard
          </h1>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-md px-4 py-2 font-medium transition-all"
            style={{ backgroundColor: COLOR_ACCENT, color: COLOR_TEXT_DARK }}
          >
            <ChevronLeft className="w-5 h-5" /> Back to Reservations
          </button>
        </div>

        {/* Profile Card */}
        <div
          className="mb-8 rounded-xl border p-6 shadow-lg"
          style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + "30" }}
        >
          <div className="flex items-center mb-6">
            <User className="w-8 h-8 mr-4" style={{ color: COLOR_TEXT_DARK }} />
            <h2 className="text-2xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
              {profile.name}
            </h2>
            <span
              className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full ${
                profile.role === "admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}
            >
              {profile.role.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" style={{ color: COLOR_MUTED }}>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> <span>{profile.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4" /> <span>Joined: {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" /> <span>Total Bookings: {reservations.length}</span>
            </div>
          </div>
        </div>

        {/* Packages & Reservations Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Packages Column */}
          <div className="lg:col-span-1 space-y-6">
            <h3 className="text-xl font-bold mb-4" style={{ color: COLOR_TEXT_DARK }}>
              Active Packages ({activePackagesCount})
            </h3>
            {packages.filter(p => p.isActive).length > 0 ? (
              packages
                .filter(p => p.isActive)
                .map((pkg) => (
                  <PackageCard key={pkg._id} pkg={pkg} />
                ))
            ) : (
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: COLOR_CARD_BG, color: COLOR_MUTED }}>
                No active packages found.
              </div>
            )}
            
            <h3 className="text-xl font-bold pt-4" style={{ color: COLOR_TEXT_DARK }}>
              All Packages ({packages.length})
            </h3>
             <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: COLOR_CARD_BG, color: COLOR_MUTED }}>
                {packages.map(pkg => (
                    <div key={pkg._id} className="border-b border-gray-100 pb-2 text-sm">
                        <span className="font-semibold" style={{ color: COLOR_TEXT_DARK }}>{pkg.packageName}</span>
                        <p className="text-xs">Sessions: {pkg.remainingSessions} / {pkg.totalSessions}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {pkg.isActive ? 'ACTIVE' : pkg.status.toUpperCase()}
                        </span>
                    </div>
                ))}
             </div>
          </div>

          {/* Reservations Column */}
          <div className="lg:col-span-2">
            <h3 className="text-xl font-bold mb-4" style={{ color: COLOR_TEXT_DARK }}>
              All Reservations ({reservations.length})
            </h3>
            <div className="space-y-4">
              {reservations.map((res) => (
                <ReservationCard key={res._id} res={res} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS FOR DISPLAY ---

const PackageCard: React.FC<{ pkg: ClientPackage }> = ({ pkg }) => {
    const usagePercent = ((pkg.totalSessions - pkg.remainingSessions) / pkg.totalSessions) * 100;
    const isLow = pkg.remainingSessions <= 2 && pkg.remainingSessions > 0;

    return (
        <div
            className="rounded-xl p-5 shadow-md border-2"
            style={{
                backgroundColor: COLOR_CARD_BG,
                borderColor: pkg.isActive ? COLOR_ACCENT : COLOR_MUTED + '30',
            }}
        >
            <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-bold" style={{ color: COLOR_TEXT_DARK }}>
                    <Package className="w-5 h-5 inline mr-2" style={{ color: COLOR_TEXT_DARK }} />
                    {pkg.packageName}
                </h4>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {pkg.isActive ? 'ACTIVE' : pkg.status.toUpperCase()}
                </span>
            </div>

            {/* Session Summary */}
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold" style={{ color: COLOR_MUTED }}>SESSIONS REMAINING</span>
                    <span className="font-bold" style={{ color: isLow ? '#EF4444' : COLOR_TEXT_DARK }}>
                        {pkg.remainingSessions} / {pkg.totalSessions}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all"
                        style={{
                            width: `${usagePercent}%`,
                            backgroundColor: isLow ? '#EF4444' : '#10B981', // Red or Green
                        }}
                    />
                </div>
            </div>

            {/* Dates */}
            <div className="text-xs space-y-1" style={{ color: COLOR_MUTED }}>
                <p>Start Date: {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString() : 'N/A'}</p>
                <p>Expiry Date: {pkg.expiryDate ? new Date(pkg.expiryDate).toLocaleDateString() : 'N/A'}</p>
                <p>Price: LKR {pkg.packageId.totalPrice.toLocaleString()}</p>
            </div>
        </div>
    );
};

const ReservationCard: React.FC<{ res: ClientReservation }> = ({ res }) => {
    const statusStyles: Record<string, string> = {
        pending: `bg-yellow-100 text-yellow-700 border-yellow-200`,
        completed: `bg-teal-100 text-teal-700 border-teal-200`,
        cancelled: `bg-red-100 text-red-700 border-red-200`,
    };

    const statusStyle = statusStyles[res.status] || statusStyles.pending;

    return (
        <div
            className="rounded-xl p-4 shadow-sm border"
            style={{ backgroundColor: COLOR_CARD_BG, borderColor: COLOR_MUTED + '30' }}
        >
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <p className="text-xl font-bold" style={{ color: COLOR_TEXT_DARK }}>
                            {new Date(res.date).getDate()}
                        </p>
                        <p className="text-xs" style={{ color: COLOR_MUTED }}>
                            {new Date(res.date).toLocaleString('en-US', { month: 'short' })}
                        </p>
                    </div>
                    <div>
                        <p className="font-semibold" style={{ color: COLOR_TEXT_DARK }}>
                            {res.reservationId}
                        </p>
                        <p className="text-sm" style={{ color: COLOR_MUTED }}>
                            <Clock className="w-3 h-3 inline mr-1" /> {res.time}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${statusStyle}`}>
                    {res.status.toUpperCase()}
                </span>
            </div>
            {res.specialNote && (
                <p className="text-xs mt-3 p-2 rounded" style={{ backgroundColor: COLOR_BG_LIGHT, color: COLOR_MUTED }}>
                    **Note:** {res.specialNote}
                </p>
            )}
        </div>
    );
};

export default ClientDashboardPage;