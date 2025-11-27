"use client";

import { useEffect, useState, useCallback, useMemo, type ChangeEvent, type FormEvent } from "react";
// Removed all external date-fns imports
import { Calendar as CalendarIcon, X, Check, Clock, Edit, Lock, Unlock, Zap, XCircle, CheckCircle, Save, ChevronLeft, ChevronRight } from 'lucide-react';

// --- DATE UTILITY REPLACEMENTS (to avoid date-fns dependency error) ---

// Replacement for date-fns format (only supports the required formats)
const _format = (date: Date, fmt: string): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = date.getDay();
    const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Simple yyyy-MM-dd
    if (fmt === 'yyyy-MM-dd') {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    // Simple MMM dd
    if (fmt === 'MMM dd') {
        return `${monthsShort[date.getMonth()]} ${String(day)}`;
    }
    // Simple EEE
    if (fmt === 'EEE') {
        return daysShort[dayOfWeek];
    }
    // Complex format for Sidebar (simplified version)
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

    return date.toDateString(); // Fallback
};

// Replacement for addDays
const _addDays = (date: Date, days: number): Date => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    return newDate;
};

// Replacement for subDays
const _subDays = (date: Date, days: number): Date => {
    return _addDays(date, -days);
};

// Replacement for startOfDay
const _startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Replacement for endOfDay (using start of next day logic)
const _endOfDay = (date: Date): Date => {
    const d = _addDays(date, 1);
    d.setHours(0, 0, 0, 0);
    return d;
};

// Replacement for isSameDay
const _isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

// Replacement for addYears
const _addYears = (date: Date, years: number): Date => {
    const newDate = new Date(date);
    newDate.setFullYear(date.getFullYear() + years);
    return newDate;
}

// --- TYPE DEFINITIONS (Normally from "@/types/calendar-types.ts") ---

/** Available statuses for a therapy tank room on a given day. */
const DAY_STATUS = {
    BOOKABLE: 'Bookable',
    CLOSED: 'Closed',
    SOLD_OUT: 'Sold Out',
} as const;

type DayStatus = typeof DAY_STATUS[keyof typeof DAY_STATUS];

/** Represents the session times for a day. */
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
    price: number; // Price in Rupees (Rs)
}

/** Represents a single floating therapy tank (room). */
interface Room {
    _id: string;
    roomName: string;
    roomType: string;
    calendarDays: DayData[];
}

// --- MOCK CONSTANTS & DATA GENERATION ---
const SESSION_DURATION_MINUTES = 90;

const defaultHours: Hours = {
    open: '09:00',
    close: '21:00',
};

// Calculate Max Sessions for Mocking
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

const generateDayData = (date: Date, roomType: string): DayData => {
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
        price: 20000 + Math.floor(Math.random() * 5) * 1000,
    };
};

const generateRoomData = (roomIndex: number, startDate: Date, endDate: Date): Room => {
    const dates: Date[] = [];
    let currentDate = _startOfDay(startDate);
    const end = _endOfDay(endDate); // Using _endOfDay for loop comparison

    while (currentDate.getTime() < end.getTime()) {
        dates.push(currentDate);
        currentDate = _addDays(currentDate, 1);
    }

    const roomType = `Tank ${roomIndex}`;
    const _id = `room-${roomIndex}`;
    const roomName = `Floating Pod ${100 + roomIndex}`;

    return {
        _id,
        roomName,
        roomType,
        calendarDays: dates.map(date => generateDayData(date, roomType)),
    };
};

const MOCK_ROOM_COUNT = 3;
const MOCK_DATA = (startDate: Date, endDate: Date): Room[] => {
    return Array.from({ length: MOCK_ROOM_COUNT }).map((_, i) => generateRoomData(i + 1, startDate, endDate));
};

