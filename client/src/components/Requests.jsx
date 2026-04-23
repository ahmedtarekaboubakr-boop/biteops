import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Requests({ staff, isHR = false }) {
  const { user } = useAuth()
  const isBranchManager = user?.role === 'manager'
  const isAreaManager = user?.role === 'area_manager'
  const isOperationsManager = user?.role === 'operations_manager'
  const isHRManager = user?.role === 'hr_manager'
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, approved, denied
  const [requestTypeFilter, setRequestTypeFilter] = useState('all') // all, leave, sick_leave, emergency_leave, quit
  const [leaveBalances, setLeaveBalances] = useState({})
  const [showForm, setShowForm] = useState(false)

  // Helper function to determine if current user can approve this request
  const canApproveRequest = (request) => {
    // If already approved or denied, no one can approve
    if (request.status === 'approved' || request.status === 'denied') {
      return false
    }

    // Check which stage we're at
    if (request.area_manager_status === 'pending') {
      return isAreaManager
    } else if (request.area_manager_status === 'approved' && request.operations_manager_status === 'pending') {
      return isOperationsManager
    } else if (request.operations_manager_status === 'approved' && request.hr_status === 'pending') {
      return isHRManager
    }

    return false
  }

  // Helper function to get current stage status
  const getCurrentStageStatus = (request) => {
    if (request.status === 'approved') {
      return { stage: 'Approved', color: 'green' }
    }
    if (request.status === 'denied') {
      return { stage: 'Denied', color: 'red' }
    }
    if (request.area_manager_status === 'pending') {
      return { stage: 'Pending Area Manager', color: 'yellow' }
    }
    if (request.area_manager_status === 'approved' && request.operations_manager_status === 'pending') {
      return { stage: 'Pending Operations Manager', color: 'yellow' }
    }
    if (request.operations_manager_status === 'approved' && request.hr_status === 'pending') {
      return { stage: 'Pending HR', color: 'yellow' }
    }
    return { stage: 'Pending', color: 'yellow' }
  }

  useEffect(() => {
    fetchRequests()
    fetchLeaveBalances()
  }, [filter, requestTypeFilter])

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.status = filter
      if (requestTypeFilter !== 'all') params.requestType = requestTypeFilter

      const response = await axios.get(`${API_URL}/api/leave-requests`, { params })
      setRequests(response.data)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveBalances = async () => {
    try {
      const balances = {}
      for (const staffMember of staff) {
        try {
          const response = await axios.get(`/api/staff/${staffMember.id}/leave-balance`)
          balances[staffMember.id] = response.data
        } catch (error) {
          console.error(`Failed to fetch balance for staff ${staffMember.id}:`, error)
        }
      }
      setLeaveBalances(balances)
    } catch (error) {
      console.error('Failed to fetch leave balances:', error)
    }
  }


  const handleApproveDeny = async (requestId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this request?`)) {
      return
    }

    try {
      await axios.put(`/api/leave-requests/${requestId}`, { status })
      fetchRequests()
      fetchLeaveBalances()
    } catch (error) {
      alert(error.response?.data?.error || `Failed to ${status} request`)
    }
  }

  const handleFormSubmit = async (data) => {
    try {
      await axios.post(`${API_URL}/api/leave-requests`, data)
      setShowForm(false)
      fetchRequests()
      fetchLeaveBalances()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create leave request')
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      denied: 'bg-red-100 text-red-800'
    }
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const getRequestTypeLabel = (type) => {
    const labels = {
      leave: 'Leave',
      sick_leave: 'Sick Leave',
      emergency_leave: 'Emergency Leave',
      quit: 'Quit'
    }
    return labels[type] || type
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const deniedCount = requests.filter(r => r.status === 'denied').length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Leave Requests</h2>
        <div className="flex gap-3">
          {isBranchManager && !isHR && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
            >
              + Create Request
            </button>
          )}
        </div>
      </div>

      {/* Info banners */}
      {isHRManager && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <span className="text-purple-700">📋 As HR Manager, you can approve or deny leave requests that have been approved by Operations Managers</span>
        </div>
      )}
      {isOperationsManager && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-blue-700">📋 As Operations Manager, you can approve or deny leave requests that have been approved by Area Managers</span>
        </div>
      )}
      {isAreaManager && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <span className="text-amber-700">📋 As Area Manager, you can approve or deny leave requests submitted by branch managers</span>
        </div>
      )}
      {isBranchManager && !isHR && !isAreaManager && !isOperationsManager && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <span className="text-green-700">📋 As Branch Manager, you can create leave requests for your staff. Requests go through Area Manager → Operations Manager → HR approval</span>
        </div>
      )}
      {!isBranchManager && !isHR && !isAreaManager && !isOperationsManager && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <span className="text-blue-700">📋 View-only: Branch managers create leave requests for staff. You can view all requests from your branch.</span>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900">{requests.length}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow-sm p-4 border border-yellow-200">
          <div className="text-sm text-yellow-700">Pending</div>
          <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow-sm p-4 border border-green-200">
          <div className="text-sm text-green-700">Approved</div>
          <div className="text-2xl font-bold text-green-800">{approvedCount}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow-sm p-4 border border-red-200">
          <div className="text-sm text-red-700">Denied</div>
          <div className="text-2xl font-bold text-red-800">{deniedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Request Type</label>
            <select
              value={requestTypeFilter}
              onChange={(e) => setRequestTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="leave">Leave</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="emergency_leave">Emergency Leave</option>
              <option value="quit">Quit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Leave Requests</h3>
          <p className="text-gray-500">No leave requests found matching your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    End Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => {
                  const balance = leaveBalances[request.staff_id]
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.staff_name}</div>
                        <div className="text-sm text-gray-500">{request.employee_code}</div>
                        {balance && (
                          <div className="text-xs text-gray-400 mt-1">
                            Balance: {balance.remaining_leave_days}/{balance.total_leave_days} days
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getRequestTypeLabel(request.request_type)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(request.start_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(request.end_date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{request.number_of_days}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {getStatusBadge(request.status)}
                          {request.status === 'pending' && (
                            <div className="mt-1">
                              {(() => {
                                const stageInfo = getCurrentStageStatus(request)
                                const colorClasses = {
                                  yellow: 'bg-yellow-100 text-yellow-800',
                                  green: 'bg-green-100 text-green-800',
                                  red: 'bg-red-100 text-red-800'
                                }
                                return (
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${colorClasses[stageInfo.color]}`}>
                                    {stageInfo.stage}
                                  </span>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {request.reason || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {canApproveRequest(request) && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveDeny(request.id, 'approved')}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveDeny(request.id, 'denied')}
                              className="text-red-600 hover:text-red-900 font-medium"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                        {request.status === 'pending' && !canApproveRequest(request) && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            {(() => {
                              const stageInfo = getCurrentStageStatus(request)
                              return `Awaiting ${stageInfo.stage.replace('Pending ', '')}`
                            })()}
                          </span>
                        )}
                        {request.status !== 'pending' && (
                          <div className="text-xs text-gray-400">
                            {request.hr_manager_name ? `By ${request.hr_manager_name}` : 
                             request.operations_manager_name ? `By ${request.operations_manager_name}` :
                             request.area_manager_name ? `By ${request.area_manager_name}` :
                             request.manager_name ? `By ${request.manager_name}` : '-'}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Request Form Modal - Only for Branch Managers */}
      {showForm && isBranchManager && !isHR && (
        <RequestForm
          staff={staff}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}

// Request Form Component
function RequestForm({ staff, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    staffId: '',
    requestType: 'leave',
    startDate: '',
    endDate: '',
    reason: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.staffId || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    await onSubmit(formData)
    setSubmitting(false)
  }

  // Filter staff to only show staff members (not managers)
  const staffMembers = Array.isArray(staff) ? staff.filter(s => s.role === 'staff' || !s.role) : []

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Create Leave Request</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Staff Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff Member *</label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Select staff member</option>
              {staffMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.employeeCode || 'N/A'})
                </option>
              ))}
            </select>
          </div>

          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Request Type *</label>
            <select
              value={formData.requestType}
              onChange={(e) => setFormData({ ...formData, requestType: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="leave">Leave</option>
              <option value="sick_leave">Sick Leave</option>
              <option value="emergency_leave">Emergency Leave</option>
              <option value="quit">Quit</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
              min={formData.startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Optional reason for leave..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Requests

