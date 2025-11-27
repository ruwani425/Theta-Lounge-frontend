"use client";

import { useEffect, useState, useCallback, useMemo, type ChangeEvent, type FormEvent } from "react";
import { Calendar as CalendarIcon, X, Check, Clock, Edit, Lock, Unlock, Zap, XCircle, CheckCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Import the actual apiRequest from axios.ts ---
import apiRequest from "../../core/axios";

// --- REMOVED MOCK IMPLEMENTATION ---
// The actual apiRequest singleton is now used for POST.

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
}

/** The structure for calendar data fetched from the provided backend GET endpoint. */
interface CalendarDetailFromBackend {
    _id: string; // MongoDB ID
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

/** Represents a single floating therapy tank (resource). */
interface Tank { 
    _id: string;
    tankName: string; 
    tankType: string; 
    calendarDays: DayData[];
}

// --- MOCK CONSTANTS & DATA GENERATION (Used for initial state only) ---
const SESSION_DURATION_MINUTES = 90;

const defaultHours: Hours = {
    open: '09:00',
    close: '21:00',
};

const calculateMaxSessions = (open: string, close: string): number => {
    try {
        const fixedDate = '2000/01/01'; 
        const startTime = new Date(`${fixedDate} ${open}`).getTime();
        const endTime = new Date(`${fixedDate} ${close}`).getTime();
        if (endTime <= startTime) return 0;
        return Math.floor(
            (endTime - startTime) /
            (SESSION_DURATION_MINUTES * 60 * 1000)
        );
    } catch {
        return 0;
    }
}

const MAX_SESSIONS = calculateMaxSessions(defaultHours.open, defaultHours.close);

const generateDayData = (date: Date, tankType: string): DayData => {
    const isClosed = Math.random() < 0.1; 
    let status: DayStatus = isClosed ? DAY_STATUS.CLOSED : DAY_STATUS.BOOKABLE;
    
    let sessionsToSell = MAX_SESSIONS;
    let bookedSessions = 0;

    if (!isClosed) {
        sessionsToSell = Math.floor(MAX_SESSIONS * (0.8 + Math.random() * 0.2)); 
        bookedSessions = Math.floor(Math.random() * sessionsToSell);
        if (bookedSessions >= sessionsToSell) {
            sessionsToSell = bookedSessions; 
            status = DAY_STATUS.SOLD_OUT;
        }
    }

    return {
        date: _format(date, 'yyyy-MM-dd'),
        status: status,
        hours: defaultHours,
        sessionsToSell,
        bookedSessions,
        availableSessions: sessionsToSell - bookedSessions,
    };
};

const generateTankData = (tankIndex: number, startDate: Date, endDate: Date): Tank => { 
    const dates: Date[] = [];
    let currentDate = _startOfDay(startDate);
    const end = _endOfDay(endDate);

    while (currentDate.getTime() < end.getTime()) {
        dates.push(currentDate);
        currentDate = _addDays(currentDate, 1);
    }

    const tankType = `Pod Type ${tankIndex}`; 
    const _id = `tank-${tankIndex}`; 
    const tankName = `Floating Pod ${100 + tankIndex}`; 

    return {
        _id,
        tankName, 
        tankType, 
        calendarDays: dates.map(date => generateDayData(date, tankType)),
    };
};

const MOCK_TANK_COUNT = 3;

/**
 * Generates the full mock data structure. This is now used for initial state.
 */
const generateMockTanks = (startDate: Date, endDate: Date): Tank[] => { 
    return Array.from({ length: MOCK_TANK_COUNT }).map((_, i) => generateTankData(i + 1, startDate, endDate));
};


// --- API SERVICE IMPLEMENTATION ---

const API_BASE_URL = "/calendar";

const apiService = {
    /**
     * MODIFIED: This function now just returns the current state of tanks synchronously 
     * without making a network request. This is critical to prevent the GET call after POST.
     */
    getTanksForCalendar: async (currentTanks: Tank[]): Promise<Tank[]> => {
        console.log("Mocked GET: Returning current local state to prevent network request.");
        // We use Promise.resolve to match the async signature
        return Promise.resolve(currentTanks);
    },
    
    /**
     * Performs a REAL POST request to update a single day's settings.
     * Uses: apiRequest.post('/api/calendar', { ...data })
     * @returns Promise<boolean> success status
     */
    updateDayStatus: async (
        tankId: string, 
        date: string, 
        status: DayStatus, 
        openTime: string, 
        closeTime: string,
        sessionsToSell: number,
    ): Promise<boolean> => {
        console.log(`Preparing to send REAL POST data for Tank ${tankId} on ${date} to backend...`);
        
        try {
            // --- REAL API REQUEST using the imported apiRequest.post ---
            const apiResponse = await apiRequest.post<CalendarApiResponse<any>>(API_BASE_URL, {
                date,
                status,
                openTime,
                closeTime,
                sessionsToSell: Number(sessionsToSell), 
            });
            // --------------------------------------------------------
            
            // We check the backend's success flag expected from your Express controller.
            if (apiResponse.success) {
                console.log(`✅ Success: REAL POST sent successfully for ${date}. Check MongoDB for saved data!`);
                return true;
            } else {
                console.error(`❌ Error: API responded with unsuccessful payload.`, apiResponse.message);
                return false;
            }
        } catch (error: any) {
            // The real apiRequest (from axios.ts) throws the error response data.
            const displayError = (error && error.message) || (error && error.data && error.data.message) || "Unknown server error or network issue.";
            console.error("❌ API Request Error: Failed to save day settings (POST failed).", displayError);
            throw new Error(`Save failed: ${displayError}`);
        }
    }
};

// --- UI COMPONENTS ---

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
    const [sessionsToSell, setSessionsToSell] = useState(dayData.sessionsToSell.toString()); 
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync state when dayData changes
    useEffect(() => {
        setOpenTime(dayData.hours.open);
        setCloseTime(dayData.hours.close);
        setStatus(dayData.status);
        setSessionsToSell(dayData.sessionsToSell.toString());
        setError(null);
    }, [dayData]);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault(); 
        if (!tank || !dayData) return; 

