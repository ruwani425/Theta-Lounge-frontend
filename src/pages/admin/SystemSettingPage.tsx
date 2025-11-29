"use client"
import { useState, memo, useCallback, useEffect } from "react"
import { Save, RotateCcw, CheckCircle, AlertCircle, Loader2, Settings } from "lucide-react"
import apiRequest from "../../core/axios" // Ensure this path is correct

// --- THEME COLORS ---
const THETA_COLORS = {
  primary: "#5B8DC4",
  primaryDark: "#2C4A6F",
  primaryLight: "#A8D0E8",
  lightBg: "#F0F6FB",
  white: "#FFFFFF",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray600: "#4B5563",
  text: "#1F2937",
  textLight: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
}

// --- INTERFACE DEFINITION ---
interface SystemSettingsProps {
  _id?: string; 
  defaultFloatPrice: number
  cleaningBuffer: number
  sessionsPerDay: number
  openTime: string
  closeTime: string
}

type SettingField = keyof Omit<SystemSettingsProps, '_id'> 

// --- INPUT FIELD COMPONENT ---
interface InputFieldProps {
  label: string
  field: SettingField
  type: "number" | "time" | "text"
  value: string | number
  unit?: string
  description?: string
  onChange: (field: SettingField, value: number | string) => void
  disabled: boolean
}

