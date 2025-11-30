"use client"

import type React from "react"
import { useEffect, useState, useCallback, memo } from "react"
import { useNavigate } from "react-router-dom"
import { Bath, PlusCircle, ArrowLeft, Trash2, Edit } from "lucide-react" 
import apiRequest from "../../core/axios" 

// --- INTERFACE DEFINITION ---

interface Tank {
  _id: string
  name: string
  capacity: number
  length: number
  width: number
  benefits: string 
  createdAt: string
  updatedAt: string 
  status?: "Ready" | "Occupied" | "Maintenance"
}

// --- STATUS COLORS (Used for status text and toggle backgrounds) ---

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  Ready: { bg: "#4CAF50", text: "#FFFFFF", border: "#4CAF50" }, // Green for Ready
  Occupied: { bg: "#FF9800", text: "#FFFFFF", border: "#FF9800" }, // Orange for Occupied (Read-only)
  Maintenance: { bg: "#F44336", text: "#FFFFFF", border: "#F44336" }, // Red for Maintenance
}

// --- STATUS TOGGLE COMPONENT ---

interface StatusToggleProps {
  tank: Tank;
  onUpdate: (id: string, newStatus: "Ready" | "Maintenance") => void;
  disabled: boolean;
}

const StatusToggle: React.FC<StatusToggleProps> = memo(({ tank, onUpdate, disabled }) => {
    // Check if the current status is one that the admin can toggle (Ready or Maintenance)
    const isTogglable = tank.status === 'Ready' || tank.status === 'Maintenance';
    
    // Calculate the current visual state: ON means Maintenance, OFF means Ready
    const isMaintenance = tank.status === 'Maintenance';
    
    const toggleHandler = () => {
        if (disabled || !isTogglable) return;

        // Determine the new status based on the current togglable status
        const newStatus = isMaintenance ? "Ready" : "Maintenance";
        onUpdate(tank._id, newStatus);
    };

    const baseClasses = `relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none`;
    const circleClasses = `inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`;
    
    // Determine colors and disability based on status
    const currentColor = isMaintenance ? statusColors.Maintenance.bg : statusColors.Ready.bg;
    const isDisabled = disabled || tank.status === 'Occupied';
    
    return (
        <div className="flex items-center gap-2">
            <button
                onClick={toggleHandler}
                disabled={isDisabled}
                type="button"
                role="switch"
                aria-checked={isMaintenance}
                className={`${baseClasses} ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                style={{ backgroundColor: isDisabled && !isTogglable ? statusColors.Occupied.bg : currentColor }}
            >
                <span 
                    className={circleClasses} 
                    style={{ transform: isMaintenance ? 'translateX(20px)' : 'translateX(4px)' }} 
                />
            </button>
            <span className="text-sm font-semibold" style={{ color: isDisabled && !isTogglable ? statusColors.Occupied.bg : currentColor }}>
              {tank.status}
            </span>
        </div>
    );
});

StatusToggle.displayName = 'StatusToggle';

// --- MAIN COMPONENT ---

const TankManagementPage: React.FC = () => {
  const navigate = useNavigate()
  const [tanks, setTanks] = useState<Tank[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [updating, setUpdating] = useState<string | null>(null); // Stores the ID of the tank currently being updated

  // --- API & State Handlers ---

  // 1. Handle Status Update (Optimistic UI + API Call)
  const handleStatusUpdate = useCallback(async (id: string, newStatus: "Ready" | "Maintenance") => {
    setUpdating(id); // Set loading state for this specific tank

    const originalTanks = tanks;
    
    // Optimistic Update: Update the UI immediately
    setTanks(prev => prev.map(t => t._id === id ? { ...t, status: newStatus } : t));

    try {
        // Use apiRequest.patch for partial update (status only)
        await apiRequest.patch(`/tanks/${id}`, { status: newStatus }); 
        console.log(`Tank ${id} status updated to ${newStatus}`);
    } catch (error) {
        console.error("Failed to update tank status:", error);
        // Revert UI on failure
        setTanks(originalTanks);
        alert("Failed to update status. Check console for details.");
    } finally {
        setUpdating(null);
    }
  }, [tanks]);
  

  // 2. Handle Delete
  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete tank: ${name}? This action cannot be undone.`)) {
        try {
            // Send DELETE request to the backend
            await apiRequest.delete(`/tanks/${id}`);

            // Update UI optimistically by filtering the deleted tank
            setTanks(prev => prev.filter(t => t._id !== id));
            alert(`Tank ${name} deleted successfully.`);
        } catch (error) {
            console.error("Failed to delete tank:", error);
            alert("Failed to delete tank. Ensure the tank is not currently booked.");
        }
    }
  };

  // 3. Handle Edit (Navigation)
  const handleEdit = (id: string) => {
    // Navigate to the Add/Edit page with the tank ID in the URL to signal edit mode
    navigate(`/admin/add-tank/edit/${id}`); 
  };
  
  // 4. Fetch Tanks (Initial Data Load)
  useEffect(() => {
    const fetchTanks = async () => {
      try {
        setLoading(true)
        const response = await apiRequest.get<Tank[]>("/tanks")

        const mappedTanks: Tank[] = response.map((tank) => ({
          ...tank,
          // Default status to "Ready" if not provided by API
          status: (tank.status || "Ready") as "Ready" | "Occupied" | "Maintenance", 
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

  const handleAddTank = () => {
    navigate("/admin/add-tank");
  };

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-gradient-to-br from-[#F0F8FB] via-[#E8F4F9] to-[#F5FAFC]">
      <div className="w-full max-w-7xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 md:p-10 border border-cyan-100/50 hover:border-cyan-200/70 transition-colors duration-300">
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="inline-flex items-center mb-8 text-base font-semibold transition-all duration-300 hover:text-cyan-600 hover:translate-x-1 text-slate-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>

        <header className="mb-10 pb-8 border-b-2 border-cyan-200/60 pb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-100/40 border border-cyan-300/50">
              <Bath className="w-8 h-8 text-cyan-700" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-800 to-blue-900 bg-clip-text text-transparent">
              Tank Management Hub
            </h1>
            </div>
          <p className="text-lg text-slate-600 ml-11">View current tank status and manage configurations.</p>
        </header>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-8 border-b border-cyan-200/60 pb-4">
            <h2 className="text-3xl font-bold text-cyan-900">Tank Inventory</h2>
            <button
              onClick={handleAddTank}
              className="px-5 py-2 text-white font-semibold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-cyan-300/40 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 active:scale-95"
            >
              <PlusCircle className="w-5 h-5" />
              Add New Tank
            </button>
          </div>


          {loading ? (
            <p className="text-slate-600 col-span-full text-center py-8">Loading tanks...</p>
          ) : tanks.length === 0 ? (
            <p className="text-slate-600 col-span-full text-center py-8">No tanks found. Click "Add New Tank" to get started.</p>
          ) : (
            // --- RESPONSIVE TANK TABLE ---
            <div className="overflow-x-auto rounded-xl shadow-lg border border-cyan-200/50">
              <table className="min-w-full divide-y divide-cyan-200/60">
                <thead className="bg-cyan-50/50">
                  <tr>
                    {/* Name: fixed width */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 w-[10rem]">
                      Tank Name
                    </th>
                    {/* Status: fixed width */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 w-[10rem]">
                      Status
                    </th>
                    {/* Capacity: fixed width */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 hidden sm:table-cell w-[8rem]">
                      Capacity
                    </th>
                    {/* Dimensions: fixed width */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 hidden lg:table-cell w-[8rem]">
                      Dimensions (m)
                    </th>
                    {/* Created Date: fixed width */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 hidden md:table-cell w-[8rem]">
                      Created
                    </th>
                    {/* Benefits: remaining dynamic width, set to normal wrapping */}
                    <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-cyan-800 hidden lg:table-cell w-full">
                      Benefits
                    </th>
                    {/* Actions: fixed width */}
                    <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-cyan-800 w-[6rem]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-100 bg-white">
                  {tanks.map((tank) => {
                    
                    // Helper for date formatting
                    const formatDate = (dateString: string | undefined) => 
                      dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

                    return (
                      <tr key={tank._id} className="hover:bg-blue-50/30 transition-colors duration-150">
                        {/* Name */}
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 align-top">
                          {tank.name}
                        </td>
                        
                        {/* Status (Toggle Button) */}
                        <td className="px-6 py-4 whitespace-nowrap align-top">
                            <StatusToggle 
                                tank={tank}
                                onUpdate={handleStatusUpdate}
                                disabled={updating === tank._id}
                            />
                        </td>
                        
                        {/* Capacity */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden sm:table-cell align-top">
                          {tank.capacity}
                        </td>
                        
                        {/* Dimensions */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden lg:table-cell align-top">
                          {tank.length} x {tank.width}
                        </td>
                        
                        {/* Created Date */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 hidden md:table-cell align-top">
                          {formatDate(tank.createdAt)}
                        </td>

                        {/* Benefits: Removed truncation and allow wrapping */}
                        <td className="px-6 py-4 text-sm text-slate-700 hidden lg:table-cell whitespace-normal max-w-lg align-top">
                          {tank.benefits}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(tank._id)}
                              title="Edit Tank"
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-cyan-200/40 text-cyan-700 hover:text-cyan-900"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(tank._id, tank.name)}
                              title="Delete Tank"
                              className="p-2 rounded-lg transition-all duration-200 hover:bg-red-200/40 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TankManagementPage