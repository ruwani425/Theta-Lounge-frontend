import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  Clock,
  User,
  Mail,
  MessageSquare,
  Send,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Shield,
} from "lucide-react";

// NOTE: Assuming this path is correct relative to the file's location
import apiRequest from "../core/axios";

// --- 1. TypeScript Interfaces & Data ---

const DAY_STATUS = {
  BOOKABLE: "Bookable",
  CLOSED: "Closed",
  SOLD_OUT: "Sold Out",
} as const;
type DayStatus = (typeof DAY_STATUS)[keyof typeof DAY_STATUS];

/** The generic API Response wrapper. */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/** Appointment data expected back upon a successful POST request. */
interface AppointmentResponseData {
  _id: string; // The MongoDB ID of the created appointment
  date: string;
  time: string;
  email: string;
  contactNumber: string;
  specialNote?: string;
  status: "Pending" | "Confirmed" | "Canceled";
}

/** Specific response type for the POST /appointments endpoint. */
interface AppointmentApiResponse
  extends ApiResponse<AppointmentResponseData | null> {}

/** * MATCHES ICalendarDetail from your backend. */
interface CalendarDetailFromBackend {
  date: string; // YYYY-MM-DD
  status: DayStatus;
  openTime?: string; // Optional override time
  closeTime?: string; // Optional override time
  sessionsToSell: number; // Total slots available for the day
  bookedSessions: number; // Total slots booked (defaults to 0 if null)
}

/** System Settings used for defaults and calculations. */
interface SystemSettings {
  defaultFloatPrice: number;
  cleaningBuffer: number; // in minutes
  sessionDuration: number; // in minutes
  sessionsPerDay: number;
  openTime: string;
  closeTime: string;
  numberOfTanks: number;
  tankStaggerInterval: number;
  actualCloseTime?: string;
}

// Default settings used as a fallback
const GLOBAL_DEFAULTS: SystemSettings = {
  defaultFloatPrice: 0,
  cleaningBuffer: 30,
  sessionDuration: 60,
  sessionsPerDay: 8,
  openTime: "09:00",
  closeTime: "21:00",
  numberOfTanks: 1,
  tankStaggerInterval: 0,
};

// --- THEME & UTILITIES ---
const THEME_COLORS: { [key: string]: string } = {
  "--theta-blue": "#035C84",
  "--theta-blue-dark": "#0873A1",
  "--light-blue-50": "#F0F8FF",
  "--light-blue-200": "#94CCE7",
  "--theta-red": "#EF4444",
  "--theta-orange": "#F59E0B", // SOLD OUT
  "--theta-green": "#10B981",
  "--dark-blue-800": "#003F5C",
  "--accent-color": "#2DA0CC",
};

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const getDaysInMonth = (date: Date): Date[] => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  const startDayOfWeek = firstDay.getDay();
  const prevMonth = new Date(year, month, 0);
  for (let i = startDayOfWeek; i > 0; i--) {
    days.unshift(
      new Date(
        prevMonth.getFullYear(),
        prevMonth.getMonth(),
        prevMonth.getDate() - i + 1
      )
    );
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  const remainingSlots = 42 - days.length;
  const nextMonth = new Date(year, month + 1, 1);
  for (let i = 0; i < remainingSlots; i++) {
    days.push(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        nextMonth.getDate() + i
      )
    );
  }

  return days;
};

const formatDateToKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isSameDay = (date1: Date | null, date2: Date | null): boolean => {
  if (!date1 || !date2) return false;
  return date1.toDateString() === date2.toDateString();
};
const isToday = (date: Date): boolean => isSameDay(date, new Date());

/**
 * Calculate staggered tank sessions - matches CalenderManage.tsx logic
 */
