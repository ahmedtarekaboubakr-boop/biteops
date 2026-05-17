import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import Tutorials from './Tutorials'
import AnnouncementBanner from './AnnouncementBanner'
import Announcements from './Announcements'
import ChangePasswordModal from './ChangePasswordModal'
import Sidebar from './Sidebar'

function StaffDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('information')
  const [showChangePassword, setShowChangePassword] = useState(false)

  const tabs = [
    { id: 'information', label: 'Information' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'performance', label: 'Performance' },
    { id: 'requests', label: 'Requests' },
    { id: 'penalties', label: 'Penalties' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'tutorials', label: t('tutorials') },
    { id: 'announcements', label: 'Announcements' }
  ]

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        user={user}
        onChangePassword={() => setShowChangePassword(true)}
        onLogout={logout}
      />

      {/* Main Content with left margin for sidebar */}
      <div className="ml-56">
        {/* Header */}
        <header className="bg-[#f5f5f0] border-b border-gray-300 px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JJ's</h1>
            <p className="text-base text-gray-600 mt-1">{t('staff')} {t('dashboard')}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-6">
          {/* Announcement Banner */}
          <AnnouncementBanner />

        {/* Information Tab */}
        {activeTab === 'information' && <StaffInformation />}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && <StaffSchedule />}

        {/* Performance Tab */}
        {activeTab === 'performance' && <StaffPerformance />}

        {/* Requests Tab - Read-only for staff */}
        {activeTab === 'requests' && <StaffRequests />}

        {/* Penalties Tab */}
        {activeTab === 'penalties' && <StaffPenalties />}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && <StaffLeaderboard />}

        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && <Tutorials />}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && <Announcements />}
        </main>
      </div>

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  )
}

