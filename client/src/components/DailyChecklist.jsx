import { useState, useEffect } from 'react'
import axios from 'axios'

const MORNING_CHECKLIST = [
  // Cleaning
  { id: 'open_clean_floor', label: 'Cleaning: Floor', category: 'Cleaning' },
  { id: 'open_clean_counter', label: 'Cleaning: Counter Top', category: 'Cleaning' },
  { id: 'open_clean_grill', label: 'Cleaning: Grill', category: 'Cleaning' },
  { id: 'open_clean_fryers', label: 'Cleaning: Fryers', category: 'Cleaning' },
  { id: 'open_clean_freezers', label: 'Cleaning: Freezers', category: 'Cleaning' },
  { id: 'open_clean_fridges', label: 'Cleaning: Fridges', category: 'Cleaning' },
  { id: 'open_clean_shelves', label: 'Cleaning: Shelves', category: 'Cleaning' },
  { id: 'open_clean_cashier', label: 'Cleaning: Cashier Area', category: 'Cleaning' },
  { id: 'open_clean_sink', label: 'Cleaning: Sink', category: 'Cleaning' },
  // Safety Check
  { id: 'open_safety_machinery', label: 'Safety Check: Machinery', category: 'Safety Check' },
  { id: 'open_safety_grill', label: 'Safety Check: Grill', category: 'Safety Check' },
  { id: 'open_safety_fryers', label: 'Safety Check: Fryers', category: 'Safety Check' },
  { id: 'open_safety_bainmarie', label: 'Safety Check: Bain Marie', category: 'Safety Check' },
  { id: 'open_safety_ipad', label: 'Safety Check: Switch Off iPad', category: 'Safety Check' },
  { id: 'open_safety_internet', label: 'Safety Check: Check Internet', category: 'Safety Check' },
  { id: 'open_safety_printers', label: 'Safety Check: Switch Off Printers', category: 'Safety Check' },
  // Check Temperature
  { id: 'temp_oil', label: 'Check Temperature: Oil', category: 'Check Temperature' },
  { id: 'temp_grill', label: 'Check Temperature: Grill', category: 'Check Temperature' },
  { id: 'temp_undercounter', label: 'Check Temperature: Under Counter Fridges', category: 'Check Temperature' },
  { id: 'temp_drinks', label: 'Check Temperature: Drinks Fridge', category: 'Check Temperature' },
  { id: 'temp_freezers', label: 'Check Temperature: Freezers', category: 'Check Temperature' },
  // Items in Freezers
  { id: 'freezer_shrimp', label: 'Items in Freezers: Shrimp', category: 'Items in Freezers' },
  { id: 'freezer_pops', label: 'Items in Freezers: Pops', category: 'Items in Freezers' },
  { id: 'freezer_tenders', label: 'Items in Freezers: Tenders', category: 'Items in Freezers' },
  { id: 'freezer_wings', label: 'Items in Freezers: Wings', category: 'Items in Freezers' },
  { id: 'freezer_chicken', label: 'Items in Freezers: Chicken', category: 'Items in Freezers' },
  { id: 'freezer_onionrings', label: 'Items in Freezers: Onion Rings', category: 'Items in Freezers' },
  { id: 'freezer_mozzsticks', label: 'Items in Freezers: Mozzarella Sticks', category: 'Items in Freezers' },
  { id: 'freezer_fries', label: 'Items in Freezers: Fries', category: 'Items in Freezers' },
  { id: 'freezer_sweetfries', label: 'Items in Freezers: Sweet Potato Fries', category: 'Items in Freezers' },
  // Items in Under Counter Fridge
  { id: 'fridge_beef', label: 'Items in Under Counter Fridge: Beef Trays', category: 'Items in Under Counter Fridge' },
  { id: 'fridge_cheese', label: 'Items in Under Counter Fridge: Cheese Tray', category: 'Items in Under Counter Fridge' },
  { id: 'fridge_philly', label: 'Items in Under Counter Fridge: Philly Steak', category: 'Items in Under Counter Fridge' },
  { id: 'fridge_hotdog', label: 'Items in Under Counter Fridge: Hotdog', category: 'Items in Under Counter Fridge' },
  { id: 'fridge_bacon', label: 'Items in Under Counter Fridge: Bacon', category: 'Items in Under Counter Fridge' },
  // Vegetables
  { id: 'veg_lettuce', label: 'Vegetables: Lettuce', category: 'Vegetables' },
  { id: 'veg_tomato', label: 'Vegetables: Tomato', category: 'Vegetables' },
  { id: 'veg_onion', label: 'Vegetables: Onion', category: 'Vegetables' },
  { id: 'veg_rocket', label: 'Vegetables: Rocket Leaves', category: 'Vegetables' },
  { id: 'veg_batavia', label: 'Vegetables: Batavia', category: 'Vegetables' },
  { id: 'veg_kabucha', label: 'Vegetables: Kabucha', category: 'Vegetables' },
  { id: 'veg_mushroom', label: 'Vegetables: Mushroom', category: 'Vegetables' },
  { id: 'veg_relish', label: 'Vegetables: Relish', category: 'Vegetables' },
  { id: 'veg_pickles', label: 'Vegetables: Pickles', category: 'Vegetables' },
  { id: 'veg_jalapeno', label: 'Vegetables: Jalapeno', category: 'Vegetables' },
  { id: 'veg_caramelized', label: 'Vegetables: Caramelized Onion', category: 'Vegetables' },
  { id: 'veg_bolognese', label: 'Vegetables: Bolognese', category: 'Vegetables' },
  // Sauces
  { id: 'sauce_jjs', label: 'Sauces: JJ\'s', category: 'Sauces' },
  { id: 'sauce_buffalo', label: 'Sauces: Buffalo', category: 'Sauces' },
  { id: 'sauce_caesar', label: 'Sauces: Caesar', category: 'Sauces' },
  { id: 'sauce_shroom', label: 'Sauces: Shroom', category: 'Sauces' },
  { id: 'sauce_smokey', label: 'Sauces: Smokey', category: 'Sauces' },
  { id: 'sauce_dynamite', label: 'Sauces: Dynamite', category: 'Sauces' },
  { id: 'sauce_sriracha', label: 'Sauces: Sriracha Mayo', category: 'Sauces' },
  { id: 'sauce_truffle', label: 'Sauces: Truffle Mayo', category: 'Sauces' },
  { id: 'sauce_bbq', label: 'Sauces: BBQ', category: 'Sauces' },
  { id: 'sauce_spicybbq', label: 'Sauces: Spicy BBQ', category: 'Sauces' },
  { id: 'sauce_ranch', label: 'Sauces: Ranch', category: 'Sauces' },
  { id: 'sauce_ketchup', label: 'Sauces: Ketchup', category: 'Sauces' },
  { id: 'sauce_mustard', label: 'Sauces: Mustard', category: 'Sauces' },
  { id: 'sauce_doritos', label: 'Sauces: Doritos', category: 'Sauces' },
  { id: 'sauce_bluecheese', label: 'Sauces: Blue Cheese', category: 'Sauces' },
  { id: 'sauce_cheesepump', label: 'Sauces: Cheese Pump', category: 'Sauces' }
]

const NIGHT_CHECKLIST = [
  // Cleaning
  { id: 'clean_floor', label: 'Cleaning: Floor', category: 'Cleaning' },
  { id: 'clean_counter', label: 'Cleaning: Counter Top', category: 'Cleaning' },
  { id: 'clean_grill', label: 'Cleaning: Grill', category: 'Cleaning' },
  { id: 'clean_fryers', label: 'Cleaning: Fryers', category: 'Cleaning' },
  { id: 'clean_freezers', label: 'Cleaning: Freezers', category: 'Cleaning' },
  { id: 'clean_fridges', label: 'Cleaning: Fridges', category: 'Cleaning' },
  { id: 'clean_shelves', label: 'Cleaning: Shelves', category: 'Cleaning' },
  { id: 'clean_cashier', label: 'Cleaning: Cashier Area', category: 'Cleaning' },
  { id: 'clean_sink', label: 'Cleaning: Sink', category: 'Cleaning' },
  // Safety Check
  { id: 'safety_machinery', label: 'Safety Check: Machinery', category: 'Safety Check' },
  { id: 'safety_grill', label: 'Safety Check: Grill', category: 'Safety Check' },
  { id: 'safety_fryers', label: 'Safety Check: Fryers', category: 'Safety Check' },
  { id: 'safety_bainmarie', label: 'Safety Check: Bain Marie', category: 'Safety Check' },
  { id: 'safety_ipad', label: 'Safety Check: Switch Off iPad', category: 'Safety Check' },
  { id: 'safety_internet', label: 'Safety Check: Check Internet', category: 'Safety Check' },
  { id: 'safety_printers', label: 'Safety Check: Switch Off Printers', category: 'Safety Check' },
  // Defrost
  { id: 'defrost_beef', label: 'Defrost: Beef', category: 'Defrost' },
  { id: 'defrost_chicken', label: 'Defrost: Chicken', category: 'Defrost' },
  { id: 'defrost_tenders', label: 'Defrost: Tenders', category: 'Defrost' },
  { id: 'defrost_pops', label: 'Defrost: Pops', category: 'Defrost' },
  { id: 'defrost_wings', label: 'Defrost: Wings', category: 'Defrost' },
  { id: 'defrost_shrimp', label: 'Defrost: Shrimp', category: 'Defrost' },
  // Outdoor Check
  { id: 'outdoor_tables', label: 'Outdoor Check: Tables', category: 'Outdoor Check' },
  { id: 'outdoor_umbrellas', label: 'Outdoor Check: Umbrellas', category: 'Outdoor Check' },
  { id: 'outdoor_chairs', label: 'Outdoor Check: Chairs', category: 'Outdoor Check' },
  { id: 'outdoor_lights', label: 'Outdoor Check: Lights of Container', category: 'Outdoor Check' }
]

function DailyChecklist() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [activeShift, setActiveShift] = useState('morning')
  const [morningChecklist, setMorningChecklist] = useState({})
  const [nightChecklist, setNightChecklist] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isViewingPast = selectedDate < today

  useEffect(() => {
    fetchChecklist()
  }, [selectedDate])

  useEffect(() => {
    if (showHistory) {
      fetchHistory()
    }
  }, [showHistory])

  const fetchChecklist = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/checklists`, {
        params: { date: selectedDate }
      })
      
      const morningData = {}
      const nightData = {}
      
      response.data.forEach(item => {
        if (item.shift === 'morning') {
          morningData[item.item_id] = item.completed
        } else if (item.shift === 'night') {
          nightData[item.item_id] = item.completed
        }
      })
      
      setMorningChecklist(morningData)
      setNightChecklist(nightData)
    } catch (error) {
      console.error('Failed to fetch checklist:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setHistoryLoading(true)
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/checklists/history`)
      setHistory(response.data)
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleCheckboxChange = async (shift, itemId, checked) => {
    // Don't allow editing past dates
    if (isViewingPast) return

    // Optimistic update
    if (shift === 'morning') {
      setMorningChecklist(prev => ({ ...prev, [itemId]: checked }))
    } else {
      setNightChecklist(prev => ({ ...prev, [itemId]: checked }))
    }

    setSaving(true)
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/checklists`, {
        date: selectedDate,
        shift,
        itemId,
        completed: checked
      })
    } catch (error) {
      console.error('Failed to save checklist item:', error)
      // Revert on error
      if (shift === 'morning') {
        setMorningChecklist(prev => ({ ...prev, [itemId]: !checked }))
      } else {
        setNightChecklist(prev => ({ ...prev, [itemId]: !checked }))
      }
    } finally {
      setSaving(false)
    }
  }

  const getCompletedCount = (shift) => {
    const checklist = shift === 'morning' ? morningChecklist : nightChecklist
    return Object.values(checklist).filter(v => v).length
  }

  const getTotalCount = (shift) => {
    return shift === 'morning' ? MORNING_CHECKLIST.length : NIGHT_CHECKLIST.length
  }

  const getProgressPercentage = (shift) => {
    const completed = getCompletedCount(shift)
    const total = getTotalCount(shift)
    return total > 0 ? Math.round((completed / total) * 100) : 0
  }

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const goToDate = (dateStr) => {
    setSelectedDate(dateStr)
    setShowHistory(false)
  }

  const goToToday = () => {
    setSelectedDate(today)
  }

  // Generate last 30 days for quick navigation
  const getLast30Days = () => {
    const days = []
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push(date.toISOString().split('T')[0])
    }
    return days
  }

  const getHistoryStatus = (dateStr) => {
    const dayHistory = history.find(h => h.date === dateStr)
    if (!dayHistory) return { morning: 0, night: 0 }
    return {
      morning: dayHistory.morning_completed || 0,
      night: dayHistory.night_completed || 0
    }
  }

  const currentChecklist = activeShift === 'morning' ? MORNING_CHECKLIST : NIGHT_CHECKLIST
  const currentChecklistState = activeShift === 'morning' ? morningChecklist : nightChecklist

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Daily Checklist</h2>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="text-sm text-gray-500">Saving...</span>
          )}
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
          {selectedDate !== today && (
            <button
              onClick={goToToday}
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

      {/* History Panel */}
      {showHistory && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="font-bold text-gray-900">📅 Checklist History (Last 30 Days)</h3>
            <p className="text-sm text-gray-500 mt-1">Click on a date to view that day's checklist</p>
          </div>
          {historyLoading ? (
            <div className="p-8 text-center text-gray-500">Loading history...</div>
          ) : (
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {getLast30Days().map((dateStr) => {
                  const status = getHistoryStatus(dateStr)
                  const morningComplete = status.morning === MORNING_CHECKLIST.length
                  const nightComplete = status.night === NIGHT_CHECKLIST.length
                  const isToday = dateStr === today
                  const isSelected = dateStr === selectedDate
                  const hasData = status.morning > 0 || status.night > 0
                  
                  return (
                    <button
                      key={dateStr}
                      onClick={() => goToDate(dateStr)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? 'border-brand bg-brand-50' 
                          : hasData
                            ? 'border-gray-200 hover:border-brand-200 bg-white'
                            : 'border-gray-100 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium ${isToday ? 'text-brand' : 'text-gray-500'}`}>
                          {isToday ? 'TODAY' : new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                        {isSelected && <span className="text-brand">●</span>}
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {new Date(dateStr).getDate()}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {new Date(dateStr).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="flex gap-1">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          morningComplete 
                            ? 'bg-green-100 text-green-700' 
                            : status.morning > 0 
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          🌅 {status.morning}/{MORNING_CHECKLIST.length}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          nightComplete 
                            ? 'bg-green-100 text-green-700' 
                            : status.night > 0 
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-400'
                        }`}>
                          🌙 {status.night}/{NIGHT_CHECKLIST.length}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Viewing Past Date Indicator */}
      {isViewingPast && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📜</span>
            <div>
              <span className="font-medium text-blue-900">Viewing: {formatDateDisplay(selectedDate)}</span>
              <p className="text-sm text-blue-700">This is a past checklist (read-only)</p>
            </div>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Today
          </button>
        </div>
      )}

      {/* Shift Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveShift('morning')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeShift === 'morning'
                ? 'bg-yellow-50 text-yellow-700 border-b-2 border-yellow-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🌅</span>
              <span>Open Checklist</span>
            </div>
            <div className="mt-1 text-sm">
              {getCompletedCount('morning')}/{getTotalCount('morning')} completed
            </div>
          </button>
          <button
            onClick={() => setActiveShift('night')}
            className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
              activeShift === 'night'
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🌙</span>
              <span>Close Checklist</span>
            </div>
            <div className="mt-1 text-sm">
              {getCompletedCount('night')}/{getTotalCount('night')} completed
            </div>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progress: {getProgressPercentage(activeShift)}%
            </span>
            <span className={`text-sm font-medium ${
              getProgressPercentage(activeShift) === 100 ? 'text-green-600' : 'text-gray-500'
            }`}>
              {getProgressPercentage(activeShift) === 100 ? '✓ Complete!' : `${getTotalCount(activeShift) - getCompletedCount(activeShift)} remaining`}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                activeShift === 'morning' ? 'bg-yellow-500' : 'bg-purple-500'
              }`}
              style={{ width: `${getProgressPercentage(activeShift)}%` }}
            />
          </div>
        </div>

        {/* Checklist Items */}
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading checklist...</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {currentChecklist.map((item, index) => {
              const isChecked = currentChecklistState[item.id] || false
              const prevItem = index > 0 ? currentChecklist[index - 1] : null
              const showCategoryHeader = item.category && (!prevItem || prevItem.category !== item.category)
              const categoryIcons = {
                'Cleaning': '🧹',
                'Safety Check': '⚠️',
                'Defrost': '❄️',
                'Outdoor Check': '🌳',
                'Check Temperature': '🌡️',
                'Items in Freezers': '🧊',
                'Items in Under Counter Fridge': '🥶',
                'Vegetables': '🥬',
                'Sauces': '🥫'
              }
              
              return (
                <div key={item.id}>
                  {showCategoryHeader && (
                    <div className="px-6 py-3 bg-gray-100 border-b border-gray-200">
                      <span className="text-lg mr-2">{categoryIcons[item.category] || '📋'}</span>
                      <span className="font-bold text-gray-700">{item.category}</span>
                    </div>
                  )}
                  <label
                    className={`flex items-center px-6 py-3 transition-colors ${
                      isViewingPast ? 'cursor-default' : 'cursor-pointer'
                    } ${
                      isChecked ? 'bg-green-50' : isViewingPast ? 'bg-gray-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleCheckboxChange(activeShift, item.id, e.target.checked)}
                      disabled={isViewingPast}
                      className={`w-5 h-5 text-brand border-gray-300 rounded focus:ring-brand ${
                        isViewingPast ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                      }`}
                    />
                    <span className={`ml-4 ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.category ? item.label.replace(`${item.category}: `, '') : item.label}
                    </span>
                    {isChecked && (
                      <span className="ml-auto text-green-500 text-lg">✓</span>
                    )}
                  </label>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`p-6 rounded-xl border-2 ${
          getProgressPercentage('morning') === 100 
            ? 'bg-green-50 border-green-200' 
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌅</span>
            <h3 className="text-lg font-bold text-gray-900">Open Shift</h3>
          </div>
          <p className={`text-sm ${
            getProgressPercentage('morning') === 100 ? 'text-green-600' : 'text-yellow-700'
          }`}>
            {getProgressPercentage('morning') === 100 
              ? '✓ All tasks completed!' 
              : `${getTotalCount('morning') - getCompletedCount('morning')} tasks remaining`
            }
          </p>
        </div>
        <div className={`p-6 rounded-xl border-2 ${
          getProgressPercentage('night') === 100 
            ? 'bg-green-50 border-green-200' 
            : 'bg-purple-50 border-purple-200'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🌙</span>
            <h3 className="text-lg font-bold text-gray-900">Close Shift</h3>
          </div>
          <p className={`text-sm ${
            getProgressPercentage('night') === 100 ? 'text-green-600' : 'text-purple-700'
          }`}>
            {getProgressPercentage('night') === 100 
              ? '✓ All tasks completed!' 
              : `${getTotalCount('night') - getCompletedCount('night')} tasks remaining`
            }
          </p>
        </div>
      </div>
    </div>
  )
}

export default DailyChecklist
