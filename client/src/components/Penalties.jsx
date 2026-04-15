import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Penalties({ staff }) {
  const { user } = useAuth()
  const isHR = user?.role === 'hr_manager'
  const [penalties, setPenalties] = useState([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingPenalty, setEditingPenalty] = useState(null)
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    staffId: '',
    penaltyType: '',
    status: ''
  })

  const penaltyTypes = [
    'Warning',
    'Verbal Warning',
    'Written Warning',
    'Deduction',
    'Suspension',
    'Termination',
    'Other'
  ]

  const statusOptions = ['active', 'resolved', 'cancelled']

  useEffect(() => {
    fetchPenalties()
  }, [filters])

  const fetchPenalties = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate
      }
      if (filters.staffId) params.staffId = filters.staffId
      if (filters.penaltyType) params.penaltyType = filters.penaltyType
      if (filters.status) params.status = filters.status

      const response = await axios.get(`${API_URL}/api/penalties`, { params })
      setPenalties(response.data)
    } catch (error) {
      console.error('Failed to fetch penalties:', error)
      alert('Failed to fetch penalties: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePenalty = () => {
    setEditingPenalty(null)
    setShowForm(true)
  }

  const handleEditPenalty = (penalty) => {
    setEditingPenalty(penalty)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPenalty(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      if (editingPenalty) {
        await axios.put(`/api/penalties/${editingPenalty.id}`, formData)
        alert('Penalty updated successfully')
      } else {
        await axios.post(`${API_URL}/api/penalties`, formData)
        alert('Penalty created successfully')
      }
      handleFormClose()
      fetchPenalties()
    } catch (error) {
      alert('Failed to save penalty: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleDeletePenalty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this penalty?')) {
      return
    }

    try {
      await axios.delete(`/api/penalties/${id}`)
      alert('Penalty deleted successfully')
      fetchPenalties()
    } catch (error) {
      alert('Failed to delete penalty: ' + (error.response?.data?.error || error.message))
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'N/A'
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Penalties</h2>
        {!isHR && (
          <button
            onClick={handleCreatePenalty}
            className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
          >
            + Record Penalty
          </button>
        )}
      </div>

      {isHR && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-700 text-sm">
            📋 <strong>View Only:</strong> HR managers can view penalties but cannot create, edit, or delete them. Only branch managers can record penalties.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff</label>
            <select
              value={filters.staffId}
              onChange={(e) => setFilters({ ...filters, staffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">All Staff</option>
              {staff
                .filter(s => s.title !== 'Operations Manager' && s.title !== 'Area Manager')
                .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Type</label>
            <select
              value={filters.penaltyType}
              onChange={(e) => setFilters({ ...filters, penaltyType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">All Types</option>
              {penaltyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">All Status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Penalty Form Modal */}
      {showForm && (
        <PenaltyForm
          penalty={editingPenalty}
          staff={staff}
          penaltyTypes={penaltyTypes}
          statusOptions={statusOptions}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Penalties List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading penalties...</div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Penalty Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Misconduct
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {penalties.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                      No penalties found for the selected filters
                    </td>
                  </tr>
                ) : (
                  penalties.map((penalty) => (
                    <tr key={penalty.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{penalty.staff_name}</div>
                        <div className="text-sm text-gray-500">{penalty.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(penalty.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {penalty.penalty_type}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={penalty.misconduct_description}>
                        {penalty.misconduct_description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                        {penalty.penalty_amount > 0 ? `$${parseFloat(penalty.penalty_amount).toFixed(2)}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            penalty.status === 'active'
                              ? 'bg-red-100 text-red-800'
                              : penalty.status === 'resolved'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {penalty.status.charAt(0).toUpperCase() + penalty.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {penalty.manager_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!isHR && (
                          <>
                            <button
                              onClick={() => handleEditPenalty(penalty)}
                              className="text-brand hover:text-brand-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeletePenalty(penalty.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {isHR && (
                          <span className="text-gray-400 text-xs">View only</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// Penalty Form Component
function PenaltyForm({ penalty, staff, penaltyTypes, statusOptions, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    staffId: penalty?.staff_id || '',
    date: penalty?.date || new Date().toISOString().split('T')[0],
    penaltyType: penalty?.penalty_type || '',
    misconductDescription: penalty?.misconduct_description || '',
    penaltyAmount: penalty?.penalty_amount || 0,
    penaltyDetails: penalty?.penalty_details || '',
    status: penalty?.status || 'active'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.staffId || !formData.date || !formData.penaltyType || !formData.misconductDescription) {
      alert('Please fill in all required fields')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {penalty ? 'Edit Penalty' : 'Record New Penalty'}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Staff Member <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Select Staff</option>
              {staff
                .filter(s => s.title !== 'Operations Manager' && s.title !== 'Area Manager')
                .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.penaltyType}
              onChange={(e) => setFormData({ ...formData, penaltyType: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">Select Penalty Type</option>
              {penaltyTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Misconduct Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.misconductDescription}
              onChange={(e) => setFormData({ ...formData, misconductDescription: e.target.value })}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Describe the misconduct..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Amount (if applicable)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.penaltyAmount}
              onChange={(e) => setFormData({ ...formData, penaltyAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              value={formData.penaltyDetails}
              onChange={(e) => setFormData({ ...formData, penaltyDetails: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Any additional details or notes..."
            />
          </div>

          {penalty && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand"
            >
              {penalty ? 'Update Penalty' : 'Record Penalty'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Penalties

