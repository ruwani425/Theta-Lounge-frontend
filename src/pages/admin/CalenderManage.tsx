"use client";

import { useEffect, useState, useCallback, useMemo, type ChangeEvent, type FormEvent } from "react";
import { Calendar as CalendarIcon, X, Check, Clock, Edit, Lock, Unlock, Zap, XCircle, CheckCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react';

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

/** Represents the data for a single tank on a single calendar day. */
interface DayData {
    date: string; // "yyyy-MM-dd"
    status: DayStatus;
    hours: Hours;
    sessionsToSell: number;
    bookedSessions: number;
    availableSessions: number;
    sessionDuration: number; 
}

/** The structure for calendar data fetched from the provided backend GET endpoint. */
interface CalendarDetailFromBackend {
    _id: string; // MongoDB ID
    tankId: string; // MongoDB Tank ID
    date: string; // YYYY-MM-DD
    status: DayStatus;
    openTime: string; 
    closeTime: string; 
    sessionsToSell: number;
}

/** The overall response structure expected from the backend GET/POST endpoints. */
interface CalendarApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// NEW: Fetched from /api/system-settings
interface SystemSettings {
  defaultFloatPrice: number;
  cleaningBuffer: number;
  sessionsPerDay: number;
  openTime: string; // Used for default hours
  closeTime: string; // Used for default hours
}

// --- NEW TYPE: Reflects the MongoDB Tank Model for fetching ---
interface BackendTank {
    _id: string;
    name: string; // Used as tankName/tankType
    capacity: number;
    sessionDuration: number; // Duration in minutes
}


/** Represents a single floating therapy tank (resource) prepared for the calendar. */
interface Tank { 
    _id: string;
    tankName: string; 
    tankType: string; 
    sessionDuration: number; 
    calendarDays: DayData[];
}

// --- SESSION CALCULATION UTILITY ---

const BREAK_DURATION_MINUTES = 30; // 30 minute break
const TOTAL_CYCLE_MINUTES = (sessionDuration: number) => sessionDuration + BREAK_DURATION_MINUTES;

/**
 * Calculates the maximum number of full sessions based on dynamic session duration.
 * The calculation now uses the actual duration from the tank data.
 * @param openTime Time string (HH:mm)
 * @param closeTime Time string (HH:mm)
 * @param sessionDuration The duration of one session in minutes (e.g., 90)
 * @returns The count of full sessions.
 */
const calculateSessionCount = (openTime: string, closeTime: string, sessionDuration: number): number => {
    if (sessionDuration <= 0) return 0;
    const cycleTime = TOTAL_CYCLE_MINUTES(sessionDuration);

    try {
        const fixedDate = '2000/01/01'; 
        const open = new Date(`${fixedDate} ${openTime}`);
        const close = new Date(`${fixedDate} ${closeTime}`);

        if (close.getTime() <= open.getTime()) {
             return 0; 
        }

        const durationMinutes = (close.getTime() - open.getTime()) / (60 * 1000);
        
        // Calculate number of full cycles
        const totalSessions = Math.floor(durationMinutes / cycleTime);
        
        return totalSessions;

    } catch (e) {
        return 0;
    }
}


// --- BASE DATA DEFAULTS (FALLBACK) ---

// Fallback defaults if API fails
const GLOBAL_DEFAULTS: SystemSettings = {
    defaultFloatPrice: 0,
    cleaningBuffer: 30,
    sessionsPerDay: 8,
    openTime: '09:00', 
    closeTime: '21:00' 
};


const generateDayData = (date: Date, tank: BackendTank, settings: SystemSettings): DayData => {
    // Use System Settings for default hours
    const openTime = settings.openTime;
    const closeTime = settings.closeTime;
    
    // Calculate sessions based on settings and tank duration
    const sessionsAvailable = calculateSessionCount(openTime, closeTime, tank.sessionDuration);
    
    // Default status and booking data (will be overridden by fetched CalendarDetail)
    let sessionsToSell = sessionsAvailable; 
    let bookedSessions = Math.floor(Math.random() * (sessionsAvailable * 0.5)); // Simulate some bookings

    let status: DayStatus = sessionsToSell > bookedSessions ? DAY_STATUS.BOOKABLE : DAY_STATUS.SOLD_OUT;
    
    return {
        date: _format(date, 'yyyy-MM-dd'),
        status: status,
        hours: { open: openTime, close: closeTime },
        sessionsToSell,
        bookedSessions,
        availableSessions: sessionsToSell - bookedSessions,
        sessionDuration: tank.sessionDuration,
    };
};

/**
 * Creates the calendar structure using data from a fetched BackendTank and System Settings.
 */
const generateCalendarTank = (backendTank: BackendTank, startDate: Date, endDate: Date, settings: SystemSettings): Tank => { 
    const dates: Date[] = [];
    let currentDate = _startOfDay(startDate);
    const end = _endOfDay(endDate);

    while (currentDate.getTime() < end.getTime()) {
        dates.push(currentDate);
        currentDate = _addDays(currentDate, 1);
    }
    
    return {
        _id: backendTank._id,
        tankName: backendTank.name, 
        tankType: backendTank.name,
        sessionDuration: backendTank.sessionDuration,
        calendarDays: dates.map(date => generateDayData(date, backendTank, settings)),
    };
};


// --- API SERVICE IMPLEMENTATION ---

const CALENDAR_API_BASE_URL = "/calendar"; // Consistent with app.ts for robust GET/POST
const TANK_API_BASE_URL = "/tanks"; // Retaining user-defined path for tanks
const SETTINGS_API_BASE_URL = "/system-settings"; // Correct path based on app.ts

const apiService = {
    /**
     * Fetches system settings (global defaults).
     */
    getSystemSettings: async (): Promise<SystemSettings> => {
        try {
            // Path: /api/system-settings
            const settings = await apiRequest.get<SystemSettings>(SETTINGS_API_BASE_URL); 
            console.log("✅ Success: Fetched system settings.");
            
            // Return fetched settings, merging with global defaults in case of missing fields
            return { ...GLOBAL_DEFAULTS, ...settings };
        } catch (error) {
            console.error("❌ Failed to fetch system settings. Using fallback defaults.", error);
            return GLOBAL_DEFAULTS; // Return robust fallback
        }
    },

    /**
     * Fetches the list of all tanks from the backend.
     */
    getTanks: async (): Promise<BackendTank[]> => {
        try {
            // Uses apiRequest.get('/tanks')
            const tanks = await apiRequest.get<BackendTank[]>(TANK_API_BASE_URL); 
            console.log(`✅ Success: Fetched ${tanks.length} tanks from backend via ${TANK_API_BASE_URL}.`);

            // If the backend returns an empty array, provide a mock tank for display
            if (!tanks || tanks.length === 0) {
                 return [{ 
                    _id: "mock-tank-1", 
                    name: "Default Float Pod", 
                    capacity: 1, 
                    sessionDuration: 90 
                }];
            }
            return tanks;
        } catch (error) {
            console.error(`❌ API Request Error: Failed to fetch tanks from ${TANK_API_BASE_URL}.`, error);
            // Return a mock tank on failure to keep the app runnable
            return [{ 
                _id: "error-tank-1", 
                name: "Fallback Float Pod", 
                capacity: 1, 
                sessionDuration: 90 
            }];
        }
    },
    
    /**
     * Fetches existing calendar details (overrides) for a date range.
     */
    getCalendarOverrides: async (formattedStartDate: string, formattedEndDate: string): Promise<CalendarDetailFromBackend[]> => {
        try {
            // Using /api/calendar as per app.ts 
            const apiResponse = await apiRequest.get<CalendarApiResponse<CalendarDetailFromBackend[]>>(CALENDAR_API_BASE_URL, {
                params: { startDate: formattedStartDate, endDate: formattedEndDate }
            });

            if (apiResponse.success) {
                console.log(`✅ Success: Fetched ${apiResponse.data.length} calendar overrides.`);
                return apiResponse.data;
            }
            return [];
        } catch (error) {
            console.error("❌ Failed to fetch calendar overrides.", error);
            return [];
        }
    },

    /**
     * Performs a REAL POST request to update a single day's settings.
     */
    updateDayStatus: async (
        tankId: string, 
        date: string, 
        status: DayStatus, 
        openTime: string, 
        closeTime: string,
        sessionsToSell: number,
    ): Promise<boolean> => {
        try {
            const apiResponse = await apiRequest.post<CalendarApiResponse<any>>(CALENDAR_API_BASE_URL, {
                tankId, 
                date,
                status,
                openTime,
                closeTime,
                sessionsToSell: Number(sessionsToSell), 
            });
            
            if (apiResponse.success) {
                return true;
            } else {
                console.error(`❌ Error: API responded with unsuccessful payload.`, apiResponse.message);
                return false;
            }
        } catch (error: any) {
            const displayError = (error && error.message) || (error && error.data && error.data.message) || "Unknown server error or network issue.";
            console.error("❌ API Request Error: Failed to save day settings (POST failed).", displayError);
            throw new Error(`Save failed: ${displayError}`);
        }
    }
};

// --- UI COMPONENTS (Minimal changes required) ---

// 3. Day Settings Sidebar
interface DaySettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    tank: Tank; 
    dayData: DayData;
    onSave: () => void;
}

const DaySettingsSidebar: React.FC<DaySettingsSidebarProps> = ({ isOpen, onClose, tank, dayData, onSave }) => {
    const [openTime, setOpenTime] = useState(dayData.hours.open);
    const [closeTime, setCloseTime] = useState(dayData.hours.close);
    const [status, setStatus] = useState<DayStatus>(dayData.status);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const calculatedSessions = useMemo(() => {
        return calculateSessionCount(openTime, closeTime, dayData.sessionDuration);
    }, [openTime, closeTime, dayData.sessionDuration]);


    useEffect(() => {
        setOpenTime(dayData.hours.open);
        setCloseTime(dayData.hours.close);
        setStatus(dayData.status);
        setError(null);
    }, [dayData]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault(); 
        if (!tank || !dayData) return; 

        if (status === DAY_STATUS.BOOKABLE) {
            if (!openTime || !closeTime) {
                setError("Open and Close times are required for a Bookable status.");
                return;
            }
             if (calculatedSessions <= 0) {
                 setError(`Operating hours must allow for at least one ${dayData.sessionDuration}-minute session plus 30-minute break.`);
                 return;
            }
        }
        
        setError(null);
        setIsSaving(true);
        
        const finalSessionsToSell = status === DAY_STATUS.BOOKABLE ? calculatedSessions : 0;
        
        try {
            const success = await apiService.updateDayStatus(
                tank._id, 
                dayData.date, 
                status, 
                openTime, 
                closeTime,
                finalSessionsToSell, 
            );

            if (success) {
                await onSave(); 
                onClose();
            } else {
                setError("Failed to save changes due to a policy error on the server.");
            }
        } catch (e: any) {
            const displayError = e.message || "An unexpected network or server error occurred.";
            setError(displayError);
            console.error("Save failed in component catch:", e);
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
                    <h2 className="text-xl font-semibold text-gray-800">Day Settings</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="mt-4 space-y-4 h-[calc(100%-60px)] flex flex-col">
                    <p className="text-sm font-medium text-blue-600">{tank.tankName}</p>
                    <h3 className="text-lg font-bold text-gray-700">{formattedDate}</h3>
                    
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded relative text-sm" role="alert">
                            <strong className="font-bold">Error:</strong>
                            <span className="block sm:inline ml-1">{error}</span>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Day Status</label>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setStatus(DAY_STATUS.BOOKABLE)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.BOOKABLE ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <CheckCircle className="inline h-4 w-4 mr-1" /> Bookable
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

                            {/* Field: Display Calculated Session Count (MODIFIED) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Calculated Available Sessions ({dayData.sessionDuration} min session + 30 min break)
                                </label>
                                <div className="mt-1 block w-full rounded-md bg-gray-100 border border-gray-300 shadow-sm p-2 text-lg font-bold text-blue-700">
                                    {calculatedSessions}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Max sessions calculated based on hours.
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
                            {isSaving ? 'Saving...' : 'Save Changes'}
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

// 2. TankTypeCalendar Component
interface TankTypeCalendarProps { 
    tank: Tank; 
    startDate: Date;
    endDate: Date;
    onDataUpdate: () => void;
}

const TankTypeCalendar: React.FC<TankTypeCalendarProps> = ({ tank, startDate, endDate, onDataUpdate }) => { 
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
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedDayData, setSelectedDayData] = useState<DayData | null>(null);

    const getCellWidth = (): string => {
        if (daysCount <= 7) return 'w-32';
        if (daysCount <= 14) return 'w-24';
        return 'w-20';
    };

    const toggleDayStatus = async (dayData: DayData) => {
        if (!dayData || !dayData.date) return; 

        let newStatus: DayStatus;
        
        if (dayData.status === DAY_STATUS.CLOSED) {
            newStatus = DAY_STATUS.BOOKABLE;
        } 
        else {
            newStatus = DAY_STATUS.CLOSED;
        }

        // Calculate sessions based on the new status
        let finalSessionsToSell = dayData.sessionsToSell;
        if (newStatus === DAY_STATUS.BOOKABLE) {
             finalSessionsToSell = calculateSessionCount(dayData.hours.open, dayData.hours.close, dayData.sessionDuration);
        } else if (newStatus === DAY_STATUS.CLOSED) {
            finalSessionsToSell = 0;
        }
        
        try {
            // Use apiService (This calls the REAL POST, passing tank._id)
            await apiService.updateDayStatus(
                tank._id, 
                dayData.date, 
                newStatus, 
                dayData.hours.open, 
                dayData.hours.close,
                finalSessionsToSell, // Use the calculated value
            );
            
            // Re-fetch data, which will now run the full fetch logic
            onDataUpdate(); 
        } catch (e) {
             console.error("Failed to toggle status:", e);
             // In a real app, show a toast/modal error here
        }
    };

    const openDaySettings = (date: Date) => {
        const dayData = tank.calendarDays.find(d => d.date === _format(date, 'yyyy-MM-dd'));
        if (dayData) {
            setSelectedDayData(dayData);
            setIsSidebarOpen(true);
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

    const tableContent = tank.calendarDays;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500" />
                    {tank.tankName}
                    <span className="text-sm font-normal text-gray-500 ml-2">(ID: {tank._id.slice(-4)})</span>
                </h2>
                {/* Removed Bulk Edit Button */}
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
                                return (
                                    <th
                                        key={index}
                                        className={`${getCellWidth()} p-2 text-center text-xs font-semibold uppercase cursor-pointer hover:bg-blue-50 transition-colors`}
                                        onClick={() => openDaySettings(date)}
                                    >
                                        <div className="text-gray-900 font-bold text-sm">{formattedDate}</div>
                                        <div className="text-gray-500">{dayOfWeek}</div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    
                    <tbody>
                        {/* 1. Tank Status (Bookable/Closed) Row */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Tank Status
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tank.calendarDays.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                return (
                                    <td key={index} className={`${getCellWidth()} p-2 text-center`}>
                                        <button
                                            onClick={() => toggleDayStatus(dayData)}
                                            disabled={!dayData.date}
                                            className={`w-full py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${getStatusColor(dayData.status)}`}
                                        >
                                            <span className="flex items-center justify-center">
                                                {dayData.status === DAY_STATUS.CLOSED ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
                                                {dayData.status === DAY_STATUS.SOLD_OUT ? 'SOLD OUT' : dayData.status.toUpperCase()}
                                            </span>
                                        </button>
                                    </td>
                                );
                            })}
                        </tr>
                        
                        {/* --- NEW ROW: Open Time (Requested) --- */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Open Time
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                const timeDisplay = dayData.hours?.open || '-';
                                return (
                                    <td key={`open-${index}`} className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? 'text-gray-400' : 'text-gray-700'}`}>
                                        {dayData.status === DAY_STATUS.CLOSED ? '-' : timeDisplay}
                                    </td>
                                );
                            })}
                        </tr>

                        {/* --- NEW ROW: Close Time (Requested) --- */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Close Time
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                const timeDisplay = dayData.hours?.close || '-';
                                return (
                                    <td key={`close-${index}`} className={`${getCellWidth()} p-2 text-center text-sm font-medium ${dayData.status === DAY_STATUS.CLOSED ? 'text-gray-400' : 'text-gray-700'}`}>
                                        {dayData.status === DAY_STATUS.CLOSED ? '-' : timeDisplay}
                                    </td>
                                );
                            })}
                        </tr>
                        
                        {/* 2. Available Sessions Count Row */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Available Sessions
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                return (
                                    <td key={index} className={`${getCellWidth()} p-2 text-center text-sm font-semibold ${dayData.availableSessions > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                                        {dayData.status === DAY_STATUS.CLOSED ? '-' : dayData.availableSessions}
                                    </td>
                                );
                            })}
                        </tr>
                        
                        {/* 3. Booked Sessions Count Row */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Booked Sessions
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                return (
                                    <td key={index} className={`${getCellWidth()} p-2 text-center text-sm font-semibold text-blue-600`}>
                                        {dayData.status === DAY_STATUS.CLOSED ? '-' : dayData.bookedSessions}
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Day Settings Sidebar (Only render if open) */}
            {isSidebarOpen && selectedDayData && (
                <DaySettingsSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    tank={tank}
                    dayData={selectedDayData}
                    onSave={onDataUpdate}
                />
            )}
        </div>
    );
};

