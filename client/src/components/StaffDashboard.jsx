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
    { id: 'attendance', label: 'Attendance' },
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

        {/* Attendance Tab */}
        {activeTab === 'attendance' && <StaffAttendance />}

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
function StaffSchedule() {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWeek, setSelectedWeek] = useState(new Date())

  useEffect(() => {
    fetchSchedule()
  }, [selectedWeek])

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const weekStart = new Date(selectedWeek)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      const startDate = weekStart.toISOString().split('T')[0]
      const endDate = weekEnd.toISOString().split('T')[0]

      const response = await axios.get(`/api/staff/my-schedule?startDate=${startDate}&endDate=${endDate}`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setSchedules([])
        return
      }
      
      setSchedules(response.data)
    } catch (error) {
      console.error('Failed to fetch schedule:', error)
      setSchedules([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getShiftLabel = (shift) => {
    const labels = { 
      morning: '🌅 Morning (9:00 - 17:30)', 
      middle: '🌆 Middle (13:00 - 21:00)', 
      night: '🌙 Night (16:00 - 00:30)' 
    }
    return labels[shift] || shift
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">My Schedule</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const newDate = new Date(selectedWeek)
                newDate.setDate(newDate.getDate() - 7)
                setSelectedWeek(newDate)
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              ← Previous Week
            </button>
            <button
              onClick={() => setSelectedWeek(new Date())}
              className="px-3 py-1 text-sm bg-brand text-white rounded-lg hover:bg-brand-600"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedWeek)
                newDate.setDate(newDate.getDate() + 7)
                setSelectedWeek(newDate)
              }}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Next Week →
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading schedule...</div>
      ) : schedules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Schedule Assigned</h3>
          <p className="text-gray-500">Your schedule will appear here once assigned by your branch manager</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Station</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{formatDate(schedule.date)}</td>
                  <td className="px-6 py-4">{getShiftLabel(schedule.shift)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                      {schedule.station || 'Not assigned'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      {schedule.title || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
      const response = await axios.get(`/api/staff/my-ratings?startDate=${selectedDate}&endDate=${selectedDate}`)
      
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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getPerformanceLabel = (score) => {
    if (score === 3) return '⭐ Excellent'
    if (score === 2) return '✓ Good'
    if (score === 1) return '⚠️ Needs Improvement'
    return '❌ Poor'
  }

  const getPerformanceColor = (score) => {
    if (score === 3) return 'bg-green-100 text-green-700'
    if (score === 2) return 'bg-blue-100 text-blue-700'
    if (score === 1) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">View Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading performance...</div>
      ) : ratings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Performance Ratings</h3>
          <p className="text-gray-500">Your performance ratings will appear here once recorded by your branch manager</p>
        </div>
      ) : (
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{formatDate(rating.date)}</h3>
                  <p className="text-sm text-gray-500">Rated by: {rating.manager_name}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getPerformanceColor(rating.performance)}`}>
                  {getPerformanceLabel(rating.performance)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Hygiene & Grooming</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span>{rating.nails_cut ? '✓' : '✗'}</span>
                      <span>Nails Cut</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{rating.beard_shaved ? '✓' : '✗'}</span>
                      <span>Beard Shaved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{rating.clean_tshirt ? '✓' : '✗'}</span>
                      <span>Clean T-Shirt</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{rating.black_pants ? '✓' : '✗'}</span>
                      <span>Black Pants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{rating.correct_footwear ? '✓' : '✗'}</span>
                      <span>Correct Footwear</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Overall Score</h4>
                  <div className="text-3xl font-bold text-brand">{rating.total_score}/8</div>
                  {rating.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{rating.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Staff Attendance Component
function StaffAttendance() {
  const { user } = useAuth()
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchAttendance()
  }, [startDate, endDate])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`/api/staff/my-attendance?startDate=${startDate}&endDate=${endDate}`)
      
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setAttendance([])
        return
      }
      
      setAttendance(response.data)
    } catch (error) {
      console.error('Failed to fetch attendance:', error)
      setAttendance([])
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
      present: 'bg-green-100 text-green-700',
      absent: 'bg-red-100 text-red-700',
      late: 'bg-yellow-100 text-yellow-700',
      on_leave: 'bg-blue-100 text-blue-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">From:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
          />
          <label className="text-sm font-medium text-gray-700">To:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading attendance...</div>
      ) : attendance.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Attendance Records</h3>
          <p className="text-gray-500">Your attendance records will appear here</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clock Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{formatDate(record.date)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.shift}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.clock_in || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.clock_out || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{record.hours_worked || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
function StaffInformation() {
  const { user } = useAuth()
  const [staffInfo, setStaffInfo] = useState(null)
  const [leaveBalance, setLeaveBalance] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStaffInfo()
    fetchLeaveBalance()
  }, [])

  const fetchStaffInfo = async () => {
    try {
      // Fetch staff information using the user's ID
      const response = await axios.get(`/api/staff/${user?.id}`)
      setStaffInfo(response.data)
    } catch (error) {
      console.error('Failed to fetch staff information:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveBalance = async () => {
    try {
      const response = await axios.get(`/api/staff/${user?.id}/leave-balance`)
      setLeaveBalance(response.data)
    } catch (error) {
      console.error('Failed to fetch leave balance:', error)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
        Loading information...
      </div>
    )
  }

  if (!staffInfo) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Unable to Load Information</h3>
        <p className="text-gray-500">Failed to fetch your staff information</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
        
        {/* Photo Section */}
        {staffInfo.photo && (
          <div className="mb-6 flex justify-center">
            <img 
              src={staffInfo.photo} 
              alt={staffInfo.name}
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"%3E%3Ccircle cx="64" cy="64" r="64" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="48" font-weight="600"%3E' + (staffInfo.name?.charAt(0) || '?') + '%3C/text%3E%3C/svg%3E'
              }}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{staffInfo.name || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Employee Code</label>
              <p className="text-lg font-mono text-gray-900 mt-1">{staffInfo.employeeCode || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Username</label>
              <p className="text-lg font-mono text-gray-900 mt-1">{staffInfo.username || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Title</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  {staffInfo.title || 'N/A'}
                </span>
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Branch</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">{staffInfo.branch || 'N/A'}</p>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-lg text-gray-900 mt-1">{formatDate(staffInfo.startDate)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-lg text-gray-900 mt-1">{formatDate(staffInfo.dateOfBirth)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone Number</label>
              <p className="text-lg text-gray-900 mt-1">{staffInfo.phoneNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">ID Number</label>
              <p className="text-lg font-mono text-gray-900 mt-1">{staffInfo.idNumber || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Health Certificate</label>
              <p className="text-lg text-gray-900 mt-1">
                {staffInfo.healthCertificate ? (
                  <span className="text-green-600 font-semibold">✅ Available</span>
                ) : (
                  <span className="text-gray-500">Not uploaded</span>
                )}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Monthly Salary</label>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {staffInfo.salary ? (
                  <span className="text-green-700 font-bold">
                    EGP {typeof staffInfo.salary === 'number' 
                      ? staffInfo.salary.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : parseFloat(staffInfo.salary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Section */}
      {leaveBalance && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Leave Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-600">Total Days Off</label>
              <p className="text-3xl font-bold text-blue-600 mt-2">{leaveBalance.total_leave_days || 0}</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-600">Used Days</label>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{leaveBalance.used_leave_days || 0}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-600">Remaining Days</label>
              <p className="text-3xl font-bold text-green-600 mt-2">{leaveBalance.remaining_leave_days || 0}</p>
            </div>
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
      const response = await axios.get(`/api/leaderboard/staff?days=${timeRange}`)
      
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
