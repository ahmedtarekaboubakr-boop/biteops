import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { id: 'proteins', label: 'Proteins', icon: '🥩' },
  { id: 'vegetables', label: 'Vegetables', icon: '🥬' },
  { id: 'sauces', label: 'Sauces', icon: '🧴' },
  { id: 'frozen', label: 'Frozen Items', icon: '🧊' },
  { id: 'drinks', label: 'Drinks', icon: '🥤' },
  { id: 'packaging', label: 'Packaging', icon: '📦' },
  { id: 'other', label: 'Other', icon: '📋' }
]

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

function Inventory() {
  const { user } = useAuth()
  const [activeSection, setActiveSection] = useState('transfers')
  const [inventory, setInventory] = useState([])
  const [transfers, setTransfers] = useState([])
  const [incomingTransfers, setIncomingTransfers] = useState([])
  const [waste, setWaste] = useState([])
  const [spotChecks, setSpotChecks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchData()
  }, [activeSection, selectedDate])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeSection === 'transfers') {
        const [outgoing, incoming] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/transfers`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/transfers/incoming`)
        ])
        setTransfers(outgoing.data)
        setIncomingTransfers(incoming.data)
      } else if (activeSection === 'waste') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory/waste`)
        setWaste(response.data)
      } else if (activeSection === 'spot-check') {
        const response = await axios.get(`/api/inventory/spot-check?date=${selectedDate}`)
        setSpotChecks(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const sections = [
    { id: 'transfers', label: 'Transfers', icon: '🔄', color: 'purple', badge: incomingTransfers.filter(t => t.status === 'pending').length },
    { id: 'waste', label: 'Waste & Disposals', icon: '🗑️', color: 'red' },
    { id: 'spot-check', label: 'Spot Check', icon: '✅', color: 'green' }
  ]

  const openForm = async (type) => {
    // Fetch inventory if needed for the form
    if (type === 'transfer' || type === 'waste' || type === 'dispose' || type === 'receive') {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/inventory`)
        setInventory(response.data)
      } catch (error) {
        console.error('Failed to fetch inventory:', error)
      }
    }
    setFormType(type)
    setShowForm(true)
  }

  const handleFormSubmit = async (data) => {
    try {
      if (formType === 'receive') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory/receive`, data)
      } else if (formType === 'add') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory`, data)
      } else if (formType === 'transfer') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory/transfer`, data)
      } else if (formType === 'waste' || formType === 'dispose') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory/waste`, { ...data, type: formType })
      }
      setShowForm(false)
      fetchData()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save')
    }
  }

  const handleTransferResponse = async (transferId, accepted) => {
    try {
      await axios.put(`/api/inventory/transfers/${transferId}/respond`, { accepted })
      fetchData()
      alert(accepted ? 'Transfer received and added to inventory!' : 'Transfer marked as not received')
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update transfer')
    }
  }

  const pendingIncoming = incomingTransfers.filter(t => t.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="bg-white rounded-xl shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeSection === section.id
                  ? 'bg-brand text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
              {section.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                  {section.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Transfers Section */}
      {activeSection === 'transfers' && (
        <div className="space-y-6">
          {/* Incoming Transfers Alert */}
          {pendingIncoming.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">📥</span>
                <h3 className="font-semibold text-amber-800">
                  Incoming Transfers ({pendingIncoming.length})
                </h3>
              </div>
              <div className="space-y-3">
                {pendingIncoming.map((transfer) => (
                  <div key={transfer.id} className="bg-white rounded-lg p-4 border border-amber-200 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transfer.item_name} - <span className="text-amber-600">{transfer.quantity} {transfer.unit}</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        From: <span className="font-medium">{transfer.from_branch}</span> • 
                        {new Date(transfer.date).toLocaleDateString()}
                      </p>
                      {transfer.notes && <p className="text-sm text-gray-400 mt-1">{transfer.notes}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTransferResponse(transfer.id, true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                      >
                        ✓ Received
                      </button>
                      <button
                        onClick={() => handleTransferResponse(transfer.id, false)}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
                      >
                        ✗ Not Received
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outgoing Transfers */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openForm('transfer')}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
            >
              <span>🔄</span> New Transfer Out
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">📤 Outgoing Transfers</h3>
            </div>
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading transfers...</div>
            ) : transfers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🔄</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Outgoing Transfers</h3>
                <p className="text-gray-500">Transfer inventory to other branches when needed</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(transfer.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{transfer.item_name}</td>
                      <td className="px-6 py-4 text-gray-900">{transfer.quantity} {transfer.unit}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                          {transfer.to_branch}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transfer.status === 'received' 
                            ? 'bg-green-100 text-green-700'
                            : transfer.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : transfer.status === 'not_received'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                        }`}>
                          {transfer.status === 'received' ? '✓ Received' : 
                           transfer.status === 'pending' ? '⏳ Pending' : 
                           transfer.status === 'not_received' ? '✗ Not Received' : transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{transfer.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Received Transfers History */}
          {incomingTransfers.filter(t => t.status !== 'pending').length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">📥 Received Transfers History</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {incomingTransfers.filter(t => t.status !== 'pending').map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(transfer.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{transfer.item_name}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">+{transfer.quantity} {transfer.unit}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {transfer.from_branch}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          transfer.status === 'received' 
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transfer.status === 'received' ? '✓ Received' : '✗ Not Received'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Waste & Disposals Section */}
      {activeSection === 'waste' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => openForm('waste')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors"
            >
              <span>⚠️</span> Record Waste
            </button>
            <button
              onClick={() => openForm('dispose')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              <span>🗑️</span> Record Disposal
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-500">Loading waste records...</div>
            ) : waste.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Waste Records</h3>
                <p className="text-gray-500">Track waste and disposals for inventory accuracy</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waste.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{record.item_name}</td>
                      <td className="px-6 py-4 text-red-600 font-medium">-{record.quantity} {record.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          record.type === 'waste' 
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {record.type === 'waste' ? '⚠️ Waste' : '🗑️ Disposal'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.reason || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{record.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Spot Check Section */}
      {activeSection === 'spot-check' && (
        <div className="space-y-4">
          {/* Date Selector */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
              />
            </div>
          </div>

          {/* Start of Day and End of Day Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Start of Day */}
            <SpotCheckForm
              checkType="start_of_day"
              date={selectedDate}
              spotChecks={spotChecks}
              onSave={fetchData}
            />

            {/* End of Day */}
            <SpotCheckForm
              checkType="end_of_day"
              date={selectedDate}
              spotChecks={spotChecks}
              onSave={fetchData}
            />
          </div>

          {/* History Table */}
          {spotChecks.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-900">📋 Spot Check History</h3>
              </div>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {spotChecks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          check.check_type === 'start_of_day'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {check.check_type === 'start_of_day' ? '🌅 Start' : '🌙 End'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          check.category === 'proteins'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {check.category === 'proteins' ? '🥩 Proteins' : '🥤 Beverages'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{check.item_name}</td>
                      <td className="px-6 py-4 text-gray-900">{check.quantity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{check.unit}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{check.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <InventoryForm
          type={formType}
          inventory={inventory}
          currentBranch={user?.branch}
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}

// Inventory Form Component
function InventoryForm({ type, inventory, currentBranch, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    category: 'proteins',
    quantity: '',
    unit: 'kg',
    minLevel: 10,
    toBranch: '',
    reason: '',
    notes: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const getFormTitle = () => {
    switch (type) {
      case 'receive': return '📥 Receive Stock'
      case 'add': return '➕ Add New Item'
      case 'transfer': return '🔄 Transfer Out'
      case 'waste': return '⚠️ Record Waste'
      case 'dispose': return '🗑️ Record Disposal'
      default: return 'Inventory'
    }
  }

  // Filter out current branch from transfer destinations
  const availableBranches = BRANCHES.filter(branch => branch !== currentBranch)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{getFormTitle()}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* For Add New Item */}
          {type === 'add' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  value={formData.itemName}
                  onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  placeholder="e.g., Beef Patties"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Quantity *</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                  >
                    <option value="kg">kg</option>
                    <option value="g">grams</option>
                    <option value="pcs">pieces</option>
                    <option value="boxes">boxes</option>
                    <option value="bottles">bottles</option>
                    <option value="liters">liters</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Level</label>
                <input
                  type="number"
                  value={formData.minLevel}
                  onChange={(e) => setFormData({ ...formData, minLevel: e.target.value })}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </>
          )}

          {/* For Receive, Transfer, Waste, Dispose */}
          {(type === 'receive' || type === 'transfer' || type === 'waste' || type === 'dispose') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Item *</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => setFormData({ ...formData, itemId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                >
                  <option value="">Select an item</option>
                  {inventory.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} (Current: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                />
              </div>
            </>
          )}

          {/* Transfer-specific: Target Branch */}
          {type === 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Transfer To Branch *</label>
              <select
                value={formData.toBranch}
                onChange={(e) => setFormData({ ...formData, toBranch: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">Select branch</option>
                {availableBranches.map((branch) => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Transferring from: <span className="font-medium">{currentBranch}</span>
              </p>
            </div>
          )}

          {/* Waste/Dispose-specific: Reason */}
          {(type === 'waste' || type === 'dispose') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              >
                <option value="">Select reason</option>
                <option value="expired">Expired</option>
                <option value="spoiled">Spoiled</option>
                <option value="damaged">Damaged</option>
                <option value="quality_issue">Quality Issue</option>
                <option value="contaminated">Contaminated</option>
                <option value="overcooked">Overcooked/Burnt</option>
                <option value="dropped">Dropped</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Additional notes..."
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
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Spot Check Form Component
function SpotCheckForm({ checkType, date, spotChecks, onSave }) {
  const [formData, setFormData] = useState({
    category: 'proteins',
    itemName: '',
    quantity: '',
    unit: 'kg',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const proteins = [
    { name: 'Beef', unit: 'kg' },
    { name: 'Chicken', unit: 'kg' },
    { name: 'Tenders', unit: 'kg' },
    { name: 'Pops', unit: 'kg' },
    { name: 'Wings', unit: 'kg' },
    { name: 'Shrimp', unit: 'kg' }
  ]

  const beverages = [
    { name: 'Coca Cola', unit: 'bottles' },
    { name: 'Pepsi', unit: 'bottles' },
    { name: 'Sprite', unit: 'bottles' },
    { name: 'Fanta', unit: 'bottles' },
    { name: 'Water', unit: 'bottles' },
    { name: 'Juice', unit: 'bottles' }
  ]

  const items = formData.category === 'proteins' ? proteins : beverages

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.itemName || !formData.quantity) {
      alert('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/inventory/spot-check`, {
        date,
        checkType,
        category: formData.category,
        itemName: formData.itemName,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        notes: formData.notes
      })
      setFormData({
        category: 'proteins',
        itemName: '',
        quantity: '',
        unit: formData.category === 'proteins' ? 'kg' : 'bottles',
        notes: ''
      })
      onSave()
      alert('Spot check saved successfully!')
    } catch (error) {
      console.error('Failed to save spot check:', error)
      alert(error.response?.data?.error || 'Failed to save spot check')
    } finally {
      setSubmitting(false)
    }
  }

  const existingChecks = spotChecks.filter(
    check => check.check_type === checkType && check.date === date
  )

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          {checkType === 'start_of_day' ? '🌅 Start of Day' : '🌙 End of Day'}
        </h3>
        <p className="text-sm text-gray-500">Record {checkType === 'start_of_day' ? 'opening' : 'closing'} inventory</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, category: 'proteins', itemName: '', unit: 'kg' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                formData.category === 'proteins'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🥩 Proteins
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, category: 'beverages', itemName: '', unit: 'bottles' })}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                formData.category === 'beverages'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🥤 Beverages
            </button>
          </div>
        </div>

        {/* Item Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Item *</label>
          <select
            value={formData.itemName}
            onChange={(e) => {
              const selected = items.find(item => item.name === e.target.value)
              setFormData({
                ...formData,
                itemName: e.target.value,
                unit: selected?.unit || formData.unit
              })
            }}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
          >
            <option value="">Select item</option>
            {items.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity and Unit */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
            <input
              type="text"
              value={formData.unit}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            placeholder="Optional notes..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </form>

      {/* Existing Checks for this type */}
      {existingChecks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Recorded Items ({existingChecks.length})
          </h4>
          <div className="space-y-2">
            {existingChecks.map((check) => (
              <div key={check.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{check.item_name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({check.category === 'proteins' ? '🥩' : '🥤'} {check.category})
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {check.quantity} {check.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Inventory