// Staff Schedule Component
const SHIFT_META = {
  morning: { label: 'Morning', time: '9:00 – 17:30',  bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  middle:  { label: 'Middle',  time: '13:00 – 21:00', bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  night:   { label: 'Night',   time: '16:00 – 00:30', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-400' },
}

function StaffSchedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading]     = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  const todayStr = new Date().toISOString().split('T')[0]

  // Week starts on Saturday
  const getWeekBounds = (date) => {
    const d   = new Date(date)
    const day = d.getDay()
    const diff = (day + 1) % 7          // days since last Saturday
    const start = new Date(d)
    start.setDate(d.getDate() - diff)
    start.setHours(0,0,0,0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end }
  }

  const fmt = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const dd = String(d.getDate()).padStart(2,'0')
    return `${y}-${m}-${dd}`
  }

  useEffect(() => { fetchSchedule() }, [selectedWeek])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const { start, end } = getWeekBounds(selectedWeek)
      const res = await axios.get(`${API_URL}/api/staff/my-schedule?startDate=${fmt(start)}&endDate=${fmt(end)}`)
      setSchedules(Array.isArray(res.data) ? res.data : [])
    } catch { setSchedules([]) }
    finally { setLoading(false) }
  }

  const { start, end } = getWeekBounds(selectedWeek)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start); d.setDate(start.getDate() + i); return d
  })
  const weekRange = `${start.toLocaleDateString('en-US',{month:'short',day:'numeric'})} – ${end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}`

  const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

  return (
    <div className="space-y-4">
      {/* Navigation bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">My Schedule</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setSelectedWeek(d => { const n=new Date(d); n.setDate(n.getDate()-7); return n })}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">← Prev</button>
          <button onClick={() => setSelectedWeek(new Date())}
            className="px-3 py-1.5 text-sm bg-brand text-white rounded-lg hover:bg-brand-600">Today</button>
          <span className="text-sm font-medium text-gray-600 px-2">{weekRange}</span>
          <button onClick={() => setSelectedWeek(d => { const n=new Date(d); n.setDate(n.getDate()+7); return n })}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Next →</button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400 text-sm">Loading schedule…</div>
      ) : (
        <div className="grid gap-2">
          {weekDays.map(day => {
            const dateStr  = fmt(day)
            const isToday  = dateStr === todayStr
            const isFri    = day.getDay() === 5
            const isSat    = day.getDay() === 6
            const dayShifts = schedules.filter(s => s.date === dateStr)

            return (
              <div key={dateStr} className={`bg-white rounded-xl border flex items-stretch overflow-hidden
                ${isToday ? 'border-brand shadow-sm' : 'border-gray-100'}`}>
                {/* Day column */}
                <div className={`w-20 shrink-0 flex flex-col items-center justify-center py-3 px-2
                  ${isToday ? 'bg-brand text-white' : isFri || isSat ? 'bg-gray-50 text-gray-500' : 'bg-gray-50 text-gray-500'}`}>
                  <span className="text-xs font-semibold uppercase tracking-wide opacity-80">{DAY_ABBR[day.getDay()]}</span>
                  <span className={`text-2xl font-bold leading-tight ${isToday ? 'text-white' : 'text-gray-800'}`}>{day.getDate()}</span>
                  {isToday && <span className="text-[10px] font-semibold mt-0.5 opacity-90 uppercase tracking-wider">Today</span>}
                </div>

                {/* Shifts */}
                <div className="flex-1 flex flex-wrap items-center gap-2 px-4 py-3 min-h-[60px]">
                  {dayShifts.length === 0 ? (
                    <span className="text-sm text-gray-300">—</span>
                  ) : dayShifts.map(s => {
                    const meta = SHIFT_META[s.shift] || { label: s.shift, time: '', bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', dot: 'bg-gray-400' }
                    return (
                      <div key={s.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${meta.bg} ${meta.border}`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                        <div>
                          <p className={`font-semibold leading-tight ${meta.text}`}>{meta.label}</p>
                          <p className="text-gray-400 text-xs leading-tight">{meta.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && schedules.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-semibold text-gray-700">No shifts this week</p>
          <p className="text-sm text-gray-400 mt-1">Your schedule will appear here once published by your branch manager</p>
        </div>
      )}
    </div>
  )
}

// Staff Performance Component
function StaffPerformance() {
  const { user } = useAuth()
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchRatings()
  }, [selectedDate])

  const fetchRatings = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/staff/my-ratings?startDate=${selectedDate}&endDate=${selectedDate}`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setRatings([])
        return
      }
      
      setRatings(response.data)
    } catch (error) {
      console.error('Failed to fetch ratings:', error)
      setRatings([])
    } finally {
      setLoading(false)
    }
  }

  const HYGIENE_ITEMS = [
    { key: 'nails_cut',        label: 'Nails Cut',        icon: '💅' },
    { key: 'beard_shaved',     label: 'Beard Shaved',     icon: '🧔' },
    { key: 'clean_tshirt',     label: 'Clean T-Shirt',    icon: '👕' },
    { key: 'black_pants',      label: 'Black Pants',      icon: '👖' },
    { key: 'correct_footwear', label: 'Correct Footwear', icon: '👟' },
  ]

  const PERF_OPTIONS = [
    { value: 0, label: 'Very Poor',  emoji: '😞', color: 'bg-red-100    text-red-700'    },
    { value: 1, label: 'Poor',       emoji: '😐', color: 'bg-orange-100 text-orange-700' },
    { value: 2, label: 'Fair',       emoji: '😑', color: 'bg-yellow-100 text-yellow-700' },
    { value: 3, label: 'Good',       emoji: '😊', color: 'bg-blue-100   text-blue-700'   },
    { value: 4, label: 'Very Good',  emoji: '😄', color: 'bg-indigo-100 text-indigo-700' },
    { value: 5, label: 'Excellent',  emoji: '🌟', color: 'bg-green-100  text-green-700'  },
  ]

  const fmtDate = (s) => new Date(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="space-y-4 max-w-xl">

      {/* Date picker */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">My Performance</h2>
        <input type="date" value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand" />
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400 text-sm">Loading…</div>
      ) : ratings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-10 text-center">
          <p className="text-3xl mb-2">⭐</p>
          <p className="font-semibold text-gray-700">No rating for this date</p>
          <p className="text-sm text-gray-400 mt-1">Your manager hasn't submitted a rating for this day yet</p>
        </div>
      ) : ratings.map(rating => {
        const hygieneScore = [rating.nails_cut, rating.beard_shaved, rating.clean_tshirt, rating.black_pants, rating.correct_footwear]
          .filter(Boolean).length
        const perfOpt = PERF_OPTIONS.find(p => p.value === rating.performance)

        return (
          <div key={rating.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

            {/* Card header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{fmtDate(rating.date)}</p>
                {rating.manager_name && <p className="text-xs text-gray-400 mt-0.5">Rated by {rating.manager_name}</p>}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 mb-0.5">Total score</p>
                <p className="text-xl font-bold text-brand">{rating.total_score ?? '—'}<span className="text-sm font-normal text-gray-400">/10</span></p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">

              {/* ── Section 1: Hygiene & Grooming ── */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">👔 Hygiene & Grooming</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${hygieneScore === 5 ? 'bg-green-100 text-green-700' : hygieneScore >= 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {hygieneScore}/5
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {HYGIENE_ITEMS.map(item => {
                    const passed = !!rating[item.key]
                    return (
                      <div key={item.key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                        ${passed ? 'bg-green-50' : 'bg-gray-50'}`}>
                        <span className={`text-base ${passed ? '' : 'opacity-30'}`}>{item.icon}</span>
                        <span className={`flex-1 ${passed ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{item.label}</span>
                        <span className={`font-bold text-xs ${passed ? 'text-green-600' : 'text-gray-300'}`}>{passed ? '✓' : '✗'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Section 2: Performance ── */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">⭐ Performance</p>
                  {perfOpt && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${perfOpt.color}`}>{rating.performance}/5</span>
                  )}
                </div>
                {perfOpt ? (
                  <div className={`flex items-center gap-3 px-4 py-3 rounded-lg ${perfOpt.color}`}>
                    <span className="text-2xl">{perfOpt.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{perfOpt.label}</p>
                      <p className="text-xs opacity-70">Score: {rating.performance} out of 5</p>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-3 rounded-lg bg-gray-50 text-sm text-gray-400">
                    Performance not yet submitted
                  </div>
                )}
              </div>

              {/* Notes */}
              {rating.notes && (
                <div className="px-5 py-3">
                  <p className="text-xs text-gray-400 mb-1">Notes</p>
                  <p className="text-sm text-gray-600">{rating.notes}</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Staff Requests Component (Read-only - staff cannot create requests)
function StaffRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      // Use the main leave-requests endpoint which now allows staff to see their own requests
      const response = await axios.get(`${API_URL}/api/leave-requests`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setRequests([])
        return
      }
      
      setRequests(response.data)
    } catch (error) {
      setRequests([])
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      denied: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      approved: 'Approved',
      denied: 'Denied'
    }
    return labels[status] || status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      leave: '🏖️ Leave',
      sick_leave: '🏥 Sick Leave',
      emergency_leave: '🚨 Emergency Leave',
      quit: '👋 Quit'
    }
    return labels[type] || type
  }

  const getCurrentStageStatus = (request) => {
    if (request.status === 'approved') {
      return 'Approved by HR'
    }
    if (request.status === 'denied') {
      return 'Denied'
    }
    if (request.area_manager_status === 'pending') {
      return 'Pending Area Manager Approval'
    }
    if (request.area_manager_status === 'approved' && request.operations_manager_status === 'pending') {
      return 'Pending Operations Manager Approval'
    }
    if (request.operations_manager_status === 'approved' && request.hr_status === 'pending') {
      return 'Pending HR Approval'
    }
    return 'Pending'
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-700 text-sm">
          📋 <strong>View Only:</strong> Your branch manager creates leave requests for you. You can view the status of your requests here.
        </p>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Leave Requests</h2>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Leave Requests</h3>
          <p className="text-gray-500">Your leave requests created by your branch manager will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{getRequestTypeLabel(request.request_type)}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(request.start_date)} - {formatDate(request.end_date)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created by: {request.manager_name || 'Branch Manager'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                  {request.status === 'pending' && (
                    <p className="text-xs text-gray-500 mt-1">{getCurrentStageStatus(request)}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Days:</span>
                  <span className="ml-2 font-medium">{request.number_of_days}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium">{getCurrentStageStatus(request)}</span>
                </div>
              </div>
              {request.reason && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Staff Penalties Component
function StaffPenalties() {
  const { user } = useAuth()
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPenalties()
  }, [])

  const fetchPenalties = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/staff/my-penalties`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setPenalties([])
        return
      }
      
      setPenalties(response.data)
    } catch (error) {
      console.error('Failed to fetch penalties:', error)
      setPenalties([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading penalties...</div>
      ) : penalties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Penalties</h3>
          <p className="text-gray-500">You have no penalties on record</p>
        </div>
      ) : (
        <div className="space-y-4">
          {penalties.map((penalty) => (
            <div key={penalty.id} className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{penalty.penalty_type}</h3>
                  <p className="text-sm text-gray-500">{formatDate(penalty.date)}</p>
                </div>
                {penalty.penalty_amount > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Amount</p>
                    <p className="text-lg font-bold text-red-600">EGP {penalty.penalty_amount}</p>
                  </div>
                )}
              </div>
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Misconduct Description:</h4>
                <p className="text-sm text-gray-600">{penalty.misconduct_description}</p>
              </div>
              {penalty.penalty_details && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Details:</h4>
                  <p className="text-sm text-gray-600">{penalty.penalty_details}</p>
                </div>
              )}
              <div className="text-xs text-gray-500">
                Recorded by: {penalty.manager_name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Staff Information Component
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500 shrink-0 w-40">{label}</span>
      <span className={`text-sm font-medium text-gray-900 text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function StaffInformation() {
  const { user } = useAuth()
  const [staffInfo, setStaffInfo]     = useState(null)
  const [leaveBalance, setLeaveBalance] = useState(null)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      axios.get(`${API_URL}/api/staff/${user?.id}`).then(r => setStaffInfo(r.data)).catch(() => {}),
      axios.get(`${API_URL}/api/staff/${user?.id}/leave-balance`).then(r => setLeaveBalance(r.data)).catch(() => {})
    ]).finally(() => setLoading(false))
  }, [user?.id])

  const fmtDate = (s) => {
    if (!s) return null
    return new Date(s).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const fmtSalary = (v) => {
    if (!v) return null
    const n = typeof v === 'number' ? v : parseFloat(v)
    return `EGP ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  if (loading) return <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400 text-sm">Loading…</div>

  if (!staffInfo) return (
    <div className="bg-white rounded-xl shadow-sm p-12 text-center">
      <p className="text-gray-500">Could not load your information.</p>
    </div>
  )

  const initials = (staffInfo.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
        {staffInfo.photo ? (
          <img src={staffInfo.photo} alt={staffInfo.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shrink-0"
            onError={e => { e.target.style.display = 'none' }} />
        ) : (
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center text-white text-xl font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 truncate">{staffInfo.name}</h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {staffInfo.title && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">{staffInfo.title}</span>
            )}
            {staffInfo.branch && (
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">📍 {staffInfo.branch}</span>
            )}
          </div>
        </div>
        {staffInfo.employeeCode && (
          <span className="text-xs font-mono text-gray-400 shrink-0">{staffInfo.employeeCode}</span>
        )}
      </div>

      {/* Details card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-2">
        <InfoRow label="Username"           value={staffInfo.username}    mono />
        <InfoRow label="Phone"              value={staffInfo.phoneNumber} />
        <InfoRow label="ID Number"          value={staffInfo.idNumber}    mono />
        <InfoRow label="Date of Birth"      value={fmtDate(staffInfo.dateOfBirth)} />
        <InfoRow label="Start Date"         value={fmtDate(staffInfo.startDate)} />
        <InfoRow label="Monthly Salary"     value={fmtSalary(staffInfo.salary)} />
        <InfoRow label="Health Certificate" value={staffInfo.healthCertificate ? '✅ Available' : 'Not uploaded'} />
      </div>

      {/* Leave balance */}
      {leaveBalance && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Leave Balance</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total',     value: leaveBalance.total_leave_days     || 0, color: 'text-blue-600',   bg: 'bg-blue-50'   },
              { label: 'Used',      value: leaveBalance.used_leave_days      || 0, color: 'text-amber-600',  bg: 'bg-amber-50'  },
              { label: 'Remaining', value: leaveBalance.remaining_leave_days || 0, color: 'text-green-600',  bg: 'bg-green-50'  },
            ].map(item => (
              <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center`}>
                <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.label} days</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Staff Leaderboard Component
function StaffLeaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days: '7', '30', '90', 'all'

  useEffect(() => {
    fetchLeaderboard()
  }, [timeRange])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/leaderboard/staff?days=${timeRange}`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setLeaderboard([])
        return
      }
      
      setLeaderboard(response.data)
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      setLeaderboard([])
    } finally {
      setLoading(false)
    }
  }

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 font-bold'
    if (score >= 75) return 'text-blue-600 font-semibold'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const formatScore = (score) => {
    return score.toFixed(1)
  }

  // Find current user's rank
  const userRank = leaderboard.findIndex(staff => staff.staff_id === user?.id) + 1
  const userData = leaderboard.find(staff => staff.staff_id === user?.id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Leaderboard</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* User's Current Rank Highlight */}
      {userData && (
        <div className="bg-gradient-to-r from-brand to-brand-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold">Your Ranking</h3>
              <p className="text-brand-100 mt-1">See how you compare with your branch colleagues</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{getRankEmoji(userRank)}</div>
              <div className="text-lg mt-1">Rank #{userRank}</div>
              <div className={`text-2xl font-bold mt-2 ${getScoreColor(userData.overall_score)}`}>
                {formatScore(userData.overall_score)}/100
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-brand to-brand-600 p-6 text-white">
          <h3 className="text-2xl font-bold">Staff Performance Leaderboard</h3>
          <p className="text-brand-100 mt-1">Ranking staff members in your branch</p>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
            <p className="text-gray-500">No ratings or attendance data found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Performance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Total Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attendance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penalties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Overall Score
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leaderboard.map((staff, index) => {
                  const isCurrentUser = staff.staff_id === user?.id
                  return (
                    <tr 
                      key={staff.staff_id} 
                      className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-brand-50 border-l-4 border-brand' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getRankEmoji(index + 1)}</span>
                          {index < 3 && (
                            <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className={`text-sm font-medium ${isCurrentUser ? 'text-brand-700 font-bold' : 'text-gray-900'}`}>
                              {staff.staff_name}
                              {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                            </div>
                            <div className="text-sm text-gray-500">{staff.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.avg_performance !== null ? formatScore(staff.avg_performance) : 'N/A'}
                          {staff.avg_performance !== null && (
                            <span className="text-xs text-gray-500 ml-1">/ 5.0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.avg_total_score !== null ? formatScore(staff.avg_total_score) : 'N/A'}
                          {staff.avg_total_score !== null && (
                            <span className="text-xs text-gray-500 ml-1">/ 10.0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.attendance_rate !== null ? `${formatScore(staff.attendance_rate)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${staff.penalty_count > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {staff.penalty_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${getScoreColor(staff.overall_score)}`}>
                          {formatScore(staff.overall_score)}
                        </div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard
