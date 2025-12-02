"use client";

import type React from "react";
import {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  Calendar as CalendarDays,
  TrendingUp,
  X,
  Save,
  XCircle,
  Lock,
  AlertCircle,
  Sparkles,
  Settings,
} from "lucide-react";
import Swal from "sweetalert2";
import apiRequest from "../../core/axios";

// --- THEME COLORS ---
const COLORS = {
  primary: "#5B8DC4",
  primaryDark: "#2C4A6F",
  primaryLight: "#A8D0E8",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  gray50: "#F9FAFB",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray400: "#9CA3AF",
  gray600: "#4B5563",
  gray700: "#374151",
  gray800: "#1F2937",
  white: "#FFFFFF",
};

// --- UTILITY FUNCTIONS ---
const formatDate = (date: Date | string, format: string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Validate date
  if (isNaN(dateObj.getTime())) {
    console.error('Invalid date:', date);
    return '';
  }

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (format === "yyyy-MM-dd") {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  if (format === "MMMM yyyy") {
    return `${monthNames[month]} ${year}`;
  }
  if (format === "MMM dd") {
    return `${monthShort[month]} ${day}`;
  }
  if (format === "full") {
    return `${dayNames[dateObj.getDay()]}, ${monthNames[month]} ${day}, ${year}`;
  }
  return dateObj.toDateString();
};

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

const addMonths = (date: Date, months: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(date.getMonth() + months);
  return newDate;
};

// --- TYPE DEFINITIONS ---
type DayStatus = "Bookable" | "Closed" | "Sold Out";

interface SystemSettings {
  defaultFloatPrice: number;
  cleaningBuffer: number;
  sessionDuration: number;
  sessionsPerDay: number;
  openTime: string;
  closeTime: string;
  numberOfTanks: number;
  tankStaggerInterval: number;
  actualCloseTime?: string;
}

interface Tank {
  _id: string;
  name: string;
  status: "Ready" | "Maintenance";
}

interface CalendarOverride {
  _id?: string;
  tankId: string;
  date: string;
  status: DayStatus;
  openTime: string;
  closeTime: string;
  sessionsToSell: number;
  bookedSessions: number;
}

interface DayData {
  date: string;
  status: DayStatus;
  openTime: string;
  closeTime: string;
  totalSessions: number;
  bookedSessions: number;
  availableSessions: number;
  overrides: CalendarOverride[];
}

interface SessionDetail {
  tankNumber: number;
  tankName: string;
  sessions: {
    sessionNumber: number;
    startTime: string;
    endTime: string;
    cleaningStart: string;
    cleaningEnd: string;
  }[];
}

// --- API SERVICE ---
const apiService = {
  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiRequest.get<SystemSettings>("/system-settings");
      return response;
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Settings",
        text: "Could not fetch system settings.",
        toast: true,
        position: "top-end",
        timer: 3000,
      });
      throw error;
    }
  },
  getAllTanks: async (): Promise<Tank[]> => {
    try {
      const response = await apiRequest.get<Tank[]>("/tanks");
      return response || [];
    } catch (error) {
      return [];
    }
  },
  getCalendarOverrides: async (startDate: string, endDate: string): Promise<CalendarOverride[]> => {
    try {
      const response = await apiRequest.get<{ success: boolean; data: CalendarOverride[] }>("/calendar", {
        params: { startDate, endDate }
      });
      return response.success ? response.data : [];
    } catch (error) {
      return [];
    }
  },
  updateDayStatus: async (
    date: string,
    status: DayStatus,
    openTime: string,
    closeTime: string,
    sessionsToSell: number
  ): Promise<boolean> => {
    try {
      const response = await apiRequest.post<{ success: boolean }>("/calendar", {
        date,
        status,
        openTime,
        closeTime,
        sessionsToSell,
      });
      return response.success;
    } catch (error) {
      throw error;
    }
  },
};

// --- SESSION CALCULATION WITH VALIDATION ---
const calculateStaggeredSessions = (
  openTime: string,
  closeTime: string,
  duration: number,
  buffer: number,
  numberOfTanks: number,
  staggerInterval: number
): { sessionsPerTank: number; actualCloseTime: string } => {
  // Validate inputs
  if (!openTime || !closeTime || !duration || !buffer || numberOfTanks <= 0) {
    return { sessionsPerTank: 0, actualCloseTime: closeTime || "00:00" };
  }

  const timeToMinutes = (time: string): number => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return 0;
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  };

  const minutesToTime = (minutes: number): string => {
    if (isNaN(minutes)) return "00:00";
    const hrs = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const openMinutes = timeToMinutes(openTime);
  let closeMinutes = timeToMinutes(closeTime);
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60;

  const sessionLength = Number(duration) + Number(buffer);
  if (sessionLength <= 0 || isNaN(sessionLength)) {
    return { sessionsPerTank: 0, actualCloseTime: closeTime };
  }

  let maxSessionsPerTank = 0;
  let latestEndTime = openMinutes;

  for (let tankIndex = 0; tankIndex < numberOfTanks; tankIndex++) {
    const tankStartMinutes = openMinutes + (tankIndex * Number(staggerInterval || 0));
    const availableTime = closeMinutes - tankStartMinutes;
    const tankSessions = Math.floor(availableTime / sessionLength);
    
    if (tankSessions > 0) {
      const tankEndTime = tankStartMinutes + (tankSessions * sessionLength);
      latestEndTime = Math.max(latestEndTime, tankEndTime);
      maxSessionsPerTank = Math.max(maxSessionsPerTank, tankSessions);
    }
  }

  return {
    sessionsPerTank: maxSessionsPerTank || 0,
    actualCloseTime: minutesToTime(latestEndTime)
  };
};

const generateSessionDetails = (
  settings: SystemSettings,
  tanks: Tank[]
): SessionDetail[] => {
  const readyTanks = tanks.filter(t => t.status === "Ready");
  const sessionDetails: SessionDetail[] = [];

  const timeToMinutes = (time: string): number => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return 0;
      return hours * 60 + minutes;
    } catch {
      return 0;
    }
  };

  const minutesToTime = (minutes: number): string => {
    if (isNaN(minutes)) return "00:00";
    const hrs = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  const openMinutes = timeToMinutes(settings.openTime);
  const sessionDuration = Number(settings.sessionDuration) || 0;
  const cleaningBuffer = Number(settings.cleaningBuffer) || 0;
  const staggerInterval = Number(settings.tankStaggerInterval) || 0;
  const sessionLength = sessionDuration + cleaningBuffer;

  if (sessionLength <= 0) return [];

  const result = calculateStaggeredSessions(
    settings.openTime,
    settings.closeTime,
    sessionDuration,
    cleaningBuffer,
    readyTanks.length,
    staggerInterval
  );

  readyTanks.forEach((tank, tankIndex) => {
    const tankStartMinutes = openMinutes + (tankIndex * staggerInterval);
    const sessions = [];

    for (let i = 0; i < result.sessionsPerTank; i++) {
      const sessionStartMinutes = tankStartMinutes + (i * sessionLength);
      const sessionEndMinutes = sessionStartMinutes + sessionDuration;
      const cleaningEndMinutes = sessionEndMinutes + cleaningBuffer;

      sessions.push({
        sessionNumber: i + 1,
        startTime: minutesToTime(sessionStartMinutes),
        endTime: minutesToTime(sessionEndMinutes),
        cleaningStart: minutesToTime(sessionEndMinutes),
        cleaningEnd: minutesToTime(cleaningEndMinutes),
      });
    }

    sessionDetails.push({
      tankNumber: tankIndex + 1,
      tankName: tank.name,
      sessions,
    });
  });

  return sessionDetails;
};

// --- DAY CONFIGURATION MODAL ---
interface DayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayData: DayData | null;
  settings: SystemSettings;
  readyTankCount: number;
  onSave: () => void;
}

