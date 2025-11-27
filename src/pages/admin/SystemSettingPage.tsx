"use client"

import type React from "react"
import { useState } from "react"
import { Save, RotateCcw, CheckCircle, AlertCircle } from "lucide-react"
import apiRequest from "../../core/axios"

interface SystemSettingsProps {
  defaultFloatPrice: number
  cleaningBuffer: number
  sessionsPerDay: number
  openTime: string
  closeTime: string
}

const THETA_COLORS = {
  primary: "#5B8DC4", // Light-medium blue
  primaryDark: "#2C4A6F", // Dark blue
  primaryLight: "#A8D0E8", // Light blue
  lightBg: "#F0F6FB", // Very light blue background
  white: "#FFFFFF",
  gray100: "#F3F4F6",
  gray200: "#E5E7EB",
  gray300: "#D1D5DB",
  gray600: "#4B5563",
  text: "#1F2937",
  textLight: "#6B7280",
  success: "#10B981",
  warning: "#F59E0B",
}

const SystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettingsProps>({
    defaultFloatPrice: 0,
    cleaningBuffer: 0,
    sessionsPerDay: 0,
    openTime: "09:00",
    closeTime: "21:00",
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  type SettingField = keyof SystemSettingsProps

  const handleInputChange = (field: SettingField, value: number | string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }))
    setHasChanges(true)
    setSaveSuccess(false)
  }
  const handleSave = async () => {
    try {
      console.log("Sending to backend:", settings);

      const response = await apiRequest.post<{ message: string }>(
        "/system-settings",
        settings
      );

      console.log("Backend response:", response);

      setSaveSuccess(true);
      setHasChanges(false);

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);

    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };


  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      setSettings({
        defaultFloatPrice: 7500,
        cleaningBuffer: 15,
        sessionsPerDay: 8,
        openTime: "09:00",
        closeTime: "21:00",
      })
      setHasChanges(false)
      setSaveSuccess(false)
    }
  }

  const InputField: React.FC<{
    label: string
    field: SettingField
    type: "number" | "time" | "text"
    value: string | number
    unit?: string
    description?: string
  }> = ({ label, field, type, value, unit, description }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold" style={{ color: THETA_COLORS.text }}>
        {label}
      </label>
      <div className="relative">
        {unit && type === "number" && (
          <span
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium"
            style={{ color: THETA_COLORS.textLight }}
          >
            {unit}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(field, type === "number" ? Number(e.target.value) : e.target.value)}
          className="w-full px-4 py-2.5 border rounded-lg focus:outline-none transition-all duration-200"
          style={{
            borderColor: THETA_COLORS.gray200,
            paddingLeft: unit && type === "number" ? "3.5rem" : undefined,
            backgroundColor: THETA_COLORS.white,
            color: THETA_COLORS.text,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = THETA_COLORS.primary
            e.currentTarget.style.boxShadow = `0 0 0 3px ${THETA_COLORS.primary}20`
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = THETA_COLORS.gray200
            e.currentTarget.style.boxShadow = "none"
          }}
        />
      </div>
      {description && (
        <p className="text-xs" style={{ color: THETA_COLORS.textLight }}>
          {description}
        </p>
      )}
    </div>
  )

  return (
    <div style={{ backgroundColor: THETA_COLORS.lightBg }} className="min-h-screen py-8">
      <div className="w-full max-w-5xl mx-auto px-4">
        {/* Header Section */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: THETA_COLORS.primary }}>
              {/* <Settings className="w-6 h-6 text-white" /> */}
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
              <p className="text-xs mt-0.5" style={{ color: THETA_COLORS.success }}>
                Your changes have been applied.
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
              <p className="text-xs mt-0.5" style={{ color: THETA_COLORS.warning }}>
                Save your changes to apply them to your system.
              </p>
            </div>
          </div>
        )}

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pricing Section */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: THETA_COLORS.white,
              borderColor: THETA_COLORS.gray200,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${THETA_COLORS.primary}15` }}>
                {/* <DollarSign className="w-5 h-5" style={{ color: THETA_COLORS.primary }} /> */}
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>
                  Pricing
                </h2>
                <p className="text-xs" style={{ color: THETA_COLORS.textLight }}>
                  Default session rates
                </p>
              </div>
            </div>
            <InputField
              label="Default Float Session Price"
              field="defaultFloatPrice"
              type="number"
              value={settings.defaultFloatPrice}
              unit="LKR"
              description="Standard base price applied to all tank sessions"
            />
          </div>

          {/* Capacity Section */}
          <div
            className="rounded-lg p-6 border"
            style={{
              backgroundColor: THETA_COLORS.white,
              borderColor: THETA_COLORS.gray200,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${THETA_COLORS.primary}15` }}>
                {/* <Bath className="w-5 h-5" style={{ color: THETA_COLORS.primary }} /> */}
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>
                  Capacity
                </h2>
                <p className="text-xs" style={{ color: THETA_COLORS.textLight }}>
                  Session limits per tank
                </p>
              </div>
            </div>
            <InputField
              label="Max Sessions Per Day"
              field="sessionsPerDay"
              type="number"
              value={settings.sessionsPerDay}
              description="Maximum bookings allowed per tank daily"
            />
          </div>

          {/* Operating Hours Section - Spans both columns on larger screens */}
          <div
            className="md:col-span-2 rounded-lg p-6 border"
            style={{
              backgroundColor: THETA_COLORS.white,
              borderColor: THETA_COLORS.gray200,
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${THETA_COLORS.primary}15` }}>
                {/* <Clock className="w-5 h-5" style={{ color: THETA_COLORS.primary }} /> */}
              </div>
              <div>
                <h2 className="text-lg font-semibold" style={{ color: THETA_COLORS.primaryDark }}>
                  Operating Hours
                </h2>
                <p className="text-xs" style={{ color: THETA_COLORS.textLight }}>
                  Schedule and buffer time
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InputField
                label="Opening Time"
                field="openTime"
                type="time"
                value={settings.openTime}
                description="Start of first available session"
              />
              <InputField
                label="Closing Time"
                field="closeTime"
                type="time"
                value={settings.closeTime}
                description="End of last scheduled session"
              />
              <InputField
                label="Cleaning Buffer"
                field="cleaningBuffer"
                type="number"
                value={settings.cleaningBuffer}
                unit="min"
                description="Time between sessions for cleaning"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-2.5 font-semibold rounded-lg border-2 transition-all duration-200 hover:bg-opacity-50 flex items-center gap-2"
            style={{
              borderColor: THETA_COLORS.gray300,
              color: THETA_COLORS.text,
              backgroundColor: THETA_COLORS.white,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = THETA_COLORS.gray100
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = THETA_COLORS.white
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-8 py-2.5 font-semibold text-white rounded-lg transition-all duration-200 flex items-center gap-2"
            style={{
              backgroundColor: hasChanges ? THETA_COLORS.primary : THETA_COLORS.gray300,
              cursor: hasChanges ? "pointer" : "not-allowed",
              opacity: hasChanges ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (hasChanges) {
                e.currentTarget.style.backgroundColor = THETA_COLORS.primaryDark
              }
            }}
            onMouseLeave={(e) => {
              if (hasChanges) {
                e.currentTarget.style.backgroundColor = THETA_COLORS.primary
              }
            }}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default SystemSettings
