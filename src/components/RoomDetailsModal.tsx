"use client"

import type React from "react"
import { useEffect, useState } from "react"
import {
  X,
  CloudSun,
  Thermometer,
  Bed,
  CheckCircle2,
  Phone,

  Wrench,

  DoorOpen,
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import adminApi, { getRoomDashboard } from "../services/api"
import type { RoomDashboard } from "../types/roomDashboard"

interface RoomDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  room: {
    id: string
    number: string
    type: string
    floor: number
    status: "available" | "occupied" | "maintenance" | "cleaning"
    guestName?: string
    guestEmail?: string
    guestPhone?: string
    checkIn?: string
    checkOut?: string
    specialRequests?: string
  }
}
const statusColors: Record<string, string> = {
  available: "text-blue-600 dark:text-blue-400",
  occupied: "text-blue-600 dark:text-blue-400",
  maintenance: "text-blue-600 dark:text-blue-400",
  cleaning: "text-blue-600 dark:text-blue-400",
}




function ThermostatDial({ value = 25 }: { value: number }) {
  const radius = 66
  const stroke = 10
  const c = 2 * Math.PI * radius
  const min = 16
  const max = 32
  const pct = Math.min(1, Math.max(0, (value - min) / (max - min)))
  const dash = c * pct
  const remainder = c - dash

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" viewBox="0 0 180 180" className="rotate-135">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * 0.25}
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${remainder}`}
          strokeDashoffset={c * 0.25}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Thermometer className="h-5 w-5 text-gray-500 dark:text-gray-300 mb-1" />
        <div className="text-4xl font-bold text-gray-900 dark:text-white">{value}</div>
        <div className="text-gray-500 dark:text-gray-300">{"\u00B0"}C</div>
      </div>
    </div>
  )
}


const Tile: React.FC<React.PropsWithChildren<{ title?: string; className?: string }>> = ({
  children,
  title,
  className,
}) => (
  <div className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm h-full ${className || ""}`}>
    {title ? <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{title}</div> : null}
    {children}
  </div>
)

const TogglePill = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm border transition-colors ${
        checked ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"
      }`}
      aria-pressed={checked}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${checked ? "bg-white" : "bg-gray-300 dark:bg-gray-500"}`} />
      {label}
    </button>
  )
}

const QuickAction = ({
  icon,
  label,
}: {
  icon: React.ReactNode
  label: string
}) => (
  <button className="flex h-12 w-12 items-center justify-center rounded-xl border bg-white dark:bg-slate-700 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-600">
    <span className="sr-only">{label}</span>
    {icon}
  </button>
)

