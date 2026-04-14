import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']
const ROLES = [
  { value: 'owner', label: 'Owner' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'area_manager', label: 'Area Manager' },
  { value: 'operations_manager', label: 'Operations Manager' },
  { value: 'manager', label: 'Branch Manager' },
  { value: 'staff', label: 'Staff' }
]

function Announcements() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    targetRoles: [],
    targetBranches: [],
    targetStaffIds: []
  })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [staffMembers, setStaffMembers] = useState([])
  const [loadingStaff, setLoadingStaff] = useState(false)

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      // Staff members use /api/announcements to see their own announcements
      // Managers and above use /api/announcements/all to see all announcements
      const canCreate = user?.role && ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'].includes(user.role)
      const endpoint = canCreate ? '/api/announcements/all' : '/api/announcements'
      const response = await axios.get(endpoint)
      setAnnouncements(response.data)
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title || !formData.message || formData.targetRoles.length === 0) {
      alert('Please fill in all required fields and select at least one target role')
      return
    }

    setSubmitting(true)
    try {
      // For branch managers, always use their branch
      // For area managers, validate they only selected from their assigned branches
      let targetBranches = formData.targetBranches
      if (isBranchManager && user?.branch) {
        targetBranches = [user.branch]
      } else if (isAreaManager && user?.area) {
        const assignedBranches = getAreaManagerBranches(user.area)
        // Filter to only include assigned branches (security check)
        targetBranches = targetBranches.filter(b => assignedBranches.includes(b))
        // Require at least one branch to be selected
        if (targetBranches.length === 0) {
          alert('Please select at least one branch from your assigned area')
          return
        }
      }

      await axios.post(`${import.meta.env.VITE_API_URL}/api/announcements`, {
        title: formData.title,
        message: formData.message,
        targetRoles: formData.targetRoles,
        targetBranches: targetBranches.length > 0 ? targetBranches : null,
        targetStaffIds: formData.targetStaffIds.length > 0 ? formData.targetStaffIds : null
      })
      setShowForm(false)
      setFormData({ title: '', message: '', targetRoles: [], targetBranches: [], targetStaffIds: [] })
      setStaffMembers([])
      fetchAnnouncements()
      alert('Announcement created successfully!')
    } catch (error) {
      console.error('Failed to create announcement:', error)
      alert(error.response?.data?.error || 'Failed to create announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleRole = (role) => {
    setFormData(prev => {
      const newTargetRoles = prev.targetRoles.includes(role)
        ? prev.targetRoles.filter(r => r !== role)
        : [...prev.targetRoles, role]
      
      return {
        ...prev,
        targetRoles: newTargetRoles,
        // If unchecking "Staff", clear staff selections
        targetStaffIds: role === 'staff' && !newTargetRoles.includes('staff') ? [] : prev.targetStaffIds
      }
    })
  }
  
  // Get area manager's assigned branches
  const getAreaManagerBranches = (area) => {
    if (area === 'Fifth Settlement') {
      return ['Mivida', 'Leven', 'Sodic Villete']
    } else if (area === '6th of October') {
      return ['Arkan', 'Palm Hills']
    }
    return []
  }

  // Fetch staff members when HR, Branch Manager, or Area Manager selects "Staff" role
  // HR: All staff with specific titles from all branches
  // Branch Manager: All staff from their branch only
  // Area Manager: All staff from all branches in their assigned area
  const fetchStaffMembers = useCallback(async () => {
    if (user?.role !== 'hr_manager' && user?.role !== 'manager' && user?.role !== 'area_manager') return
    
    setLoadingStaff(true)
    try {
      if (user?.role === 'hr_manager') {
        // HR sees all staff with specific titles from all branches
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`)
        const allowedTitles = ['Crew', 'Cashier', 'Supervisor', 'Line Leader', 'Assistant Manager']
        setStaffMembers(response.data.filter(staff => 
          staff.role === 'staff' && allowedTitles.includes(staff.title)
        ))
      } else if (user?.role === 'manager' && user?.branch) {
        // Branch Manager sees only staff from their branch
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`, {
          params: { branch: user.branch }
        })
        setStaffMembers(response.data.filter(staff => staff.role === 'staff'))
      } else if (user?.role === 'area_manager' && user?.area) {
        // Area Manager sees all staff from branches in their assigned area
        const assignedBranches = getAreaManagerBranches(user.area)
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`)
        setStaffMembers(response.data.filter(staff => 
          staff.role === 'staff' && assignedBranches.includes(staff.branch)
        ))
      }
    } catch (error) {
      console.error('Failed to fetch staff members:', error)
      setStaffMembers([])
    } finally {
      setLoadingStaff(false)
    }
  }, [user])
  
  // Auto-fetch staff when "Staff" role is selected (for HR, Branch Managers, and Area Managers)
  useEffect(() => {
    const canSelectStaff = (user?.role === 'hr_manager' || user?.role === 'manager' || user?.role === 'area_manager')
    if (canSelectStaff && formData.targetRoles.includes('staff') && staffMembers.length === 0 && !loadingStaff) {
      fetchStaffMembers()
    } else if (canSelectStaff && !formData.targetRoles.includes('staff')) {
      // Clear staff list when "Staff" role is unchecked
      setStaffMembers([])
    }
  }, [formData.targetRoles, user?.role, user?.branch, user?.area, fetchStaffMembers, staffMembers.length, loadingStaff])
  
  const toggleStaff = (staffId) => {
    setFormData(prev => ({
      ...prev,
      targetStaffIds: prev.targetStaffIds.includes(staffId)
        ? prev.targetStaffIds.filter(id => id !== staffId)
        : [...prev.targetStaffIds, staffId]
    }))
  }
  
  const selectAllStaff = () => {
    setFormData(prev => ({
      ...prev,
      targetStaffIds: staffMembers.map(s => s.id)
    }))
  }
  
  const deselectAllStaff = () => {
    setFormData(prev => ({
      ...prev,
      targetStaffIds: []
    }))
  }

  const toggleBranch = (branch) => {
    // Branch managers cannot change their branch selection
    if (user?.role === 'manager') {
      return
    }
    // Area managers can toggle branches, but only from their assigned list
    if (user?.role === 'area_manager') {
      const assignedBranches = getAreaManagerBranches(user.area)
      if (!assignedBranches.includes(branch)) {
        return // Can't select branches outside their assigned area
      }
    }
    setFormData(prev => ({
      ...prev,
      targetBranches: prev.targetBranches.includes(branch)
        ? prev.targetBranches.filter(b => b !== branch)
        : [...prev.targetBranches, branch]
    }))
  }

  // Check if user is a branch manager or area manager
  const isBranchManager = user?.role === 'manager'
  const isAreaManager = user?.role === 'area_manager'

  // Get available branches for the current user
  const getAvailableBranches = () => {
    if (isBranchManager) {
      return user?.branch ? [user.branch] : []
    } else if (isAreaManager && user?.area) {
      return getAreaManagerBranches(user.area)
    }
    return BRANCHES
  }

  const availableBranches = getAvailableBranches()

  // When form opens, auto-set branches for branch managers only
  // Area managers can select which branches they want to target
  useEffect(() => {
    if (showForm && isBranchManager && user?.branch) {
      setFormData(prev => ({
        ...prev,
        targetBranches: [user.branch]
      }))
    } else if (showForm && !isBranchManager && !isAreaManager) {
      // Reset branches for other roles (not branch managers or area managers)
      setFormData(prev => ({
        ...prev,
        targetBranches: []
      }))
    }
    // Area managers: don't auto-select - let them choose which branches to target
  }, [showForm, isBranchManager, isAreaManager, user?.branch])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Check if user can create announcements (not staff)
  const canCreateAnnouncements = user?.role && ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'].includes(user.role)

  // Filter roles: HR, Owner, Area Manager, Operations Manager, and Branch Manager cannot send to themselves
  const getAvailableRoles = () => {
    const restrictedRoles = ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager']
    if (user?.role && restrictedRoles.includes(user.role)) {
      return ROLES.filter(role => role.value !== user.role)
    }
    return ROLES
  }

  const availableRoles = getAvailableRoles()

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Announcements</h2>
            <p className="text-sm text-gray-500">
              {canCreateAnnouncements ? 'Create and manage announcements' : 'View announcements'}
            </p>
          </div>
          {canCreateAnnouncements && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              + New Announcement
            </button>
          )}
        </div>
      </div>

      {/* Announcement Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Create New Announcement</h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setFormData({ title: '', message: '', targetRoles: [], targetBranches: [], targetStaffIds: [] })
                  setStaffMembers([])
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="Enter announcement message"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Roles *</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((role) => (
                    <label key={role.value} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.targetRoles.includes(role.value)}
                        onChange={() => toggleRole(role.value)}
                        className="rounded border-gray-300 text-brand focus:ring-brand"
                      />
                      <span className="text-sm text-gray-700">{role.label}</span>
                    </label>
                  ))}
                </div>
                {user?.role && ['owner', 'hr_manager', 'area_manager', 'operations_manager', 'manager'].includes(user.role) && (
                  <p className="text-xs text-gray-500 mt-2">
                    You cannot send announcements to your own role ({ROLES.find(r => r.value === user.role)?.label || user.role}).
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isBranchManager
                    ? `Target Branch (Your branch: ${user?.branch || 'N/A'})`
                    : isAreaManager
                      ? `Target Branches (Your area: ${user?.area || 'N/A'})`
                      : 'Target Branches (Optional - leave empty for all branches)'}
                </label>
                {isBranchManager ? (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      {user?.branch || 'No branch assigned'}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Branch managers can only send announcements to their own branch staff.
                    </p>
                  </div>
                ) : isAreaManager ? (
                  <div>
                    <p className="text-xs text-gray-600 mb-2">
                      Select which branches from your area ({user?.area || 'N/A'}) to target:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableBranches.map((branch) => (
                        <label key={branch} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={formData.targetBranches.includes(branch)}
                            onChange={() => toggleBranch(branch)}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-gray-700">{branch}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-blue-600 mt-2">
                      You can only select branches from your assigned area.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {BRANCHES.map((branch) => (
                      <label key={branch} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.targetBranches.includes(branch)}
                          onChange={() => toggleBranch(branch)}
                          className="rounded border-gray-300 text-brand focus:ring-brand"
                        />
                        <span className="text-sm text-gray-700">{branch}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Staff Member Selection - For HR, Branch Managers, and Area Managers when "Staff" role is selected */}
              {(user?.role === 'hr_manager' || user?.role === 'manager' || user?.role === 'area_manager') && formData.targetRoles.includes('staff') && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Staff Members (or leave unchecked to send to all staff)
                    </label>
                    {staffMembers.length > 0 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={selectAllStaff}
                          className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Select All
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllStaff}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Clear All
                        </button>
                      </div>
                    )}
                  </div>
                  {loadingStaff ? (
                    <div className="text-sm text-gray-500 py-4">Loading staff members...</div>
                  ) : staffMembers.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4">No staff members found.</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3 space-y-2">
                      {staffMembers.map((staff) => (
                        <label
                          key={staff.id}
                          className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={formData.targetStaffIds.includes(staff.id)}
                            onChange={() => toggleStaff(staff.id)}
                            className="rounded border-gray-300 text-brand focus:ring-brand"
                          />
                          <span className="text-sm text-gray-700">
                            {staff.name} ({staff.employeeCode}) - {staff.title}
                            {(user?.role === 'hr_manager' || user?.role === 'area_manager') && ` - ${staff.branch}`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {formData.targetStaffIds.length === 0
                      ? user?.role === 'hr_manager'
                        ? 'No specific staff selected - announcement will be sent to all staff members (Crew, Cashier, Supervisor, Line Leader, Assistant Manager).'
                        : user?.role === 'area_manager'
                        ? `No specific staff selected - announcement will be sent to all staff members in your area (${user?.area || 'N/A'}).`
                        : `No specific staff selected - announcement will be sent to all staff members in ${user?.branch || 'your branch'}.`
                      : `${formData.targetStaffIds.length} staff member(s) selected.`}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setFormData({ title: '', message: '', targetRoles: [], targetBranches: [], targetStaffIds: [] })
                    setStaffMembers([])
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Launch Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Announcements</h3>
          <p className="text-gray-500">Create your first announcement to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => {
            const targetRoles = JSON.parse(announcement.target_roles || '[]')
            const targetBranches = announcement.target_branches ? JSON.parse(announcement.target_branches) : null
            return (
              <div key={announcement.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{announcement.title}</h3>
                    <p className="text-sm text-gray-500 mb-4">{announcement.message}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-gray-600">Created by: <span className="font-medium">{announcement.created_by_name}</span></span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{formatDate(announcement.created_at)}</span>
                      {announcement.view_count > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-600">{announcement.view_count} views</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="text-xs">
                    <span className="text-gray-600 font-medium">Target Roles:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {targetRoles.map((role) => {
                        const roleInfo = ROLES.find(r => r.value === role)
                        return (
                          <span key={role} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                            {roleInfo?.label || role}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  {targetBranches && (
                    <div className="text-xs">
                      <span className="text-gray-600 font-medium">Target Branches:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {targetBranches.map((branch) => (
                          <span key={branch} className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            {branch}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Announcements