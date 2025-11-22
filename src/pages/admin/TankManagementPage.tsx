// src/pages/admin/TankManagementPage.tsx

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bath, PlusCircle, ArrowLeft, Info, Trash2, Edit, Clock, BathIcon } from "lucide-react";

// --- MOCK DATA ---
const MOCK_TANKS = [
    { id: 1, name: "Neptune Chamber", status: "Ready", capacity: 1, lastCleaned: "2 hours ago", imageUrl: "/Building_Biology_Consultancy_25.webp" },
    { id: 2, name: "Orion Pod", status: "Occupied", capacity: 1, lastCleaned: "Yesterday", imageUrl: "/Building_Biology_Consultancy_25.webp" },
    { id: 3, name: "Zen Floater XL", status: "Maintenance", capacity: 2, lastCleaned: "4 days ago", imageUrl: "/Building_Biology_Consultancy_25.webp" },
    { id: 4, name: "Aqua Retreat", status: "Ready", capacity: 1, lastCleaned: "1 hour ago", imageUrl: "/Building_Biology_Consultancy_25.webp" }, // Added for more variety
];

// --- CUSTOM TAILWIND STYLES (Theta Lounge Theme) ---
const CustomStyle = `
  .text-theta-primary { color: #233547; } 
  .bg-theta-light { background-color: #92B8D9; } 
  .text-theta-secondary { color: #475D73; } 
  .bg-theta-background { background-color: #CEDBE6; } 

  .border-status-ready { border-left: 4px solid #00C49F; } /* Green */
  .border-status-occupied { border-left: 4px solid #FFBB28; } /* Yellow */
  .border-status-maintenance { border-left: 4px solid #FF8042; } /* Orange */

  /* Image Placeholder Styles - if you don't have actual images */
  .tank-image-placeholder {
    background: linear-gradient(135deg, #92B8D9, #CEDBE6); /* bg-theta-light to bg-theta-background gradient */
    display: flex;
    align-items: center;
    justify-content: center;
    color: #233547; /* text-theta-primary */
    font-weight: bold;
    font-size: 0.8rem;
    text-align: center;
    border-radius: 0.5rem; /* Rounded corners for the image container */
  }
`;

const TankManagementPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-theta-background p-0">
            <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
            
            <div className="relative w-full max-w-full mx-auto p-10 md:p-12 bg-white rounded-2xl shadow-3xl">
                
                {/* Header and Back Link */}
                <NavLink
                    to="/admin/dashboard"
                    className="inline-flex items-center text-theta-primary hover:text-theta-secondary transition-colors mb-6"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Back to Dashboard</span>
                </NavLink>

                <header className="mb-10 border-b border-gray-200 pb-4">
                    <h1 className="flex items-center text-4xl font-extrabold text-theta-primary">
                        <Bath className="w-8 h-8 mr-3" />
                        Tank Management Hub
                    </h1>
                    <p className="text-lg text-theta-secondary mt-1">
                        View current tank status and manage configurations.
                    </p>
                </header>

                <section>
                    <h2 className="text-2xl font-bold text-theta-primary mb-6">Tank Inventory</h2>
                    
                    {/* Tank Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        
                        {/* 1. ADD NEW TANK BOX (Navigation) */}
                        <div 
                            onClick={() => navigate('/admin/add-tank')} // 💡 Navigation link
                            className="p-6 bg-theta-background border-2 border-dashed border-theta-secondary/50 rounded-xl 
                                       shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer 
                                       flex flex-col items-center justify-center text-center h-full min-h-[250px] hover:bg-theta-background/80"
                        >
                            <PlusCircle className="w-10 h-10 mb-3" style={{ color: '#475D73' }} />
                            <h3 className="text-xl font-bold text-theta-primary">Add New Tank</h3>
                            <p className="text-sm text-theta-secondary">Configure a new floating pod</p>
                        </div>

                        {/* 2. Existing Tank Boxes (Mapped) */}
                        {MOCK_TANKS.map((tank) => (
                            <div 
                                key={tank.id} 
                                className={`p-4 bg-white rounded-xl shadow-md transition-shadow duration-300 hover:shadow-lg 
                                            ${'border-status-' + tank.status.toLowerCase()} flex flex-col`}
                            >
                                {/* 💡 Tank Image Section */}
                                <div className="relative w-full h-32 bg-gray-200 rounded-lg mb-4 overflow-hidden flex-shrink-0">
                                    {/* Replace with your actual image path */}
                                    <img 
                                        src={tank.imageUrl || "https://via.placeholder.com/200x128?text=Float+Tank"} 
                                        alt={`${tank.name} Float Tank`} 
                                        className="w-full h-full object-cover" 
                                    />
                                    {/* Optional: Status Overlay on Image */}
                                    <span 
                                        className={`absolute bottom-2 left-2 px-3 py-1 text-xs font-bold text-white rounded-full
                                                    ${tank.status === 'Ready' ? 'bg-[#00C49F]' : tank.status === 'Occupied' ? 'bg-[#FFBB28]' : 'bg-[#FF8042]'}`}
                                    >
                                        {tank.status}
                                    </span>
                                </div>


                                <div className="flex-grow"> {/* Allows details to push actions to bottom */}
                                    <h3 className="text-xl font-bold text-theta-primary mb-1">{tank.name}</h3>
                                    <p className="text-sm font-semibold mt-1 mb-3" style={{ color: tank.status === 'Ready' ? '#00C49F' : tank.status === 'Occupied' ? '#FFBB28' : '#FF8042' }}>
                                        {tank.status === 'Ready' ? 'Available for booking' : tank.status === 'Occupied' ? 'Currently in use' : 'Under maintenance'}
                                    </p>
                                    <div className="text-sm text-gray-600 space-y-1 border-t pt-3">
                                        <p><Info className="w-4 h-4 inline mr-2 align-middle" /> Capacity: {tank.capacity} person</p>
                                        <p><Clock className="w-4 h-4 inline mr-2 align-middle" /> Last Cleaned: {tank.lastCleaned}</p>
                                    </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="mt-4 flex justify-end space-x-2 border-t pt-3 flex-shrink-0">
                                    <button title="Edit Tank" className="p-2 rounded-full text-theta-secondary hover:bg-gray-100 hover:text-theta-primary transition-colors">
                                        <Edit className="w-5 h-5" />
                                    </button>
                                    <button title="Delete Tank" className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default TankManagementPage;