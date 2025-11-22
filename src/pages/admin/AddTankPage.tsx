// src/pages/admin/AddTankPage.tsx

import React, { useState, type FormEvent, type ChangeEvent } from "react";
import { NavLink } from "react-router-dom";
import {
  Bath,
  PlusCircle,
  Hash,
  Ruler,
  Clock,
  Info,
  Text,
  Image,
  ArrowLeft,
  DollarSign,
  User 
} from "lucide-react";

// --- CUSTOM TAILWIND STYLES (Theta Lounge Theme) ---
const CustomStyle = `
  .text-theta-primary { color: #233547; } 
  .bg-theta-light { background-color: #92B8D9; } 
  .text-theta-secondary { color: #475D73; } 

  .focus\\:ring-theta-light:focus { --tw-ring-color: #92B8D9; }
  .focus\\:border-theta-light:focus { border-color: #92B8D9; }
`;

// Interface for form state
interface TankFormState {
  name: string;
  capacity: number;
  length: number;
  width: number;
  sessionDuration: number;
  basePrice: number;
  benefits: string;
  imagePreview: string | null;
}

const AddTankPage: React.FC = () => {
  const [formData, setFormData] = useState<TankFormState>({
    name: "",
    capacity: 1,
    length: 2.5,
    width: 1.5,
    sessionDuration: 60,
    basePrice: 80,
    benefits: "Deep relaxation, pain relief, improved sleep.",
    imagePreview: null,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Adding Tank:", formData);
    alert(`Tank '${formData.name}' added successfully! (Mock submission)`);
  };

  return (
    <div className="min-h-screen bg-theta-background p-0">
      <style dangerouslySetInnerHTML={{ __html: CustomStyle }} />
      
      <div className="relative w-full max-w-full mx-auto p-8 md:p-12 bg-white rounded-2xl shadow-3xl">
        
        {/* Header and Back Link */}
        <NavLink
            to="/admin/tank-management" // Navigate back to the management hub
            className="inline-flex items-center text-theta-primary hover:text-theta-secondary transition-colors mb-6"
        >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-semibold">Back to Tank Inventory</span>
        </NavLink>

        <header className="mb-10 border-b border-gray-200 pb-4">
          <h1 className="flex items-center text-4xl font-extrabold text-theta-primary">
            <PlusCircle className="w-8 h-8 mr-3" />
            Add New Floating Tank
          </h1>
          <p className="text-lg text-theta-secondary mt-1">
            Configure the physical and service parameters.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* 1. TANK CONFIGURATION */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-bold text-theta-primary border-b pb-2 mb-4">
                <Ruler className="w-5 h-5 inline mr-2 align-text-bottom" />
                Physical Specs & Pricing
              </h2>
              
              <TextField 
                id="name" 
                name="name" 
                label="Tank Name (e.g., Neptune, Orion)" 
                value={formData.name} 
                onChange={handleChange} 
                icon={Hash}
              />
              
              <NumberField 
                id="capacity" 
                name="capacity" 
                label="Max Capacity (People)" 
                value={formData.capacity} 
                onChange={handleChange} 
                icon={User}
              />
              
              <NumberField 
                id="length" 
                name="length" 
                label="Tank Length (meters)" 
                value={formData.length} 
                onChange={handleChange} 
                icon={Ruler}
                step="0.1"
              />
              
              <NumberField 
                id="sessionDuration" 
                name="sessionDuration" 
                label="Default Session Duration (min)" 
                value={formData.sessionDuration} 
                onChange={handleChange} 
                icon={Clock}
              />
              
              <NumberField 
                id="basePrice" 
                name="basePrice" 
                label="Base Price (USD)" 
                value={formData.basePrice} 
                onChange={handleChange} 
                icon={DollarSign}
                step="5"
              />
            </div>
            
            {/* 2. MARKETING & CONTENT SUGGESTIONS */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-2xl font-bold text-theta-primary border-b pb-2 mb-4">
                <Info className="w-5 h-5 inline mr-2 align-text-bottom" />
                Therapy Suggestions & Media
              </h2>

              {/* Text Field for Suggestions */}
              <div className="space-y-2">
                <Label htmlFor="benefits" text="Floating Therapy Benefits (Marketing Text)" icon={Text} />
                <textarea
                  id="benefits"
                  name="benefits"
                  rows={5}
                  value={formData.benefits}
                  onChange={handleChange}
                  placeholder="Describe unique relaxation and health benefits..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theta-light focus:border-theta-light transition-all duration-200"
                ></textarea>
                <p className="text-xs text-gray-500">
                    This text will be used to automatically generate content suggestions for clients booking this specific tank.
                </p>
              </div>

              {/* Image Upload Field */}
              <div className="space-y-2">
                <Label htmlFor="imageFile" text="Tank Image Upload" icon={Image} />
                <input
                  id="imageFile"
                  name="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4
                             file:rounded-full file:border-0
                             file:text-sm file:font-semibold
                             file:bg-theta-light/50 file:text-theta-primary
                             hover:file:bg-theta-light/80 cursor-pointer"
                />
                
                {/* Image Preview */}
                {formData.imagePreview && (
                    <div className="mt-4 p-2 border border-gray-300 rounded-lg w-full max-w-sm">
                        <p className="text-sm font-medium text-theta-primary mb-2">Preview:</p>
                        <img 
                            src={formData.imagePreview} 
                            alt="Tank Preview" 
                            className="w-full h-auto object-cover rounded-md shadow-md"
                        />
                    </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Submission Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="px-6 py-3 bg-theta-primary text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-theta-primary/90 transition-all duration-300 flex items-center"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add New Floating Tank
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTankPage;


// --- Helper Components (Reusable) ---

const Label: React.FC<{ htmlFor: string, text: string, icon: React.ElementType }> = ({ htmlFor, text, icon: Icon }) => (
  <label htmlFor={htmlFor} className="flex items-center text-sm font-semibold text-theta-primary mb-1">
    <Icon className="w-4 h-4 mr-2" />
    {text}
  </label>
);

const TextField: React.FC<{ id: string, name: string, label: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void, icon: React.ElementType }> = (props) => (
  <div className="space-y-2">
    <Label htmlFor={props.id} text={props.label} icon={props.icon} />
    <input
      id={props.id}
      name={props.name}
      type="text"
      value={props.value}
      onChange={props.onChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theta-light focus:border-theta-light transition-all duration-200"
    />
  </div>
);

const NumberField: React.FC<{ id: string, name: string, label: string, value: number, onChange: (e: ChangeEvent<HTMLInputElement>) => void, icon: React.ElementType, step?: string }> = (props) => (
  <div className="space-y-2">
    <Label htmlFor={props.id} text={props.label} icon={props.icon} />
    <input
      id={props.id}
      name={props.name}
      type="number"
      value={props.value}
      onChange={props.onChange}
      step={props.step || "1"}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theta-light focus:border-theta-light transition-all duration-200"
    />
  </div>
);