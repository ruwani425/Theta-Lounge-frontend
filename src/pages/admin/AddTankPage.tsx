import type React from "react"
import { useState, type FormEvent, type ChangeEvent, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom" 
import { PlusCircle, Hash, Ruler, Info, Text, ArrowLeft, Edit, Loader2, User } from "lucide-react" 
import apiRequest from "../../core/axios"
// import type { AxiosResponse } from "axios" // Removed as apiRequest appears to return the data body directly

// --- INTERFACE DEFINITION ---

interface TankSubmissionData {
  name: string
  capacity: number
  length: number
  width: number
  benefits: string
  status: "Ready" | "Occupied" | "Maintenance"
}

// Interface for state (All bindable fields must be string for input value consistency)
interface TankFormState {
  _id?: string;
  name: string
  capacity: string 
  length: string
  width: string
  benefits: string
  status: "Ready" | "Occupied" | "Maintenance"
}

// Initial state for a brand new tank
const initialTankState: TankFormState = {
  name: "",
  capacity: '1', 
  length: '2.5', 
  width: '1.5',  
  benefits: "Deep relaxation, pain relief, improved sleep.",
  status: "Ready" as const,
}

const AddTankPage: React.FC = () => {
  const navigate = useNavigate()
  // FIX 1: Only destructure the 'id' parameter. The presence of 'id' indicates edit mode.
  const { id } = useParams<{ id: string }>() 
  const isEditMode = !!id; // Edit mode if ID is present
  
  // Use state to track loading specifically for edit mode data fetch
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [formData, setFormData] = useState<TankFormState>(initialTankState)
  
  // --- Data Fetch for Edit Mode (GET API Call) ---
  useEffect(() => {
    if (isEditMode) {
      const fetchTankData = async () => {
        try {
          setIsLoading(true);
          
          interface RawTankData {
            _id: string;
            name: string;
            capacity: number; 
            length: number;   
            width: number;    
            benefits: string;
            status: "Ready" | "Occupied" | "Maintenance";
          }
          
          // API call uses the correctly extracted ID (GET call for existing data)
          // Note: apiRequest.get returns the data body directly.
          const response = await apiRequest.get<RawTankData>(`/tanks/${id}`);
          
          // FIX 2: Explicitly convert all numeric fields to strings for form binding
          const tankData: TankFormState = {
              _id: response._id, 
              name: response.name,
              capacity: String(response.capacity), 
              length: String(response.length),
              width: String(response.width),
              benefits: response.benefits,
              status: response.status || 'Ready',
          };

          setFormData(tankData);
        } catch (error) {
          console.error(`Failed to fetch tank ${id}:`, error);
          // Using alert instead of a custom modal for simplicity as per instructions
          alert(`Failed to load tank data. Check console. Redirecting to tank inventory.`);
          navigate('/admin/tank-management');
        } finally {
          setIsLoading(false);
        }
      };
      fetchTankData();
    }
  }, [isEditMode, id, navigate]); // Removed 'mode' from dependency array

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target 
    setFormData((prev) => ({
      ...prev,
      [name]: value, 
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    // 1. Prepare data for submission: Convert input strings back to numbers for the API payload
    const dataToSubmit: TankSubmissionData = {
        name: formData.name,
        capacity: Number(formData.capacity),
        length: Number(formData.length),
        width: Number(formData.width),
        benefits: formData.benefits,
        status: formData.status, 
    };
    
    try {
      console.log("Sending tank data to backend:", dataToSubmit);

      // MODIFICATION: Changed variable type to expect the data body directly.
      let responseData: { message: string; tank?: any };
      let successMessage: string;

      if (isEditMode && formData._id) {
        // PATCH/UPDATE MODE: This is the edit API call!
        // apiRequest.patch returns the data body directly.
        responseData = await apiRequest.patch<{ message: string; tank?: any }>(`/tanks/${formData._id}`, dataToSubmit);
        successMessage = `Tank '${formData.name}' updated successfully!`;
      } else {
        // POST/ADD MODE
        // apiRequest.post returns the data body directly.
        responseData = await apiRequest.post<{ message: string; tank?: any }>("/tanks", dataToSubmit);
        successMessage = `Tank '${formData.name}' added successfully!`;
      }
      
      // MODIFICATION: Logging the responseData directly (which is the body)
      console.log("Backend response (data body):", responseData)
      // Using alert instead of a custom modal for simplicity as per instructions
      alert(successMessage) 
      navigate("/admin/tank-management")
    } catch (error: any) {
      console.error("Failed to save tank", error)
      // Using alert instead of a custom modal for simplicity as per instructions
      alert("Failed to save tank. Check console for details.")
    }
  }
  
  if (isEditMode && isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#F0F8FB] via-[#E8F4F9] to-[#F5FAFC]">
            <Loader2 className="w-8 h-8 animate-spin mr-3 text-cyan-600" />
            <p className="text-lg text-slate-700">Loading tank data...</p>
        </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-10 bg-gradient-to-br from-[#F0FF8FB] via-[#E8F4F9] to-[#F5FAFC]">
      <div className="w-full max-w-4xl mx-auto bg-white/95 backdrop-blur-sm rounded-3xl shadow-lg p-8 md:p-10 border border-cyan-100/50 hover:border-cyan-200/70 transition-colors duration-300">
        <button
          onClick={() => navigate("/admin/tank-management")}
          className="inline-flex items-center mb-8 text-base font-semibold transition-all duration-300 hover:text-cyan-600 hover:translate-x-1 text-slate-700"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Tank Inventory
        </button>

        <header className="mb-10 pb-8 border-b-2 border-cyan-200/60">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-cyan-100/40 border border-cyan-300/50">
              {isEditMode ? <Edit className="w-8 h-8 text-cyan-700" /> : <PlusCircle className="w-8 h-8 text-cyan-700" />}
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-800 to-blue-900 bg-clip-text text-transparent">
              {isEditMode ? `Edit Tank: ${formData.name || id}` : "Add New Floating Tank"}
            </h1>
          </div>
          <p className="text-lg text-slate-600 ml-11">
             {isEditMode ? `Updating parameters for tank ID: ${id}` : "Configure the physical and service parameters."}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-cyan-200/60 pb-3">
                <Ruler className="w-5 h-5 text-cyan-700" />
                <h2 className="text-2xl font-bold text-slate-800">Physical Specs</h2>
              </div>

              <FormField
                id="name"
                name="name"
                label="Tank Name"
                value={formData.name}
                onChange={handleChange}
                icon={Hash}
                placeholder="e.g., Neptune, Orion"
              />

              <FormField
                id="capacity"
                name="capacity"
                label="Max Capacity (People)"
                value={formData.capacity} // Now guaranteed to be a string
                onChange={handleChange}
                icon={User}
                type="number"
              />

              <FormField
                id="length"
                name="length"
                label="Tank Length (meters)"
                value={formData.length} // Now guaranteed to be a string
                onChange={handleChange}
                icon={Ruler}
                type="number"
                step="0.1"
              />
                
              <FormField
                id="width"
                name="width"
                label="Tank Width (meters)"
                value={formData.width} // Now guaranteed to be a string
                onChange={handleChange}
                icon={Ruler}
                type="number"
                step="0.1"
              />

            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 border-b-2 border-cyan-200/60 pb-3">
                <Info className="w-5 h-5 text-cyan-700" />
                <h2 className="text-2xl font-bold text-slate-800">Therapy & Details</h2>
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-slate-800">
                  <Text className="w-4 h-4 mr-2 text-cyan-700" />
                  Floating Therapy Benefits
                </label>
                <textarea
                  id="benefits"
                  name="benefits"
                  rows={5}
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Describe unique relaxation and health benefits..."
                  className="w-full p-4 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 bg-blue-50/40 border-cyan-200/60 text-slate-800 placeholder-slate-400 focus:ring-cyan-400/60 focus:border-cyan-400/80 focus:shadow-lg focus:shadow-cyan-200/20"
                />
                
              </div>
            </div>
            
          {/* Hidden field to retain status during edit mode update */}
          {isEditMode && (
            <input 
              type="hidden" 
              name="status" 
              value={formData.status} 
              onChange={handleChange} 
            />
          )}

          </div>

          <div className="pt-8 border-t border-cyan-200/40">
            <button
              type="submit"
              className="px-8 py-4 text-white font-bold rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:shadow-cyan-300/40 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 active:scale-95"
            >
              {isEditMode ? (
                  <> 
                    <Edit className="w-5 h-5" />
                    Save Changes
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5" />
                    Add New Floating Tank
                  </>
                )}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default AddTankPage

interface FormFieldProps {
  id: string
  name: string
  label: string
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  icon: React.ElementType
  type?: string
  placeholder?: string
  step?: string
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
  placeholder = "",
  step,
}) => (
  <div className="space-y-2">
    <label htmlFor={id} className="flex items-center text-sm font-semibold text-slate-800">
      <Icon className="w-4 h-4 mr-2 text-cyan-700" />
      {label}
    </label>
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      step={step}
      className="w-full p-4 border rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 bg-blue-50/40 border-cyan-200/60 text-slate-800 placeholder-slate-400 focus:ring-cyan-400/60 focus:border-cyan-400/80 focus:shadow-lg focus:shadow-cyan-200/20"
    />
  </div>
)