const DayConfigModal: React.FC<DayConfigModalProps> = ({
  isOpen,
  onClose,
  dayData,
  settings,
  readyTankCount,
  onSave,
}) => {
  const [status, setStatus] = useState<DayStatus>("Bookable");
  const [openTime, setOpenTime] = useState("");
  const [closeTime, setCloseTime] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (dayData) {
      setStatus(dayData.status);
      setOpenTime(dayData.openTime || settings.openTime);
      setCloseTime(dayData.closeTime || settings.closeTime);
    }
  }, [dayData, settings]);

  const calculatedSessions = useMemo(() => {
    if (status !== "Bookable" || !openTime || !closeTime) return 0;
    
    const result = calculateStaggeredSessions(
      openTime,
      closeTime,
      settings.sessionDuration,
      settings.cleaningBuffer,
      readyTankCount,
      settings.tankStaggerInterval
    );
    
    const total = result.sessionsPerTank * readyTankCount;
    return isNaN(total) ? 0 : total;
  }, [openTime, closeTime, status, settings, readyTankCount]);

  const handleSave = async () => {
    if (!dayData) return;

    if (status === "Bookable" && (!openTime || !closeTime)) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please set operating hours for bookable days.",
      });
      return;
    }

    setIsSaving(true);
    try {
      const sessionsToSell = status === "Bookable" ? calculatedSessions : 0;
      const success = await apiService.updateDayStatus(
        dayData.date,
        status,
        openTime || settings.openTime,
        closeTime || settings.closeTime,
        sessionsToSell
      );

      if (success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Day settings updated successfully!",
          toast: true,
          position: "top-end",
          timer: 2000,
          showConfirmButton: false,
        });
        onSave();
        onClose();
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update day settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !dayData) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full md:w-96 shadow-2xl z-50 overflow-y-auto" style={{ backgroundColor: COLORS.white }}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b" style={{ borderColor: COLORS.gray200 }}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${COLORS.primary}15` }}>
                <CalendarDays className="w-5 h-5" style={{ color: COLORS.primary }} />
              </div>
              <h2 className="text-xl font-bold" style={{ color: COLORS.gray800 }}>
                Configure Day
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: COLORS.gray600 }} />
            </button>
          </div>

          {/* Date Display */}
          <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.gray50 }}>
            <p className="text-xs font-semibold mb-1" style={{ color: COLORS.gray600 }}>SELECTED DATE</p>
            <p className="text-lg font-bold" style={{ color: COLORS.gray800 }}>
              {dayData.date && formatDate(dayData.date, "full")}
            </p>
          </div>

          {/* Current Status Info */}
          {dayData.bookedSessions > 0 && (
            <div className="mb-6 p-4 rounded-xl border-2" style={{ 
              backgroundColor: `${COLORS.warning}10`,
              borderColor: COLORS.warning 
            }}>
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.warning }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: COLORS.warning }}>
                    Active Bookings
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.gray700 }}>
                    This day has <strong>{dayData.bookedSessions}</strong> confirmed booking{dayData.bookedSessions !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status Selection */}
          <div className="mb-6">
            <label className="block text-sm font-bold mb-3" style={{ color: COLORS.gray800 }}>
              Day Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("Bookable")}
                className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  status === "Bookable"
                    ? "shadow-lg"
                    : "hover:shadow-md"
                }`}
                style={{
                  borderColor: status === "Bookable" ? COLORS.success : COLORS.gray200,
                  backgroundColor: status === "Bookable" ? `${COLORS.success}15` : COLORS.white,
                }}
              >
                <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${
                  status === "Bookable" ? "" : "opacity-40"
                }`} style={{ color: COLORS.success }} />
                <p className={`text-sm font-bold ${
                  status === "Bookable" ? "" : "opacity-60"
                }`} style={{ color: status === "Bookable" ? COLORS.success : COLORS.gray600 }}>
                  Open
                </p>
              </button>
              <button
                type="button"
                onClick={() => setStatus("Closed")}
                className={`p-4 rounded-xl border-2 transition-all transform hover:scale-105 ${
                  status === "Closed"
                    ? "shadow-lg"
                    : "hover:shadow-md"
                }`}
                style={{
                  borderColor: status === "Closed" ? COLORS.error : COLORS.gray200,
                  backgroundColor: status === "Closed" ? `${COLORS.error}15` : COLORS.white,
                }}
              >
                <XCircle className={`w-8 h-8 mx-auto mb-2 ${
                  status === "Closed" ? "" : "opacity-40"
                }`} style={{ color: COLORS.error }} />
                <p className={`text-sm font-bold ${
                  status === "Closed" ? "" : "opacity-60"
                }`} style={{ color: status === "Closed" ? COLORS.error : COLORS.gray600 }}>
                  Closed
                </p>
              </button>
            </div>
          </div>

          {/* Operating Hours */}
          {status === "Bookable" && (
            <div className="mb-6">
              <label className="block text-sm font-bold mb-3" style={{ color: COLORS.gray800 }}>
                <Clock className="w-4 h-4 inline mr-2" />
                Operating Hours
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: COLORS.gray600 }}>
                    OPEN TIME
                  </label>
                  <input
                    type="time"
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full px-3 py-3 border-2 rounded-lg focus:ring-2 transition-all font-semibold"
                    style={{ 
                      borderColor: COLORS.gray300,
                      color: COLORS.gray800,
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: COLORS.gray600 }}>
                    CLOSE TIME
                  </label>
                  <input
                    type="time"
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full px-3 py-3 border-2 rounded-lg focus:ring-2 transition-all font-semibold"
                    style={{ 
                      borderColor: COLORS.gray300,
                      color: COLORS.gray800,
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Calculated Sessions */}
          {status === "Bookable" && (
            <div className="mb-6 p-5 rounded-xl border-2" style={{ 
              backgroundColor: `${COLORS.primary}08`,
              borderColor: COLORS.primary 
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: COLORS.primary }} />
                <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>
                  CALCULATED SESSIONS
                </p>
              </div>
              <p className="text-4xl font-bold mb-2" style={{ color: COLORS.primary }}>
                {calculatedSessions}
              </p>
              <p className="text-xs font-medium" style={{ color: COLORS.gray600 }}>
                Based on {readyTankCount} ready tank{readyTankCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 font-bold transition-all hover:bg-gray-50 transform hover:scale-105"
              style={{ borderColor: COLORS.gray300, color: COLORS.gray700 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 py-3 rounded-xl font-bold text-white transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-105"
              style={{ backgroundColor: COLORS.primary }}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// --- MAIN COMPONENT ---
const CalendarManage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarData, setCalendarData] = useState<Map<string, DayData>>(new Map());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const readyTankCount = useMemo(() => {
    return tanks.filter(t => t.status === "Ready").length;
  }, [tanks]);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [fetchedSettings, fetchedTanks] = await Promise.all([
        apiService.getSystemSettings(),
        apiService.getAllTanks(),
      ]);
      setSettings(fetchedSettings);
      setTanks(fetchedTanks);
      
      // Fetch calendar data for current month
      const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      const overrides = await apiService.getCalendarOverrides(
        formatDate(firstDay, "yyyy-MM-dd"),
        formatDate(lastDay, "yyyy-MM-dd")
      );

      // Process calendar data
      const dataMap = new Map<string, DayData>();
      const readyTanks = fetchedTanks.filter(t => t.status === "Ready");
      
      // Calculate default sessions with validation
      const defaultResult = calculateStaggeredSessions(
        fetchedSettings.openTime,
        fetchedSettings.closeTime,
        fetchedSettings.sessionDuration,
        fetchedSettings.cleaningBuffer,
        readyTanks.length,
        fetchedSettings.tankStaggerInterval
      );
      const defaultSessions = (defaultResult.sessionsPerTank * readyTanks.length) || 0;

      // Group overrides by date
      const overridesByDate = new Map<string, CalendarOverride[]>();
      overrides.forEach(override => {
        if (!overridesByDate.has(override.date)) {
          overridesByDate.set(override.date, []);
        }
        overridesByDate.get(override.date)!.push(override);
      });

      // Create day data for each day in month
      for (let d = 1; d <= lastDay.getDate(); d++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
        const dateKey = formatDate(date, "yyyy-MM-dd");
        const dayOverrides = overridesByDate.get(dateKey) || [];

        if (dayOverrides.length > 0) {
          const totalSessions = dayOverrides.reduce((sum, o) => sum + (Number(o.sessionsToSell) || 0), 0);
          const totalBooked = dayOverrides.reduce((sum, o) => sum + (Number(o.bookedSessions) || 0), 0);
          const firstOverride = dayOverrides[0];
          
          let status: DayStatus = firstOverride.status;
          if (status === "Bookable" && totalBooked >= totalSessions && totalSessions > 0) {
            status = "Sold Out";
          }

          dataMap.set(dateKey, {
            date: dateKey,
            status,
            openTime: firstOverride.openTime || fetchedSettings.openTime,
            closeTime: firstOverride.closeTime || fetchedSettings.closeTime,
            totalSessions: totalSessions || 0,
            bookedSessions: totalBooked || 0,
            availableSessions: Math.max(0, (totalSessions || 0) - (totalBooked || 0)),
            overrides: dayOverrides,
          });
        } else {
          dataMap.set(dateKey, {
            date: dateKey,
            status: "Bookable",
            openTime: fetchedSettings.openTime,
            closeTime: fetchedSettings.closeTime,
            totalSessions: defaultSessions,
            bookedSessions: 0,
            availableSessions: defaultSessions,
            overrides: [],
          });
        }
      }

      setCalendarData(dataMap);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!settings || !tanks.length) return null;

    const result = calculateStaggeredSessions(
      settings.openTime,
      settings.closeTime,
      settings.sessionDuration,
      settings.cleaningBuffer,
      readyTankCount,
      settings.tankStaggerInterval
    );

    // Calculate monthly stats
    let totalBookings = 0;
    let totalAvailable = 0;
    calendarData.forEach(day => {
      if (day.status !== "Closed") {
        totalBookings += Number(day.bookedSessions) || 0;
        totalAvailable += Number(day.totalSessions) || 0;
      }
    });

    const dailySessions = (result.sessionsPerTank * readyTankCount) || 0;

    return {
      totalDailySessions: isNaN(dailySessions) ? 0 : dailySessions,
      sessionsPerTank: result.sessionsPerTank || 0,
      readyTanks: readyTankCount,
      actualCloseTime: result.actualCloseTime,
      monthlyBookings: isNaN(totalBookings) ? 0 : totalBookings,
      monthlyCapacity: isNaN(totalAvailable) ? 0 : totalAvailable,
    };
  }, [settings, tanks, readyTankCount, calendarData]);

  // Generate session details for selected date using that day's specific hours
  const sessionDetails = useMemo(() => {
    if (!selectedDate || !settings || !tanks.length) return [];
    
    const dateKey = formatDate(selectedDate, "yyyy-MM-dd");
    const dayData = calendarData.get(dateKey);
    
    if (!dayData || dayData.status === "Closed") return [];
    
    // Create a modified settings object with the day's specific hours
    const daySpecificSettings = {
      ...settings,
      openTime: dayData.openTime,
      closeTime: dayData.closeTime,
    };
    
    return generateSessionDetails(daySpecificSettings, tanks);
  }, [selectedDate, settings, tanks, calendarData]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleMonthChange = (direction: number) => {
    setCurrentMonth(addMonths(currentMonth, direction));
    setSelectedDate(null);
  };

  const today = new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.gray50 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-transparent mx-auto mb-4" style={{ borderColor: COLORS.primary }}></div>
          <p className="text-xl font-semibold" style={{ color: COLORS.gray600 }}>Loading calendar...</p>
        </div>
      </div>
    );
  }

  const selectedDayData = selectedDate ? calendarData.get(formatDate(selectedDate, "yyyy-MM-dd")) : null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.gray50 }}>
      {/* Header */}
      <div className="p-6 border-b shadow-sm" style={{ backgroundColor: COLORS.white }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-3" style={{ color: COLORS.gray800 }}>
                <div className="p-2 rounded-xl" style={{ backgroundColor: `${COLORS.primary}20` }}>
                  <CalendarIcon className="w-8 h-8" style={{ color: COLORS.primary }} />
                </div>
                Calendar Management
              </h1>
              <p className="mt-2 text-sm font-medium" style={{ color: COLORS.gray600 }}>
                View and manage your tank booking schedule
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${COLORS.primary}15` }}>
                    <CalendarDays className="w-6 h-6" style={{ color: COLORS.primary }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>DAILY CAPACITY</p>
                    <p className="text-3xl font-extrabold" style={{ color: COLORS.primary }}>{stats.totalDailySessions}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${COLORS.success}15` }}>
                    <TrendingUp className="w-6 h-6" style={{ color: COLORS.success }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>MONTHLY BOOKINGS</p>
                    <p className="text-3xl font-extrabold" style={{ color: COLORS.success }}>{stats.monthlyBookings}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${COLORS.warning}15` }}>
                    <Users className="w-6 h-6" style={{ color: COLORS.warning }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>READY TANKS</p>
                    <p className="text-3xl font-extrabold" style={{ color: COLORS.warning }}>{stats.readyTanks}</p>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${COLORS.error}15` }}>
                    <Clock className="w-6 h-6" style={{ color: COLORS.error }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>HOURS</p>
                    <p className="text-xl font-extrabold" style={{ color: COLORS.error }}>
                      {settings?.openTime} - {settings?.closeTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Calendar Section */}
          <div className="lg:col-span-2 rounded-xl border p-4 shadow-md" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: COLORS.gray800 }}>
                {formatDate(currentMonth, "MMMM yyyy")}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-2 rounded-lg border transition-all hover:shadow"
                  style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.white }}
                >
                  <ChevronLeft className="w-4 h-4" style={{ color: COLORS.gray600 }} />
                </button>
                 <button
                   onClick={() => {
                     setCurrentMonth(new Date());
                     setSelectedDate(null);
                   }}
                   className="px-3 py-2 rounded-lg border transition-all hover:shadow text-xs font-bold"
                   style={{ borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}10`, color: COLORS.primary }}
                 >
                   Today
                 </button>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-2 rounded-lg border transition-all hover:shadow"
                  style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.white }}
                >
                  <ChevronRight className="w-4 h-4" style={{ color: COLORS.gray600 }} />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 mb-4 p-2 rounded-lg text-xs" style={{ backgroundColor: COLORS.gray50 }}>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: `${COLORS.success}40` }} />
                <span className="font-semibold" style={{ color: COLORS.gray700 }}>Available</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: `${COLORS.warning}40` }} />
                <span className="font-semibold" style={{ color: COLORS.gray700 }}>Partial</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: `${COLORS.error}40` }} />
                <span className="font-semibold" style={{ color: COLORS.gray700 }}>Sold Out</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: `${COLORS.error}80` }} />
                <span className="font-semibold" style={{ color: COLORS.gray700 }}>Closed</span>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center py-2 text-xs font-bold" style={{ color: COLORS.gray600 }}>
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="aspect-square" />;
              }

              const dateKey = formatDate(day, "yyyy-MM-dd");
              const dayData = calendarData.get(dateKey);
              const isToday = isSameDay(day, today);
              const isPast = day < today && !isSameDay(day, today);

              let backgroundColor = COLORS.white;
              let borderColor = COLORS.gray200;
              let statusIcon = null;

              if (dayData) {
                const available = dayData.availableSessions || 0;
                const total = dayData.totalSessions || 0;

                if (dayData.status === "Closed") {
                  backgroundColor = `${COLORS.error}90`;
                  borderColor = COLORS.error;
                  statusIcon = <Lock className="w-2 h-2" style={{ color: COLORS.white }} />;
                } else if (dayData.status === "Sold Out" || (available === 0 && total > 0)) {
                  backgroundColor = `${COLORS.error}20`;
                  borderColor = COLORS.error;
                  statusIcon = <XCircle className="w-2 h-2" style={{ color: COLORS.error }} />;
                } else if (dayData.bookedSessions > 0) {
                  const bookingPercentage = total > 0 ? (dayData.bookedSessions / total) * 100 : 0;
                  if (bookingPercentage >= 70) {
                    backgroundColor = `${COLORS.warning}25`;
                    borderColor = COLORS.warning;
                  } else {
                    backgroundColor = `${COLORS.success}20`;
                    borderColor = COLORS.success;
                  }
                } else {
                  backgroundColor = `${COLORS.success}15`;
                  borderColor = COLORS.success;
                }
              }

              const isSelected = selectedDate && isSameDay(day, selectedDate);
              if (isSelected) {
                borderColor = COLORS.primary;
              } else if (isToday) {
                borderColor = COLORS.primary;
              }

              return (
                <button
                  key={idx}
                  onClick={() => !isPast && handleDateClick(day)}
                  disabled={isPast}
                  className="aspect-square rounded-lg flex flex-col items-center justify-center transition-all hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed relative p-1"
                  style={{
                    backgroundColor,
                    borderWidth: (isToday || isSelected) ? '2px' : '1px',
                    borderColor,
                  }}
                >
                  <div className="flex items-center justify-between w-full mb-0.5">
                    <span className="text-sm font-bold" style={{ 
                      color: dayData?.status === "Closed" ? COLORS.white : (isPast ? COLORS.gray400 : COLORS.gray800) 
                    }}>
                      {day.getDate()}
                    </span>
                    {statusIcon}
                  </div>
                  
                  {dayData && !isPast && dayData.status !== "Closed" && (
                    <div className="w-full text-center">
                      <div className="text-xs font-bold" style={{ color: COLORS.primary }}>
                        {dayData.availableSessions}/{dayData.totalSessions}
                      </div>
                    </div>
                  )}

                  {dayData && !isPast && dayData.status === "Closed" && (
                    <div className="text-[10px] font-bold" style={{ color: COLORS.white }}>
                      CLOSED
                    </div>
                  )}

                  {isToday && !isSelected && (
                    <div className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Day Details Sidebar - Always Visible */}
        <div className="lg:col-span-1 rounded-xl border p-4 shadow-md" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
          {selectedDate && selectedDayData ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: COLORS.gray800 }}>Day Details</h3>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4" style={{ color: COLORS.gray600 }} />
                </button>
              </div>

            {/* Date */}
            <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: COLORS.gray50 }}>
              <p className="text-xs font-bold mb-1" style={{ color: COLORS.gray600 }}>DATE</p>
              <p className="text-sm font-bold" style={{ color: COLORS.gray800 }}>
                {formatDate(selectedDate, "full")}
              </p>
            </div>

            {/* Status */}
            <div className="mb-4">
              <p className="text-xs font-bold mb-2" style={{ color: COLORS.gray600 }}>STATUS</p>
              <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg`} style={{
                backgroundColor: selectedDayData.status === "Closed" ? `${COLORS.error}20` :
                  selectedDayData.status === "Sold Out" ? `${COLORS.error}20` :
                  `${COLORS.success}20`,
                color: selectedDayData.status === "Closed" || selectedDayData.status === "Sold Out" ? COLORS.error : COLORS.success
              }}>
                {selectedDayData.status === "Closed" ? <Lock className="w-4 h-4" /> :
                  selectedDayData.status === "Sold Out" ? <XCircle className="w-4 h-4" /> :
                  <CheckCircle2 className="w-4 h-4" />}
                <span className="text-sm font-bold">{selectedDayData.status}</span>
              </div>
            </div>

            {/* Hours */}
            {selectedDayData.status !== "Closed" && (
              <div className="mb-4">
                <p className="text-xs font-bold mb-2" style={{ color: COLORS.gray600 }}>OPERATING HOURS</p>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.gray50 }}>
                  <span className="text-sm font-bold" style={{ color: COLORS.gray800 }}>{selectedDayData.openTime}</span>
                  <span style={{ color: COLORS.gray400 }}>→</span>
                  <span className="text-sm font-bold" style={{ color: COLORS.gray800 }}>{selectedDayData.closeTime}</span>
                </div>
              </div>
            )}

            {/* Sessions */}
            <div className="mb-4">
              <p className="text-xs font-bold mb-2" style={{ color: COLORS.gray600 }}>SESSIONS</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: COLORS.gray50 }}>
                  <span className="text-sm font-medium" style={{ color: COLORS.gray600 }}>Total</span>
                  <span className="text-lg font-bold" style={{ color: COLORS.gray800 }}>{selectedDayData.totalSessions}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${COLORS.primary}10` }}>
                  <span className="text-sm font-medium" style={{ color: COLORS.primary }}>Booked</span>
                  <span className="text-lg font-bold" style={{ color: COLORS.primary }}>{selectedDayData.bookedSessions}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: `${COLORS.success}10` }}>
                  <span className="text-sm font-medium" style={{ color: COLORS.success }}>Available</span>
                  <span className="text-lg font-bold" style={{ color: COLORS.success }}>{selectedDayData.availableSessions}</span>
                </div>
              </div>
            </div>

              {/* Actions */}
              <div className="mt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-2 rounded-lg font-bold text-white transition-all shadow hover:shadow-md flex items-center justify-center gap-2"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  <Settings className="w-4 h-4" />
                  Configure Day
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="p-4 rounded-full inline-block mb-4" style={{ backgroundColor: COLORS.gray100 }}>
                <CalendarDays className="w-8 h-8" style={{ color: COLORS.gray400 }} />
              </div>
              <p className="text-sm font-semibold mb-2" style={{ color: COLORS.gray600 }}>
                Select a Date
              </p>
              <p className="text-xs" style={{ color: COLORS.gray600 }}>
                Click any date to view details and sessions
              </p>
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Session Details Section - Below Calendar */}
      {selectedDate && selectedDayData && selectedDayData.status !== "Closed" && sessionDetails.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="rounded-xl border p-6 shadow-lg" style={{ backgroundColor: COLORS.white, borderColor: COLORS.gray200 }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold" style={{ color: COLORS.gray800 }}>
                  Session Schedule - {formatDate(selectedDate, "full")}
                </h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: COLORS.primary }} />
                    <p className="text-sm font-semibold" style={{ color: COLORS.gray600 }}>
                      Open: {selectedDayData.openTime}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: COLORS.error }} />
                    <p className="text-sm font-semibold" style={{ color: COLORS.gray600 }}>
                      Close: {selectedDayData.closeTime}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mb-4 p-3 rounded-lg border" style={{ 
              backgroundColor: `${COLORS.primary}05`,
              borderColor: COLORS.primary 
            }}>
              <p className="text-xs font-semibold" style={{ color: COLORS.gray700 }}>
                Showing sessions calculated for this specific day's operating hours ({selectedDayData.openTime} - {selectedDayData.closeTime})
              </p>
            </div>

            <div className="space-y-4">
              {sessionDetails.map((tankDetail) => (
                  <div key={tankDetail.tankNumber} className="border rounded-lg p-4" style={{ borderColor: COLORS.gray200 }}>
                    {/* Tank Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow" 
                          style={{ backgroundColor: COLORS.primary }}>
                          {tankDetail.tankNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-base" style={{ color: COLORS.gray800 }}>{tankDetail.tankName}</h4>
                          <p className="text-xs font-semibold" style={{ color: COLORS.gray600 }}>
                            {tankDetail.sessions.length} sessions
                          </p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ 
                        backgroundColor: `${COLORS.success}20`,
                        color: COLORS.success 
                      }}>
                        READY
                      </span>
                    </div>

                    {/* Sessions Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tankDetail.sessions.map((session) => (
                        <div key={session.sessionNumber} className="border rounded-lg p-3 hover:shadow-md transition-shadow" 
                          style={{ borderColor: COLORS.gray200, backgroundColor: COLORS.gray50 }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ 
                              backgroundColor: COLORS.primaryLight,
                              color: COLORS.primaryDark 
                            }}>
                              #{session.sessionNumber}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: COLORS.gray600 }}>
                              {settings?.sessionDuration}min
                            </span>
                          </div>

                          <div className="space-y-2">
                            {/* Session Time */}
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: COLORS.primary }} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold truncate" style={{ color: COLORS.gray800 }}>
                                  {session.startTime} - {session.endTime}
                                </p>
                              </div>
                            </div>

                            {/* Cleaning Time */}
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.warning }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs truncate" style={{ color: COLORS.gray600 }}>
                                  Clean: {session.cleaningStart} - {session.cleaningEnd}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div className="mt-4 p-4 rounded-lg border" style={{ 
              backgroundColor: `${COLORS.primary}08`,
              borderColor: COLORS.primary 
            }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold" style={{ color: COLORS.gray600 }}>TOTAL CAPACITY</p>
                  <p className="text-2xl font-bold mt-1" style={{ color: COLORS.primary }}>
                    {stats?.totalDailySessions} Sessions
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold" style={{ color: COLORS.gray600 }}>
                    {sessionDetails.length} tanks × {sessionDetails[0]?.sessions.length || 0}
                  </p>
                  <p className="text-xs mt-1" style={{ color: COLORS.gray600 }}>
                    Close: {stats?.actualCloseTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Configuration Modal */}
      {settings && selectedDayData && (
        <DayConfigModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
          }}
          dayData={selectedDayData}
          settings={settings}
          readyTankCount={readyTankCount}
          onSave={() => {
            fetchData();
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default CalendarManage;