const RoomDetailsModal: React.FC<RoomDetailsModalProps> = ({ isOpen, onClose, room }) => {
  const [dnd, setDnd] = useState(false)
  const [masterLight, setMasterLight] = useState(true)
  const [readingLight, setReadingLight] = useState(false)
  const [curtain, setCurtain] = useState(true)
  const [windowBlind, setWindowBlind] = useState(false)
  const [temp, setTemp] = useState(25)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<RoomDashboard | null>(null)
  const [greeting, setGreeting] = useState('')
  const [editingGreeting, setEditingGreeting] = useState(false)
  const [greetingInput, setGreetingInput] = useState('')
  const navigate = useNavigate()
  // Trigger manual refreshes when external updates happen (e.g., Configure Display updates greeting)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch dashboard data and greeting on open
  useEffect(() => {
    let isCancelled = false
    const fetchData = async () => {
      if (!isOpen || !room.id) return
      setLoading(true)
      setError(null)
      try {
        const token = adminApi.getToken()
        if (!token) throw new Error("Missing auth token. Please login again.")
        const roomIdNum = Number(room.id)
        if (Number.isNaN(roomIdNum)) throw new Error("Invalid room id")
        
        // Fetch dashboard and greeting in parallel
        const [dashboardResp, greetingResp] = await Promise.all([
          getRoomDashboard(roomIdNum, token),
          adminApi.getRoomGreeting(roomIdNum, 'en').catch(() => ({ message: 'Welcome Guest' }))
        ])
        
        if (isCancelled) return
        
        const data = dashboardResp.response
        setDashboard(data)
        setGreeting(greetingResp.message || 'Welcome Guest')
        setGreetingInput(greetingResp.message || 'Welcome Guest')
        
        // Initialize UI states from API
        setDnd(Boolean(data?.dnd?.status))
        setMasterLight(Boolean(data?.controls?.lights?.master))
        setReadingLight(Boolean(data?.controls?.lights?.reading))
        setCurtain(Boolean(data?.controls?.curtains?.master))
        setWindowBlind(Boolean(data?.controls?.curtains?.window))
        if (typeof data?.controls?.temperature === 'number') {
          setTemp(data.controls.temperature)
        }
      } catch (e: any) {
        if (!isCancelled) setError(e?.message || 'Failed to load room data')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { isCancelled = true }
  }, [isOpen, room.id, refreshKey])

  // Listen for global refresh event and refetch when it's for this room
  useEffect(() => {
    const handler = (e: any) => {
      try {
        const targetRoomNumber = e?.detail?.roomNumber
        const newGreeting = e?.detail?.greeting
        if (!targetRoomNumber) {
          // If no specific room provided, refresh anyway
          if (newGreeting) {
            setGreeting(newGreeting)
            setGreetingInput(newGreeting)
          }
          setRefreshKey((k) => k + 1)
          return
        }
        if (String(targetRoomNumber) === String(room.number)) {
          if (newGreeting) {
            setGreeting(newGreeting)
            setGreetingInput(newGreeting)
          }
          setRefreshKey((k) => k + 1)
        }
      } catch {
        // Fallback: refresh
        setRefreshKey((k) => k + 1)
      }
    }
    window.addEventListener('refreshRoomDashboard', handler as EventListener)
    return () => window.removeEventListener('refreshRoomDashboard', handler as EventListener)
  }, [room.number])

  if (!isOpen) return null

  const formatDateTime = (iso?: string) => {
    if (!iso) return '-'
    const d = new Date(iso)
    if (isNaN(d.getTime())) return '-'
    return d.toLocaleString()
  }

  const weather = {
    temp: dashboard?.weather?.temperature ?? 21,
    summary: dashboard?.weather?.summary ?? "Partly Cloudy",
  }
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const language = dashboard?.guest?.language || 'en'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-visible">
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[60] rounded-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-900 dark:text-white" />
        </button>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          {/* Loader Overlay */}
          {loading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 cursor-wait select-none" style={{ pointerEvents: 'all' }}>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center animate-spin">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Loading Room Details</h3>
                <p className="text-slate-500 dark:text-slate-400">Please wait while we fetch room data...</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bed className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Room {room.number}</h2>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[room.status]}`}>
              {room.status[0].toUpperCase() + room.status.slice(1)}
            </span>
          </div>
          {/* close button moved to floating absolute position */}
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="py-10 text-center text-gray-600 dark:text-gray-300">Loading room dashboard...</div>
          ) : error ? (
            <div className="py-10 text-center text-red-600">{error}</div>
          ) : (
          <>
        
          {/* Top bar: weather, time, welcome, small icons */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 items-center">
            {/* Left: Weather + Time */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <CloudSun className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {weather.temp}
                    {"\u00B0"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{weather.summary}</div>
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">{time}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{language}</div>
              </div>
            </div>

            {/* Center: Greeting from API */}
            <div className="flex flex-col justify-center items-center md:items-start text-center md:text-left">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Room {dashboard?.roomNo || room.number}</div>
              {editingGreeting ? (
                <div className="flex items-center gap-2">
                  <textarea
                    value={greetingInput}
                    onChange={(e) => setGreetingInput(e.target.value)}
                    className="text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-slate-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={async () => {
                        try {
                          await adminApi.updateRoomGreeting(room.id, { language: 'en', message: greetingInput })
                          setGreeting(greetingInput)
                          setEditingGreeting(false)
                          const event = new CustomEvent('showToast', { detail: { type: 'success', title: 'Success', message: 'Greeting updated successfully' }})
                          window.dispatchEvent(event)
                        } catch (e: any) {
                          const event = new CustomEvent('showToast', { detail: { type: 'error', title: 'Error', message: e?.message || 'Failed to update greeting' }})
                          window.dispatchEvent(event)
                        }
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setGreetingInput(greeting)
                        setEditingGreeting(false)
                      }}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className="text-2xl font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 px-2 py-1 rounded"
                  onClick={() => setEditingGreeting(true)}
                  title="Click to edit greeting"
                >
                  {greeting}
                </div>
              )}
            </div>

            {/* Right: small stats row */}
            <div className="flex items-center justify-start gap-6 md:justify-end">
              {/* <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Bell className="h-5 w-5" />
                <span className="text-sm font-medium">01</span>
              </div> */}
              {/* <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <User2 className="h-5 w-5" />
                <span className="text-sm font-medium">{guests.toString().padStart(2, "0")}</span>
              </div> */}
              {/* <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Bed className="h-5 w-5" />
                <span className="text-sm font-medium">{rooms.toString().padStart(2, "0")}</span>
              </div> */}
            </div>
          </div>

          {/* Middle controls */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
            {/* Action tiles */}
            <div className="lg:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-3 items-stretch">
              <Tile>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Check In</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(dashboard?.reservation?.checkIn)}</div>
                    </div>
                  </div>
                </div>
              </Tile>

              <Tile>
                <div className="flex items-center gap-3">
                  <DoorOpen className="h-5 w-5 text-blue-600" />
                  <div className="font-medium text-gray-900 dark:text-white">Clean Room {dashboard?.cleanRoom?.status ? `- ${dashboard?.cleanRoom?.status}` : ''}</div>
                </div>
              </Tile>

              <Tile>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-gray-900 dark:text-white">Do Not Disturb</div>
                  <TogglePill label={dnd ? "On" : "Off"} checked={dnd} onChange={setDnd} />
                </div>
              </Tile>

              {/* Lighting Control */}
              <Tile title="Lighting Control" className="sm:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  {/* <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Warm Lighting</span>
                  </div> */}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Master Light</span>
                    <TogglePill label={masterLight ? "On" : "Off"} checked={masterLight} onChange={setMasterLight} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Master Curtain</span>
                    <TogglePill label={curtain ? "Open" : "Close"} checked={curtain} onChange={setCurtain} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Reading Light</span>
                    <TogglePill label={readingLight ? "On" : "Off"} checked={readingLight} onChange={setReadingLight} />
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-600 p-3">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Master Window</span>
                    <TogglePill
                      label={windowBlind ? "Open" : "Close"}
                      checked={windowBlind}
                      onChange={setWindowBlind}
                    />
                  </div>
                </div>
              </Tile>

             

              <Tile className="sm:col-span-3">
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <button className="font-medium" onClick={() => {
                    onClose()
                    navigate(`/technical-issues`, { state: { room: room.number } })
                    const event = new CustomEvent('showToast', { detail: { type: 'info', title: 'Report Issue', message: `Navigated to Technical Issues for Room ${room.number}` }})
                    window.dispatchEvent(event)
                  }}>Report Technical Issue</button>
                </div>
              </Tile>
            </div>

            {/* Thermostat */}
            <div className="rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperature Control</div>
                {/* <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Warm</span>
                </div> */}
              </div>
              <div className="flex flex-col items-center">
                <ThermostatDial value={temp} />
                <div className="mt-6 flex items-center gap-3">
                  <button
                    className="rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    onClick={() => setTemp((t) => Math.max(16, t - 1))}
                    aria-label="Decrease temperature"
                  >
                    −
                  </button>
                  <button
                    className="rounded-full border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
                    onClick={() => setTemp((t) => Math.min(32, t + 1))}
                    aria-label="Increase temperature"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info: Contact and Notifications */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 items-stretch">
            <Tile title="Contact" className="lg:col-span-1">
              <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                <Phone className="h-5 w-5 text-blue-600" />
                <div className="text-sm">{dashboard?.contact?.phoneNumber || '-'}</div>
              </div>
            </Tile>
            <Tile title="Reservation" className="lg:col-span-1">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div><span className="font-medium">Check-in:</span> {formatDateTime(dashboard?.reservation?.checkIn)}</div>
                <div><span className="font-medium">Check-out:</span> {formatDateTime(dashboard?.reservation?.checkOut)}</div>
              </div>
            </Tile>
            <Tile title="Notifications" className="lg:col-span-1">
              <div className="space-y-2 min-h-40 max-h-96 overflow-auto">
                {dashboard?.notifications?.length ? (
                  dashboard.notifications.map((n, idx) => (
                    <div key={n.id ?? idx} className="text-sm text-gray-700 dark:text-gray-300">
                      • {n.message}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No notifications</div>
                )}
              </div>
            </Tile>
          </div>

          </>
          )}

          {/* Footer buttons */}
          <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-6">
            <button 
              onClick={onClose} 
              className="rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
            <button 
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors" 
              onClick={() => {
                const event = new CustomEvent('showToast', { detail: { type: 'success', title: 'Saved', message: `Room ${room.number} settings saved` }})
                window.dispatchEvent(event)
                onClose()
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomDetailsModal
