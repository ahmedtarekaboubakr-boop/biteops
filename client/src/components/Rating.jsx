import { useState, useEffect, useMemo } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

// Area manager branch assignments
const AREA_MANAGER_BRANCHES = {
  '1663': ['Mivida', 'Leven', 'Sodic Villete'],
  '1618': ['Arkan', 'Palm Hills']
}

function Rating({ readOnly: propReadOnly = false }) {
  const { user } = useAuth()
  
  // Operations Manager and Area Manager are always read-only
  const isAreaManager = user?.role === 'area_manager'
  const isOperationsManager = user?.role === 'operations_manager'
  const readOnly = propReadOnly || isAreaManager || isOperationsManager
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [scheduledStaff, setScheduledStaff] = useState([])
  const [ratings, setRatings] = useState({})
  const [historicalRatings, setHistoricalRatings] = useState([])
  const [historyByDate, setHistoryByDate] = useState({})
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [expandedStaff, setExpandedStaff] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [attendanceRecords, setAttendanceRecords] = useState({}) // staffId -> attendance record
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Get area manager's assigned branches
  const areaManagerBranches = isAreaManager && user?.employeeCode 
    ? (AREA_MANAGER_BRANCHES[user.employeeCode] || [])
    : []
  
  // Determine which branches to show
  const visibleBranches = isOperationsManager 
    ? BRANCHES 
    : isAreaManager 
      ? areaManagerBranches.filter(b => BRANCHES.includes(b) || b === 'Sodic')
      : BRANCHES
  
  const [selectedBranch, setSelectedBranch] = useState(visibleBranches[0] || BRANCHES[0])

  const today = new Date().toISOString().split('T')[0]
  
  // Show branch tabs for HR (readOnly), Operations Manager, or Area Manager
  const showBranchTabs = readOnly || isOperationsManager || isAreaManager

  const hygieneGroomingCriteria = [
    { id: 'nailsCut', label: 'Nails Cut', icon: '💅' },
    { id: 'beardShaved', label: 'Beard Shaved', icon: '🧔' },
    { id: 'cleanTshirt', label: 'Clean T-Shirt', icon: '👕' },
    { id: 'blackPants', label: 'Black Pants', icon: '👖' },
    { id: 'correctFootwear', label: 'Correct Footwear', icon: '👟' }
  ]

  const performanceOptions = [
    { value: 0, label: 'Very Poor', emoji: '😞', color: 'bg-red-100 text-red-700 border-red-300' },
    { value: 1, label: 'Poor', emoji: '😐', color: 'bg-orange-100 text-orange-700 border-orange-300' },
    { value: 2, label: 'Fair', emoji: '😑', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    { value: 3, label: 'Good', emoji: '😊', color: 'bg-blue-100 text-blue-700 border-blue-300' },
    { value: 4, label: 'Very Good', emoji: '😄', color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    { value: 5, label: 'Excellent', emoji: '🌟', color: 'bg-green-100 text-green-700 border-green-300' }
  ]

  const formatDate = (dateInput) => {
    if (!dateInput) return ''
    let date
    if (typeof dateInput === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        return dateInput
      }
      date = new Date(dateInput)
    } else {
      date = dateInput
    }
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Check if it's past 4:30 PM
  const isHygieneLocked = () => {
    const now = new Date()
    const lockTime = new Date()
    lockTime.setHours(16, 30, 0, 0) // 4:30 PM
    
    // Only lock if it's today
    const isToday = selectedDate === today
    return isToday && now >= lockTime
  }

  // Check if staff member is late
  const isStaffLate = (staffId) => {
    const attendance = attendanceRecords[staffId]
    if (!attendance) return false
    
    // Check if they have late_minutes > 0 or status is 'late'
    return (attendance.late_minutes > 0) || (attendance.status === 'late')
  }

  const fetchScheduledStaff = async () => {
    setLoading(true)
    try {
      // Pass branch filter for HR/Area Manager/Ops Manager views
      const params = showBranchTabs && selectedBranch ? { branch: selectedBranch } : {}
      const response = await axios.get(`/api/schedules/date/${selectedDate}`, { params })
      // Filter out Branch Managers and Area Managers from performance ratings
      const filteredStaff = (response.data || []).filter(staff => 
        staff.title !== 'Branch Manager' && staff.title !== 'Area Manager' && staff.title !== 'Operations Manager'
      )
      setScheduledStaff(filteredStaff)
      
      // Fetch attendance records for the selected date
      let attendanceMap = {}
      try {
        const attendanceResponse = await axios.get(`${API_URL}/api/attendance`, {
          params: { startDate: selectedDate, endDate: selectedDate }
        })
        if (attendanceResponse.data) {
          attendanceResponse.data.forEach(record => {
            attendanceMap[record.staff_id] = record
          })
        }
        setAttendanceRecords(attendanceMap)
      } catch (error) {
        console.error('Failed to fetch attendance records:', error)
        setAttendanceRecords({})
      }
      
      const ratingsResponse = await axios.get(`${API_URL}/api/ratings`, {
        params: { startDate: selectedDate, endDate: selectedDate }
      })
      
      const ratingsMap = {}
      if (ratingsResponse.data) {
        ratingsResponse.data.forEach(rating => {
          ratingsMap[rating.staff_id] = {
            nailsCut: rating.nails_cut === 1,
            beardShaved: rating.beard_shaved === 1,
            cleanTshirt: rating.clean_tshirt === 1,
            blackPants: rating.black_pants === 1,
            correctFootwear: rating.correct_footwear === 1,
            performance: rating.performance,
            totalScore: rating.total_score,
            notes: rating.notes || '',
            id: rating.id
          }
        })
      }
      
      // Auto-set hygiene to 0 for late staff if not already rated
      filteredStaff.forEach(staff => {
        const attendance = attendanceMap[staff.staff_id]
        const isLate = attendance && ((attendance.late_minutes > 0) || (attendance.status === 'late'))
        if (isLate && !ratingsMap[staff.staff_id]) {
          ratingsMap[staff.staff_id] = {
            nailsCut: false,
            beardShaved: false,
            cleanTshirt: false,
            blackPants: false,
            correctFootwear: false,
            performance: undefined,
            notes: '',
            isLate: true
          }
        }
      })
      
      setRatings(ratingsMap)
      
      // Check if ratings already exist (already submitted)
      const hasExistingRatings = Object.keys(ratingsMap).length > 0
      setIsSubmitted(hasExistingRatings)
      setHasUnsavedChanges(false)
      
      // Expand all staff by default
      const expanded = {}
      response.data?.forEach(s => { expanded[s.staff_id] = true })
      setExpandedStaff(expanded)
    } catch (error) {
      console.error('Failed to fetch scheduled staff:', error)
      setScheduledStaff([])
    } finally {
      setLoading(false)
    }
  }

  const fetchHistoricalRatings = async () => {
    setHistoryLoading(true)
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)
      
      const response = await axios.get(`${API_URL}/api/ratings`, {
        params: {
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        }
      })
      setHistoricalRatings(response.data)
      
      // Group by date
      const byDate = {}
      response.data.forEach(rating => {
        if (!byDate[rating.date]) {
          byDate[rating.date] = []
        }
        byDate[rating.date].push(rating)
      })
      setHistoryByDate(byDate)
    } catch (error) {
      console.error('Failed to fetch historical ratings:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    fetchScheduledStaff()
    // Reset submission status when date changes
    setIsSubmitted(false)
    setHasUnsavedChanges(false)
  }, [selectedDate, selectedBranch])

  // Update current time every minute to check if hygiene section should be locked
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (showHistory) {
      fetchHistoricalRatings()
    }
  }, [showHistory])

  const handleCheckboxChange = (staffId, field, checked) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        [field]: checked
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handlePerformanceChange = (staffId, value) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        performance: parseInt(value)
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleNotesChange = (staffId, value) => {
    setRatings(prev => ({
      ...prev,
      [staffId]: {
        ...prev[staffId],
        notes: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const calculateTotalScore = (rating) => {
    if (!rating) return 0
    const hygieneScore = 
      (rating.nailsCut ? 1 : 0) +
      (rating.beardShaved ? 1 : 0) +
      (rating.cleanTshirt ? 1 : 0) +
      (rating.blackPants ? 1 : 0) +
      (rating.correctFootwear ? 1 : 0)
    const performanceScore = rating.performance || 0
    return hygieneScore + performanceScore
  }

  const getHygieneScore = (rating) => {
    if (!rating) return 0
    return (rating.nailsCut ? 1 : 0) +
      (rating.beardShaved ? 1 : 0) +
      (rating.cleanTshirt ? 1 : 0) +
      (rating.blackPants ? 1 : 0) +
      (rating.correctFootwear ? 1 : 0)
  }

  const handleSubmitAllRatings = async () => {
    // Check if all staff have performance ratings
    const staffToRate = scheduledStaff.filter(s => {
      const r = ratings[s.staff_id]
      return r && r.performance !== undefined && r.performance !== null && r.performance !== ''
    })

    if (staffToRate.length === 0) {
      alert('Please rate at least one staff member before submitting')
      return
    }

    const unratedStaff = scheduledStaff.filter(s => {
      const r = ratings[s.staff_id]
      return !r || r.performance === undefined || r.performance === null || r.performance === ''
    })

    if (unratedStaff.length > 0) {
      const confirm = window.confirm(
        `${unratedStaff.length} staff member(s) have not been rated yet. Do you want to submit anyway?`
      )
      if (!confirm) return
    }

    setSubmitting(true)

    try {
      // Submit all ratings that have a performance value
      for (const staff of staffToRate) {
        const rating = ratings[staff.staff_id]
        await axios.post(`${API_URL}/api/ratings`, {
          staffId: staff.staff_id,
          date: selectedDate,
          nailsCut: rating.nailsCut || false,
          beardShaved: rating.beardShaved || false,
          cleanTshirt: rating.cleanTshirt || false,
          blackPants: rating.blackPants || false,
          correctFootwear: rating.correctFootwear || false,
          performance: rating.performance,
          notes: rating.notes || ''
        })
      }
      
      setIsSubmitted(true)
      setHasUnsavedChanges(false)
      alert('Performance ratings submitted to HR successfully!')
      fetchScheduledStaff()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit ratings')
    } finally {
      setSubmitting(false)
    }
  }

  const initializeRating = (staffId) => {
    if (!ratings[staffId]) {
      setRatings(prev => ({
        ...prev,
        [staffId]: {
          nailsCut: false,
          beardShaved: false,
          cleanTshirt: false,
          blackPants: false,
          correctFootwear: false,
          performance: '',
          notes: ''
        }
      }))
    }
  }

  const toggleStaffExpand = (staffId) => {
    setExpandedStaff(prev => ({ ...prev, [staffId]: !prev[staffId] }))
  }

  const goToDate = (dateStr) => {
    setSelectedDate(dateStr)
    setShowHistory(false)
  }

  const getLast30Days = () => {
    const days = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const getScoreColor = (score) => {
    if (score >= 9) return 'text-green-600 bg-green-100'
    if (score >= 7) return 'text-blue-600 bg-blue-100'
    if (score >= 5) return 'text-brand bg-brand-100'
    if (score >= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const canRate = !readOnly

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">⭐ Staff Performance</h2>
          <p className="text-gray-500 mt-1">Rate your team's daily performance</p>
        </div>
        <div className="flex items-center gap-3">
        <button
          onClick={() => setShowHistory(!showHistory)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              showHistory 
                ? 'bg-brand text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            📅 History
          </button>
          {selectedDate !== today && !showHistory && (
            <button
              onClick={() => setSelectedDate(today)}
              className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              Go to Today
        </button>
          )}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
            max={today}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>
      </div>

      {/* Read-only indicator for HR */}
      {readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-2">
          <span className="text-2xl">📋</span>
          <span className="text-gray-600">View Only - Performance ratings are recorded by branch managers</span>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-brand to-brand-600 text-white">
            <h3 className="font-bold text-lg">📅 Performance History (Last 30 Days)</h3>
            <p className="text-brand-100 text-sm mt-1">Click on a date to view or edit ratings</p>
          </div>
          {historyLoading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
                {getLast30Days().map((dateStr) => {
                  const dayRatings = historyByDate[dateStr] || []
                  const hasRatings = dayRatings.length > 0
                  const avgScore = hasRatings 
                    ? Math.round(dayRatings.reduce((sum, r) => sum + (r.total_score || 0), 0) / dayRatings.length * 10) / 10
                    : 0
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => goToDate(dateStr)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-brand bg-brand-50 shadow-md' 
                          : hasRatings
                            ? 'border-gray-200 hover:border-brand-200 bg-white'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-gray-500'}`}>
                          {isToday ? 'TODAY' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(dateStr).getDate()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      {hasRatings ? (
                        <div className={`mt-2 text-xs px-2 py-1 rounded-full text-center font-medium ${getScoreColor(avgScore)}`}>
                          ⭐ {avgScore}/10 ({dayRatings.length})
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-400 text-center">
                          No ratings
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Recent Ratings List */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold text-gray-900 mb-4">📊 Recent Ratings</h4>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {historicalRatings.slice(0, 20).map((rating) => {
                    const perfOption = performanceOptions.find(p => p.value === rating.performance)
                    return (
                      <div 
                        key={rating.id} 
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => goToDate(rating.date)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">
                              {new Date(rating.date).toLocaleDateString('en-US', { month: 'short' })}
                            </div>
                            <div className="text-lg font-bold text-gray-900">
                              {new Date(rating.date).getDate()}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{rating.staff_name}</div>
                            <div className="text-sm text-gray-500">{rating.employee_code}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Hygiene</div>
                            <div className="font-semibold text-blue-600">
                              {(rating.nails_cut || 0) + (rating.beard_shaved || 0) + (rating.clean_tshirt || 0) + (rating.black_pants || 0) + (rating.correct_footwear || 0)}/5
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-gray-500">Performance</div>
                            <div className="text-xl">{perfOption?.emoji || '❓'}</div>
                          </div>
                          <div className={`px-3 py-2 rounded-lg font-bold ${getScoreColor(rating.total_score || 0)}`}>
                            {rating.total_score || 0}/10
                          </div>
                        </div>
                      </div>
                    )
                  })}
            {historicalRatings.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No ratings recorded yet
                    </div>
            )}
          </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating Form */}
      {!showHistory && (
        <>
          {/* Current Date Display */}
          <div className="bg-gradient-to-r from-brand to-brand-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-brand-100 text-sm">Rating for</p>
                <h3 className="text-2xl font-bold">{formatDateDisplay(selectedDate)}</h3>
                {readOnly && <p className="text-brand-100 text-sm mt-1">📍 {selectedBranch} Branch</p>}
              </div>
              <div className="text-right">
                <p className="text-brand-100 text-sm">{readOnly ? `Staff in ${selectedBranch}` : 'Staff Scheduled'}</p>
                <p className="text-3xl font-bold">
                  {readOnly 
                    ? scheduledStaff.filter(s => s.branch === selectedBranch).length 
                    : scheduledStaff.length}
                </p>
              </div>
            </div>
          </div>

          {/* Hygiene Lock Warning */}
          {isHygieneLocked() && !readOnly && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h4 className="font-semibold text-red-800">Hygiene & Grooming Section Locked</h4>
                <p className="text-sm text-red-700 mt-1">
                  It is past 4:30 PM. The Hygiene & Grooming section is now locked and cannot be modified. 
                  Late staff members automatically receive 0/5 for hygiene.
                </p>
              </div>
            </div>
          )}

          {/* Scoring Guide */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">📊 Scoring Guide</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                isHygieneLocked() 
                  ? 'bg-gray-100 border-gray-300' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-semibold ${
                    isHygieneLocked() ? 'text-gray-600' : 'text-blue-800'
                  }`}>
                    👔 Hygiene & Grooming (5 pts) - Beginning of Shift
                  </h4>
                  {isHygieneLocked() && (
                    <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
                      🔒 Locked
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  isHygieneLocked() ? 'text-gray-600' : 'text-blue-700'
                }`}>
                  1 point each for: Nails Cut, Beard Shaved, Clean T-Shirt, Black Pants, Correct Footwear
                </p>
                {isHygieneLocked() && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    ⚠️ Locked after 4:30 PM. Late staff automatically receive 0/5.
                  </p>
                )}
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">⭐ Performance (5 pts) - End of Shift</h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {performanceOptions.map(opt => (
                    <span key={opt.value} className={`text-xs px-2 py-1 rounded-full border ${opt.color}`}>
                      {opt.emoji} {opt.value} - {opt.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Total Score:</span> Perfect score is 10 points (5 from Hygiene & Grooming + 5 from Performance)
              </p>
            </div>
          </div>

          {/* Branch Tabs for HR, Operations Manager, and Area Manager */}
          {showBranchTabs && (
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="mb-2 text-sm text-gray-500">
                {isOperationsManager ? '📊 Operations Manager View - All Branches' : 
                 isAreaManager ? '📊 Area Manager View - Assigned Branches' : 
                 '📊 HR View - All Branches'}
              </div>
              <div className="flex flex-wrap gap-2">
                {visibleBranches.map((branch) => {
                  const displayBranch = branch === 'Sodic' ? 'Sodic Villete' : branch
                  return (
                    <button
                      key={branch}
                      onClick={() => setSelectedBranch(branch)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        selectedBranch === branch
                          ? 'bg-brand text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {displayBranch}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">⏳</div>
              <div className="text-gray-500">Loading staff...</div>
            </div>
          ) : scheduledStaff.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Staff Scheduled</h3>
              <p className="text-gray-500 mb-4">No staff were scheduled to work on this date</p>
              <p className="text-sm text-gray-400">
                💡 Tip: Make sure you've added staff to the Schedule for this date first. 
                The Performance list is linked to your schedule.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Filter staff by branch for HR view */}
              {(readOnly ? scheduledStaff.filter(s => s.branch === selectedBranch) : scheduledStaff).length === 0 && readOnly ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No Staff in {selectedBranch}</h3>
                  <p className="text-gray-500">No staff were scheduled for this branch on this date</p>
              </div>
              ) : (readOnly ? scheduledStaff.filter(s => s.branch === selectedBranch) : scheduledStaff).map((staff) => {
                const staffId = staff.staff_id
                if (!ratings[staffId]) {
                  initializeRating(staffId)
                }
                const rating = ratings[staffId] || {}
                const totalScore = calculateTotalScore(rating)
                const hygieneScore = getHygieneScore(rating)
                const hasRating = rating.performance !== undefined && rating.performance !== null && rating.performance !== ''
                const perfOption = performanceOptions.find(p => p.value === rating.performance)

                return (
                  <div key={staffId} className={`bg-white rounded-xl shadow-sm p-4 border-2 transition-all ${hasRating ? 'border-green-300 bg-green-50/30' : 'border-gray-200'}`}>
                    {/* Staff Info Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${hasRating ? 'bg-green-200' : 'bg-gray-200'}`}>
                          {hasRating ? '✓' : '👤'}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{staff.staff_name}</h4>
                          <p className="text-xs text-gray-500">{staff.employee_code}</p>
                        </div>
                      </div>
                      {/* Total Score */}
                      <div className="flex items-center gap-3">
                        <div className={`text-center px-3 py-1 rounded-lg ${getScoreColor(totalScore)}`}>
                          <span className="text-lg font-bold">{totalScore}</span>
                          <span className="text-xs text-gray-500">/10</span>
                        </div>
                        {hasRating && (
                          <span className="text-green-600 text-sm font-medium">✓ Rated</span>
                        )}
                      </div>
                    </div>

                    {/* Section 1: Hygiene & Grooming - Beginning of Shift */}
                    {(() => {
                      const hygieneLocked = isHygieneLocked()
                      const staffLate = isStaffLate(staffId)
                      const hygieneDisabled = hygieneLocked || staffLate || !canRate
                      
                      return (
                        <div className={`mb-4 p-3 rounded-lg border-2 ${
                          hygieneLocked 
                            ? 'bg-gray-100 border-gray-300' 
                            : staffLate
                              ? 'bg-red-50 border-red-300'
                              : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">👔</span>
                              <h5 className={`font-semibold ${
                                hygieneLocked 
                                  ? 'text-gray-600' 
                                  : staffLate
                                    ? 'text-red-800'
                                    : 'text-blue-800'
                              }`}>
                                Hygiene & Grooming (Beginning of Shift)
                              </h5>
                              {hygieneLocked && (
                                <span className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700">
                                  🔒 Locked (Past 4:30 PM)
                                </span>
                              )}
                              {staffLate && !hygieneLocked && (
                                <span className="text-xs font-medium px-2 py-1 rounded bg-red-200 text-red-700">
                                  ⚠️ Late - Auto Zero
                                </span>
                              )}
                            </div>
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              hygieneScore === 5 
                                ? 'bg-green-100 text-green-700' 
                                : staffLate
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}>
                              {hygieneScore}/5
                            </span>
                          </div>
                          {staffLate && (
                            <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-sm text-red-800">
                              ⚠️ Staff member was late. Hygiene & Grooming automatically set to 0/5.
                            </div>
                          )}
                          {hygieneLocked && !staffLate && (
                            <div className="mb-2 p-2 bg-gray-200 border border-gray-300 rounded text-sm text-gray-700">
                              🔒 This section is locked after 4:30 PM. Ratings cannot be changed.
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            {hygieneGroomingCriteria.map((criterion) => {
                              const isChecked = rating[criterion.id] || false
                              return (
                                <button
                                  key={criterion.id}
                                  onClick={() => !hygieneDisabled && handleCheckboxChange(staffId, criterion.id, !isChecked)}
                                  disabled={hygieneDisabled}
                                  title={hygieneLocked ? 'Locked after 4:30 PM' : staffLate ? 'Late staff - auto zero' : criterion.label}
                                  className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                                    hygieneDisabled
                                      ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                                      : isChecked 
                                        ? 'bg-green-500 text-white shadow-sm' 
                                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <span>{criterion.icon}</span>
                                  <span>{criterion.label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })()}

                    {/* Section 2: Performance - End of Shift */}
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">⭐</span>
                          <h5 className="font-semibold text-purple-800">Performance (End of Shift)</h5>
                        </div>
                        {perfOption && (
                          <span className={`text-xs font-medium px-2 py-1 rounded ${perfOption.color}`}>
                            {rating.performance}/5
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {performanceOptions.map((option) => {
                          const isSelected = rating.performance === option.value
                          return (
                            <button
                              key={option.value}
                              onClick={() => canRate && handlePerformanceChange(staffId, option.value)}
                              disabled={!canRate}
                              title={`${option.value} - ${option.label}`}
                              className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                                isSelected 
                                  ? `${option.color} ring-2 ring-offset-1 ring-current shadow-sm` 
                                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                              } ${!canRate ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                            >
                              <span>{option.emoji}</span>
                              <span>{option.value} - {option.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Notes - Collapsible on small screens */}
                    {!readOnly && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                            <input
                          type="text"
                          value={rating.notes || ''}
                          onChange={(e) => handleNotesChange(staffId, e.target.value)}
                              disabled={!canRate}
                          placeholder="📝 Add notes (optional)..."
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100"
                            />
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Submit to HR Button - Only for branch managers */}
              {!readOnly && scheduledStaff.length > 0 && (
                <div className={`mt-6 p-4 rounded-xl ${
                  isSubmitted 
                    ? 'bg-green-50 border-2 border-green-300' 
                    : hasUnsavedChanges 
                      ? 'bg-amber-50 border-2 border-amber-300'
                      : 'bg-gray-50 border-2 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isSubmitted ? (
                        <>
                          <span className="text-2xl">✅</span>
                          <div>
                            <p className="font-semibold text-green-800">Ratings Submitted to HR</p>
                            <p className="text-sm text-green-600">
                              {scheduledStaff.filter(s => {
                                const r = ratings[s.staff_id]
                                return r && r.performance !== undefined && r.performance !== null && r.performance !== ''
                              }).length} of {scheduledStaff.length} staff rated
                            </p>
                          </div>
                        </>
                      ) : hasUnsavedChanges ? (
                        <>
                          <span className="text-2xl">⚠️</span>
                          <div>
                            <p className="font-semibold text-amber-800">Unsaved Ratings</p>
                            <p className="text-sm text-amber-600">
                              Click "Submit to HR" to save your ratings
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">📊</span>
                          <div>
                            <p className="font-semibold text-gray-700">Rate Staff Performance</p>
                            <p className="text-sm text-gray-500">
                              Rate all staff members, then submit to HR
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleSubmitAllRatings}
                      disabled={submitting || !hasUnsavedChanges}
                      className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                        isSubmitted && !hasUnsavedChanges
                          ? 'bg-green-600 text-white'
                          : 'bg-brand text-white hover:bg-brand-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {submitting ? '⏳ Submitting...' : isSubmitted && !hasUnsavedChanges ? '✓ Submitted' : '📤 Submit to HR'}
                    </button>
                  </div>
                </div>
              )}

              {/* Daily Analytics Summary */}
              {(() => {
                const branchStaff = readOnly 
                  ? scheduledStaff.filter(s => s.branch === selectedBranch) 
                  : scheduledStaff
                
                // Only show analytics if there are staff and some ratings
                const ratedStaff = branchStaff.filter(s => {
                  const r = ratings[s.staff_id]
                  return r && r.performance !== undefined && r.performance !== null && r.performance !== ''
                })
                
                if (branchStaff.length === 0 || ratedStaff.length === 0) return null

                // Calculate averages
                let totalHygiene = 0
                let totalPerformance = 0
                let perfectHygiene = 0
                let excellentPerformance = 0

                ratedStaff.forEach(s => {
                  const r = ratings[s.staff_id]
                  const hygieneScore = [r.nailsCut, r.beardShaved, r.cleanTshirt, r.blackPants, r.correctFootwear]
                    .filter(Boolean).length
                  totalHygiene += hygieneScore
                  totalPerformance += r.performance || 0
                  if (hygieneScore === 5) perfectHygiene++
                  if (r.performance === 5) excellentPerformance++
                })

                const avgHygiene = (totalHygiene / ratedStaff.length).toFixed(1)
                const avgPerformance = (totalPerformance / ratedStaff.length).toFixed(1)
                const avgTotal = ((totalHygiene + totalPerformance) / ratedStaff.length).toFixed(1)
                const hygienePercent = ((totalHygiene / (ratedStaff.length * 5)) * 100).toFixed(0)
                const performancePercent = ((totalPerformance / (ratedStaff.length * 5)) * 100).toFixed(0)
                const overallPercent = (((totalHygiene + totalPerformance) / (ratedStaff.length * 10)) * 100).toFixed(0)

                return (
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl shadow-lg p-6 text-white mt-6">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-3xl">📊</span>
                      <div>
                        <h3 className="text-xl font-bold">Daily Performance Analytics</h3>
                        <p className="text-gray-400 text-sm">
                          {readOnly ? `${selectedBranch} Branch` : 'Your Branch'} • {formatDateDisplay(selectedDate)}
                        </p>
                      </div>
                    </div>

                    {/* Rating Coverage */}
                    <div className="mb-6 p-4 bg-white/10 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Rating Coverage</span>
                        <span className="font-bold">{ratedStaff.length} / {branchStaff.length} staff rated</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(ratedStaff.length / branchStaff.length) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Average Scores Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Hygiene Average */}
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">👔</div>
                        <div className="text-3xl font-bold text-blue-400">{avgHygiene}<span className="text-lg text-gray-400">/5</span></div>
                        <div className="text-sm text-gray-300 mt-1">Avg Hygiene & Grooming</div>
                        <div className="mt-2 text-xs text-blue-300">{hygienePercent}% compliance</div>
                      </div>

                      {/* Performance Average */}
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">⭐</div>
                        <div className="text-3xl font-bold text-purple-400">{avgPerformance}<span className="text-lg text-gray-400">/5</span></div>
                        <div className="text-sm text-gray-300 mt-1">Avg Performance</div>
                        <div className="mt-2 text-xs text-purple-300">{performancePercent}% of max</div>
                      </div>

                      {/* Overall Average */}
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 text-center">
                        <div className="text-3xl mb-2">🏆</div>
                        <div className="text-3xl font-bold text-green-400">{avgTotal}<span className="text-lg text-gray-400">/10</span></div>
                        <div className="text-sm text-gray-300 mt-1">Avg Total Score</div>
                        <div className="mt-2 text-xs text-green-300">{overallPercent}% overall</div>
                      </div>
                    </div>

                    {/* Achievement Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                        <div className="text-4xl">✨</div>
                        <div>
                          <div className="text-2xl font-bold">{perfectHygiene}</div>
                          <div className="text-sm text-gray-400">Perfect Hygiene (5/5)</div>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                        <div className="text-4xl">🌟</div>
                        <div>
                          <div className="text-2xl font-bold">{excellentPerformance}</div>
                          <div className="text-sm text-gray-400">Excellent Performance (5/5)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Rating