// --- MOCK SERVICE (Simulates API calls) ---
const roomService = {
    getRoomsForCalendar: async (formattedStartDate: string, formattedEndDate: string): Promise<Room[]> => {
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const start = new Date(formattedStartDate);
        const end = new Date(formattedEndDate);
        return MOCK_DATA(start, end);
    },
    updateDayStatus: async (roomId: string, date: string, status: DayStatus, openTime: string, closeTime: string): Promise<boolean> => {
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log(`API Call: Updating Room ${roomId} on ${date}. Status: ${status}, Hours: ${openTime}-${closeTime}`);
        return true;
    }
};

// --- UI COMPONENTS ---

// 3. Day Settings Sidebar
interface DaySettingsSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room;
    dayData: DayData;
    onSave: () => void;
}

const DaySettingsSidebar: React.FC<DaySettingsSidebarProps> = ({ isOpen, onClose, room, dayData, onSave }) => {
    const [openTime, setOpenTime] = useState(dayData.hours.open);
    const [closeTime, setCloseTime] = useState(dayData.hours.close);
    const [status, setStatus] = useState<DayStatus>(dayData.status);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setOpenTime(dayData.hours.open);
        setCloseTime(dayData.hours.close);
        setStatus(dayData.status);
    }, [dayData]);

    const handleSave = async () => {
        if (!room || !dayData) return;
        setIsSaving(true);
        try {
            await roomService.updateDayStatus(room._id, dayData.date, status, openTime, closeTime);
            await onSave(); 
            onClose();
        } catch (error) {
            console.error("Save failed:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const sidebarClass = `fixed inset-y-0 right-0 w-80 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out z-[100] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`;

    // Use internal _format
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
                
                <div className="mt-4 space-y-4">
                    <p className="text-sm font-medium text-blue-600">{room.roomName}</p>
                    <h3 className="text-lg font-bold text-gray-700">{formattedDate}</h3>
                    
                    <div className="space-y-2">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Day Status</label>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setStatus(DAY_STATUS.BOOKABLE)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.BOOKABLE ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <CheckCircle className="inline h-4 w-4 mr-1" /> Open
                            </button>
                            <button
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
                                <Clock className="h-4 w-4 mr-2" /> Special Operating Hours
                            </h4>
                            <p className="text-xs text-gray-500">Overrides default room hours for this specific day.</p>
                            <div className="flex gap-4">
                                <div>
                                    <label htmlFor="openTime" className="block text-sm font-medium text-gray-700">Open Time</label>
                                    <input
                                        id="openTime"
                                        type="time"
                                        value={openTime}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => setOpenTime(e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2"
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
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="absolute bottom-6 left-6 right-6">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
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

// 2. RoomTypeCalendar Component
interface RoomTypeCalendarProps {
    room: Room;
    startDate: Date;
    endDate: Date;
    onDataUpdate: () => void;
    onBulkEditClick: (room: Room) => void; // Keeping this prop for flexibility, but it's unused in the UI now
}

const RoomTypeCalendar: React.FC<RoomTypeCalendarProps> = ({ room, startDate, endDate, onDataUpdate, onBulkEditClick }) => {
    const dates = useMemo(() => {
        if (!startDate || !endDate) return [];
        const days: Date[] = [];
        let currentDate = _startOfDay(startDate);
        const end = _endOfDay(endDate); // Use _endOfDay for comparison logic

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

        let newStatus: DayStatus = DAY_STATUS.CLOSED;
        if (dayData.status === DAY_STATUS.CLOSED) {
            newStatus = DAY_STATUS.BOOKABLE;
        }
        
        await roomService.updateDayStatus(room._id, dayData.date, newStatus, dayData.hours.open, dayData.hours.close);
        onDataUpdate(); 
    };

    const openDaySettings = (date: Date) => {
        // Use internal _format
        const dayData = room.calendarDays.find(d => d.date === _format(date, 'yyyy-MM-dd'));
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

    const tableContent = room.calendarDays;

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-500" />
                    {room.roomName}
                    <span className="text-sm font-normal text-gray-500 ml-2">(ID: {room._id.split('-')[1]})</span>
                </h2>
                {/* REMOVED: The clickable date range button that triggered BulkEditSidebar */}
            </div>

            <div className="overflow-x-auto relative">
                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                    {/* Calendar Header Row */}
                    <thead>
                        <tr className="bg-gray-50 sticky top-0 z-20">
                            {/* Fixed header columns for room details */}
                            <th className="sticky left-0 bg-gray-50 p-3 text-left text-xs font-semibold text-gray-600 uppercase w-32 min-w-[128px] border-r border-gray-200 shadow-inner-right">
                                Dates
                            </th>
                            {/* Date columns */}
                            {dates.map((date, index) => {
                                // Use internal _format
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
                    
                    {/* Calendar Body */}
                    <tbody className="divide-y divide-gray-200">
                        {/* 1. Room Status (Bookable/Closed) Row */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Room Status
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
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
                        
                        {/* 4. Price Row (Example for rate management) */}
                        <tr>
                            <td className="sticky left-0 bg-white p-3 text-left text-sm font-medium text-gray-800 border-r border-gray-200 shadow-inner-right whitespace-nowrap">
                                Standard Rate (Rs)
                            </td>
                            {dates.map((date, index) => {
                                const dayData = tableContent.find(d => d.date === _format(date, 'yyyy-MM-dd')) || {} as DayData;
                                return (
                                    <td key={index} className={`${getCellWidth()} p-2 text-center text-sm text-gray-700`}>
                                        {dayData.status === DAY_STATUS.CLOSED ? 'Rs --' : `Rs ${dayData.price?.toLocaleString('en-IN') || '--'}`}
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
                    room={room}
                    dayData={selectedDayData}
                    onSave={onDataUpdate}
                />
            )}
        </div>
    );
};

// 4. Bulk Edit Sidebar (Conversion from Modal)
interface BulkEditSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    initialRoom: Room;
    onSave: () => void;
}

const BulkEditSidebar: React.FC<BulkEditSidebarProps> = ({ isOpen, onClose, initialRoom, onSave }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(_addDays(new Date(), 7));

    const [status, setStatus] = useState<DayStatus>(DAY_STATUS.BOOKABLE);

    const handleBulkSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        // Use internal _format
        console.log(`Bulk saving for Room ${initialRoom.roomName} from ${_format(startDate, 'yyyy-MM-dd')} to ${_format(endDate, 'yyyy-MM-dd')} with Status: ${status}`);
        
        onSave();
        setIsSaving(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[999] bg-black bg-opacity-25 transition-opacity duration-300"
                    onClick={onClose}
                />
            )}
            
            <div className={`fixed inset-y-0 right-0 w-96 bg-white p-6 shadow-2xl transition-transform duration-300 ease-in-out z-[1000] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-2xl font-bold text-gray-800">Bulk Edit</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <p className="text-sm text-gray-500 mt-1 mb-6">For tank: <span className="font-semibold text-blue-600">{initialRoom.roomName}</span></p>

                <div className="space-y-4">
                    <h4 className="font-semibold text-lg text-gray-700 border-b pb-2">Date Range & Status Update</h4>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Date Range</label>
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                // Use internal _format
                                value={_format(startDate, 'yyyy-MM-dd')}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setStartDate(new Date(e.target.value))}
                                className="w-1/2 border border-gray-300 rounded-lg p-2.5 text-center shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            />
                            <input
                                type="date"
                                // Use internal _format
                                value={_format(endDate, 'yyyy-MM-dd')}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setEndDate(new Date(e.target.value))}
                                className="w-1/2 border border-gray-300 rounded-lg p-2.5 text-center shadow-sm focus:ring-blue-500 focus:focus:border-blue-500"
                                min={_format(startDate, 'yyyy-MM-dd')}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">From — To (YYYY-MM-DD)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setStatus(DAY_STATUS.BOOKABLE)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.BOOKABLE ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <Check className="inline h-4 w-4 mr-1" /> Open
                            </button>
                            <button
                                onClick={() => setStatus(DAY_STATUS.CLOSED)}
                                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${status === DAY_STATUS.CLOSED ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                <X className="inline h-4 w-4 mr-1" /> Close
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleBulkSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 mt-6"
                    >
                        <Save className="h-5 w-5 mr-2" />
                        {isSaving ? 'Applying Changes...' : 'Apply Bulk Changes'}
                    </button>
                </div>
            </div>
        </>
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
        // Use internal _format
        displayValue = `${_format(startDate, "yyyy-MM-dd")} — ${_format(endDate, "yyyy-MM-dd")}`;
    } else if (startDate) {
        // Use internal _format
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
const CalendarPage: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);

    // Use internal _startOfDay and _addDays
    const [startDate, setStartDate] = useState<Date>(_startOfDay(new Date()));
    const [endDate, setEndDate] = useState<Date>(_startOfDay(_addDays(new Date(), 29)));

    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [selectedRoomForBulkEdit, setSelectedRoomForBulkEdit] = useState<Room | null>(null);

    const fetchCalendarData = useCallback(async (isInitialLoad = false) => {
        if (isInitialLoad) setLoading(true);
        if (!startDate || !endDate) {
            if (isInitialLoad) setLoading(false);
            setRooms([]);
            return;
        }
        
        // Use internal _startOfDay and _addDays
        const safeStartDate = startDate instanceof Date && !isNaN(startDate.getTime()) ? startDate : _startOfDay(new Date());
        const safeEndDate = endDate instanceof Date && !isNaN(endDate.getTime()) ? endDate : _startOfDay(_addDays(new Date(), 29));

        try {
            // Use internal _format
            const formattedStartDate = _format(safeStartDate, "yyyy-MM-dd");
            const formattedEndDate = _format(safeEndDate, "yyyy-MM-dd");
            const calendarData = await roomService.getRoomsForCalendar(formattedStartDate, formattedEndDate);
            setRooms(calendarData);

        } catch (err) {
            console.error("Failed to fetch calendar data:", err);
            setRooms([]);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => {
        fetchCalendarData(true);
    }, [fetchCalendarData]);

    const openBulkEdit = (room: Room) => {
        setSelectedRoomForBulkEdit(room);
        setIsBulkEditOpen(true);
    };

    const navigateDateRange = (direction: 'prev' | 'next') => {
        if (!startDate || !endDate) return;

        // Calculate current range duration in days
        const rangeDurationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        
        let newStart, newEnd;
        if (direction === 'next') {
            // Use internal _addDays
            newStart = _addDays(startDate, rangeDurationDays);
            newEnd = _addDays(endDate, rangeDurationDays);
        } else {
            // Use internal _subDays
            newStart = _subDays(startDate, rangeDurationDays);
            newEnd = _subDays(endDate, rangeDurationDays);
            
            // Use internal _startOfDay
            const today = _startOfDay(new Date());
            // Use internal _isSameDay and _addDays
            if (newEnd < today) {
                newStart = today;
                newEnd = _addDays(today, rangeDurationDays - 1);
            }
        }
        setStartDate(newStart);
        setEndDate(newEnd);
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
                            // Use internal _isSameDay and _startOfDay
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
                ) : rooms.length > 0 ? (
                    <div className="space-y-10">
                        {rooms.map(room => (
                            <RoomTypeCalendar
                                key={room._id}
                                room={room}
                                startDate={startDate}
                                endDate={endDate}
                                onDataUpdate={fetchCalendarData}
                                onBulkEditClick={openBulkEdit}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-20 text-lg text-gray-500">No floating tanks found or no data for the selected range.</p>
                )}

                {/* Bulk Edit Modal (now a Sidebar) */}
                {selectedRoomForBulkEdit && (
                    <BulkEditSidebar
                        isOpen={isBulkEditOpen}
                        onClose={() => setIsBulkEditOpen(false)}
                        initialRoom={selectedRoomForBulkEdit}
                        onSave={fetchCalendarData}
                    />
                )}
            </div>
        </div>
    );
}

export default CalendarPage;