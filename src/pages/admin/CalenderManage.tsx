"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, X, Save, Clock } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Mock data for operational hours by day of week
const INITIAL_OPERATIONAL_HOURS: Record<number, string> = {
  0: "CLOSED", // Sunday
  1: "09:00 - 17:00", // Monday
  2: "09:00 - 17:00", // Tuesday
  3: "09:00 - 17:00", // Wednesday
  4: "09:00 - 17:00", // Thursday
  5: "09:00 - 16:00", // Friday
  6: "10:00 - 14:00", // Saturday
}

const INITIAL_CLOSED_DATES = new Set(["2025-12-25", "2025-01-01"])

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const WEEKDAY_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isClosed: boolean
}

const getDaysInMonth = (date: Date): CalendarDay[] => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days: CalendarDay[] = []

  const startDayOfWeek = firstDay.getDay()
  const prevMonth = new Date(year, month, 0)
  for (let i = startDayOfWeek; i > 0; i--) {
    const d = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), prevMonth.getDate() - i + 1)
    days.push({ date: d, isCurrentMonth: false, isClosed: false })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true, isClosed: false })
  }

  const remainingSlots = 42 - days.length
  const nextMonth = new Date(year, month + 1, 1)
  for (let i = 0; i < remainingSlots; i++) {
    const d = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate() + i)
    days.push({ date: d, isCurrentMonth: false, isClosed: false })
  }

  return days
}

const formatDateToKey = (date: Date): string => date.toISOString().split("T")[0]

export default function CalendarManagement() {
  const navigate = useNavigate()
  // Using fixed date for reliable mock testing of closed dates
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date(2025, 10, 1)) 
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2025, 11, 15))
  const [operationalHours, setOperationalHours] = useState(INITIAL_OPERATIONAL_HOURS)
  const [closedDates, setClosedDates] = useState(INITIAL_CLOSED_DATES)
  const [savedMessage, setSavedMessage] = useState("")

  const calendarDays = useMemo(() => {
    const days = getDaysInMonth(currentMonth)
    return days.map((day) => ({
      ...day,
      isClosed: closedDates.has(formatDateToKey(day.date)),
    }))
  }, [currentMonth, closedDates])

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const handleDateClick = (date: Date) => {
    if (date.getMonth() === currentMonth.getMonth()) {
      setSelectedDate(date)
    }
  }

  const toggleDateClosed = () => {
    if (!selectedDate) return
    const key = formatDateToKey(selectedDate)
    const newClosed = new Set(closedDates)

    if (newClosed.has(key)) {
      newClosed.delete(key)
    } else {
      newClosed.add(key)
    }
    setClosedDates(newClosed)
  }

  const updateOperationalHours = (day: number, hours: string) => {
    setOperationalHours((prev) => ({
      ...prev,
      [day]: hours,
    }))
  }

  const handleSave = async () => {
    // Simulate API call to save hours
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSavedMessage("Changes saved successfully!")
    setTimeout(() => setSavedMessage(""), 3000)
  }

 const handleViewAppointments = () => {
    if (selectedDate) {
      // Format the date as 'YYYY-MM-DD' for the query parameter (e.g., 2025-12-15)
      const dateString = selectedDate.toISOString().split('T')[0];

      // Use navigate() to go to the appointments page, passing the date as a query parameter.
      // The target path should match your React Router route configuration.
      navigate(`/admin/view-appointments?date=${dateString}`);    
    }
  };

  const selectedDateKey = selectedDate ? formatDateToKey(selectedDate) : null
  const isSelectedDateClosed = selectedDateKey ? closedDates.has(selectedDateKey) : false
  const selectedDayOfWeek = selectedDate?.getDay() ?? 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calendar Management</h1>
            <p className="mt-2 text-muted-foreground">Manage business hours and close days</p>
          </div>
          <button
            onClick={() => navigate("/reservations")}
            className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-foreground hover:bg-muted transition-all"
          >
            <X className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Main Layout: Calendar + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Section */}
          <div className="lg:col-span-3 rounded-lg border border-border bg-card p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePrevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <h2 className="text-2xl font-bold text-foreground">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <button onClick={handleNextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {WEEKDAY_SHORT.map((day) => (
                <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                const isSelected = selectedDate && selectedDate.toDateString() === day.date.toDateString()
                const isCurrentMonth = day.isCurrentMonth
                const isPastDate = day.date < new Date(new Date().setHours(0, 0, 0, 0))

                return (
                  <button
                    key={index}
                    onClick={() => handleDateClick(day.date)}
                    disabled={!isCurrentMonth || isPastDate}
                    className={`
                      aspect-square p-2 rounded-lg text-sm font-medium transition-all
                      ${!isCurrentMonth || isPastDate ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"}
                      ${isSelected ? "bg-primary text-primary-foreground ring-2 ring-primary" : "border border-border hover:bg-muted"}
                      ${day.isClosed && isCurrentMonth && !isPastDate ? "bg-red-100 border-red-300 text-red-700" : ""}
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sidebar: Date Details & Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Selected Date Card */}
            {selectedDate && (
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>

                {/* Close/Open Toggle and View Appointments Button */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={toggleDateClosed}
                    className={`
                      w-full px-4 py-3 rounded-lg font-medium transition-all
                      ${
                        isSelectedDateClosed
                          ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                          : "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                      }
                    `}
                  >
                    {isSelectedDateClosed ? "Mark Day as Open" : "Mark Day as Closed"}
                  </button>

                  {isSelectedDateClosed && (
                    <p className="text-xs text-red-600 text-center">This day is closed for bookings</p>
                  )}

                {selectedDate &&
                  selectedDate.getMonth() === currentMonth.getMonth() &&
                  // Checks if the selected date is today or a future date
                  selectedDate >= new Date(new Date().setHours(0, 0, 0, 0)) && (
                    <button
                      onClick={handleViewAppointments} // This now correctly navigates
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/80 transition-all border border-secondary"
                    >
                      <Clock className="h-5 w-5" />
                      View Appointments
                    </button>
                  )}
                </div>

                {/* Day of Week Hours */}
                <div className="border-t border-border pt-4">
                  <p className="text-sm font-semibold text-foreground mb-3">{WEEKDAYS[selectedDayOfWeek]} Hours:</p>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{operationalHours[selectedDayOfWeek]}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Hours Settings */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Business Hours</h3>
              <div className="space-y-3">
                {WEEKDAYS.map((day, index) => (
                  <div key={day} className="space-y-1">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">{day}</label>
                    <input
                      type="text"
                      placeholder="e.g., 09:00 - 17:00"
                      value={operationalHours[index]}
                      onChange={(e) => updateOperationalHours(index, e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-opacity-90 transition-all"
            >
              <Save className="h-5 w-5" />
              Save Changes
            </button>

            {/* Success Message */}
            {savedMessage && (
              <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm text-center">{savedMessage}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}