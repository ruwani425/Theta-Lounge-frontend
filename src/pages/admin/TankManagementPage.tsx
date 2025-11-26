// TankManagementPage.tsx
"use client"

import React, { useEffect, useState } from "react"
import { NavLink, useNavigate } from "react-router-dom"
import { Bath, PlusCircle, ArrowLeft, Info, Trash2, Edit, Clock } from "lucide-react"
import apiRequest from "../../core/axios"

interface Tank {
  _id: string
  name: string
  capacity: number
  length: number
  width: number
  sessionDuration: number
  basePrice: number
  benefits: string
  createdAt: string
  status?: "Ready" | "Occupied" | "Maintenance"
  lastCleaned?: string
}

const TankManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [tanks, setTanks] = useState<Tank[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const fetchTanks = async () => {
      try {
        setLoading(true)
        const response = await apiRequest.get<Tank[]>("/tanks")

        const mappedTanks: Tank[] = response.map((tank) => ({
          ...tank,
          status: "Ready",
          lastCleaned: new Date(tank.createdAt).toLocaleDateString(),
        }))

        setTanks(mappedTanks)
      } catch (error) {
        console.error("Failed to fetch tanks:", error)
        alert("Failed to fetch tanks. Check console for details.")
      } finally {
        setLoading(false)
      }
    }

    fetchTanks()
  }, [])

  const statusColors: Record<string, { bg: string; text: string; border: string }> = {
    Ready: { bg: "#E3F2FD", text: "#92B8D9", border: "#92B8D9" },
    Occupied: { bg: "#EEF4F9", text: "#5A7A95", border: "#5A7A95" },
    Maintenance: { bg: "#F5EBE6", text: "#C4956D", border: "#C4956D" },
  }

  return (
    <div
      className="min-h-screen p-6 md:p-8 lg:p-10"
      style={{ background: "linear-gradient(135deg, #6BA3C5 0%, #475D73 50%, #0F3A52 100%)" }}
    >
      <div className="w-full max-w-7xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-10">
        <NavLink
          to="/admin/dashboard"
          className="inline-flex items-center mb-8 text-base font-semibold transition-colors hover:opacity-80"
          style={{ color: "#233547" }}
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </NavLink>

        <header className="mb-10 pb-6 border-b-2" style={{ borderColor: "#92B8D9" }}>
          <div className="flex items-center gap-3 mb-2">
            <Bath className="w-8 h-8" style={{ color: "#0F3A52" }} />
            <h1 className="text-4xl font-bold" style={{ color: "#233547" }}>
              Tank Management Hub
            </h1>
          </div>
          <p className="text-lg" style={{ color: "#5A7A95" }}>
            View current tank status and manage configurations.
          </p>
        </header>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-8" style={{ color: "#0F3A52" }}>
            Tank Inventory
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Add New Tank Card */}
            <div
              onClick={() => navigate("/admin/add-tank")}
              className="p-8 rounded-xl shadow-md transition-all duration-300 cursor-pointer flex flex-col items-center justify-center text-center h-full min-h-[280px] border-2 border-dashed hover:shadow-lg hover:scale-105"
              style={{
                backgroundColor: "#E8F0F5",
                borderColor: "#5A7A95",
              }}
            >
              <div className="mb-4 p-3 rounded-full" style={{ backgroundColor: "#92B8D9" }}>
                <PlusCircle className="w-8 h-8" style={{ color: "#0F3A52" }} />
              </div>
              <h3 className="text-xl font-bold mb-2" style={{ color: "#0F3A52" }}>
                Add New Tank
              </h3>
              <p style={{ color: "#5A7A95" }}>Configure a new floating pod</p>
            </div>

            {loading ? (
              <p className="text-gray-700 col-span-full">Loading tanks...</p>
            ) : tanks.length === 0 ? (
              <p className="text-gray-700 col-span-full">No tanks found.</p>
            ) : (
              tanks.map((tank) => {
                const colors = statusColors[tank.status || "Ready"]
                return (
                  <div
                    key={tank._id}
                    className="rounded-xl shadow-md transition-all duration-300 flex flex-col bg-white"
                    style={{ borderLeft: `4px solid ${colors.border}` }}
                  >
                    {/* Tank Details */}
                    <div className="flex-grow p-4">
                      <h3 className="text-lg font-bold mb-2" style={{ color: "#0F3A52" }}>
                        {tank.name}
                      </h3>
                      <p className="text-sm font-semibold mb-3" style={{ color: colors.text }}>
                        {tank.status === "Ready"
                          ? "Available for booking"
                          : tank.status === "Occupied"
                          ? "Currently in use"
                          : "Under maintenance"}
                      </p>
                      <span
                        className="inline-block mb-3 px-3 py-1 text-xs font-bold text-white rounded-full"
                        style={{ backgroundColor: colors.text }}
                      >
                        {tank.status}
                      </span>
                      <div className="text-sm space-y-1 border-t pt-3" style={{ borderColor: "#E0E0E0", color: "#666" }}>
                        <p className="flex items-center">
                          <Info className="w-4 h-4 mr-2" style={{ color: "#5A7A95" }} />
                          Capacity: {tank.capacity} person
                        </p>
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" style={{ color: "#5A7A95" }} />
                          Last Cleaned: {tank.lastCleaned}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 border-t flex justify-end gap-2" style={{ borderColor: "#E0E0E0" }}>
                      <button
                        title="Edit Tank"
                        className="p-2 rounded-full transition-all duration-200 hover:bg-opacity-100"
                        style={{ color: "#5A7A95" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#E8F0F5")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        title="Delete Tank"
                        className="p-2 rounded-full transition-all duration-200"
                        style={{ color: "#FF8042" }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FFE8E0")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TankManagementPage
