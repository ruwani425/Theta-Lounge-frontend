import { useSearchParams, useNavigate } from "react-router-dom"
import { Calendar, Clock, MapPin, Phone, ChevronLeft } from "lucide-react"
import { useState, useMemo } from "react"

// --- TYPESCRIPT DEFINITIONS ---

// 1. Define a Union Type for the possible appointment statuses
type AppointmentStatus = "confirmed" | "pending" | "completed"

// 2. Define the Interface for an Appointment object
interface Appointment {
  id: string
  time: string
  clientName: string
  service: string
  duration: string
  phone: string
  location: string
  status: AppointmentStatus
}

// Mock appointment data organized by date (Type-safe)
const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
  "2025-12-15": [
    {
      id: "1",
      time: "09:00 AM",
      clientName: "John Smith",
      service: "Haircut",
      duration: "30 mins",
      phone: "+1 234-567-8900",
      location: "Main Branch",
      status: "confirmed",
    },
    {
      id: "2",
      time: "10:00 AM",
      clientName: "Sarah Johnson",
      service: "Hair Coloring",
      duration: "60 mins",
      phone: "+1 234-567-8901",
      location: "Main Branch",
      status: "confirmed",
    },
    {
      id: "3",
      time: "11:30 AM",
      clientName: "Mike Davis",
      service: "Beard Trim",
      duration: "20 mins",
      phone: "+1 234-567-8902",
      location: "Main Branch",
      status: "pending",
    },
    {
      id: "4",
      time: "02:00 PM",
      clientName: "Emily Wilson",
      service: "Styling",
      duration: "45 mins",
      phone: "+1 234-567-8903",
      location: "Main Branch",
      status: "confirmed",
    },
  ],
  "2025-12-16": [
    {
      id: "5",
      time: "09:30 AM",
      clientName: "Robert Brown",
      service: "Haircut",
      duration: "30 mins",
      phone: "+1 234-567-8904",
      location: "Downtown",
      status: "confirmed",
    },
    {
      id: "6",
      time: "01:00 PM",
      clientName: "Lisa Anderson",
      service: "Spa Treatment",
      duration: "90 mins",
      phone: "+1 234-567-8905",
      location: "Main Branch",
      status: "confirmed",
    },
  ],
}

export default function AppointmentsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  // Use a string or null type for dateParam
  const dateParam: string | null = searchParams.get("date")
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)

  const appointments = useMemo(() => {
    if (!dateParam) return []
    // Cast the lookup result to the expected Appointment[] type
    return MOCK_APPOINTMENTS[dateParam] || []
  }, [dateParam])

  const formattedDate = useMemo(() => {
    if (!dateParam) return ""
    try {
      const date = new Date(dateParam)
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateParam
    }
  }, [dateParam])

  // 3. Status parameter is explicitly typed as AppointmentStatus
  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-700 border-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-700 border-yellow-300"
      case "completed":
        return "bg-blue-100 text-blue-700 border-blue-300"
      default:
        // Ensures a fallback for comprehensive function return
        return "bg-gray-100 text-gray-700 border-gray-300" 
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
            <p className="mt-2 text-muted-foreground">{formattedDate && `Viewing appointments for ${formattedDate}`}</p>
          </div>
          <button
            onClick={() => navigate(-1)} // React Router DOM back navigation
            className="flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-foreground hover:bg-muted transition-all"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Back</span>
          </button>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {appointments.length > 0 ? (
            appointments.map((appointment) => {
              const isSelected = selectedAppointment === appointment.id
              return (
                <div
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(isSelected ? null : appointment.id)}
                  className="rounded-lg border border-border bg-card p-6 cursor-pointer hover:bg-muted transition-all"
                >
                  {/* Appointment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5 text-primary" />
                          <span className="text-lg font-bold text-foreground">{appointment.time}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground">{appointment.clientName}</h3>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusColor(appointment.status)}`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  {/* Quick Info */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Service:</span>
                      <span className="text-sm text-foreground">{appointment.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-muted-foreground">Duration:</span>
                      <span className="text-sm text-foreground">{appointment.duration}</span>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isSelected && (
                    <div className="border-t border-border pt-4 mt-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{appointment.phone}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{appointment.location}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 mt-4">
                        <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-opacity-90 transition-all">
                          Confirm
                        </button>
                        <button className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-all">
                          Reschedule
                        </button>
                        <button className="flex-1 px-4 py-2 border border-destructive text-destructive rounded-lg font-medium hover:bg-destructive/10 transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border border-border bg-card p-12 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Appointments</h3>
              <p className="text-muted-foreground">
                {dateParam ? "No appointments scheduled for this date." : "Please select a date to view appointments."}
              </p>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        {appointments.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Total Appointments</p>
              <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {appointments.filter((a) => a.status === "confirmed").length}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {appointments.filter((a) => a.status === "pending").length}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}