const calculateStaggeredSessions = (
  openTime: string,
  closeTime: string,
  duration: number,
  buffer: number,
  numberOfTanks: number,
  staggerInterval: number
): {
  sessionsPerTank: number;
  actualCloseTime: string;
  totalSessions: number;
} => {
  // Validate inputs
  if (!openTime || !closeTime || !duration || !buffer || numberOfTanks <= 0) {
    return {
      sessionsPerTank: 0,
      actualCloseTime: closeTime || "00:00",
      totalSessions: 0,
    };
  }

  const timeToMinutes = (time: string): number => {
    try {
      const [hours, minutes] = time.split(":").map(Number);
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
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const openMinutes = timeToMinutes(openTime);
  let closeMinutes = timeToMinutes(closeTime);
  if (closeMinutes <= openMinutes) closeMinutes += 24 * 60;

  const sessionLength = Number(duration) + Number(buffer);
  if (sessionLength <= 0 || isNaN(sessionLength)) {
    return { sessionsPerTank: 0, actualCloseTime: closeTime, totalSessions: 0 };
  }

  let maxSessionsPerTank = 0;
  let latestEndTime = openMinutes;

  for (let tankIndex = 0; tankIndex < numberOfTanks; tankIndex++) {
    const tankStartMinutes =
      openMinutes + tankIndex * Number(staggerInterval || 0);
    const availableTime = closeMinutes - tankStartMinutes;
    const tankSessions = Math.floor(availableTime / sessionLength);

    if (tankSessions > 0) {
      const tankEndTime = tankStartMinutes + tankSessions * sessionLength;
      latestEndTime = Math.max(latestEndTime, tankEndTime);
      maxSessionsPerTank = Math.max(maxSessionsPerTank, tankSessions);
    }
  }

  const totalSessions = maxSessionsPerTank * numberOfTanks;

  return {
    sessionsPerTank: maxSessionsPerTank || 0,
    actualCloseTime: minutesToTime(latestEndTime),
    totalSessions: isNaN(totalSessions) ? 0 : totalSessions,
  };
};

/**
 * Generate detailed session schedule for each tank - matches CalenderManage.tsx
 */
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

const generateSessionDetails = (
  openTime: string,
  closeTime: string,
  sessionDuration: number,
  cleaningBuffer: number,
  numberOfTanks: number,
  tankStaggerInterval: number
): SessionDetail[] => {
  const sessionDetails: SessionDetail[] = [];

  const timeToMinutes = (time: string): number => {
    try {
      const [hours, minutes] = time.split(":").map(Number);
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
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
  };

  const minutesToTime12Hour = (minutes: number): string => {
    if (isNaN(minutes)) return "12:00 AM";
    const hrs = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    const period = hrs >= 12 ? "PM" : "AM";
    const displayHours = hrs % 12 || 12;
    return `${String(displayHours).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )} ${period}`;
  };

  const openMinutes = timeToMinutes(openTime);
  const sessionDurationNum = Number(sessionDuration) || 0;
  const cleaningBufferNum = Number(cleaningBuffer) || 0;
  const staggerInterval = Number(tankStaggerInterval) || 0;
  const sessionLength = sessionDurationNum + cleaningBufferNum;

  if (sessionLength <= 0) return [];

  const result = calculateStaggeredSessions(
    openTime,
    closeTime,
    sessionDurationNum,
    cleaningBufferNum,
    numberOfTanks,
    staggerInterval
  );

  for (let tankIndex = 0; tankIndex < numberOfTanks; tankIndex++) {
    const tankStartMinutes = openMinutes + tankIndex * staggerInterval;
    const sessions = [];

    for (let i = 0; i < result.sessionsPerTank; i++) {
      const sessionStartMinutes = tankStartMinutes + i * sessionLength;
      const sessionEndMinutes = sessionStartMinutes + sessionDurationNum;
      const cleaningEndMinutes = sessionEndMinutes + cleaningBufferNum;

      sessions.push({
        sessionNumber: i + 1,
        startTime: minutesToTime12Hour(sessionStartMinutes),
        endTime: minutesToTime12Hour(sessionEndMinutes),
        cleaningStart: minutesToTime(sessionEndMinutes),
        cleaningEnd: minutesToTime(cleaningEndMinutes),
      });
    }

    sessionDetails.push({
      tankNumber: tankIndex + 1,
      tankName: `Tank ${tankIndex + 1}`,
      sessions,
    });
  }

  return sessionDetails;
};

// --- API SERVICE ---

const CALENDAR_API_BASE_URL = "/calendar";
const SETTINGS_API_BASE_URL = "/system-settings";

const apiService = {
  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const response = await apiRequest.get<ApiResponse<SystemSettings>>(
        SETTINGS_API_BASE_URL
      );
      return { ...GLOBAL_DEFAULTS, ...response.data };
    } catch (error) {
      console.error(
        "Failed to fetch system settings. Using fallback defaults.",
        error
      );
      return GLOBAL_DEFAULTS;
    }
  },

  getCalendarOverrides: async (
    formattedStartDate: string,
    formattedEndDate: string
  ): Promise<CalendarDetailFromBackend[]> => {
    try {
      const apiResponse = await apiRequest.get<
        ApiResponse<CalendarDetailFromBackend[]>
      >(CALENDAR_API_BASE_URL, {
        params: { startDate: formattedStartDate, endDate: formattedEndDate },
      });

      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data.map((detail) => ({
          ...detail,
          bookedSessions: (detail as any).bookedSessions ?? 0,
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch calendar overrides.", error);
      return [];
    }
  },
};

// --- Calendar Legend Component (NEW) ---
const CalendarLegend: React.FC = () => {
  const LegendItem: React.FC<{ color: string; label: string }> = ({
    color,
    label,
  }) => (
    <div className="flex items-center space-x-2">
      <div
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: color }}
      ></div>
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );

  return (
    <div className="flex justify-start space-x-6 mb-6">
      <LegendItem color={THEME_COLORS["--theta-red"]} label="Closed (Admin)" />
      <LegendItem color={THEME_COLORS["--theta-orange"]} label="Sold Out" />
      <LegendItem
        color={THEME_COLORS["--theta-blue"]}
        label="Today (Available)"
      />
      <LegendItem
        color={THEME_COLORS["--accent-color"]}
        label="Selected Date"
      />
      <LegendItem color="#E5E7EB" label="Available" />
    </div>
  );
};

// --- 2. Custom Calendar Component ---

interface CustomCalendarProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  dayOverrides: Record<string, CalendarDetailFromBackend>;
}

const CustomCalendar: React.FC<CustomCalendarProps> = ({
  currentDate,
  onDateChange,
  onMonthChange,
  selectedDate,
  dayOverrides,
}) => {
  const calendarDays = useMemo(
    () => getDaysInMonth(currentDate),
    [currentDate]
  );

  const handlePrevMonth = () => {
    const prevMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() - 1,
      1
    );
    onMonthChange(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    onMonthChange(nextMonth);
  };

  const getTileClass = (date: Date) => {
    const dateKey = formatDateToKey(date);
    const override = dayOverrides[dateKey];
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

    let baseClasses =
      "flex items-center justify-center h-10 w-10 text-center text-sm font-semibold rounded-full transition duration-150 cursor-pointer";

    const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

    if (!isCurrentMonth || isPastDate) {
      return `${baseClasses} text-gray-400 cursor-not-allowed`;
    }

    const isSelected = isSameDay(date, selectedDate);
    const isTodayMarker = isToday(date);

    const status = override?.status;

    if (isSelected) {
      return `${baseClasses} bg-[var(--accent-color)] text-white shadow-lg border-2 border-white`;
    } else if (status === DAY_STATUS.CLOSED) {
      // Use red for CLOSED
      return `${baseClasses} bg-[var(--theta-red)] text-white shadow-md`;
    } else if (status === DAY_STATUS.SOLD_OUT) {
      // Use orange for SOLD OUT
      return `${baseClasses} bg-[var(--theta-orange)] text-white shadow-md`;
    } else if (isTodayMarker) {
      return `${baseClasses} bg-[var(--theta-blue)] text-white shadow-md`;
    } else {
      return `${baseClasses} text-gray-700 hover:bg-gray-100`;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-2 pb-6 text-[var(--dark-blue-800)]">
        <button
          type="button"
          onClick={handlePrevMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ChevronLeft className="w-7 h-7 text-gray-700" />
        </button>
        <h3 className="text-2xl font-semibold">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h3>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ChevronRight className="w-7 h-7 text-gray-700" />
        </button>
      </div>

      <div className="grid grid-cols-7 text-center text-gray-500 font-semibold mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentDate.getMonth();
          const isPastDate = date < new Date(new Date().setHours(0, 0, 0, 0));

          // Allow clicks for all non-past, current month dates.
          const isClickable = isCurrentMonth && !isPastDate;

          return (
            <div key={index} className="flex items-center justify-center p-1">
              <button
                type="button"
                className={getTileClass(date)}
                onClick={() => isClickable && onDateChange(date)}
                disabled={!isClickable}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Event Sidebar Component ---

interface EventSidebarProps {
  selectedDate: Date | null;
  dayOverrides: Record<string, CalendarDetailFromBackend>;
  defaultHours: SystemSettings;
}

const EventSidebar: React.FC<EventSidebarProps> = ({
  selectedDate,
  dayOverrides,
  defaultHours,
}) => {
  // If no date is selected, show placeholder
  if (!selectedDate) {
    return (
      <div className="w-full max-w-sm ml-auto space-y-4 pt-1">
        <div className="text-center py-12 px-4">
          <CalendarCheck
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: THEME_COLORS["--theta-blue"], opacity: 0.3 }}
          />
          <p className="text-lg font-semibold text-gray-600 mb-2">
            Select a Date
          </p>
          <p className="text-sm text-gray-500">
            Click on any available date in the calendar to view session details
            and book your appointment
          </p>
        </div>
      </div>
    );
  }

  const displayDate = selectedDate;
  const dateKey = formatDateToKey(displayDate);
  const override = dayOverrides[dateKey];

  const effectiveOpenTime = override?.openTime || defaultHours.openTime;
  const effectiveCloseTime = override?.closeTime || defaultHours.closeTime;

  // Calculate sessions using staggered tank logic (matches CalenderManage.tsx)
  const calculatedSessions = calculateStaggeredSessions(
    effectiveOpenTime,
    effectiveCloseTime,
    defaultHours.sessionDuration,
    defaultHours.cleaningBuffer,
    defaultHours.numberOfTanks,
    defaultHours.tankStaggerInterval
  );

  // If no override exists, use calculated default sessions
  const sessionsToSell =
    override?.sessionsToSell ?? calculatedSessions.totalSessions;
  const bookedSessions = override?.bookedSessions || 0;
  const availableSlots = Math.max(0, sessionsToSell - bookedSessions);

  // Determine status by respecting CLOSED and SOLD_OUT overrides
  let dateStatus: DayStatus;

  if (override?.status === DAY_STATUS.CLOSED) {
    dateStatus = DAY_STATUS.CLOSED;
  } else if (override?.status === DAY_STATUS.SOLD_OUT) {
    dateStatus = DAY_STATUS.SOLD_OUT;
  } else {
    dateStatus = DAY_STATUS.BOOKABLE;
  }

  const isClosed = dateStatus === DAY_STATUS.CLOSED;
  const isSoldOut = dateStatus === DAY_STATUS.SOLD_OUT;
  const isClosedOrSoldOut = isClosed || isSoldOut;

  const operationalHours =
    dateStatus !== DAY_STATUS.CLOSED
      ? `${effectiveOpenTime} - ${effectiveCloseTime}`
      : "CLOSED";

  // Use dynamic color for date box based on specific status
  const dateBoxColor = isClosed
    ? THEME_COLORS["--theta-red"]
    : isSoldOut
    ? THEME_COLORS["--theta-orange"]
    : THEME_COLORS["--accent-color"];

  const sessions = [
    {
      label: "Tank Count",
      value: `${defaultHours.numberOfTanks} tank${
        defaultHours.numberOfTanks !== 1 ? "s" : ""
      }`,
      status: "info",
    },
    {
      label: "Sessions Per Tank",
      value: `${calculatedSessions.sessionsPerTank} sessions`,
      status: "info",
    },
    {
      label: "Total Sessions",
      value: `${sessionsToSell} sessions`,
      status: "full",
    },
    { label: "Booked", value: `${bookedSessions} sessions`, status: "full" },
    {
      label: "Available",
      value: `${availableSlots} slots`,
      status: isClosedOrSoldOut || availableSlots === 0 ? "full" : "available",
    },
    {
      label: "Status",
      value: dateStatus.toUpperCase(),
      status: isClosedOrSoldOut ? "full" : "open",
    },
    { label: "Operating Hours", value: operationalHours, status: "info" },
    {
      label: "Actual Close Time",
      value: calculatedSessions.actualCloseTime,
      status: "info",
    },
  ];

  const dateNum = displayDate.getDate().toString().padStart(2, "0");
  const month = displayDate
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  const getStatusColor = (status: "available" | "open" | "info" | "full") => {
    switch (status) {
      case "available":
      case "open":
        return "text-green-600 border-green-300 bg-green-50";
      case "full":
        // Use orange text for sold out status displayed in sidebar
        return isSoldOut
          ? "text-orange-600 border-orange-300 bg-orange-50"
          : "text-red-600 border-red-300 bg-red-50";
      case "info":
      default:
        return "text-gray-700";
    }
  };

  // Use dynamic color for the status text
  const statusTextColor = isClosed
    ? "text-[var(--theta-red)]"
    : isSoldOut
    ? "text-[var(--theta-orange)]"
    : "text-[var(--theta-green)]";

  return (
    <div className="w-full max-w-sm ml-auto space-y-4 pt-1">
      <div className="flex justify-between items-start">
        <div
          className="w-20 h-20 flex flex-col items-center justify-center text-white font-bold rounded-lg shadow-xl"
          style={{ backgroundColor: dateBoxColor }}
        >
          <span className="text-3xl">{dateNum}</span>
          <span className="text-sm">{month}</span>
        </div>

        <div className="flex items-center pt-1 text-sm">
          <span className="text-gray-500 mr-1">Status:</span>
          <span className={`font-bold ${statusTextColor}`}>
            {dateStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <p className="text-sm font-bold text-[var(--dark-blue-800)] uppercase flex items-center gap-2">
          <Clock
            className="w-4 h-4"
            style={{ color: THEME_COLORS["--theta-blue"] }}
          />
          Session Details
        </p>
        <div className="border-t border-gray-200 pt-3 space-y-3">
          {sessions.map((session, index) => (
            <div key={index} className="flex justify-between items-center">
              <p className="text-sm text-gray-600 font-medium">
                {session.label}
              </p>

              {session.label === "Operating Hours" ||
              session.label === "Actual Close Time" ? (
                <p
                  className={`text-sm font-bold ${getStatusColor(
                    session.status as any
                  )}`}
                >
                  {session.value}
                </p>
              ) : (
                <p
                  className={`text-sm font-bold px-3 py-1 rounded-lg border ${getStatusColor(
                    session.status as any
                  )}`}
                >
                  {session.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tank Information Card */}
      {!isClosed && defaultHours.numberOfTanks > 1 && (
        <div
          className="mt-4 p-4 rounded-lg border-2"
          style={{
            backgroundColor: `${THEME_COLORS["--light-blue-50"]}`,
            borderColor: THEME_COLORS["--theta-blue"],
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Users
              className="w-5 h-5"
              style={{ color: THEME_COLORS["--theta-blue"] }}
            />
            <p
              className="text-sm font-bold"
              style={{ color: THEME_COLORS["--theta-blue"] }}
            >
              Staggered Tank Schedule
            </p>
          </div>
          <p className="text-xs text-gray-600 font-medium">
            {defaultHours.numberOfTanks} tanks with{" "}
            {defaultHours.tankStaggerInterval} min intervals
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Each session: {defaultHours.sessionDuration} min +{" "}
            {defaultHours.cleaningBuffer} min cleaning
          </p>
        </div>
      )}
    </div>
  );
};

const ConsolidatedBookingForm: React.FC = () => {
  // --- State Initialization ---
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [specialNote, setSpecialNote] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dayOverrides, setDayOverrides] = useState<
    Record<string, CalendarDetailFromBackend>
  >({});
  const [defaultHours, setDefaultHours] =
    useState<SystemSettings>(GLOBAL_DEFAULTS);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- Dynamic Data Fetching ---
  const fetchCalendarData = useCallback(
    async (date: Date) => {
      setLoadingCalendar(true);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const formattedStartDate = formatDateToKey(startOfMonth);
      const formattedEndDate = formatDateToKey(endOfMonth);

      try {
        const [settings, overrides] = await Promise.all([
          apiService.getSystemSettings(),
          apiService.getCalendarOverrides(formattedStartDate, formattedEndDate),
        ]);

        setDefaultHours(settings);

        const overridesMap = overrides.reduce((acc, curr) => {
          acc[curr.date] = curr;
          return acc;
        }, {} as Record<string, CalendarDetailFromBackend>);

        setDayOverrides(overridesMap);

        // Set today as selected date on initial load only
        if (isInitialLoad) {
          const today = new Date();
          // Only set today if it's in the current month being displayed
          if (
            today.getMonth() === date.getMonth() &&
            today.getFullYear() === date.getFullYear()
          ) {
            setSelectedDate(today);
          }
          setIsInitialLoad(false);
        }
      } catch (e) {
        setMessage("Failed to load appointment schedule.");
        console.error(e);
      } finally {
        setLoadingCalendar(false);
      }
    },
    [isInitialLoad]
  );

  useEffect(() => {
    fetchCalendarData(currentMonth);
  }, [currentMonth, fetchCalendarData]);

  // --- Handlers ---
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime("");
    setMessage(null);
  };

  const handleMonthNavigate = (date: Date) => {
    setCurrentMonth(date);
    setSelectedDate(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dateKey = selectedDate ? formatDateToKey(selectedDate) : null;
    const override = dateKey ? dayOverrides[dateKey] : null;

    if (!selectedDate || !selectedTime || !email || !contactNumber) {
      setMessage(
        "Please select an available date, time, and provide your email and contact number."
      );
      return;
    }

    // Determine status for validation
    let dateStatus: DayStatus;
    if (override?.status === DAY_STATUS.CLOSED) {
      dateStatus = DAY_STATUS.CLOSED;
    } else if (override?.status === DAY_STATUS.SOLD_OUT) {
      dateStatus = DAY_STATUS.SOLD_OUT;
    } else {
      dateStatus = DAY_STATUS.BOOKABLE;
    }

    const isUnavailable =
      dateStatus === DAY_STATUS.CLOSED || dateStatus === DAY_STATUS.SOLD_OUT;

    if (isUnavailable) {
      setMessage(
        `The selected date is currently ${dateStatus.toUpperCase()}. Please choose another date.`
      );
      return;
    }

    if (sessionDetails.length === 0) {
      setMessage(
        "No available time slots on the selected date within operational hours. Please choose another date."
      );
      return;
    }

    setIsSubmitting(true);
    setMessage("Processing your appointment...");
    setSuccessMessage(null);

    try {
      const bookingData = {
        date: dateKey,
        time: selectedTime,
        email: email,
        contactNumber: contactNumber,
        specialNote: specialNote,
      };

      const response = await apiRequest.post<AppointmentApiResponse>(
        "/appointments",
        bookingData
      );

      if (response.success) {
        setIsSubmitting(false);
        const confirmationId = response.data?._id || "N/A";
        setSuccessMessage(
          `Appointment confirmed on ${selectedDate!.toLocaleDateString()} at ${selectedTime}. Confirmation ID: ${confirmationId}`
        );
        setMessage(null);

        setSelectedTime("");
        setSelectedDate(null);
        setContactNumber("");
        setEmail("");
        setSpecialNote("");

        fetchCalendarData(currentMonth);
      } else {
        setIsSubmitting(false);
        setMessage(
          response.message || "Booking failed: Server rejected the request."
        );
      }
    } catch (error: any) {
      setIsSubmitting(false);
      const errorMessage =
        error.response?.data?.message ||
        "A network error occurred while trying to book.";
      setMessage(errorMessage);
      console.error("Booking submission error:", error);
    }
  };

  // --- Generate Session Details for Selected Date ---
  const sessionDetails = useMemo(() => {
    if (!selectedDate) return [];

    const dateKey = formatDateToKey(selectedDate);
    const override = dayOverrides[dateKey];

    const effectiveOpenTime = override?.openTime || defaultHours.openTime;
    const effectiveCloseTime = override?.closeTime || defaultHours.closeTime;

    // Check if the day is closed or sold out
    const status = override?.status || DAY_STATUS.BOOKABLE;
    if (status === DAY_STATUS.CLOSED || status === DAY_STATUS.SOLD_OUT)
      return [];

    return generateSessionDetails(
      effectiveOpenTime,
      effectiveCloseTime,
      defaultHours.sessionDuration,
      defaultHours.cleaningBuffer,
      defaultHours.numberOfTanks,
      defaultHours.tankStaggerInterval
    );
  }, [selectedDate, dayOverrides, defaultHours]);

  // --- Extract All Available Time Slots from Session Details ---
  const availableTimeSlots = useMemo(() => {
    const slots: string[] = [];
    sessionDetails.forEach((tank) => {
      tank.sessions.forEach((session) => {
        if (!slots.includes(session.startTime)) {
          slots.push(session.startTime);
        }
      });
    });
    return slots;
  }, [sessionDetails]);

  const inputClass = "input-style";

  const CustomStyles = `
        :root {
            --theta-blue: ${THEME_COLORS["--theta-blue"]};
            --theta-red: ${THEME_COLORS["--theta-red"]};
            --theta-green: ${THEME_COLORS["--theta-green"]};
            --theta-orange: ${THEME_COLORS["--theta-orange"]};
            --light-blue-200: ${THEME_COLORS["--light-blue-200"]};
            --light-blue-50: ${THEME_COLORS["--light-blue-50"]};
            --dark-blue-800: ${THEME_COLORS["--dark-blue-800"]};
            --accent-color: ${THEME_COLORS["--accent-color"]};
        }
        
        .input-style {
            width: 100%;
            padding: 0.75rem; 
            border: none;
            border-radius: 0.5rem;
            transition: all 0.15s ease-in-out;
        }
    `;

  return (
    <div className="bg-[var(--light-blue-50)] min-h-screen pt-0">
      <style dangerouslySetInnerHTML={{ __html: CustomStyles }} />

      <div className="w-full bg-white shadow-2xl rounded-xl py-8 lg:py-12 border border-gray-100 relative overflow-hidden mt-[72px]">
        {successMessage && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-10 bg-white/95 backdrop-blur-sm rounded-xl">
            <CalendarCheck className="w-16 h-16 text-[var(--theta-blue)] mb-4 animate-bounce" />
            <h2 className="text-4xl font-serif font-bold text-[var(--dark-blue-800)] mb-2">
              Appointment Confirmed!
            </h2>
            <p className="text-lg text-gray-600 mb-6 text-center">
              {successMessage}
            </p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="px-6 py-3 bg-[var(--theta-blue)] text-white rounded-full font-semibold hover:bg-[var(--theta-blue-dark)] transition"
            >
              Close
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-serif font-bold text-[var(--dark-blue-800)] mb-6 text-center">
            Make an Appointment
          </h1>

          {/* NEW: Calendar Legend */}
          <CalendarLegend />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-10 mb-12 border border-gray-100 rounded-lg shadow-md p-6">
            <div className="lg:col-span-3 p-4 border-r border-gray-200">
              {loadingCalendar ? (
                <div className="text-center py-20 text-gray-500 font-medium">
                  Loading schedule...
                </div>
              ) : (
                <CustomCalendar
                  currentDate={currentMonth}
                  onDateChange={handleDateSelect}
                  onMonthChange={handleMonthNavigate}
                  selectedDate={selectedDate}
                  dayOverrides={dayOverrides}
                />
              )}
            </div>

            <div className="lg:col-span-1 pt-6 lg:pt-0">
              <EventSidebar
                selectedDate={selectedDate}
                dayOverrides={dayOverrides}
                defaultHours={defaultHours}
              />
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12 pt-8 border-t border-gray-100"
          >
            <div className="space-y-8">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-xl font-semibold text-gray-700">
                  Select Available Time
                </label>
                {selectedDate && sessionDetails.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-[var(--theta-blue)] font-bold text-sm">
                      {defaultHours.numberOfTanks} Tank{defaultHours.numberOfTanks !== 1 ? 's' : ''}
                    </span>
                    <div>
                      <span className="font-bold text-lg" style={{ color: THEME_COLORS['--theta-green'] }}>
                        {availableTimeSlots.length}
                      </span>
                      <span className="text-gray-600 text-sm"> slots available</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedDate && sessionDetails.length > 0 && (
                <div className="p-3 bg-blue-50 border-l-4 border-[var(--theta-blue)] text-gray-700 rounded-r-lg shadow-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: THEME_COLORS['--theta-blue'] }} />
                    <div className="text-sm">
                      <p className="font-bold mb-1" style={{ color: THEME_COLORS['--theta-blue'] }}>
                        Operating: {dayOverrides[formatDateToKey(selectedDate)]?.openTime || defaultHours.openTime} - {dayOverrides[formatDateToKey(selectedDate)]?.closeTime || defaultHours.closeTime}
                        {defaultHours.tankStaggerInterval > 0 && ` | Stagger: ${defaultHours.tankStaggerInterval} min`}
                      </p>
                      <p className="font-medium">
                        Session: {defaultHours.sessionDuration} min | Cleaning: {defaultHours.cleaningBuffer} min
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionDetails.length > 0 ? (
                <div className="space-y-6">
                  {/* Quick Select - All Available Times */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-green-700 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Quick Select - All Available Times
                      </h3>
                      <span className="px-3 py-1 rounded-full bg-green-600 text-white font-bold text-sm">
                        {availableTimeSlots.length} Open
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                      {availableTimeSlots.map((time) => (
                        <button
                          type="button"
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 px-2 rounded-lg text-sm font-semibold transition duration-150 border-2 ${
                            selectedTime === time
                              ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg scale-105"
                              : "bg-white text-gray-700 border-green-300 hover:bg-green-50 hover:border-green-500 shadow-sm"
                          }`}
                          disabled={isSubmitting}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Detailed Tank Sessions - Same as Admin Calendar */}
                  <div className="space-y-4">
                    <h3 className="text-base font-bold text-gray-700 flex items-center gap-2 border-b pb-2">
                      <Users className="w-5 h-5" style={{ color: THEME_COLORS['--theta-blue'] }} />
                      Complete Schedule - All Tanks
                    </h3>
                    
                    {sessionDetails.map((tankDetail) => (
                      <div key={tankDetail.tankNumber} className="border-2 rounded-xl p-4" style={{ borderColor: THEME_COLORS['--theta-blue'] + '30' }}>
                        {/* Tank Header */}
                        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow" 
                              style={{ backgroundColor: THEME_COLORS['--theta-blue'] }}>
                              {tankDetail.tankNumber}
                            </div>
                            <div>
                              <h4 className="font-bold text-base" style={{ color: THEME_COLORS['--dark-blue-800'] }}>
                                {tankDetail.tankName}
                              </h4>
                              <p className="text-xs font-semibold text-gray-600">
                                {tankDetail.sessions.length} sessions available
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-lg text-xs font-bold" style={{ 
                            backgroundColor: THEME_COLORS['--theta-green'] + '20',
                            color: THEME_COLORS['--theta-green']
                          }}>
                            READY
                          </span>
                        </div>

                        {/* Sessions Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {tankDetail.sessions.map((session) => (
                            <button
                              type="button"
                              key={`${tankDetail.tankNumber}-${session.sessionNumber}`}
                              onClick={() => setSelectedTime(session.startTime)}
                              className={`p-3 rounded-lg text-left transition-all duration-150 border-2 ${
                                selectedTime === session.startTime
                                  ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)] shadow-lg scale-105"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-[var(--theta-blue)] shadow-sm"
                              }`}
                              disabled={isSubmitting}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  selectedTime === session.startTime ? 'bg-white/20 text-white' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  #{session.sessionNumber}
                                </span>
                                <CheckCircle className={`w-4 h-4 ${
                                  selectedTime === session.startTime ? 'text-white' : 'text-green-500'
                                }`} />
                              </div>
                              
                              <div className="space-y-1.5">
                                {/* Session Time */}
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 opacity-70" />
                                  <div>
                                    <p className="text-xs font-bold">{session.startTime}</p>
                                    <p className="text-xs font-bold">{session.endTime}</p>
                                  </div>
                                </div>

                                {/* Cleaning Time */}
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 flex-shrink-0 flex items-center justify-center">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME_COLORS['--theta-orange'] }} />
                                  </div>
                                  <p className="text-[10px] opacity-80">
                                    Clean: {session.cleaningStart} - {session.cleaningEnd}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center font-medium">
                  {selectedDate
                    ? dayOverrides[formatDateToKey(selectedDate)]?.status ===
                        DAY_STATUS.CLOSED ||
                      dayOverrides[formatDateToKey(selectedDate)]?.status ===
                        DAY_STATUS.SOLD_OUT
                      ? `We are ${dayOverrides[
                          formatDateToKey(selectedDate)
                        ]?.status.toUpperCase()} on this date.`
                      : "No available slots on the selected date within operational hours."
                    : "Please select a date."}
                </div>
              )}

              {message && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium shadow-sm">
                  {message}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Email Address
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-[var(--accent-color)] transition shadow-sm">
                  <Mail className="w-5 h-5 ml-3 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className={`${inputClass} focus:ring-0`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="contact"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Contact Number
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center border border-gray-300 rounded-lg focus-within:border-[var(--accent-color)] transition shadow-sm">
                  <User className="w-5 h-5 ml-3 text-gray-400" />
                  <input
                    id="contact"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    placeholder="(555) 555-5555"
                    className={`${inputClass} focus:ring-0`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Special Note Textarea (OPTIONAL) */}
              <div>
                <label
                  htmlFor="note"
                  className="block text-lg font-semibold text-gray-700 mb-2"
                >
                  Special Note (Optional)
                </label>
                <div className="flex items-start border border-gray-300 rounded-lg focus-within:border-[var(--accent-color)] transition shadow-sm">
                  <MessageSquare className="w-5 h-5 ml-3 mt-3 text-gray-400 flex-shrink-0" />
                  <textarea
                    id="note"
                    rows={4}
                    value={specialNote}
                    onChange={(e) => setSpecialNote(e.target.value)}
                    placeholder="E.g., mobility issues, prefer morning session..."
                    className={`${inputClass} focus:ring-0 resize-none`}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Submit Button (Uses --theta-blue) */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full px-10 py-3.5 text-lg font-bold rounded-xl transition duration-300 flex items-center justify-center space-x-2 shadow-xl"
                  disabled={
                    isSubmitting || !selectedTime || !email || !contactNumber
                  }
                  style={{
                    backgroundColor:
                      isSubmitting || !selectedTime || !email || !contactNumber
                        ? THEME_COLORS["--light-blue-200"]
                        : THEME_COLORS["--theta-blue"],
                    color:
                      isSubmitting || !selectedTime || !email || !contactNumber
                        ? THEME_COLORS["--dark-blue-800"]
                        : "white",
                  }}
                >
                  <Send className="w-5 h-5 mr-2" />
                  {isSubmitting ? "Processing..." : "Get Appointment"}
                </button>
              </div>
            </div>
          </form>

          <SessionDetails />
        </div>
      </div>
    </div>
  );
};

// Component below remains the same.
const SessionDetails: React.FC = () => (
  <div className="pt-10 mt-12 border-t border-[var(--light-blue-200)] lg:col-span-2">
    <h2 className="text-3xl font-serif font-bold text-[var(--dark-blue-800)] mb-2 flex items-center">
      <CheckCircle className="w-7 h-7 mr-3 text-[var(--theta-green)]" />
      Our Commitment: Capacity, Time & Safety
    </h2>
    <p className="text-gray-600 mb-10 text-base">
      We prioritize quality, focus, and impeccable hygiene to ensure a truly
      restorative experience
    </p>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6 pb-8">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 bg-gradient-to-br from-[var(--light-blue-50)] to-[var(--light-blue-200)] flex items-center justify-center overflow-hidden">
          <img
            src="/person-enjoying-relaxing-one-hour-floating-therapy.jpg"
            alt="Limited capacity floating therapy facility"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[var(--light-blue-50)] rounded-lg">
              <Users className="w-6 h-6 text-[var(--theta-blue)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--theta-blue)]">
              Limited Daily Capacity
            </h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            We use only 2 specialized machines with a maximum of 20 personalized
            sessions per day. This ensures a low-traffic, serene atmosphere
            where you can truly relax.
          </p>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-[var(--theta-blue)] uppercase">
              Max 20 Sessions Daily
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 bg-gradient-to-br from-[var(--light-blue-50)] to-[var(--light-blue-200)] flex items-center justify-center overflow-hidden">
          <img
            src="/person-enjoying-relaxing-one-hour-floating-therapy.jpg"
            alt="Dedicated one hour therapy session"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[var(--light-blue-50)] rounded-lg">
              <Clock className="w-6 h-6 text-[var(--theta-blue)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--theta-blue)]">
              Full 1-Hour Sessions
            </h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            Each confirmed appointment guarantees you a full 60 minutes of
            uninterrupted therapy time in your dedicated pod. No rushing, no
            distractions.
          </p>
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs font-semibold text-[var(--theta-blue)] uppercase">
              60 Minutes Guaranteed
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-red-200 hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-48 bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center overflow-hidden">
          <img
            src="/person-enjoying-relaxing-one-hour-floating-therapy.jpg"
            alt="Mandatory sanitization and cleaning process"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <Shield className="w-6 h-6 text-[var(--theta-red)]" />
            </div>
            <h3 className="text-xl font-bold text-[var(--theta-red)]">
              Strict Sanitization
            </h3>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            A mandatory 30-minute deep cleaning break is strictly scheduled
            after every session to meet the highest hygiene and safety
            standards.
          </p>
          <div className="pt-2 border-t border-red-200">
            <p className="text-xs font-semibold text-[var(--theta-red)] uppercase">
              30 Min Between Sessions
            </p>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-12 p-6 bg-gradient-to-r from-[var(--light-blue-50)] to-white rounded-xl border-l-4 border-[var(--theta-blue)]">
      <p className="text-gray-700 text-center font-medium">
        <span className="text-[var(--theta-blue)] font-bold">
          Your wellness matters.
        </span>{" "}
        Every detail in our facility is designed with your safety, comfort, and
        rejuvenation in mind.
      </p>
    </div>
  </div>
);

export default ConsolidatedBookingForm;
