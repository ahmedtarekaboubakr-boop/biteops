import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import Tutorials from './Tutorials'
import AnnouncementBanner from './AnnouncementBanner'
import Announcements from './Announcements'
import Schedule from './Schedule'
import Leaderboard from './Leaderboard'
import ChangePasswordModal from './ChangePasswordModal'
import Rating from './Rating'
import Sidebar from './Sidebar'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

function OwnerDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState('staff')
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedBranches, setExpandedBranches] = useState({})
  const [selectedStaff, setSelectedStaff] = useState(null)
  const [activities, setActivities] = useState([])
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activitiesError, setActivitiesError] = useState(null)
  const [activityFilter, setActivityFilter] = useState({ role: '', actionType: '' })
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchActivities()
    }
  }, [activeTab])

  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/staff`)
      
      // Ensure response.data is an array
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        setStaff([])
        return
      }
      
      // Filter out Area Managers and Operations Managers
      const filteredStaff = response.data.filter(s => 
        s.title !== 'Area Manager' && s.title !== 'Operations Manager'
      )
      setStaff(filteredStaff)
      // Initialize all branches as expanded
      const expanded = {}
      BRANCHES.forEach(branch => {
        expanded[branch] = true
      })
      setExpandedBranches(expanded)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
      setStaff([])
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    setActivitiesError(null)
    try {
      const params = new URLSearchParams()
      if (activityFilter.role) params.append('userRole', activityFilter.role)
      if (activityFilter.actionType) params.append('actionType', activityFilter.actionType)
      params.append('limit', '200')
      
      const response = await axios.get(`${API_URL}/api/activity-log?${params.toString()}`)
      
      // Ensure response.data is an array
      if (!Array.isArray(response.data)) {
        console.error('API returned non-array data:', response.data)
        const errorMsg = response.data?.error || 'Invalid response format from server'
        setActivitiesError(errorMsg)
        setActivities([])
        return
      }
      
      setActivities(response.data)
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      const errorMsg = error.response?.data?.error || error.message
      setActivitiesError(errorMsg)
      setActivities([])
    } finally {
      setActivitiesLoading(false)
    }
  }

  const clearAllActivities = async () => {
    if (!window.confirm('Are you sure you want to clear all activity logs? This cannot be undone.')) {
      return
    }
    try {
      await axios.delete(`${API_URL}/api/activity-log`)
      setActivities([])
    } catch (error) {
      console.error('Failed to clear activities:', error)
      alert('Failed to clear activity logs')
    }
  }

  const toggleBranch = (branch) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branch]: !prev[branch]
    }))
  }

  const getStaffByBranch = (branch) => {
    return staff.filter(s => s.branch === branch)
  }

  const getTitleColor = (title) => {
    const colors = {
      'Crew': 'bg-gray-100 text-gray-700',
      'Cashier': 'bg-blue-100 text-blue-700',
      'Line Leader': 'bg-green-100 text-green-700',
      'Supervisor': 'bg-purple-100 text-purple-700',
      'Assistant Manager': 'bg-amber-100 text-amber-700',
      'Branch Manager': 'bg-brand-100 text-brand-700'
    }
    return colors[title] || 'bg-gray-100 text-gray-700'
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const calculateTenure = (startDate) => {
    if (!startDate) return 'Not specified'
    const start = new Date(startDate)
    const now = new Date()
    const diffTime = Math.abs(now - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 30) {
      return `${diffDays} days`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months} month${months > 1 ? 's' : ''}`
    } else {
      const years = Math.floor(diffDays / 365)
      const remainingMonths = Math.floor((diffDays % 365) / 30)
      if (remainingMonths > 0) {
        return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`
      }
      return `${years} year${years > 1 ? 's' : ''}`
    }
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Not specified'
    const dob = new Date(dateOfBirth)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const monthDiff = now.getMonth() - dob.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
      age--
    }
    return `${age} years old`
  }

  const tabs = [
    { id: 'staff', label: 'Staff' },
    { id: 'schedule', label: 'Schedule' },
    { id: 'tutorials', label: 'Tutorials' },
    { id: 'performance', label: 'Performance' },
    { id: 'activity', label: 'Activity' },
    { id: 'leaderboard', label: 'Leaderboard' },
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
            <p className="text-base text-gray-600 mt-1">Owner Dashboard</p>
          </div>
        </header>

      {/* Staff Detail Modal */}
      {selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-brand to-brand-600 px-6 py-5 rounded-t-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedStaff.name}</h3>
                  <p className="text-brand-100 mt-1">{selectedStaff.employeeCode}</p>
                </div>
                <button
                  onClick={() => setSelectedStaff(null)}
                  className="text-white hover:text-brand-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              <div className="mt-3">
                <span className={`px-3 py-1 text-sm font-medium rounded-full bg-white/20 text-white`}>
                  {selectedStaff.title || 'Staff'}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Work Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Work Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Branch</span>
                    <span className="font-medium text-gray-900">{selectedStaff.branch || 'Not assigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedStaff.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tenure</span>
                    <span className="font-medium text-green-600">{calculateTenure(selectedStaff.startDate)}</span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Personal Information
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date of Birth</span>
                    <span className="font-medium text-gray-900">{formatDate(selectedStaff.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Age</span>
                    <span className="font-medium text-gray-900">{calculateAge(selectedStaff.dateOfBirth)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username</span>
                    <span className="font-medium text-gray-900">{selectedStaff.username}</span>
                  </div>
                </div>
              </div>

              {/* Payroll Information */}
              {selectedStaff.payrollInfo && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Payroll Information
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedStaff.payrollInfo}</p>
                  </div>
                </div>
              )}

              {/* Account Created */}
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-400 text-center">
                  Profile created on {formatDate(selectedStaff.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Main Content */}
        <main className="px-8 py-6">
          {/* Announcement Banner */}
          <AnnouncementBanner />

        {/* Staff Tab */}
        {activeTab === 'staff' && (
          <div>
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-900 mb-2">Staff</h2>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading staff...</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {BRANCHES.map(branch => {
                  const branchStaff = getStaffByBranch(branch)
                  return (
                    <div 
                      key={branch} 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      {/* Branch Header */}
                      <button
                        onClick={() => toggleBranch(branch)}
                        className="w-full px-5 py-4 bg-gradient-to-r from-brand to-brand-600 text-white flex justify-between items-center hover:from-brand-600 hover:to-brand-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">🏪</span>
                          <div className="text-left">
                            <h3 className="font-bold text-lg">{branch}</h3>
                            <p className="text-brand-100 text-sm">{branchStaff.length} staff members</p>
                          </div>
                        </div>
                        <span className="text-2xl">
                          {expandedBranches[branch] ? '−' : '+'}
                        </span>
                      </button>

                      {/* Staff List */}
                      {expandedBranches[branch] && (
                        <div className="divide-y divide-gray-100">
                          {branchStaff.length === 0 ? (
                            <div className="px-5 py-4 text-gray-400 text-center text-sm">
                              No staff assigned to this branch
                            </div>
                          ) : (
                            branchStaff.map(member => (
                              <div 
                                key={member.id} 
                                onClick={() => setSelectedStaff(member)}
                                className="px-5 py-3 hover:bg-brand-50 transition-colors cursor-pointer"
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900 hover:text-brand">{member.name}</p>
                                    <p className="text-xs text-gray-500">{member.employeeCode}</p>
                                  </div>
                                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTitleColor(member.title)}`}>
                                    {member.title || 'Staff'}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && <Schedule staff={staff} readOnly={true} />}

        {/* Tutorials Tab */}
        {activeTab === 'tutorials' && <Tutorials />}

        {/* Performance Tab */}
        {activeTab === 'performance' && <Rating readOnly={true} />}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            {/* Header with filters and clear button */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Activity Log</h2>
                  <p className="text-gray-500 mt-1">Track all actions across the system</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {/* Role Filter */}
                  <select
                    value={activityFilter.role}
                    onChange={(e) => {
                      setActivityFilter(prev => ({ ...prev, role: e.target.value }))
                      setTimeout(fetchActivities, 100)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">All Roles</option>
                    <option value="manager">Branch Managers</option>
                    <option value="hr_manager">HR</option>
                    <option value="area_manager">Area Managers</option>
                    <option value="operations_manager">Operations Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                  
                  {/* Action Type Filter */}
                  <select
                    value={activityFilter.actionType}
                    onChange={(e) => {
                      setActivityFilter(prev => ({ ...prev, actionType: e.target.value }))
                      setTimeout(fetchActivities, 100)
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    <option value="">All Actions</option>
                    <option value="login">Login</option>
                    <option value="schedule_submitted">Schedule Submitted</option>
                    <option value="schedule_edited">Schedule Edited</option>
                    <option value="staff_created">Staff Created</option>
                    <option value="leave_request_created">Leave Request</option>
                    <option value="penalty_created">Penalty</option>
                    <option value="inventory_transfer">Inventory Transfer</option>
                    <option value="inventory_received">Inventory Received</option>
                  </select>

                  {/* Refresh Button */}
                  <button
                    onClick={fetchActivities}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    🔄 Refresh
                  </button>
                  
                  {/* Clear All Button */}
                  <button
                    onClick={clearAllActivities}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                  >
                    🗑️ Clear All
                  </button>
                </div>
              </div>
            </div>

            {/* Activity List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {activitiesLoading ? (
                <div className="p-12 text-center text-gray-500">Loading activities...</div>
              ) : activitiesError ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-lg font-semibold text-red-700 mb-2">Error Loading Activities</h3>
                  <p className="text-gray-600">{activitiesError}</p>
                  <button 
                    onClick={fetchActivities}
                    className="mt-4 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-600"
                  >
                    Try Again
                  </button>
                </div>
              ) : activities.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-5xl mb-4">📋</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Activity Yet</h3>
                  <p className="text-gray-500">Activity logs will appear here as users interact with the system</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && <Leaderboard />}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && <Announcements />}
        </main>
      </div>

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  )
}

// Activity Item Component
function ActivityItem({ activity }) {
  const getActionIcon = (actionType) => {
    const icons = {
      'login': '🔐',
      'schedule_submitted': '📅',
      'schedule_edited': '✏️',
      'staff_created': '👤',
      'leave_request_created': '📝',
      'penalty_created': '⚠️',
      'inventory_transfer': '📦',
      'inventory_received': '✅',
      'inventory_rejected': '❌'
    }
    return icons[actionType] || '📋'
  }

  const getActionColor = (actionType) => {
    const colors = {
      'login': 'bg-blue-100 text-blue-700',
      'schedule_submitted': 'bg-green-100 text-green-700',
      'schedule_edited': 'bg-amber-100 text-amber-700',
      'staff_created': 'bg-purple-100 text-purple-700',
      'leave_request_created': 'bg-cyan-100 text-cyan-700',
      'penalty_created': 'bg-red-100 text-red-700',
      'inventory_transfer': 'bg-indigo-100 text-indigo-700',
      'inventory_received': 'bg-emerald-100 text-emerald-700',
      'inventory_rejected': 'bg-rose-100 text-rose-700'
    }
    return colors[actionType] || 'bg-gray-100 text-gray-700'
  }

  const getRoleLabel = (role) => {
    const labels = {
      'manager': 'Branch Manager',
      'hr_manager': 'HR',
      'area_manager': 'Area Manager',
      'operations_manager': 'Operations Manager',
      'staff': 'Staff',
      'owner': 'Owner'
    }
    return labels[role] || role
  }

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A'
    
    // SQLite stores datetime as 'YYYY-MM-DD HH:MM:SS' without timezone
    // We need to treat it as UTC and convert to Cairo time
    let date
    
    // If the string is in SQLite format (YYYY-MM-DD HH:MM:SS), convert to ISO format with UTC
    if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
      // Replace space with 'T' and add 'Z' to indicate UTC
      date = new Date(dateString.replace(' ', 'T') + 'Z')
    } else if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {
      // If it's ISO format without timezone, assume UTC
      date = new Date(dateString + 'Z')
    } else {
      // Otherwise, parse normally
      date = new Date(dateString)
    }
    
    // Convert to Cairo timezone (UTC+2 or UTC+3 depending on DST)
    return date.toLocaleString('en-US', { 
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActionColor(activity.action_type)}`}>
          {getActionIcon(activity.action_type)}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900">{activity.user_name}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getActionColor(activity.action_type)}`}>
              {getRoleLabel(activity.user_role)}
            </span>
            {activity.branch && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {activity.branch}
              </span>
            )}
          </div>
          <p className="text-gray-600 mt-1">{activity.action_description}</p>
          <p className="text-xs text-gray-400 mt-1">{formatTime(activity.created_at)}</p>
        </div>
      </div>
    </div>
  )
}

export default OwnerDashboard