const InputField = memo(({ label, field, type, value, unit, description, onChange, disabled }: InputFieldProps) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold" style={{ color: THETA_COLORS.text }}>
      {label}
    </label>
    <div className="relative">
      {unit && type === "number" && (
        <span
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium z-10"
          style={{ color: THETA_COLORS.textLight }}
        >
          {unit}
        </span>
      )}
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(field, type === "number" ? Number(e.target.value) : e.target.value)}
        className={`w-full py-2.5 border rounded-lg focus:outline-none transition-all duration-200 ${
          unit && type === "number" ? "pl-14 pr-4" : "px-4"
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        style={{
          borderColor: THETA_COLORS.gray200,
          backgroundColor: THETA_COLORS.white,
          color: THETA_COLORS.text,
        }}
        onFocus={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = THETA_COLORS.primary
            e.currentTarget.style.boxShadow = `0 0 0 3px ${THETA_COLORS.primary}20`
          }
        }}
        onBlur={(e) => {
          if (!disabled) {
            e.currentTarget.style.borderColor = THETA_COLORS.gray200
            e.currentTarget.style.boxShadow = "none"
          }
        }}
      />
    </div>
    {description && (
      <p className="text-xs" style={{ color: THETA_COLORS.textLight }}>
        {description}
      </p>
    )}
  </div>
))

InputField.displayName = "InputField"

// --- MAIN COMPONENT ---
const SystemSettings = () => {
  // 1. Define the default state for a brand new, unsaved document
  const defaultState: SystemSettingsProps = {
    defaultFloatPrice: 0,
    cleaningBuffer: 0,
    sessionsPerDay: 0,
    openTime: "09:00",
    closeTime: "21:00",
  };

  const [settings, setSettings] = useState<SystemSettingsProps>(defaultState)
  const [initialSettings, setInitialSettings] = useState<SystemSettingsProps>(defaultState) 
  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // --- DATA FETCHING (GET Request) ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        setFetchError(null)

        // Using the confirmed backend endpoint and generic type for potentially null response
        const response = await apiRequest.get<SystemSettingsProps | null>("/system-settings")

        // If response is NOT null (document exists in DB), use it to populate the form
        if (response) {
          const dataToUse: SystemSettingsProps = response as SystemSettingsProps;
          setSettings(dataToUse)
          setInitialSettings(dataToUse)
        } else {
          // If response is null (no document in DB yet), keep the defaultState
          setSettings(defaultState)
          setInitialSettings(defaultState)
        }

      } catch (error) {
        console.error("Failed to fetch system settings:", error)
        setFetchError("Failed to load settings. Please ensure the API is running correctly.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  // --- HANDLERS ---
  const handleInputChange = useCallback((field: SettingField, value: number | string) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [field]: value } as SystemSettingsProps;

      // Check for changes against the initial state (ignoring the _id field)
      const hasChanged = Object.keys(defaultState).some(key => {
        return newSettings[key as SettingField] !== initialSettings[key as SettingField];
      });

      setHasChanges(hasChanged);
      setSaveSuccess(false);
      return newSettings;
    });
  }, [initialSettings])

  const handleSave = async () => {
    if (!hasChanges || isSaving || isLoading) return;

    try {
      setIsSaving(true);
      
      let savedResponse: any;
      
      if (settings._id) {
        // 🛑 FIX: Use apiRequest.put for updating existing records
        const updateEndpoint = `/system-settings/${settings._id}`;
        savedResponse = await apiRequest.put<SystemSettingsProps>(updateEndpoint, settings);
      } else {
        // Use apiRequest.post for creating the initial record
        savedResponse = await apiRequest.post<SystemSettingsProps>("/system-settings", settings);
      }

      // The response might be directly the object or wrapped in a data property
      const updatedSettings = savedResponse.data || savedResponse;
      setInitialSettings(updatedSettings); 
      setSettings(updatedSettings); 

      setSaveSuccess(true);
      setHasChanges(false);
      setTimeout(() => { setSaveSuccess(false); }, 4000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("Failed to save settings. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  }

  const handleReset = () => {
    if (window.confirm("Are you sure you want to revert all changes to the last saved values?")) {
      setSettings(initialSettings) 
      setHasChanges(false)
      setSaveSuccess(false)
    }
  }

  // --- CONDITIONAL RENDERING ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: THETA_COLORS.lightBg }}>
        <Loader2 className="w-8 h-8 animate-spin mr-3" style={{ color: THETA_COLORS.primary }} />
        <p className="text-lg" style={{ color: THETA_COLORS.text }}>**Loading system settings from database...**</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ backgroundColor: THETA_COLORS.lightBg }}>
        <div
          className="p-6 rounded-lg border flex items-start gap-3"
          style={{ backgroundColor: `${THETA_COLORS.error}15`, borderColor: THETA_COLORS.error }}
        >
          <AlertCircle className="w-6 h-6 flex-shrink-0" style={{ color: THETA_COLORS.error }} />
          <div>
            <p className="text-lg font-semibold" style={{ color: THETA_COLORS.error }}>Data Fetch Error</p>
            <p className="text-sm mt-1" style={{ color: THETA_COLORS.error }}>{fetchError}</p>
          </div>
        </div>
      </div>
    )
  }

  // --- MAIN RENDER ---
  return (
    <div style={{ backgroundColor: THETA_COLORS.lightBg }} className="min-h-screen py-8">
      <div className="w-full max-w-5xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: THETA_COLORS.primary }}>
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: THETA_COLORS.primaryDark }}>
                System Settings
              </h1>
              <p className="text-sm mt-1" style={{ color: THETA_COLORS.textLight }}>
                Manage your operations and tank configuration
              </p>
            </div>
          </div>
        </div>
        
        {/* Check if data exists or is new */}
        {!settings._id && !hasChanges && !isLoading && (
            <div className="mb-6 p-4 rounded-lg border border-opacity-20 flex items-start gap-3" 
                style={{ backgroundColor: `${THETA_COLORS.warning}15`, borderColor: THETA_COLORS.warning }}>
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: THETA_COLORS.warning }} />
                <p className="text-sm" style={{ color: THETA_COLORS.warning }}>
                    **No system settings found in the database.** Enter the default values and click "Save Changes" to create the initial document.
                </p>
            </div>
        )}

        {/* Status Messages */}
        {saveSuccess && (
          <div
            className="mb-6 p-4 rounded-lg border border-opacity-20 flex items-start gap-3"
            style={{
              backgroundColor: `${THETA_COLORS.success}15`,
              borderColor: THETA_COLORS.success,
            }}
          >
            <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: THETA_COLORS.success }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: THETA_COLORS.success }}>
                Settings saved successfully
              </p>
            </div>
          </div>
        )}

        {hasChanges && (
          <div
            className="mb-6 p-4 rounded-lg border border-opacity-20 flex items-start gap-3"
            style={{
              backgroundColor: `${THETA_COLORS.warning}15`,
              borderColor: THETA_COLORS.warning,
            }}
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: THETA_COLORS.warning }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: THETA_COLORS.warning }}>
                You have unsaved changes
              </p>
            </div>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pricing Section */}
          <div className="rounded-lg p-6 border" style={{ backgroundColor: THETA_COLORS.white, borderColor: THETA_COLORS.gray200 }}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>Pricing</h2>
            </div>
            <InputField
              label="Default Float Session Price"
              field="defaultFloatPrice"
              type="number"
              value={settings.defaultFloatPrice}
              unit="LKR"
              description="Standard base price applied to all tank sessions"
              onChange={handleInputChange}
              disabled={isSaving}
            />
          </div>

          {/* Capacity Section */}
          <div className="rounded-lg p-6 border" style={{ backgroundColor: THETA_COLORS.white, borderColor: THETA_COLORS.gray200 }}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>Capacity</h2>
            </div>
            <InputField
              label="Max Sessions Per Day"
              field="sessionsPerDay"
              type="number"
              value={settings.sessionsPerDay}
              description="Maximum bookings allowed per tank daily"
              onChange={handleInputChange}
              disabled={isSaving}
            />
          </div>

          {/* Operating Hours Section */}
          <div className="md:col-span-2 rounded-lg p-6 border" style={{ backgroundColor: THETA_COLORS.white, borderColor: THETA_COLORS.gray200 }}>
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>Operating Hours</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="Opening Time"
                field="openTime"
                type="time"
                value={settings.openTime}
                description="Start of first available session"
                onChange={handleInputChange}
                disabled={isSaving}
              />
              <InputField
                label="Closing Time"
                field="closeTime"
                type="time"
                value={settings.closeTime}
                description="End of last scheduled session"
                onChange={handleInputChange}
                disabled={isSaving}
              />
              <InputField
                label="Cleaning Buffer"
                field="cleaningBuffer"
                type="number"
                value={settings.cleaningBuffer}
                unit="min"
                description="Time between sessions for cleaning"
                onChange={handleInputChange}
                disabled={isSaving}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleReset}
            disabled={isSaving || !hasChanges}
            className="px-6 py-2.5 font-semibold rounded-lg border-2 transition-all duration-200 hover:bg-opacity-50 flex items-center gap-2"
            style={{
              borderColor: THETA_COLORS.gray300,
              color: THETA_COLORS.text,
              backgroundColor: THETA_COLORS.white,
              opacity: hasChanges ? 1 : 0.6,
              cursor: hasChanges ? "pointer" : "not-allowed",
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Revert Changes
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-8 py-2.5 font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: hasChanges && !isSaving ? THETA_COLORS.primary : THETA_COLORS.gray300,
              cursor: hasChanges && !isSaving ? "pointer" : "not-allowed",
              opacity: hasChanges && !isSaving ? 1 : 0.6,
            }}
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings