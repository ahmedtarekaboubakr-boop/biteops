import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'

function BranchManagement() {
  const [branches, setBranches] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [showAssignStaff, setShowAssignStaff] = useState(false)
  const [availableStaff, setAvailableStaff] = useState([])
  const [selectedStaffIds, setSelectedStaffIds] = useState([])
  const [error, setError] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')

  useEffect(() => {
    fetchBranches()
    fetchAllStaff()
  }, [])

  const fetchBranches = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/branches`)
      setBranches(response.data)
    } catch (error) {
      console.error('Failed to fetch branches:', error)
      setError('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  const fetchAllStaff = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/staff`)
      setStaff(response.data)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    }
  }

  const fetchBranchDetails = async (branchId) => {
    try {
      const response = await axios.get(`/api/branches/${branchId}`)
      setSelectedBranch(response.data)
    } catch (error) {
      console.error('Failed to fetch branch details:', error)
    }
  }

  const handleCreateBranch = () => {
    setEditingBranch(null)
    setShowForm(true)
  }

  const handleEditBranch = (branch) => {
    setEditingBranch(branch)
    setShowForm(true)
  }

  const handleDeleteBranch = async (branchId, branchName) => {
    if (!window.confirm(`Are you sure you want to delete branch "${branchName}"? This action cannot be undone.`)) {
      return
    }

    try {
      await axios.delete(`/api/branches/${branchId}`)
      fetchBranches()
      if (selectedBranch && selectedBranch.id === branchId) {
        setSelectedBranch(null)
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to delete branch')
    }
  }

  const handleAssignStaff = async (branchId) => {
    try {
      const response = await axios.get(`/api/branches/${branchId}/available-staff`)
      setAvailableStaff(response.data)
      setSelectedStaffIds([])
      setShowAssignStaff(true)
    } catch (error) {
      console.error('Failed to fetch available staff:', error)
      alert('Failed to load staff list')
    }
  }

  const handleSaveStaffAssignment = async () => {
    if (!selectedBranch) return

    try {
      await axios.put(`/api/branches/${selectedBranch.id}/assign-staff`, {
        staffIds: selectedStaffIds
      })
      fetchBranchDetails(selectedBranch.id)
      setShowAssignStaff(false)
      setSelectedStaffIds([])
      alert('Staff assigned successfully')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign staff')
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingBranch(null)
  }

  const handleFormSuccess = () => {
    fetchBranches()
    handleFormClose()
  }

  const handleInitializeBranches = async () => {
    if (!window.confirm('This will create the 5 existing branches (Mivida, Leven, Sodic Villete, Arkan, Palm Hills) if they don\'t already exist. Continue?')) {
      return
    }

    try {
      const response = await axios.post(`${API_URL}/api/branches/initialize`)
      alert(`Branches initialized successfully!\nCreated: ${response.data.created.join(', ') || 'None'}\nSkipped (already exist): ${response.data.skipped.join(', ') || 'None'}`)
      fetchBranches()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to initialize branches')
    }
  }

  // Get area for a branch
  const getBranchArea = (branchName) => {
    const fifthSettlementBranches = ['Mivida', 'Leven', 'Sodic Villete']
    const sixthOctoberBranches = ['Arkan', 'Palm Hills']
    
    if (fifthSettlementBranches.includes(branchName)) {
      return 'Fifth Settlement'
    } else if (sixthOctoberBranches.includes(branchName)) {
      return '6th of October'
    }
    return null
  }

  // Filter branches by selected area
  const filteredBranches = branches.filter(branch => {
    if (selectedArea === 'all') return true
    // Use area from database if available, otherwise calculate it
    const branchArea = branch.area || getBranchArea(branch.name)
    return branchArea === selectedArea
  })

  if (loading) {
    return <div className="text-center py-8">Loading branches...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Branch Management</h2>
        <div className="flex gap-3">
          {branches.length === 0 && (
            <button
              onClick={handleInitializeBranches}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Initialize Existing Branches
            </button>
          )}
          <button
            onClick={handleCreateBranch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add New Branch
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Area Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Area:</label>
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Areas</option>
            <option value="Fifth Settlement">Fifth Settlement</option>
            <option value="6th of October">6th of October</option>
          </select>
          {selectedArea !== 'all' && (
            <span className="text-sm text-gray-500">
              Showing {filteredBranches.length} branch(es) in {selectedArea}
            </span>
          )}
        </div>
      </div>

      {/* Branches List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Area
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Manager
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Staff Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {branch.area || getBranchArea(branch.name) || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{branch.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{branch.manager_name || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{branch.staff_count || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => {
                        setSelectedBranch(branch)
                        fetchBranchDetails(branch.id)
                      }}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </button>
                    <button
                      onClick={() => handleEditBranch(branch)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBranch(branch.id, branch.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Branch Details Modal */}
      {selectedBranch && !showAssignStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedBranch.name} - Staff Members
                </h3>
                <button
                  onClick={() => {
                    setSelectedBranch(null)
                    setShowAssignStaff(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <button
                  onClick={() => handleAssignStaff(selectedBranch.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  + Assign Staff to Branch
                </button>
              </div>

              {Array.isArray(selectedBranch.staff) && selectedBranch.staff.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Employee Code
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedBranch.staff.map((member) => (
                        <tr key={member.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.employee_code || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.title || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {member.role || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No staff assigned to this branch yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Assign Staff Modal */}
      {showAssignStaff && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">
                  Assign Staff to {selectedBranch.name}
                </h3>
                <button
                  onClick={() => {
                    setShowAssignStaff(false)
                    setSelectedStaffIds([])
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Select staff members to assign to this branch. You can select multiple staff members.
                </p>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {availableStaff.map((member) => (
                    <label
                      key={member.id}
                      className="flex items-center px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStaffIds.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStaffIds([...selectedStaffIds, member.id])
                          } else {
                            setSelectedStaffIds(selectedStaffIds.filter(id => id !== member.id))
                          }
                        }}
                        className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-500">
                          {member.employee_code && `Code: ${member.employee_code} • `}
                          {member.title && `${member.title} • `}
                          Current Branch: {member.branch || 'Unassigned'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssignStaff(false)
                    setSelectedStaffIds([])
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStaffAssignment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Assign Selected Staff ({selectedStaffIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Branch Form Modal */}
      {showForm && (
        <BranchForm
          branch={editingBranch}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  )
}

function BranchForm({ branch, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    managerId: '',
    area: ''
  })
  const [managers, setManagers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchManagers()
    if (branch) {
      setFormData({
        name: branch.name || '',
        phone: branch.phone || '',
        managerId: branch.manager_id || '',
        area: branch.area || ''
      })
    }
  }, [branch])

  const fetchManagers = async () => {
    try {
      // Fetch branch managers specifically (users with role 'manager' and title 'Branch Manager')
      const response = await axios.get(`${API_URL}/api/branch-managers`)
      setManagers(response.data)
    } catch (error) {
      console.error('Failed to fetch branch managers:', error)
      // Fallback: try to get from staff endpoint
      try {
        const staffResponse = await axios.get(`${API_URL}/api/staff`)
        setManagers(staffResponse.data.filter(m => m.role === 'manager' && m.title === 'Branch Manager'))
      } catch (fallbackError) {
        console.error('Failed to fetch managers from staff endpoint:', fallbackError)
      }
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (branch) {
        await axios.put(`/api/branches/${branch.id}`, formData)
      } else {
        await axios.post(`${API_URL}/api/branches`, formData)
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save branch')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {branch ? 'Edit Branch' : 'Create New Branch'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter branch name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Area *
            </label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an area</option>
              <option value="Fifth Settlement">Fifth Settlement</option>
              <option value="6th of October">6th of October</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Manager
            </label>
            <select
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a manager (optional)</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.name} {manager.branch ? `(Current: ${manager.branch})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : branch ? 'Update Branch' : 'Create Branch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BranchManagement

