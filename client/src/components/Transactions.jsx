import { useState, useEffect } from 'react'
import axios from 'axios'

const TRANSACTION_TYPES = [
  { id: 'revenue_cash', label: 'Revenue (Cash)', icon: '💵', color: 'green' },
  { id: 'revenue_card', label: 'Revenue (Card)', icon: '💳', color: 'blue' },
  { id: 'petty_cash', label: 'Petty Cash', icon: '🏦', color: 'amber' },
  { id: 'fine', label: 'Fine', icon: '⚠️', color: 'red' },
  { id: 'deposit', label: 'Deposit', icon: '🏧', color: 'purple' },
  { id: 'void', label: 'Void Transaction', icon: '❌', color: 'gray' },
  { id: 'complimentary', label: 'Officer/Complimentary', icon: '🎁', color: 'pink' }
]

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedType, setSelectedType] = useState('all')
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    fetchTransactions()
  }, [dateRange, selectedType])

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
      if (selectedType !== 'all') {
        params.type = selectedType
      }

      const [transResponse, summaryResponse] = await Promise.all([
        axios.get('/api/transactions', { params }),
        axios.get('/api/transactions/summary', { params: { date: dateRange.startDate } })
      ])

      setTransactions(transResponse.data)
      setSummary(summaryResponse.data)
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = async (data) => {
    try {
      await axios.post('/api/transactions', data)
      setShowForm(false)
      fetchTransactions()
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save transaction')
    }
  }

  const getTypeInfo = (typeId) => {
    return TRANSACTION_TYPES.find(t => t.id === typeId) || { label: typeId, icon: '📋', color: 'gray' }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount)
  }

  const totalRevenue = (summary.revenue_cash || 0) + (summary.revenue_card || 0)
  const totalDeductions = (summary.void || 0) + (summary.complimentary || 0)
  const netRevenue = totalRevenue - totalDeductions

  return (
    <div className="space-y-6">
      {/* Daily Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Cash Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.revenue_cash || 0)}</p>
            </div>
            <span className="text-4xl opacity-80">💵</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Card Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.revenue_card || 0)}</p>
            </div>
            <span className="text-4xl opacity-80">💳</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
            <span className="text-4xl opacity-80">📊</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-brand to-red-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Net Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(netRevenue)}</p>
            </div>
            <span className="text-4xl opacity-80">💰</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏦</span>
            <div>
              <p className="text-xs text-gray-500">Petty Cash</p>
              <p className="font-semibold text-amber-600">{formatCurrency(summary.petty_cash || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-xs text-gray-500">Fines</p>
              <p className="font-semibold text-red-600">{formatCurrency(summary.fine || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏧</span>
            <div>
              <p className="text-xs text-gray-500">Deposits</p>
              <p className="font-semibold text-purple-600">{formatCurrency(summary.deposit || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <div>
              <p className="text-xs text-gray-500">Voids</p>
              <p className="font-semibold text-gray-600">{formatCurrency(summary.void || 0)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <div>
              <p className="text-xs text-gray-500">Complimentary</p>
              <p className="font-semibold text-pink-600">{formatCurrency(summary.complimentary || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">From:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">To:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0]
              setDateRange({ startDate: today, endDate: today })
            }}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            Today
          </button>
          <div className="ml-auto">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              <span>➕</span> Add Transaction
            </button>
          </div>
        </div>
      </div>

      {/* Type Filter */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-brand text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Transactions
          </button>
          {TRANSACTION_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedType === type.id
                  ? 'bg-brand text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Transactions</h3>
            <p className="text-gray-500">Add transactions to track your daily financial activity</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recorded By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((trans) => {
                const typeInfo = getTypeInfo(trans.type)
                const isDeduction = ['void', 'complimentary', 'petty_cash', 'fine'].includes(trans.type)
                return (
                  <tr key={trans.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(trans.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                        <span>{typeInfo.icon}</span>
                        <span>{typeInfo.label}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${isDeduction ? 'text-red-600' : 'text-green-600'}`}>
                        {isDeduction ? '-' : '+'}{formatCurrency(trans.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {trans.reference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {trans.description || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {trans.recorded_by_name}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  )
}

// Transaction Form Component
function TransactionForm({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'revenue_cash',
    amount: '',
    reference: '',
    description: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setSubmitting(true)
    await onSubmit(formData)
    setSubmitting(false)
  }

  const selectedType = TRANSACTION_TYPES.find(t => t.id === formData.type)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">➕ Add Transaction</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.id })}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 text-left transition-all ${
                    formData.type === type.id
                      ? 'border-brand bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (EGP) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">EGP</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                min="0.01"
                step="0.01"
                className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Order # 
              {(formData.type === 'void' || formData.type === 'complimentary') && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              required={formData.type === 'void' || formData.type === 'complimentary'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="e.g., ORD-12345"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Notes</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Add details about this transaction..."
            />
          </div>

          {/* Info Box for specific types */}
          {formData.type === 'void' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ❌ <strong>Void:</strong> Record cancelled/refunded orders. Include the original order reference.
              </p>
            </div>
          )}
          {formData.type === 'complimentary' && (
            <div className="p-3 bg-pink-50 border border-pink-200 rounded-lg">
              <p className="text-sm text-pink-700">
                🎁 <strong>Complimentary:</strong> Record discounted or free orders (officer meals, promotions, etc.)
              </p>
            </div>
          )}
          {formData.type === 'petty_cash' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                🏦 <strong>Petty Cash:</strong> Record small cash expenses (supplies, emergency purchases, etc.)
              </p>
            </div>
          )}

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
              {submitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Transactions

