"use client"

import type React from "react"
import { useEffect, useState, useCallback, useMemo, type ChangeEvent, type FormEvent } from "react"
import {
  CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  Unlock,
  Zap,
  XCircle,
  CheckCircle,
  Save,
} from "lucide-react"
import Swal from "sweetalert2"
import apiRequest from "../../core/axios" 

// --- DATE UTILITY FUNCTIONS ---
const _format = (date: Date, fmt: string): string => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayOfWeek = date.getDay()
  const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  if (fmt === "yyyy-MM-dd") {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }
  if (fmt === "MMM dd") {
    return `${monthsShort[date.getMonth()]} ${String(day)}`
  }
  if (fmt === "EEE") {
    return daysShort[dayOfWeek]
  }
  if (fmt === "EEEE, MMMM do, yyyy") {
    const daysLong = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const monthsLong = [
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    ]
    const suffix = (d: number) => {
      if (d > 3 && d < 21) return "th"
      switch (d % 10) {
        case 1: return "st"
        case 2: return "nd"
        case 3: return "rd"
        default: return "th"
      }
    }
    return `${daysLong[dayOfWeek]}, ${monthsLong[date.getMonth()]} ${day}${suffix(day)}, ${year}`
  }
  return date.toDateString()
}

const _addDays = (date: Date, days: number): Date => {
  const newDate = new Date(date)
  newDate.setDate(date.getDate() + days)
  return newDate
}

const _subDays = (date: Date, days: number): Date => {
  return _addDays(date, -days)
}

const _startOfDay = (date: Date): Date => {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

const _endOfDay = (date: Date): Date => {
  const d = _addDays(date, 1)
  d.setHours(0, 0, 0, 0)
  return d
}

const _isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

const _getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

const _getFirstDayOfMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
}

// --- TYPE DEFINITIONS & CONSTANTS ---
const DAY_STATUS = {
  BOOKABLE: "Bookable",
  CLOSED: "Closed",
  SOLD_OUT: "Sold Out",
} as const

type DayStatus = (typeof DAY_STATUS)[keyof typeof DAY_STATUS]

interface Hours {
  open: string
  close: string
}

interface Tank {
  _id: string
  name: string
  capacity: number
  length: number
  width: number
  benefits: string
  status: "Ready" | "Maintenance"
  // Removed hardcoded sessionDuration, but kept type for tank details if used later
  sessionDuration: number
}

interface FacilityDayData {
  date: string
  status: DayStatus
  hours: Hours
  totalAvailableSessions: number
  totalBookedSessions: number
  overrideData: CalendarDetailFromBackend[]
  // Added cycleDuration for UI display and clarity
  cycleDuration: number 
}

interface CalendarDetailFromBackend {
  _id?: string
  tankId: string
  date: string
  status: DayStatus
  openTime: string
  closeTime: string
  sessionsToSell: number
  bookedSessions: number
}

interface FacilityUpdatePayload {
  date: string
  status: DayStatus
  openTime: string
  closeTime: string
  sessionsToSell: number
}

interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

interface SystemSettings {
  defaultFloatPrice: number
  cleaningBuffer: number // Used for BREAK_DURATION_MINUTES
  sessionDuration: number // Used for SESSION_DURATION_MINUTES
  sessionsPerDay: number
  openTime: string
  closeTime: string
}

// --- SESSION CALCULATION UTILITY ---

/**
 * Calculates the number of full session cycles possible within the operating hours,
 * based on dynamic session and cleaning times.
 * @param openTime 'HH:mm'
 * @param closeTime 'HH:mm'
 * @param sessionDuration The duration of the session in minutes (e.g., 60)
 * @param cleaningBuffer The duration of the cleaning buffer/break in minutes (e.g., 30)
 * @returns number of sessions per tank
 */
const calculateSessionCountPerTank = (
  openTime: string,
  closeTime: string,
  sessionDuration: number,
  cleaningBuffer: number
): number => {
  const totalCycleMinutes = sessionDuration + cleaningBuffer
  if (totalCycleMinutes <= 0) return 0
    
  try {
    const fixedDate = "2000/01/01"
    const open = new Date(`${fixedDate} ${openTime}`)
    const close = new Date(`${fixedDate} ${closeTime}`)
    
    if (close.getTime() <= open.getTime()) return 0
    
    const durationMinutes = (close.getTime() - open.getTime()) / (60 * 1000)
    return Math.floor(durationMinutes / totalCycleMinutes)
  } catch (e) {
    console.error("Error calculating session count:", e);
    return 0
  }
}

// --- MINIMAL DEFAULT DATA (Failover Only) ---
// Using 60 and 30 as a sensible default if the API fetch fails completely
const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  defaultFloatPrice: 27,
  cleaningBuffer: 30, 
  sessionDuration: 60,
  sessionsPerDay: 7,
  openTime: "10:00", 
  closeTime: "21:00",
}

// --- API SERVICE ---
const CALENDAR_API_BASE_URL = "/calendar"
const SETTINGS_API_BASE_URL = "/system-settings"
const TANK_API_BASE_URL = "/tanks"

const apiService = {
getSystemSettings: async (): Promise<SystemSettings> => {
  try {
    const response = await apiRequest.get<SystemSettings>(SETTINGS_API_BASE_URL)

    return { ...DEFAULT_SYSTEM_SETTINGS, ...response }  // ✅ FIXED
  } catch (error) {
    Swal.fire({
      icon: "error",
      title: "Failed to Load Settings",
      text: "Could not fetch system settings. Using defaults.",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
    })
    return DEFAULT_SYSTEM_SETTINGS
  }
}
,
  getAllTanks: async (): Promise<Tank[]> => {
    try {
      const response = await apiRequest.get<Tank[]>(TANK_API_BASE_URL)
      return response || []
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Tanks",
        text: "Could not fetch tanks. Assuming 0 ready tanks.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      })
      return []
    }
  },
  getCalendarOverrides: async (
    formattedStartDate: string,
    formattedEndDate: string,
  ): Promise<CalendarDetailFromBackend[]> => {
    try {
      const apiResponse = await apiRequest.get<ApiResponse<CalendarDetailFromBackend[]>>(CALENDAR_API_BASE_URL, {
        params: { startDate: formattedStartDate, endDate: formattedEndDate },
      })
      if (apiResponse.success && apiResponse.data) {
        return apiResponse.data.map((override) => ({
          ...override,
          bookedSessions: Math.min(override.sessionsToSell, override.bookedSessions || 0),
          tankId: override.tankId || "missing-tank-id",
        }))
      }
      return []
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Load Calendar",
        text: "Could not fetch calendar overrides. Showing defaults only.",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      })
      return []
    }
  },
  updateFacilityStatus: async (
    date: string,
    status: DayStatus,
    openTime: string,
    closeTime: string,
    sessionsToSell: number,
  ): Promise<boolean> => {
    try {
      const payload: FacilityUpdatePayload = {
        date,
        status,
        openTime,
        closeTime,
        sessionsToSell,
      }
      const apiResponse = await apiRequest.post<ApiResponse<any>>(CALENDAR_API_BASE_URL, payload)
      if (apiResponse.success) {
        return true
      } else {
        return false
      }
    } catch (error: any) {
      const displayError =
        (error && error.message) ||
        (error && error.data && error.data.message) ||
        "Unknown server error or network issue."
      throw new Error(`Save failed: ${displayError}`)
    }
  },
}

// --- UI COMPONENTS ---
interface DaySettingsSidebarProps {
  isOpen: boolean
  onClose: () => void
  dayData: FacilityDayData | null 
  onSave: () => Promise<void> 
  readyTankCount: number
  cycleDuration: number // Passed from App component
}

const DaySettingsSidebar: React.FC<DaySettingsSidebarProps> = ({
  isOpen,
  onClose,
  dayData,
  onSave,
  readyTankCount,
  cycleDuration, // Used here
}) => {
  const [openTime, setOpenTime] = useState(dayData?.hours.open || DEFAULT_SYSTEM_SETTINGS.openTime)
  const [closeTime, setCloseTime] = useState(dayData?.hours.close || DEFAULT_SYSTEM_SETTINGS.closeTime)
  const [status, setStatus] = useState<DayStatus>(dayData?.status || DAY_STATUS.BOOKABLE)
  const [isSaving, setIsSaving] = useState(false)
  
  // Recalculate sessions using current local state times and fetched global cycle duration
  const maxSessionsPerTank = useMemo(() => {
    // Note: We need the individual session and buffer times, not the cycle duration.
    // If the systemSettings is available in the main App, we should pass those too.
    // For now, relying on the calculation in the main component.
    
    // For calculating max sessions in the sidebar, we'll use the hardcoded/default duration values
    // as we don't have access to systemSettings.sessionDuration/cleaningBuffer here directly.
    // However, since we rely on 'cycleDuration' passed from App, we should use a consistent calculation.
    // Let's rely on the cycleDuration passed from the parent for consistency.
    
    if (cycleDuration <= 0) return 0;

    try {
      const fixedDate = "2000/01/01"
      const open = new Date(`${fixedDate} ${openTime}`)
      const close = new Date(`${fixedDate} ${closeTime}`)
      if (close.getTime() <= open.getTime()) return 0
      const durationMinutes = (close.getTime() - open.getTime()) / (60 * 1000)
      return Math.floor(durationMinutes / cycleDuration)
    } catch (e) {
      return 0
    }
  }, [openTime, closeTime, cycleDuration])
  
  const calculatedFacilitySessions = maxSessionsPerTank * readyTankCount

  useEffect(() => {
    if (dayData) {
      setOpenTime(dayData.hours.open)
      setCloseTime(dayData.hours.close)
      setStatus(dayData.status)
    }
  }, [dayData])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!dayData) return

    if (status === DAY_STATUS.BOOKABLE) {
      if (!openTime || !closeTime) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: "Open and Close times are required for a Bookable status.",
        })
        return
      }
      if (maxSessionsPerTank <= 0) {
        Swal.fire({
          icon: "warning",
          title: "Validation Error",
          text: `Operating hours must allow at least one full session + cleaning cycle (${cycleDuration} minutes).`,
        })
        return
      }
    }

    const finalSessionsToSell = status === DAY_STATUS.BOOKABLE ? calculatedFacilitySessions : 0
    setIsSaving(true)
    try {
      const success = await apiService.updateFacilityStatus(
        dayData.date,
        status,
        openTime,
        closeTime,
        finalSessionsToSell,
      )
      if (success) {
        Swal.fire({
          icon: "success",
          title: "Settings Updated",
          text: "Facility day settings have been updated successfully.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        })
        await onSave()
        onClose()
      } else {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: "Failed to save changes due to a server policy error.",
        })
      }
    } catch (e: any) {
      const displayError = e.message || "An unexpected network or server error occurred."
      Swal.fire({
        icon: "error",
        title: "Error",
        text: displayError,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!dayData) return null 

  const sidebarClass = `fixed inset-y-0 right-0 w-80 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out z-[100] ${isOpen ? "translate-x-0" : "translate-x-full"}`
  const formattedDate = _format(new Date(dayData.date), "EEEE, MMMM do, yyyy")

  return (
    <>
      <div className={sidebarClass}>
        <div className="flex justify-between items-center pb-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Facility Day Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
            <X className="h-6 w-6" />
          </button>
        </div>
        <form onSubmit={handleSave} className="mt-4 space-y-4 h-[calc(100%-60px)] flex flex-col">
          <h3 className="text-lg font-bold text-gray-700">{formattedDate}</h3>
          <p className="text-sm text-gray-500">
            This update sets the **status and hours for ALL {readyTankCount} ready tanks**.
          </p>
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Facility Status
            </label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStatus(DAY_STATUS.BOOKABLE)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.BOOKABLE ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <CheckCircle className="inline h-4 w-4 mr-1" /> Open
              </button>
              <button
                type="button"
                onClick={() => setStatus(DAY_STATUS.CLOSED)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.CLOSED ? "bg-red-100 text-red-700 border border-red-300" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                <XCircle className="inline h-4 w-4 mr-1" /> Closed
              </button>
            </div>
          </div>
          {status === DAY_STATUS.BOOKABLE && (
            <div className="space-y-4 pt-2">
              <h4 className="text-base font-medium text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2" /> Operating Hours
              </h4>
              <div className="flex gap-4">
                <div>
                  <label htmlFor="openTime" className="block text-sm font-medium text-gray-700">
                    Open Time
                  </label>
                  <input
                    id="openTime"
                    type="time"
                    value={openTime}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOpenTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700">
                    Close Time
                  </label>
                  <input
                    id="closeTime"
                    type="time"
                    value={closeTime}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setCloseTime(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Calculated Total Sessions ({readyTankCount} ready tanks * {cycleDuration} min cycle)
                </label>
                <div className="mt-1 block w-full rounded-md bg-gray-100 border border-gray-300 shadow-sm p-2 text-lg font-bold text-blue-700">
                  {calculatedFacilitySessions}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Max sessions calculated based on hours for all ready tanks.
                </p>
              </div>
            </div>
          )}
          <div className="mt-auto pt-4 border-t">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
            >
              <Save className="h-5 w-5 mr-2" />
              {isSaving ? "Applying Globally..." : "Apply Status & Hours"}
            </button>
          </div>
        </form>
      </div>
      {isOpen && <div className="fixed inset-0 z-[99] bg-black bg-opacity-25" onClick={onClose} />}
    </>
  )
}

interface DateRangeDisplayProps {
  startDate: Date | null
  endDate: Date | null
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
}

const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<"start" | "end">("start")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const getDaysInCalendar = () => {
    const firstDay = _getFirstDayOfMonth(currentMonth)
    const daysInMonth = _getDaysInMonth(currentMonth)
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i)
      days.push(date)
    }
    return days
  }

  const handleDayClick = (day: Date | null) => {
    if (!day) return
    if (mode === "start") {
      onStartDateChange(day)
      setMode("end")
    } else {
      if (startDate && day < startDate) {
        onEndDateChange(startDate)
        onStartDateChange(day)
      } else {
        onEndDateChange(day)
      }
      setIsOpen(false)
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onStartDateChange(_startOfDay(new Date()))
    onEndDateChange(_startOfDay(new Date()))
    setMode("start")
    setIsOpen(false)
  }

  let displayValue = "Select a date range"
  if (startDate && endDate) {
    displayValue = `${_format(startDate, "yyyy-MM-dd")} — ${_format(endDate, "yyyy-MM-dd")}`
  } else if (startDate) {
    displayValue = `${_format(startDate, "yyyy-MM-dd")} — ...`
  }

  const today = _startOfDay(new Date())
  const calendarDays = getDaysInCalendar()

  return (
    <div className="relative w-72">
      <div
        className="relative flex items-center bg-white border border-gray-300 rounded-lg shadow-sm w-full h-[46px] cursor-pointer hover:border-gray-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="absolute left-3 h-5 w-5 text-gray-400 z-10 pointer-events-none" />
        <span className="pl-10 pr-10 py-2 w-full text-center text-sm text-gray-800 font-medium overflow-hidden text-ellipsis whitespace-nowrap">
          {displayValue}
        </span>
        {(startDate || endDate) && (
          <button
            onClick={handleClear}
            className="absolute right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear dates"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 w-80">
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-700">
                {mode === "start" ? "Select Start Date" : "Select End Date"}
              </div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(_addDays(currentMonth, -32))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-medium">
                  {_format(currentMonth, "MMMM yyyy").split(",")[0].split(" ").slice(0, 2).join(" ")}{" "}
                  {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() => setCurrentMonth(_addDays(currentMonth, 32))}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className="text-xs font-semibold text-gray-500">
                    {day}
                  </div>
                ))}
                {calendarDays.map((day, idx) => {
                  const isToday = day && _isSameDay(day, today)
                  const isPastDate = day && day < today
                  const isStartDate = day && startDate && _isSameDay(day, startDate)
                  const isEndDate = day && endDate && _isSameDay(day, endDate)
                  const isInRange = day && startDate && endDate && day > startDate && day < endDate
                  const isInvalidEnd = day && mode === "end" && startDate && day < startDate
                  return (
                    <button
                      key={idx}
                      onClick={() => day && !isPastDate && !isInvalidEnd && handleDayClick(day)}
                      disabled={Boolean(!day || isPastDate || isInvalidEnd)}
                      className={`p-2 rounded text-sm font-medium transition-colors ${
                        !day || isPastDate || isInvalidEnd
                          ? "text-gray-300 cursor-not-allowed"
                          : isStartDate || isEndDate
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : isInRange
                              ? "bg-blue-100 text-blue-700"
                              : isToday
                                ? "border-2 border-blue-600 text-gray-700 hover:bg-blue-50"
                                : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {day?.getDate()}
                    </button>
                  )
                })}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Start:</span>
                  <span className="font-medium">{startDate ? _format(startDate, "yyyy-MM-dd") : "Not set"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">End:</span>
                  <span className="font-medium">{endDate ? _format(endDate, "yyyy-MM-dd") : "Not set"}</span>
                </div>
                {startDate && (
                  <button
                    onClick={() => setMode(mode === "start" ? "end" : "start")}
                    className="w-full mt-2 py-2 px-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {mode === "start" ? "Switch to End Date" : "Switch to Start Date"}
                  </button>
                )}
                {startDate && endDate && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-full mt-2 py-2 px-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    Confirm
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const initialStartDate = _startOfDay(new Date())
  const initialEndDate = _startOfDay(_addDays(new Date(), 29))
  const [startDate, setStartDate] = useState<Date>(initialStartDate)
  const [endDate, setEndDate] = useState<Date>(initialEndDate)
  const [calendarDays, setCalendarDays] = useState<FacilityDayData[]>([])
  const [loading, setLoading] = useState(true)
  const [tanks, setTanks] = useState<Tank[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null) 

  const readyTankCount = useMemo(() => {
    return tanks.filter((tank) => tank.status === "Ready").length
  }, [tanks])
  
  // Calculate Cycle Duration based on fetched settings
  const totalCycleMinutes = useMemo(() => {
    if (!systemSettings) return 0;
    return systemSettings.sessionDuration + systemSettings.cleaningBuffer;
  }, [systemSettings]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedDayData, setSelectedDayData] = useState<FacilityDayData | null>(null)

  // 1. Fetch Tanks and Settings first
  const fetchInitialData = useCallback(async () => {
    setLoading(true)
    const [fetchedSettings, fetchedTanks] = await Promise.all([
      apiService.getSystemSettings(),
      apiService.getAllTanks(),
    ])
    setSystemSettings(fetchedSettings)
    setTanks(fetchedTanks)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchInitialData()
  }, [fetchInitialData])

  // 2. Fetch Calendar Data after tanks and settings are loaded
  const fetchCalendarData = useCallback(
    async (isInitialLoad = false) => {
      if (!systemSettings || loading) return

      if (isInitialLoad) setLoading(true)

      const currentReadyTankCount = tanks.filter((tank) => tank.status === "Ready").length
      
      const { openTime: defaultOpenTime, closeTime: defaultCloseTime, sessionDuration, cleaningBuffer } = systemSettings;
      
      try {
        const formattedStartDate = _format(startDate, "yyyy-MM-dd")
        const formattedEndDate = _format(endDate, "yyyy-MM-dd")
        const facilityOverrides = await apiService.getCalendarOverrides(formattedStartDate, formattedEndDate)

        const dates: Date[] = []
        let currentDate = _startOfDay(startDate)
        const end = _endOfDay(endDate)
        while (currentDate.getTime() < end.getTime()) {
          dates.push(currentDate)
          currentDate = _addDays(currentDate, 1)
        }

        const newCalendarDays: FacilityDayData[] = dates.map((date) => {
          const dateKey = _format(date, "yyyy-MM-dd")
          const facilityRecord = facilityOverrides.find((o) => o.date === dateKey)

          // Use system defaults as a base for the day
          let status: DayStatus = DAY_STATUS.BOOKABLE
          let openTime = defaultOpenTime
          let closeTime = defaultCloseTime
          let totalSessionsToSell = 0
          let totalBookedSessions = 0
          
          // Apply override if it exists
          if (facilityRecord) {
            status = facilityRecord.status
            openTime = facilityRecord.openTime || defaultOpenTime
            closeTime = facilityRecord.closeTime || defaultCloseTime
            totalSessionsToSell = facilityRecord.sessionsToSell
            totalBookedSessions = facilityRecord.bookedSessions
          } 
          
          // Calculate sessions based on effective hours and dynamic duration settings
          const sessionsPerTank = calculateSessionCountPerTank(
            openTime, 
            closeTime, 
            sessionDuration, 
            cleaningBuffer
          )
          
          // If no override, recalculate sessionsToSell based on tank count
          if (!facilityRecord) {
             totalSessionsToSell = sessionsPerTank * currentReadyTankCount
          }

          let totalAvailableSessions = totalSessionsToSell - totalBookedSessions
          
          if (status === DAY_STATUS.CLOSED) {
            totalAvailableSessions = 0
            totalSessionsToSell = 0
          } else if (totalAvailableSessions <= 0 && totalSessionsToSell > 0) {
            status = DAY_STATUS.SOLD_OUT
            totalAvailableSessions = 0
          }

          return {
            date: dateKey,
            status: status,
            hours: { open: openTime, close: closeTime },
            totalAvailableSessions,
            totalBookedSessions,
            overrideData: facilityRecord ? [facilityRecord] : [],
            cycleDuration: sessionDuration + cleaningBuffer, // Pass cycle duration for UI clarity
          }
        })
        setCalendarDays(newCalendarDays)
      } catch (err) {
        console.error("Failed to process calendar data:", err)
        setCalendarDays([])
      } finally {
        if (isInitialLoad) setLoading(false)
      }
    },
    [startDate, endDate, tanks, systemSettings, loading],
  )

  useEffect(() => {
    if (systemSettings) {
        fetchCalendarData(false) 
    }
  }, [startDate, endDate, readyTankCount, systemSettings, fetchCalendarData])

  const navigateDateRange = (direction: "prev" | "next") => {
    if (!startDate || !endDate) return
    const rangeDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    let newStart, newEnd
    if (direction === "next") {
      newStart = _addDays(startDate, rangeDurationDays)
      newEnd = _addDays(endDate, rangeDurationDays)
    } else {
      newStart = _subDays(startDate, rangeDurationDays)
      newEnd = _subDays(endDate, rangeDurationDays)
      const today = _startOfDay(new Date())
      if (newEnd < today) {
        newStart = today
        newEnd = _addDays(today, rangeDurationDays - 1)
      }
    }
    setStartDate(newStart)
    setEndDate(newEnd)
  }

  const openDaySettings = (dayData: FacilityDayData) => {
    setSelectedDayData(dayData)
    setIsSidebarOpen(true)
  }

  const toggleDayStatus = async (dayData: FacilityDayData) => {
    if (!dayData || !dayData.date || !systemSettings) return
    if (dayData.status === DAY_STATUS.SOLD_OUT) return

    const newStatus: DayStatus = dayData.status === DAY_STATUS.CLOSED ? DAY_STATUS.BOOKABLE : DAY_STATUS.CLOSED
    
    // Recalculate sessions using current day hours and dynamic duration settings
    const sessionsPerTank = calculateSessionCountPerTank(
        dayData.hours.open, 
        dayData.hours.close, 
        systemSettings.sessionDuration, 
        systemSettings.cleaningBuffer
    )
    const calculatedFacilitySessions = sessionsPerTank * readyTankCount
    
    const sessionsToSend = newStatus === DAY_STATUS.CLOSED ? 0 : calculatedFacilitySessions

    try {
      await apiService.updateFacilityStatus(
        dayData.date,
        newStatus,
        dayData.hours.open,
        dayData.hours.close,
        sessionsToSend,
      )
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Day status changed to ${newStatus}`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      })
      fetchCalendarData()
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed to Toggle Status",
        text: "Could not update the day status. Please try again.",
      })
    }
  }

  const getStatusColor = (status: DayStatus): string => {
    switch (status) {
      case DAY_STATUS.BOOKABLE:
        return "bg-green-100 text-green-700 hover:bg-green-200"
      case DAY_STATUS.CLOSED:
        return "bg-red-100 text-red-700 hover:bg-red-200"
      case DAY_STATUS.SOLD_OUT:
        return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  const dates = useMemo(() => {
    if (!startDate || !endDate) return []
    const days: Date[] = []
    let currentDate = _startOfDay(startDate)
    const end = _endOfDay(endDate)
    while (currentDate.getTime() < end.getTime()) {
      days.push(currentDate)
      currentDate = _addDays(currentDate, 1)
    }
    return days
  }, [startDate, endDate])

  const daysCount = dates.length

  const getCellWidth = (): string => {
    if (daysCount <= 7) return "w-32"
    if (daysCount <= 14) return "w-24"
    return "w-20"
  }
  
  const isDataReady = !loading && systemSettings !== null

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      {/* Sticky Header with Date Range Selector and Navigation */}
      <div className="sticky top-0 p-4 z-30 bg-white shadow-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
          {/* Title */}
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
              <CalendarIcon className="h-7 w-7 mr-3 text-blue-600" />
              Tank Reservation Calendar
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage availability and bookings for your floating therapy pods (Facility-Wide View).
            </p>
          </div>
          {/* Date Navigation and Display */}
          <div className="flex items-center space-x-3">
            {/* Prev Button */}
            <button
              onClick={() => navigateDateRange("prev")}
              disabled={_isSameDay(_startOfDay(startDate), _startOfDay(new Date()))}
              className="p-2 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous range"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <DateRangeDisplay
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />
            {/* Next Button */}
            <button
              onClick={() => navigateDateRange("next")}
              className="p-2 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
              aria-label="Next range"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isDataReady ? (
          <div className="text-center py-20 text-xl font-medium text-gray-500">
            <span className="animate-pulse">Loading settings and tanks...</span>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
              <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-blue-500" />
                Facility Calendar View ({readyTankCount} Ready Tanks Combined)
              </h2>
            </div>
            <div className="overflow-x-auto relative">
              <table className="min-w-full divide-y divide-gray-200 border-collapse">
                <thead>
                  <tr className="bg-gray-50 sticky top-0 z-20">
                    <th className="sticky left-0 bg-gray-50 p-3 text-left text-xs font-semibold text-gray-600 uppercase w-32 min-w-[128px] border-r border-gray-200 shadow-inner-right">
                      Dates
                    </th>
                    {dates.map((date, index) => {
                      const formattedDate = _format(date, "MMM dd")
                      const dayOfWeek = _format(date, "EEE")
                      // Find the corresponding calendar data for the date
                      const dayData =
                        calendarDays.find((d) => d.date === _format(date, "yyyy-MM-dd")) || ({} as FacilityDayData)
                      return (
                        <th
                          key={index}
                          className={`${getCellWidth()} p-2 text-center text-xs font-semibold uppercase cursor-pointer hover:bg-blue-50 transition-colors`}
                          onClick={() => openDaySettings(dayData)}
                        >
                          <div className="text-gray-900 font-bold text-sm">{formattedDate}</div>
                          <div className="text-gray-500">{dayOfWeek}</div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                      Tank Status
                    </td>
                    {calendarDays.map((dayData, index) => {
                      const canToggle = dayData.status !== DAY_STATUS.SOLD_OUT
                      return (
                        <td key={index} className={`${getCellWidth()} p-2 text-center`}>
                          <button
                            onClick={() => dayData.date && canToggle && toggleDayStatus(dayData)}
                            disabled={Boolean(!dayData.date || !canToggle)}
                            className={`w-full py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${getStatusColor(dayData.status)}`}
                          >
                            <span className="flex items-center justify-center">
                              {dayData.status === DAY_STATUS.CLOSED && <Lock className="h-3 w-3 mr-1" />}
                              {dayData.status === DAY_STATUS.BOOKABLE && <Unlock className="h-3 w-3 mr-1" />}
                              {dayData.status === DAY_STATUS.SOLD_OUT ? "SOLD OUT" : dayData.status.toUpperCase()}
                            </span>
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                      Open Time
                    </td>
                    {calendarDays.map((dayData, index) => {
                      const timeDisplay = dayData.hours?.open || "-"
                      return (
                        <td
                          key={`open-${index}`}
                          className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {dayData.status === DAY_STATUS.CLOSED ? "-" : timeDisplay}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                      Close Time
                    </td>
                    {calendarDays.map((dayData, index) => {
                      const timeDisplay = dayData.hours?.close || "-"
                      return (
                        <td
                          key={`close-${index}`}
                          className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? "text-gray-400" : "text-gray-700"}`}
                        >
                          {dayData.status === DAY_STATUS.CLOSED ? "-" : timeDisplay}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-t border-gray-200">
                    <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                      Available Sessions
                    </td>
                    {calendarDays.map((dayData, index) => {
                      const availableCount = dayData.totalAvailableSessions
                      const isLow = availableCount > 0 && availableCount < readyTankCount
                      return (
                        <td
                          key={index}
                          className={`${getCellWidth()} p-2 text-center text-sm font-semibold ${dayData.status === DAY_STATUS.CLOSED ? "text-gray-500" : isLow ? "text-orange-600" : "text-green-600"}`}
                        >
                          {dayData.status === DAY_STATUS.CLOSED ? "-" : availableCount}
                        </td>
                      )
                    })}
                  </tr>
                  <tr className="border-t border-gray-100">
                    <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                      Booked Sessions
                    </td>
                    {calendarDays.map((dayData, index) => {
                      return (
                        <td
                          key={index}
                          className={`${getCellWidth()} p-2 text-center text-sm font-semibold text-blue-600`}
                        >
                          {dayData.status === DAY_STATUS.CLOSED ? "-" : dayData.totalBookedSessions}
                        </td>
                      )
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {isSidebarOpen && selectedDayData && systemSettings && (
        <DaySettingsSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          dayData={selectedDayData}
          onSave={fetchCalendarData}
          readyTankCount={readyTankCount}
          // Pass the dynamically calculated total cycle time
          cycleDuration={totalCycleMinutes}
        />
      )}
    </div>
  )
}

export default App