        // Basic validation
        if (status === DAY_STATUS.BOOKABLE) {
            if (!openTime || !closeTime) {
                setError("Open and Close times are required for a Bookable status.");
                return;
            }
            if (parseInt(sessionsToSell) < 0 || isNaN(parseInt(sessionsToSell))) {
                setError("Available sessions count must be a non-negative number.");
                return;
            }
        }
        
        setError(null);
        setIsSaving(true);
        
        try {
            // Call the API service (sends a real POST request)
            const success = await apiService.updateDayStatus(
                tank._id, 
                dayData.date, 
                status, 
                openTime, 
                closeTime,
                parseInt(sessionsToSell), 
            );

            if (success) {
                // Trigger onSave, which calls the modified fetchCalendarData 
                // (prevents GET network call and keeps the current mock data visible)
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

                            {/* Field: Default Count for Available Sessions (sessionsToSell) */}
                            <div>
                                <label htmlFor="sessionsToSell" className="block text-sm font-medium text-gray-700">
                                    Default Available Sessions
                                </label>
                                <input
                                    id="sessionsToSell"
                                    type="number"
                                    min="0"
                                    value={sessionsToSell}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setSessionsToSell(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Max number of sessions to sell for this tank on this day.
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
        
        try {
            // Use apiService (This calls the REAL POST)
            await apiService.updateDayStatus(
                tank._id, 
                dayData.date, 
                newStatus, 
                dayData.hours.open, 
                dayData.hours.close,
                dayData.sessionsToSell,
            );
            
            // Re-fetch data, which will now run the MOCKED GET to prevent network traffic
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
                    <span className="text-sm font-normal text-gray-500 ml-2">(ID: {tank._id.split('-')[1]})</span>
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
    
    // Initialize tanks directly with mock data
    const [tanks, setTanks] = useState<Tank[]>(generateMockTanks(initialStartDate, initialEndDate)); 
    const [loading, setLoading] = useState(false); // Set to false to show table immediately

    // fetchCalendarData is now modified to skip network calls and use local state
    const fetchCalendarData = useCallback(async () => {
        // This simulates a successful fetch without hitting the network.
        const currentTanks = await apiService.getTanksForCalendar(tanks); 
        // We update the state to trigger a re-render, even though the data hasn't changed.
        setTanks(currentTanks); 
    }, [tanks]);
    
    // The initial fetch useEffect is deliberately commented out to prevent GET on load:
    /*
    useEffect(() => {
        // This would call fetchCalendarData(true);
    }, [fetchCalendarData]);
    */

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
        // Regenerate mock data for the new range
        setTanks(generateMockTanks(newStart, newEnd));
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
                        <span className="animate-pulse">Loading tank schedules...</span>
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
                    <p className="text-center py-20 text-lg text-gray-500">No floating tanks found or no data for the selected range.</p>
                )}
            </div>
        </div>
    );
}

export default App;