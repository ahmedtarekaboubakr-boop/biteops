import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { value: 'machinery', label: 'Machinery', icon: '⚙️' },
  { value: 'cleaning_supplies', label: 'Cleaning Supplies', icon: '🧹' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'supplies', label: 'Supplies', icon: '📦' },
  { value: 'furniture', label: 'Furniture', icon: '🪑' }
]

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'green' },
  { value: 'needs_repair', label: 'Needs Repair', color: 'yellow' },
  { value: 'out_of_order', label: 'Out of Order', color: 'red' },
  { value: 'disposed', label: 'Disposed', color: 'gray' }
]

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

function Maintenance() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'
  const isOperationsManager = user?.role === 'operations_manager'
  const canViewAllBranches = isOwner || isOperationsManager
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeCategory, setActiveCategory] = useState('machinery')
  const [selectedBranch, setSelectedBranch] = useState((isOwner || isOperationsManager) ? 'all' : null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    category: 'machinery',
    description: '',
    quantity: 1,
    status: 'active',
    notes: '',
    branch: ''
  })

  useEffect(() => {
    fetchItems()
  }, [user, selectedBranch, canViewAllBranches])

  const fetchItems = async () => {
    try {
      setLoading(true)
      const url = canViewAllBranches && selectedBranch !== 'all' 
        ? `/api/maintenance?branch=${selectedBranch}`
        : '/api/maintenance'
      const response = await axios.get(url)
      setItems(response.data)
    } catch (err) {
      console.error('Failed to fetch maintenance items:', err)
      setError('Failed to load maintenance items')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!isOwner && !formData.branch && !user.branch) {
      setError('Branch is required')
      return
    }

    try {
      const branch = isOwner ? formData.branch : user.branch
      if (editingItem) {
        await axios.put(`/api/maintenance/${editingItem.id}`, {
          ...formData,
          branch: branch
        })
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance', {
          ...formData,
          branch: branch
        })
      }
      
      await fetchItems()
      setShowForm(false)
      setEditingItem(null)
      resetForm()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save maintenance item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      description: item.description || '',
      quantity: item.quantity,
      status: item.status,
      notes: item.notes || '',
      branch: item.branch || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      await axios.delete(`/api/maintenance/${id}`)
      await fetchItems()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete maintenance item')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'machinery',
      description: '',
      quantity: 1,
      status: 'active',
      notes: '',
      branch: isOwner ? '' : (user.branch || '')
    })
    setEditingItem(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    resetForm()
  }

  const filteredItems = items.filter(item => {
    const categoryMatch = item.category === activeCategory
    if (canViewAllBranches && selectedBranch !== 'all') {
      return categoryMatch && item.branch === selectedBranch
    }
    return categoryMatch
  })

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status)
    const colorClasses = {
      green: 'bg-green-100 text-green-800 border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      red: 'bg-red-100 text-red-800 border-red-300',
      gray: 'bg-gray-100 text-gray-800 border-gray-300'
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colorClasses[statusOption?.color || 'gray']}`}>
        {statusOption?.label || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Maintenance</h2>
            <p className="text-sm text-gray-500 mt-1">
              {canViewAllBranches ? 'View maintenance items across all branches' : 'View maintenance items for your branch'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canViewAllBranches && (
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="all">All Branches</option>
                {BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            )}
            {!showForm && isOwner && (
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                + Add Item
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="Item name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.icon} {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {isOwner && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Branch <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    >
                      <option value="">Select branch</option>
                      {BRANCHES.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Item description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Additional notes"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto">
          {CATEGORIES.map(category => (
            <button
              key={category.value}
              onClick={() => setActiveCategory(category.value)}
              className={`px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                activeCategory === category.value
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {items.filter(item => item.category === category.value).length}
              </span>
            </button>
          ))}
        </div>

        {/* Items Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
            <p className="mt-4 text-gray-500">Loading maintenance items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No items in this category yet.</p>
            {isOwner && (
              <button
                onClick={() => {
                  setFormData({ ...formData, category: activeCategory })
                  setShowForm(true)
                }}
                className="mt-4 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
              >
                Add First Item
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {canViewAllBranches && (
                        <div className="text-xs text-gray-500 mt-1">{item.branch}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.description || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {item.notes || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-brand hover:text-brand-600 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {!isOwner && (
                        <span className="text-gray-400 text-xs">View Only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Maintenance