// 5. Date Range Display
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
    
    const [tanks, setTanks] = useState<Tank[]>([]); 
    const [loading, setLoading] = useState(true); 

    const fetchTanksAndCalendar = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);

        try {
            // 1. Fetch System Settings (Global Defaults)
            const systemSettingsPromise = apiService.getSystemSettings();
            
            // 2. Fetch the list of Tanks
            const backendTanksPromise = apiService.getTanks();
            
            // Execute parallel fetches
            const [systemSettings, backendTanks] = await Promise.all([
                systemSettingsPromise,
                backendTanksPromise
            ]);

            // 3. Fetch all Calendar Overrides for the date range
            const formattedStartDate = _format(startDate, "yyyy-MM-dd");
            const formattedEndDate = _format(endDate, "yyyy-MM-dd");
            const overrides = await apiService.getCalendarOverrides(formattedStartDate, formattedEndDate);
            
            // 4. GENERATE AND MERGE CALENDAR DATA
            const calendarTanks = backendTanks.map(bTank => {
                // Generate base structure using System Settings for defaults
                const baseTank = generateCalendarTank(bTank, startDate, endDate, systemSettings);

                // Apply overrides from the database
                const updatedCalendarDays = baseTank.calendarDays.map(day => {
                    // Find an override matching BOTH tank ID and date
                    const override = overrides.find(o => o.tankId === bTank._id && o.date === day.date);

                    if (override) {
                        // Use calendar override open/close times, falling back to System Settings if empty in DB
                        const newOpen = override.openTime || systemSettings.openTime;
                        const newClose = override.closeTime || systemSettings.closeTime;
                        
                        // Use DB sessionsToSell if set, otherwise recalculate based on new hours
                        let newSessions = override.sessionsToSell > 0 ? override.sessionsToSell : calculateSessionCount(newOpen, newClose, bTank.sessionDuration);
                        
                        return {
                            ...day,
                            status: override.status,
                            hours: {
                                open: newOpen,
                                close: newClose,
                            },
                            sessionsToSell: newSessions,
                            // NOTE: bookedSessions remains mocked/base data, but sessionsToSell is updated
                            availableSessions: newSessions - day.bookedSessions, 
                        };
                    }
                    return day;
                });
                
                return {
                    ...baseTank,
                    calendarDays: updatedCalendarDays
                };
            });
            
            setTanks(calendarTanks); 

        } catch (err) {
            console.error("Failed to fetch tanks, settings, or calendar data:", err);
            setTanks([]);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [startDate, endDate]);


    useEffect(() => {
        // Fetch tanks and calendar data on initial mount and date range change
        fetchTanksAndCalendar(true);
    }, [fetchTanksAndCalendar]);

    // fetchCalendarData is now modified to trigger a refresh via the full fetch function
    const fetchCalendarData = useCallback(async () => {
        fetchTanksAndCalendar(false);
    }, [fetchTanksAndCalendar]);


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
        // fetchTanksAndCalendar will run automatically due to dependency change in useEffect
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
                        <p className="text-sm text-gray-500 mt-1">Manage availability and bookings for your floating therapy pods.</p>
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

            {/* Calendar Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="text-center py-20 text-xl font-medium text-gray-500">
                        <span className="animate-pulse">Loading schedules...</span>
                    </div>
                ) : !startDate || !endDate ? (
                    <p className="text-center py-20 text-lg text-gray-500">Date range is invalid. Please refresh the page.</p>
                ) : tanks.length > 0 ? ( 
                    <div className="space-y-10">
                        {tanks.map(tank => ( 
                            <TankTypeCalendar 
                                key={tank._id}
                                tank={tank}
                                startDate={startDate}
                                endDate={endDate}
                                onDataUpdate={fetchCalendarData}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-20 text-lg text-gray-500">No floating tanks found or failed to load schedule data.</p>
                )}
            </div>
        </div>
    );
}

export default App;