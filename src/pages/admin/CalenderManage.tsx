"use client";

import { useEffect, useState, useCallback, useMemo, type ChangeEvent, type FormEvent } from "react";
import { Calendar as CalendarIcon, X, Clock, Edit, Lock, Unlock, Zap, XCircle, CheckCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Import the actual apiRequest from axios.ts ---
import apiRequest from "../../core/axios"; 

// --- DATE UTILITY REPLACEMENTS (Keep as is) ---
const _format = (date: Date, fmt: string): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (fmt === 'yyyy-MM-dd') {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (fmt === 'MMM dd') {
        return `${monthsShort[date.getMonth()]} ${String(day)}`;
    }
    if (fmt === 'EEE') {
        return daysShort[dayOfWeek];
    }
    if (fmt === 'EEEE, MMMM do, yyyy') {
        const daysLong = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const monthsLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const suffix = (d: number) => {
            if (d > 3 && d < 21) return 'th';
            switch (d % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        return `${daysLong[dayOfWeek]}, ${monthsLong[date.getMonth()]} ${day}${suffix(day)}, ${year}`;
    }
    return date.toDateString(); 
};

const _addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
};

const _subDays = (date: Date, days: number): Date => {
    return _addDays(date, -days);
};

const _startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

const _endOfDay = (date: Date): Date => {
    const d = _addDays(date, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

const _isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};


// --- TYPE DEFINITIONS ---

const DAY_STATUS = {
    BOOKABLE: 'Bookable',
    CLOSED: 'Closed',
    SOLD_OUT: 'Sold Out',
} as const;

type DayStatus = typeof DAY_STATUS[keyof typeof DAY_STATUS];

interface Hours {
    open: string; // e.g., "09:00"
    close: string; // e.g., "21:00"
}

// Tank Model (Dynamic, fetched from API)
interface Tank { 
    _id: string;
    name: string; 
    sessionDuration: number; // Duration in minutes (e.g., 60 minutes)
}

/** Represents the aggregated/consolidated data for a single calendar day (one table row). */
interface FacilityDayData {
    date: string; // "yyyy-MM-dd"
    status: DayStatus;
    hours: Hours;
    totalAvailableSessions: number; // Sum of available sessions across all tanks
    totalBookedSessions: number; // Sum of booked sessions across all tanks
    overrideData: CalendarDetailFromBackend[]; 
}

/** The structure for calendar data fetched from the provided backend GET endpoint. */
interface CalendarDetailFromBackend {
    _id?: string; 
    tankId: string; 
    date: string; 
    status: DayStatus;
    openTime: string; 
    closeTime: string; 
    sessionsToSell: number;
    bookedSessions: number; 
}

/** The POST payload structure for a facility-wide update (tankId omitted). */
interface FacilityUpdatePayload {
    date: string;
    status: DayStatus;
    openTime: string;
    closeTime: string;
    sessionsToSell: number; 
}

/** The overall response structure expected from the backend GET/POST endpoints. */
interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// System Settings (Global Defaults)
interface SystemSettings {
    defaultFloatPrice: number;
    cleaningBuffer: number;
    sessionsPerDay: number;
    openTime: string; // Used for default hours
    closeTime: string; // Used for default hours
}


// --- SESSION CALCULATION UTILITY ---

// User requirement: 1 hour session (60 min) + 1/2 hour cleaning (30 min) = 90 min total cycle
const SESSION_DURATION_MINUTES = 60;
const BREAK_DURATION_MINUTES = 30; 
const TOTAL_CYCLE_MINUTES = SESSION_DURATION_MINUTES + BREAK_DURATION_MINUTES; // 90 minutes

/**
 * Calculates the maximum number of full sessions based on the fixed 90-minute cycle time.
 * This function calculates the max sessions available in the time slot for ONE single resource.
 */
const calculateSessionCountPerTank = (openTime: string, closeTime: string): number => {
    const cycleTime = TOTAL_CYCLE_MINUTES;

    try {
        const fixedDate = '2000/01/01'; 
        const open = new Date(`${fixedDate} ${openTime}`);
        const close = new Date(`${fixedDate} ${closeTime}`);

        if (close.getTime() <= open.getTime()) return 0; 

        const durationMinutes = (close.getTime() - open.getTime()) / (60 * 1000);
        return Math.floor(durationMinutes / cycleTime);
    } catch (e) {
        return 0;
    }
}


// --- BASE DATA DEFAULTS ---

const GLOBAL_DEFAULTS: SystemSettings = {
    defaultFloatPrice: 0,
    cleaningBuffer: 30,
    sessionsPerDay: 8,
    openTime: '09:00', 
    closeTime: '21:00' 
};

// Placeholder for a base tank used only for sidebar default generation
const DEFAULT_TANK: Tank = { _id: "default-tank-id", name: "Default", sessionDuration: SESSION_DURATION_MINUTES };


/**
 * Generates the base DayData for a single tank, including mocked bookings.
 */
const generateBaseDayData = (date: Date, tank: Tank, settings: SystemSettings, totalFacilitySessions: number): CalendarDetailFromBackend => {
    const openTime = settings.openTime;
    const closeTime = settings.closeTime;
    
    // Sessions based on global time/default hours (Per Tank)
    const sessionsAvailablePerTank = calculateSessionCountPerTank(openTime, closeTime);
    
    // We mock the booked sessions based on the single tank's capacity for the default record
    let bookedSessionsPerTank = Math.floor(Math.random() * (sessionsAvailablePerTank * 0.5)); 
    
    return {
        tankId: tank._id, 
        date: _format(date, 'yyyy-MM-dd'),
        status: DAY_STATUS.BOOKABLE,
        openTime: openTime, 
        closeTime: closeTime,
        // For the detail, we store per-tank sessions, but for the main table, we use the aggregated total
        sessionsToSell: sessionsAvailablePerTank, 
        bookedSessions: bookedSessionsPerTank, 
    };
};


// --- API SERVICE IMPLEMENTATION ---

const CALENDAR_API_BASE_URL = "/calendar";
const SETTINGS_API_BASE_URL = "/system-settings";
const TANK_API_BASE_URL = "/tanks"; // New API base URL

const apiService = {
    getSystemSettings: async (): Promise<SystemSettings> => {
        try {
            const response = await apiRequest.get<{ data: SystemSettings }>(SETTINGS_API_BASE_URL); 
            return { ...GLOBAL_DEFAULTS, ...response.data };
        } catch (error) {
            return GLOBAL_DEFAULTS;
        }
    },

    // NEW API CALL to fetch all tanks
    getAllTanks: async (): Promise<Tank[]> => {
        try {
            const response = await apiRequest.get<Tank[]>(TANK_API_BASE_URL); 
            // Assuming the tank endpoint returns an array of tanks directly
            return response || [];
        } catch (error) {
            console.error("❌ Failed to fetch tanks. Falling back to 0 tanks.", error);
            return [];
        }
    },
    
    getCalendarOverrides: async (formattedStartDate: string, formattedEndDate: string): Promise<CalendarDetailFromBackend[]> => {
        try {
            // Assuming this still fetches facility-wide or all tank overrides for the range
            const apiResponse = await apiRequest.get<ApiResponse<CalendarDetailFromBackend[]>>(CALENDAR_API_BASE_URL, {
                params: { startDate: formattedStartDate, endDate: formattedEndDate }
            });

            if (apiResponse.success && apiResponse.data) {
                return apiResponse.data.map(override => ({
                    ...override,
                    // Use sessionsToSell field to store the Facility TOTAL sessions
                    // Mock booked sessions based on the total sessions to sell
                    bookedSessions: Math.min(override.sessionsToSell, override.bookedSessions !== undefined ? override.bookedSessions : Math.floor(Math.random() * (override.sessionsToSell * 0.2))),
                    tankId: override.tankId || DEFAULT_TANK._id, // Ensure tankId exists for typing consistency
                }));
            }
            return [];
        } catch (error) {
            console.error("❌ Failed to fetch calendar overrides.", error);
            return [];
        }
    },

    /**
     * Performs a POST request for a facility-wide update, including the CALCULATED TOTAL sessionsToSell.
     */
    updateFacilityStatus: async (
        date: string, 
        status: DayStatus, 
        openTime: string, 
        closeTime: string,
        sessionsToSell: number // This is the total for ALL tanks
    ): Promise<boolean> => {
        try {
            const payload: FacilityUpdatePayload = {
                date,
                status,
                openTime,
                closeTime,
                sessionsToSell, 
            };

            const apiResponse = await apiRequest.post<ApiResponse<any>>(CALENDAR_API_BASE_URL, payload);
            
            if (apiResponse.success) {
                return true;
            } else {
                return false;
            }
        } catch (error: any) {
            const displayError = (error && error.message) || (error && error.data && error.data.message) || "Unknown server error or network issue.";
            throw new Error(`Save failed: ${displayError}`);
        }
    }
};

// --- UI COMPONENTS ---

interface DaySettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    dayData: FacilityDayData;
    onSave: () => void;
    tankCount: number; // Pass dynamic tank count
}

const DaySettingsSidebar: React.FC<DaySettingsSidebarProps> = ({ isOpen, onClose, dayData, onSave, tankCount }) => {
    
    const [openTime, setOpenTime] = useState(dayData.hours.open);
    const [closeTime, setCloseTime] = useState(dayData.hours.close);
    const [status, setStatus] = useState<DayStatus>(dayData.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Calculate max sessions for ONE tank based on current hours
    const maxSessionsPerTank = useMemo(() => {
        return calculateSessionCountPerTank(openTime, closeTime);
    }, [openTime, closeTime]);

    // Calculate total sessions for the entire facility using the dynamic tank count
    const calculatedFacilitySessions = maxSessionsPerTank * tankCount;

    useEffect(() => {
        setOpenTime(dayData.hours.open);
        setCloseTime(dayData.hours.close);
        setStatus(dayData.status);
        setError(null);
    }, [dayData]);


    const handleSave = async (e: FormEvent) => {
        e.preventDefault(); 
        if (!dayData) return; 

        if (status === DAY_STATUS.BOOKABLE) {
            if (!openTime || !closeTime) {
                setError("Open and Close times are required for a Bookable status.");
                return;
            }
            if (maxSessionsPerTank <= 0) {
                 setError(`Operating hours must allow for at least one ${TOTAL_CYCLE_MINUTES}-minute cycle.`);
                 return;
            }
        }

        const finalSessionsToSell = status === DAY_STATUS.BOOKABLE ? calculatedFacilitySessions : 0;
        
        setError(null);
        setIsSaving(true);
        
        try {
            const success = await apiService.updateFacilityStatus(
                dayData.date, 
                status, 
                openTime, 
                closeTime,
                finalSessionsToSell // SENDING THE CALCULATED COUNT
            );

            if (success) {
                await onSave(); 
                onClose();
            } else {
                setError("Failed to save changes due to a server policy error.");
            }
        } catch (e: any) {
            const displayError = e.message || "An unexpected network or server error occurred.";
            setError(displayError);
        } finally {
            setIsSaving(false);
        }
    };

    const sidebarClass = `fixed inset-y-0 right-0 w-80 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out z-[100] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;
    const formattedDate = _format(new Date(dayData.date), 'EEEE, MMMM do, yyyy');

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
                        This update sets the **status and hours for ALL {tankCount} tanks**.
                    </p>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative text-sm" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline ml-1">{error}</span>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Facility Status</label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setStatus(DAY_STATUS.BOOKABLE)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.BOOKABLE ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <CheckCircle className="inline h-4 w-4 mr-1" /> Open
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus(DAY_STATUS.CLOSED)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.CLOSED ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
                                    <label htmlFor="openTime" className="block text-sm font-medium text-gray-700">Open Time</label>
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
                                    <label htmlFor="closeTime" className="block text-sm font-medium text-gray-700">Close Time</label>
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
                            {/* Display Calculated Session Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Calculated Total Sessions ({tankCount} tanks * {TOTAL_CYCLE_MINUTES} min cycle)
                                </label>
                                <div className="mt-1 block w-full rounded-md bg-gray-100 border border-gray-300 shadow-sm p-2 text-lg font-bold text-blue-700">
                                    {calculatedFacilitySessions}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max sessions calculated based on hours for all tanks.
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Save Button is inside the form */}
                    <div className="mt-auto pt-4 border-t">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                        >
                            <Save className="h-5 w-5 mr-2" />
                            {isSaving ? 'Applying Globally...' : 'Apply Status & Hours'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[99] bg-black bg-opacity-25"
                    onClick={onClose}
                />
            )}
        </>
    );
};

// 5. Date Range Display (Unchanged)
interface DateRangeDisplayProps {
    startDate: Date | null;
    endDate: Date | null;
}

const DateRangeDisplay: React.FC<DateRangeDisplayProps> = ({ startDate, endDate }) => {
    let displayValue = "Select a date range";
    if (startDate && endDate) {
        displayValue = `${_format(startDate, "yyyy-MM-dd")} — ${_format(endDate, "yyyy-MM-dd")}`;
    } else if (startDate) {
        displayValue = `${_format(startDate, "yyyy-MM-dd")} — ...`;
    }

    return (
        <div className="relative flex items-center bg-white border border-gray-300 rounded-lg shadow-sm w-72 h-[46px]">
            <CalendarIcon className="absolute left-3 h-5 w-5 text-gray-400 z-10" />
            <span className="pl-10 pr-4 py-2 w-full text-center text-sm text-gray-800 font-medium">
                {displayValue}
            </span>
        </div>
    );
};


// 1. The Main Calendar Page Component
const App: React.FC = () => {
    
    const initialStartDate = _startOfDay(new Date());
    const initialEndDate = _startOfDay(_addDays(new Date(), 29));
    
    const [startDate, setStartDate] = useState<Date>(initialStartDate);
    const [endDate, setEndDate] = useState<Date>(initialEndDate);
    
    const [calendarDays, setCalendarDays] = useState<FacilityDayData[]>([]); 
    const [loading, setLoading] = useState(true); 

    // New state for dynamically fetched tanks
    const [tanks, setTanks] = useState<Tank[]>([]);
    const tankCount = tanks.length;

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState<FacilityDayData | null>(null);

    
    const fetchTanks = useCallback(async () => {
        const fetchedTanks = await apiService.getAllTanks();
        setTanks(fetchedTanks);
    }, []);

    const fetchCalendarData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);

        // Calculate session capacity per tank now, as the tank count might change if fetched
        const currentTankCount = tanks.length;

        try {
            const systemSettings = await apiService.getSystemSettings();
            
            const formattedStartDate = _format(startDate, "yyyy-MM-dd");
            const formattedEndDate = _format(endDate, "yyyy-MM-dd");
            
            const facilityOverrides = await apiService.getCalendarOverrides(formattedStartDate, formattedEndDate);
            
            const dates: Date[] = [];
            let currentDate = _startOfDay(startDate);
            const end = _endOfDay(endDate);

            while (currentDate.getTime() < end.getTime()) {
                dates.push(currentDate);
                currentDate = _addDays(currentDate, 1);
            }
            
            // Core Logic: Aggregate Overrides with System Defaults
            const newCalendarDays: FacilityDayData[] = dates.map(date => {
                const dateKey = _format(date, 'yyyy-MM-dd');
                
                const facilityRecord = facilityOverrides.find(o => o.date === dateKey);

                let status: DayStatus = DAY_STATUS.BOOKABLE;
                let openTime = systemSettings.openTime;
                let closeTime = systemSettings.closeTime;
                let totalSessionsToSell = 0;
                let totalBookedSessions = 0;
                
                if (facilityRecord) {
                    // A. Use the database record (override)
                    status = facilityRecord.status;
                    openTime = facilityRecord.openTime || systemSettings.openTime;
                    closeTime = facilityRecord.closeTime || systemSettings.closeTime;
                    totalSessionsToSell = facilityRecord.sessionsToSell; 
                    totalBookedSessions = facilityRecord.bookedSessions; 

                } else {
                    // B. Calculate total defaults using System Settings (no override found)
                    const sessionsPerTank = calculateSessionCountPerTank(openTime, closeTime);
                    // Use the DYNAMIC tank count
                    totalSessionsToSell = sessionsPerTank * currentTankCount;

                    // MOCKING: Assuming 20% of max sessions are booked by default if no record exists
                    totalBookedSessions = Math.floor(totalSessionsToSell * 0.2); 
                }

                let totalAvailableSessions = totalSessionsToSell - totalBookedSessions;
                
                // Final Status Logic
                if (status === DAY_STATUS.CLOSED) {
                    totalAvailableSessions = 0;
                    totalSessionsToSell = 0; 
                } else if (totalAvailableSessions <= 0 && totalSessionsToSell > 0) {
                    status = DAY_STATUS.SOLD_OUT;
                    totalAvailableSessions = 0; 
                }
                
                return {
                    date: dateKey,
                    status: status, 
                    hours: { open: openTime, close: closeTime },
                    totalAvailableSessions,
                    totalBookedSessions,
                    // Use the DEFAULT_TANK as a placeholder for the sidebar data structure
                    overrideData: facilityRecord ? [facilityRecord] : [generateBaseDayData(date, DEFAULT_TANK, systemSettings, totalSessionsToSell)], 
                };
            });
            
            setCalendarDays(newCalendarDays); 

        } catch (err) {
            console.error("Failed to process calendar data:", err);
            setCalendarDays([]);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [startDate, endDate, tanks.length]); // Dependency on tanks.length added

    // Fetch tanks first, then fetch calendar data
    useEffect(() => {
        fetchTanks();
    }, [fetchTanks]);

    useEffect(() => {
        if (tanks.length > 0) {
             fetchCalendarData(true);
        } else if (loading && tanks.length === 0) {
             // If loading and no tanks, assume fetching failed/0 tanks found, still render calendar with 0 sessions
             fetchCalendarData(true);
        }
       
    }, [tanks.length, fetchCalendarData]);


    const navigateDateRange = (direction: 'prev' | 'next') => {
        if (!startDate || !endDate) return;

        const rangeDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        let newStart, newEnd;
        if (direction === 'next') {
            newStart = _addDays(startDate, rangeDurationDays);
            newEnd = _addDays(endDate, rangeDurationDays);
        } else {
            newStart = _subDays(startDate, rangeDurationDays);
            newEnd = _subDays(endDate, rangeDurationDays);
            
            const today = _startOfDay(new Date());
            if (newEnd < today) {
                newStart = today;
                newEnd = _addDays(today, rangeDurationDays - 1);
            }
        }
        setStartDate(newStart);
        setEndDate(newEnd);
    };
    
    const openDaySettings = (dayData: FacilityDayData) => {
        setSelectedDayData(dayData);
        setIsSidebarOpen(true);
    };

    // Function to handle inline status toggle
    const toggleDayStatus = async (dayData: FacilityDayData) => {
        if (!dayData || !dayData.date) return;
        if (dayData.status === DAY_STATUS.SOLD_OUT) return; 

        const newStatus: DayStatus = dayData.status === DAY_STATUS.CLOSED ? DAY_STATUS.BOOKABLE : DAY_STATUS.CLOSED;
        
        // Calculate the appropriate sessionsToSell to send with the POST request
        const sessionsPerTank = calculateSessionCountPerTank(dayData.hours.open, dayData.hours.close);
        const calculatedFacilitySessions = sessionsPerTank * tankCount; // Use DYNAMIC tank count
        
        const sessionsToSend = newStatus === DAY_STATUS.CLOSED ? 0 : calculatedFacilitySessions;

        try {
            await apiService.updateFacilityStatus(
                dayData.date, 
                newStatus, 
                dayData.hours.open, 
                dayData.hours.close,
                sessionsToSend // SENDING THE CALCULATED COUNT
            );
            
            fetchCalendarData(); 
        } catch (e) {
            console.error("Failed to toggle status:", e);
        }
    };


    const getStatusColor = (status: DayStatus): string => {
        switch (status) {
            case DAY_STATUS.BOOKABLE:
                return 'bg-green-100 text-green-700 hover:bg-green-200';
            case DAY_STATUS.CLOSED:
                return 'bg-red-100 text-red-700 hover:bg-red-200';
            case DAY_STATUS.SOLD_OUT:
                return 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    // Generate the list of dates for the table headers
    const dates = useMemo(() => {
        if (!startDate || !endDate) return [];
        const days: Date[] = [];
        let currentDate = _startOfDay(startDate);
        const end = _endOfDay(endDate);

        while (currentDate.getTime() < end.getTime()) {
            days.push(currentDate);
            currentDate = _addDays(currentDate, 1);
        }
        return days;
    }, [startDate, endDate]);

    const daysCount = dates.length;

    const getCellWidth = (): string => {
        if (daysCount <= 7) return 'w-32';
        if (daysCount <= 14) return 'w-24';
        return 'w-20';
    };


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
                        <p className="text-sm text-gray-500 mt-1">Manage availability and bookings for your floating therapy pods (Facility-Wide View).</p>
                    </div>
                    
                    {/* Date Navigation and Display */}
                    <div className="flex items-center space-x-3">
                        {/* Prev Button */}
                        <button
                            onClick={() => navigateDateRange('prev')}
                            disabled={_isSameDay(_startOfDay(startDate), _startOfDay(new Date()))} 
                            className="p-2 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            aria-label="Previous range"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        
                        {/* Date Range Display */}
                        <DateRangeDisplay startDate={startDate} endDate={endDate} />

                        {/* Next Button */}
                        <button
                            onClick={() => navigateDateRange('next')}
                            className="p-2 border border-gray-300 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
                            aria-label="Next range"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Content Area (Single Table) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-20 text-xl font-medium text-gray-500">
                        <span className="animate-pulse">Loading tanks and schedules...</span>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        <div className="p-4 flex justify-between items-center border-b">
                             <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                 <Zap className="h-5 w-5 mr-2 text-blue-500" />
                                 Facility Calendar View ({tankCount} Tanks Combined)
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
                                            const formattedDate = _format(date, 'MMM dd');
                                            const dayOfWeek = _format(date, 'EEE');
                                            const dayData = calendarDays.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as FacilityDayData;
                                            
                                            return (
                                                <th
                                                    key={index}
                                                    className={`${getCellWidth()} p-2 text-center text-xs font-semibold uppercase cursor-pointer hover:bg-blue-50 transition-colors`}
                                                    onClick={() => openDaySettings(dayData)} 
                                                >
                                                    <div className="text-gray-900 font-bold text-sm">{formattedDate}</div>
                                                    <div className="text-gray-500">{dayOfWeek}</div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                
                                <tbody>
                                    
                                    {/* 1. Facility Status (Bookable/Closed/Sold Out) Row */}
                                    <tr className="border-t border-gray-200">
                                        <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                            Tank Status
                                        </td>
                                        {calendarDays.map((dayData, index) => {
                                            const canToggle = dayData.status !== DAY_STATUS.SOLD_OUT;

                                            return (
                                                <td key={index} className={`${getCellWidth()} p-2 text-center`}>
                                                    <button
                                                        onClick={() => dayData.date && canToggle && toggleDayStatus(dayData)}
                                                        disabled={!dayData.date || !canToggle} 
                                                        className={`w-full py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${getStatusColor(dayData.status)}`}
                                                    >
                                                        <span className="flex items-center justify-center">
                                                            {dayData.status === DAY_STATUS.CLOSED && <Lock className="h-3 w-3 mr-1" />}
                                                            {dayData.status === DAY_STATUS.BOOKABLE && <Unlock className="h-3 w-3 mr-1" />}
                                                            {dayData.status === DAY_STATUS.SOLD_OUT ? 'SOLD OUT' : dayData.status.toUpperCase()}
                                                        </span>
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    
                                    {/* --- Open Time Row --- */}
                                    <tr className="border-t border-gray-100">
                                        <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                            Open Time
                                        </td>
                                        {calendarDays.map((dayData, index) => {
                                            const timeDisplay = dayData.hours?.open || '-';
                                            return (
                                                <td key={`open-${index}`} className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    {dayData.status === DAY_STATUS.CLOSED ? '-' : timeDisplay}
                                                </td>
                                            );
                                        })}
                                    </tr>

                                    {/* --- Close Time Row --- */}
                                    <tr className="border-t border-gray-100">
                                        <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                            Close Time
                                        </td>
                                        {calendarDays.map((dayData, index) => {
                                            const timeDisplay = dayData.hours?.close || '-';
                                            return (
                                                <td key={`close-${index}`} className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? 'text-gray-400' : 'text-gray-700'}`}>
                                                    {dayData.status === DAY_STATUS.CLOSED ? '-' : timeDisplay}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    
                                    {/* 2. Available Sessions Count Row (Total across all tanks) */}
                                    <tr className="border-t border-gray-200">
                                        <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                            Available Sessions
                                        </td>
                                        {calendarDays.map((dayData, index) => {
                                            const availableCount = dayData.totalAvailableSessions;
                                            const isLow = availableCount > 0 && availableCount < tankCount; 
                                            
                                            return (
                                                <td key={index} className={`${getCellWidth()} p-2 text-center text-sm font-semibold ${dayData.status === DAY_STATUS.CLOSED ? 'text-gray-500' : isLow ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {dayData.status === DAY_STATUS.CLOSED ? '-' : availableCount}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    
                                    {/* 3. Booked Sessions Count Row (Total across all tanks) */}
                                    <tr className="border-t border-gray-100">
                                        <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                            Booked Sessions
                                        </td>
                                        {calendarDays.map((dayData, index) => {
                                            return (
                                                <td key={index} className={`${getCellWidth()} p-2 text-center text-sm font-semibold text-blue-600`}>
                                                    {dayData.status === DAY_STATUS.CLOSED ? '-' : dayData.totalBookedSessions}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Day Settings Sidebar (Only render if open) */}
            {isSidebarOpen && selectedDayData && (
                <DaySettingsSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    dayData={selectedDayData}
                    onSave={fetchCalendarData}
                    tankCount={tankCount}
                />
            )}
        </div>
    );
}

export default App;