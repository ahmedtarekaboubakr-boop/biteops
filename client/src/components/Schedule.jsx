import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

// Station configuration - same for all branches, no max limits
const STATIONS = [
  { id: 'manager', label: 'Manager', icon: '👔' },
  { id: 'cashier', label: 'Cashier', icon: '💵' },
  { id: 'fryer', label: 'Fryer', icon: '🍟' },
  { id: 'grill', label: 'Grill', icon: '🍔' },
  { id: 'dress', label: 'Dress', icon: '🥗' },
  { id: 'pickup', label: 'Pickup', icon: '📦' }
]

// All branches use the same stations
const BRANCH_STATIONS = {
  'Mivida': STATIONS,
  'Leven': STATIONS,
  'Sodic Villete': STATIONS,
  'Sodic': STATIONS,
  'Arkan': STATIONS,
  'Palm Hills': STATIONS
}

function Schedule({ staff, readOnly: propReadOnly = false }) {
  const { user } = useAuth()
  
  // Operations Manager and Area Manager are always read-only
  const isAreaManager = user?.role === 'area_manager'
  const isOperationsManager = user?.role === 'operations_manager'
  const readOnly = propReadOnly || isAreaManager || isOperationsManager
  
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState(null)
  const [showStaffSelector, setShowStaffSelector] = useState(false)
  const [selectedStation, setSelectedStation] = useState(null)
  const [swapMode, setSwapMode] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [userBranch, setUserBranch] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [branches, setBranches] = useState([])
  const [areaManagerBranches, setAreaManagerBranches] = useState([])

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const shifts = [
    { id: 'morning', label: 'Morning', time: '9:00 - 17:30', color: 'bg-yellow-100 border-yellow-300' },
    { id: 'middle', label: 'Middle', time: '13:00 - 21:00', color: 'bg-blue-100 border-blue-300' },
    { id: 'night', label: 'Night', time: '16:00 - 00:30', color: 'bg-purple-100 border-purple-300' }
  ]
  
  // Operations manager sees all branches
  const operationsManagerBranches = branches.length > 0 ? branches.map(b => b.name) : BRANCHES

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/branches`)
        
        if (!Array.isArray(response.data)) {
          console.error('API returned non-array data:', response.data)
          setBranches([])
          setAreaManagerBranches([])
          return
        }
        
        setBranches(response.data)
        
        // Filter branches for area managers based on their area
        if (isAreaManager && user?.area) {
          const filtered = response.data.filter(b => b.area === user.area)
          const branchNames = filtered.map(b => b.name)
          setAreaManagerBranches(branchNames)
        }
      } catch (error) {
        console.error('Failed to fetch branches:', error)
        // Fallback to static branches if API fails
        setBranches(BRANCHES.map(name => ({ name, area: null })))
      }
    }
    
    fetchBranches()
  }, [isAreaManager, user?.area])

  // Update userBranch when user changes
  useEffect(() => {
    if (user?.branch) {
      setUserBranch(user.branch)
    }
  }, [user])

  // Check if current user's branch has stations (for regular managers) or selected branch (for area/ops managers)
  const activeBranch = (isAreaManager || isOperationsManager) ? selectedBranch : userBranch
  const hasStations = activeBranch && BRANCH_STATIONS[activeBranch]
  const stations = hasStations ? BRANCH_STATIONS[activeBranch] : []

  // Get week dates
  const getWeekDates = (date) => {
    const start = new Date(date)
    const day = start.getDay()
    const diff = start.getDate() - day
    start.setDate(diff)
    start.setHours(0, 0, 0, 0)

    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)

    return { start, end }
  }

  const formatDate = (date) => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const weekDates = () => {
    const { start } = getWeekDates(currentWeek)
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const { start, end } = getWeekDates(currentWeek)
      const response = await axios.get(`${API_URL}/api/schedules`, {
        params: {
          startDate: formatDate(start),
          endDate: formatDate(end)
        }
      })
      setSchedules(response.data)
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissionStatus = async () => {
    try {
      const { start } = getWeekDates(currentWeek)
      const response = await axios.get(`${API_URL}/api/schedules/submission-status`, {
        params: { weekStart: formatDate(start) }
      })
      if (readOnly) {
        // For management roles, get all branch publication statuses
        setSubmissionStatus(response.data)
      } else {
        // For branch manager, get their branch publication status
        setSubmissionStatus(response.data[0] || null)
      }
    } catch (error) {
      console.error('Failed to fetch submission status:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!readOnly) return
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        params: { unreadOnly: 'false' }
      })
      setNotifications(response.data)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  const handleSubmitSchedule = async (isEdit = false) => {
    if (schedules.length === 0) {
      alert('Please add at least one staff member to the schedule before submitting.')
      return
    }
    
    const confirmMessage = isEdit 
      ? 'Save your changes and publish the updated schedule?' 
      : 'Are you sure you want to publish this schedule? It will be visible to your staff, area manager, and management.'
    if (!window.confirm(confirmMessage)) return
    
    setSubmitting(true)
    try {
      const { start, end } = getWeekDates(currentWeek)
      await axios.post(`${API_URL}/api/schedules/submit`, {
        weekStart: formatDate(start),
        weekEnd: formatDate(end),
        isEdit: isEdit
      })
      alert(isEdit ? 'Changes saved and published successfully!' : 'Schedule published successfully!')
      fetchSubmissionStatus()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const markNotificationRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`)
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  }

  const markAllNotificationsRead = async () => {
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`)
      fetchNotifications()
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }

  useEffect(() => {
    fetchSchedules()
    fetchSubmissionStatus()
    if (readOnly) {
      fetchNotifications()
    }
  }, [currentWeek])

  const previousWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() - 7)
    setCurrentWeek(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + 7)
    setCurrentWeek(newDate)
  }

  const goToToday = () => {
    setCurrentWeek(new Date())
  }

  const getSchedulesForCell = (date, shift) => {
    return schedules.filter(s => {
      const matchesDateShift = s.date === formatDate(date) && s.shift === shift
      if ((readOnly || isAreaManager || isOperationsManager) && selectedBranch) {
        return matchesDateShift && s.branch === selectedBranch
      }
      return matchesDateShift
    })
  }

  const handleCellClick = (date, shift) => {
    if (readOnly) return
    // Only allow editing if not published OR in edit mode
    if (submissionStatus?.status && !editMode) return
    setSelectedCell({ date, shift })
    setSelectedStation(null)
    setShowStaffSelector(true)
  }

  const handleAddStaff = async (staffId) => {
    if (!selectedCell) return
    
    // For branches with stations, require station selection
    if (hasStations && !selectedStation) {
      alert('Please select a station first')
      return
    }

    try {
      await axios.post(`${API_URL}/api/schedules`, {
        staffId,
        date: formatDate(selectedCell.date),
        shift: selectedCell.shift,
        station: selectedStation
      })
      setShowStaffSelector(false)
      setSelectedCell(null)
      setSelectedStation(null)
      fetchSchedules()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to add staff to schedule')
    }
  }

  const handleRemoveStaff = async (scheduleId) => {
    // Only allow removing if not published OR in edit mode
    if (submissionStatus?.status && !editMode) return
    if (!window.confirm('Remove this staff member from this shift?')) return

    try {
      await axios.delete(`${API_URL}/api/schedules/${scheduleId}`)
      fetchSchedules()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to remove staff from schedule')
    }
  }

  const handleStartSwap = (schedule, e) => {
    e.stopPropagation()
    // Only allow swapping if not published OR in edit mode
    if (submissionStatus?.status && !editMode) return
    setSwapMode({
      scheduleId: schedule.id,
      date: schedule.date,
      shift: schedule.shift,
      staffName: schedule.staff_name
    })
  }

  const handleCompleteSwap = async (targetScheduleId) => {
    if (!swapMode) return

    try {
      await axios.post(`${API_URL}/api/schedules/swap`, {
        scheduleId1: swapMode.scheduleId,
        scheduleId2: targetScheduleId
      })
      setSwapMode(null)
      fetchSchedules()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to swap shifts')
      setSwapMode(null)
    }
  }

  const handleCancelSwap = () => {
    setSwapMode(null)
  }

  const getStationInfo = (stationId) => {
    for (const branch in BRANCH_STATIONS) {
      const station = BRANCH_STATIONS[branch].find(s => s.id === stationId)
      if (station) return station
    }
    return null
  }

  const getStationCountForCell = (date, shift, stationId) => {
    return schedules.filter(s => 
      s.date === formatDate(date) && 
      s.shift === shift && 
      s.station === stationId
    ).length
  }

  const dates = weekDates()
  const { start } = getWeekDates(currentWeek)
  const weekRange = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const unreadNotifications = notifications.filter(n => !n.is_read)

  const getSubmissionForBranch = (branch) => {
    if (Array.isArray(submissionStatus)) {
      return submissionStatus.find(s => s.branch === branch)
    }
    return null
  }

  const isMultiBranchViewer = readOnly || isAreaManager || isOperationsManager
  const showScheduleContent = !isMultiBranchViewer || selectedBranch
  const branchTabList = isOperationsManager
    ? operationsManagerBranches
    : isAreaManager
      ? areaManagerBranches
      : BRANCHES

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="text-3xl font-bold text-gray-900">Weekly Schedule</h2>
        {readOnly && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative"
            >
              <span className="text-xl">🔔</span>
              {unreadNotifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Location first: Owner, HR, Area Manager, Operations Manager must choose a branch before the grid */}
      {isMultiBranchViewer && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <span className="text-gray-600">
              {readOnly
                ? '📋 View Only - Schedules are created by Branch Managers'
                : isOperationsManager
                  ? '📋 Operations Manager View - Viewing analytics for all branches'
                  : '📋 Area Manager View - Viewing schedules for your assigned branches'}
            </span>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Location</p>
            <div className="flex flex-wrap gap-2">
              {branchTabList.map((branch) => {
                const branchSubmission = getSubmissionForBranch(branch)
                return (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      selectedBranch === branch
                        ? 'bg-brand text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {branch}
                    {branchSubmission && (
                      <span
                        className={`w-2 h-2 rounded-full ${
                          branchSubmission.status === 'submitted'
                            ? 'bg-green-500'
                            : branchSubmission.status === 'edited'
                              ? 'bg-yellow-500'
                              : 'bg-gray-400'
                        }`}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {!selectedBranch && (
            <div className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Select a location to view the schedule.
            </div>
          )}

          {selectedBranch && (() => {
            const branchSubmission = getSubmissionForBranch(selectedBranch)
            return (
              <div
                className={`rounded-lg p-4 flex items-center justify-between ${
                  branchSubmission?.status === 'edited'
                    ? 'bg-yellow-50 border-2 border-yellow-300'
                    : branchSubmission?.status === 'submitted'
                      ? 'bg-green-50 border-2 border-green-300'
                      : 'bg-brand-50 border border-brand-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏪</span>
                  <div>
                    <span
                      className={`font-semibold text-lg ${
                        branchSubmission?.status === 'edited'
                          ? 'text-yellow-900'
                          : branchSubmission?.status === 'submitted'
                            ? 'text-green-900'
                            : 'text-gray-800'
                      }`}
                    >
                      {selectedBranch} Branch Schedule
                    </span>
                    {branchSubmission && (
                      <p
                        className={`text-sm mt-1 ${
                          branchSubmission.status === 'edited'
                            ? 'text-yellow-800 font-medium'
                            : branchSubmission.status === 'submitted'
                              ? 'text-green-800'
                              : 'text-gray-600'
                        }`}
                      >
                        {branchSubmission.status === 'edited'
                          ? `⚠️ Updated after publishing by ${branchSubmission.manager_name} on ${new Date(branchSubmission.last_edited_at || branchSubmission.submitted_at).toLocaleDateString()}`
                          : branchSubmission.status === 'submitted'
                            ? `✅ Published by ${branchSubmission.manager_name} on ${new Date(branchSubmission.submitted_at).toLocaleDateString()}`
                            : 'Not published'}
                      </p>
                    )}
                  </div>
                </div>
                {branchSubmission ? (
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      branchSubmission.status === 'edited'
                        ? 'bg-yellow-200 text-yellow-900 border border-yellow-400'
                        : branchSubmission.status === 'submitted'
                          ? 'bg-green-200 text-green-900 border border-green-400'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {branchSubmission.status === 'edited'
                      ? '⚠ Updated'
                      : branchSubmission.status === 'submitted'
                        ? '✓ Published'
                        : 'Pending'}
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-500">Not Published</span>
                )}
              </div>
            )
          })()}
        </div>
      )}

      {showScheduleContent && (
        <>
      {/* Week Navigation */}
      <div className="flex flex-wrap justify-center sm:justify-end items-center gap-2 sm:gap-4">
          <button
            onClick={previousWeek}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Previous
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <span className="text-lg font-semibold text-gray-700 min-w-[200px] text-center">
            {weekRange}
          </span>
          <button
            onClick={nextWeek}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Next →
          </button>
      </div>

      {/* Notifications Panel for HR */}
      {readOnly && showNotifications && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">🔔 Notifications</h3>
            {unreadNotifications.length > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-sm text-brand hover:text-brand-600"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.slice(0, 20).map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 ${notification.is_read ? 'bg-white' : 'bg-brand-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${notification.type === 'schedule_submitted' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        <span className="text-xs font-medium text-gray-500 uppercase">
                          {notification.type === 'schedule_submitted' ? 'Published' : 'Updated'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markNotificationRead(notification.id)}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Station Legend for Leven */}
      {hasStations && !readOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold text-amber-800">📍 Stations for {userBranch}:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {stations.map(station => (
              <div key={station.id} className="flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-amber-300">
                <span>{station.icon}</span>
                <span className="text-sm font-medium text-gray-700">{station.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Schedule Button for Managers */}
      {!readOnly && (
        <div className={`rounded-xl p-4 flex items-center justify-between ${
          editMode
            ? 'bg-blue-50 border border-blue-200'
            : submissionStatus?.status === 'submitted' 
              ? 'bg-green-50 border border-green-200' 
              : submissionStatus?.status === 'edited'
                ? 'bg-yellow-50 border border-yellow-200'
                : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {editMode ? (
              <>
                <span className="text-2xl">✏️</span>
                <div>
                  <p className="font-semibold text-blue-800">Editing Mode</p>
                  <p className="text-sm text-blue-600">
                    Make your changes, then click "Done" to save
                  </p>
                </div>
              </>
            ) : submissionStatus?.status === 'submitted' ? (
              <>
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-semibold text-green-800">Schedule Published</p>
                  <p className="text-sm text-green-600">
                    Published on {new Date(submissionStatus.submitted_at).toLocaleString()} - Visible to your team and management
                  </p>
                </div>
              </>
            ) : submissionStatus?.status === 'edited' ? (
              <>
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-800">Schedule Updated After Publishing</p>
                  <p className="text-sm text-yellow-600">
                    Management has been notified of the changes
                  </p>
                </div>
              </>
            ) : (
              <>
                <span className="text-2xl">📤</span>
                <div>
                  <p className="font-semibold text-blue-800">Ready to Publish</p>
                  <p className="text-sm text-blue-600">
                    Publish your schedule to make it visible to your team and management
                  </p>
                </div>
              </>
            )}
          </div>
          {/* Button logic based on state */}
          {!submissionStatus?.status ? (
            // Not yet published - show Publish button
            <button
              onClick={() => handleSubmitSchedule(false)}
              disabled={submitting || schedules.length === 0}
              className="px-6 py-2 rounded-lg font-semibold transition-colors bg-brand text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Publishing...' : 'Publish Schedule'}
            </button>
          ) : editMode ? (
            // In edit mode - show Done button
            <button
              onClick={async () => {
                await handleSubmitSchedule(true)
                setEditMode(false)
              }}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <span className="text-lg">✓</span>
              <span>{submitting ? 'Saving...' : 'Done'}</span>
            </button>
          ) : (
            // Published but not in edit mode - show Edit Schedule button
            <button
              onClick={() => {
                setEditMode(true)
                document.getElementById('schedule-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <span className="text-lg">✏️</span>
              <span>Edit Schedule</span>
            </button>
          )}
        </div>
      )}

      {/* Swap Mode Indicator */}
      {swapMode && !readOnly && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div>
            <span className="font-semibold text-blue-900">Swap Mode Active:</span>
            <span className="ml-2 text-blue-700">Click on another staff member to swap with {swapMode.staffName}</span>
          </div>
          <button
            onClick={handleCancelSwap}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Cancel Swap
          </button>
        </div>
      )}

      {/* Calendar Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading schedule...</div>
        </div>
      ) : (
        <div id="schedule-grid" className="bg-white rounded-xl shadow-sm overflow-hidden scroll-mt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Shift / Day
                  </th>
                  {dates.map((date, index) => (
                    <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      <div>{daysOfWeek[date.getDay()]}</div>
                      <div className="text-gray-400 font-normal">{date.getDate()}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shifts.map((shift) => (
                  <tr key={shift.id}>
                    <td className="px-4 py-4 whitespace-nowrap bg-gray-50">
                      <div className={`text-sm font-semibold px-3 py-2 rounded-lg border-2 ${shift.color} text-center`}>
                        <div>{shift.label}</div>
                        <div className="text-xs font-normal mt-1 opacity-75">{shift.time}</div>
                      </div>
                    </td>
                    {dates.map((date, dateIndex) => {
                      const cellSchedules = getSchedulesForCell(date, shift.id)
                      const canEdit = !readOnly && (!submissionStatus?.status || editMode)
                      return (
                        <td
                          key={dateIndex}
                          className={`px-2 py-2 border border-gray-200 min-h-[100px] align-top transition-colors ${
                            canEdit ? 'cursor-pointer hover:bg-gray-50' : ''
                          } ${!canEdit && submissionStatus?.status ? 'bg-gray-50' : ''}`}
                          onClick={() => handleCellClick(date, shift.id)}
                        >
                          <div className="space-y-1">
                            {cellSchedules.map((schedule) => {
                              const isSwapSource = swapMode?.scheduleId === schedule.id
                              const isSwapTarget = swapMode && 
                                                   swapMode.scheduleId !== schedule.id && 
                                                   schedule.date === formatDate(date) && 
                                                   schedule.shift === shift.id
                              const stationInfo = getStationInfo(schedule.station)
                              return (
                                <div
                                  key={schedule.id}
                                  className={`px-2 py-1 rounded text-xs font-medium ${shift.color} border flex items-center justify-between group ${
                                    isSwapSource ? 'ring-2 ring-brand ring-offset-1' : ''
                                  } ${isSwapTarget ? 'ring-2 ring-blue-500 ring-offset-1 cursor-pointer hover:bg-blue-50' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (swapMode && isSwapTarget) {
                                      handleCompleteSwap(schedule.id)
                                    }
                                  }}
                                >
                                  <div className="flex items-center gap-2 truncate flex-1">
                                    <span 
                                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs font-medium whitespace-nowrap"
                                      title={stationInfo ? stationInfo.label : 'Not assigned'}
                                    >
                                      {stationInfo ? (
                                        <>
                                          <span>{stationInfo.icon}</span>
                                          <span>{stationInfo.label}</span>
                                        </>
                                      ) : (
                                        <span>📍 Not assigned</span>
                                      )}
                                    </span>
                                    <span className="truncate font-medium flex-1 min-w-0">{schedule.staff_name}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium whitespace-nowrap">
                                      {schedule.title || 'N/A'}
                                    </span>
                                  </div>
                                  {canEdit && (
                                    <div className="flex items-center gap-1">
                                      {!swapMode && (
                                        <button
                                          onClick={(e) => handleStartSwap(schedule, e)}
                                          className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                          title="Swap"
                                        >
                                          ⇄
                                        </button>
                                      )}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleRemoveStaff(schedule.id)
                                        }}
                                        className="text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                            {cellSchedules.length === 0 && canEdit && (
                              <div className="text-xs text-gray-400 text-center py-2">
                                Click to add
                              </div>
                            )}
                            {cellSchedules.length === 0 && !canEdit && (
                              <div className="text-xs text-gray-300 text-center py-2">
                                —
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* Staff Selector Modal */}
      {showStaffSelector && selectedCell && !readOnly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">
                  Add Staff - {selectedCell.shift.charAt(0).toUpperCase() + selectedCell.shift.slice(1)} Shift
                </h3>
                <button
                  onClick={() => {
                    setShowStaffSelector(false)
                    setSelectedCell(null)
                    setSelectedStation(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedCell.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Station Selector */}
            {hasStations && (
              <div className="p-4 border-b border-gray-200 bg-amber-50">
                <p className="text-sm font-medium text-amber-800 mb-3">1. Select Station:</p>
                <div className="grid grid-cols-3 gap-2">
                  {stations.map(station => {
                    const isSelected = selectedStation === station.id
                    return (
                      <button
                        key={station.id}
                        onClick={() => setSelectedStation(station.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          isSelected 
                            ? 'border-brand bg-brand-100' 
                            : 'border-gray-200 bg-white hover:border-brand-200'
                        }`}
                      >
                        <span className="text-lg">{station.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{station.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {hasStations && (
                <p className="text-sm font-medium text-gray-700 mb-3">2. Select Staff:</p>
              )}
              {!Array.isArray(staff) || staff.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No staff available</p>
              ) : (
                <div className="space-y-2">
                  {staff.map((staffMember) => {
                    const alreadyScheduled = schedules.some(
                      s => s.staff_id === staffMember.id &&
                           s.date === formatDate(selectedCell.date) &&
                           s.shift === selectedCell.shift
                    )
                    return (
                      <button
                        key={staffMember.id}
                        onClick={() => !alreadyScheduled && handleAddStaff(staffMember.id)}
                        disabled={alreadyScheduled || (hasStations && !selectedStation)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          alreadyScheduled
                            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                            : (hasStations && !selectedStation)
                              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-white border-gray-300 hover:bg-brand-50 hover:border-brand-200'
                        }`}
                      >
                        <div className="font-medium">{staffMember.name}</div>
                        <div className="text-sm text-gray-500">{staffMember.employeeCode}</div>
                        {alreadyScheduled && (
                          <div className="text-xs text-gray-400 mt-1">Already scheduled</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
              {hasStations && !selectedStation && (
                <p className="text-xs text-amber-600 text-center mt-4">
                  ↑ Please select a station above first
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule
