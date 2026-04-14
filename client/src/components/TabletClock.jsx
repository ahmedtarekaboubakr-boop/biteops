import { useState, useEffect } from 'react'
import axios from 'axios'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

function TabletClock() {
  const [branchCode, setBranchCode] = useState('')
  const [branch, setBranch] = useState(null)
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [clockingIn, setClockingIn] = useState({})

  // Check if branch code is stored in localStorage
  useEffect(() => {
    const savedBranch = localStorage.getItem('tablet_branch')
    if (savedBranch) {
      setBranch(savedBranch)
      fetchStaff(savedBranch)
    }
  }, [])

  const handleBranchSubmit = async (e) => {
    e.preventDefault()
    if (!branchCode.trim()) {
      setError('Please enter a branch code')
      return
    }

    // Validate branch code (simple check - can be enhanced)
    const branchName = BRANCHES.find(b => 
      b.toLowerCase().replace(/\s+/g, '') === branchCode.toLowerCase().replace(/\s+/g, '') ||
      b.toLowerCase().startsWith(branchCode.toLowerCase())
    )

    if (!branchName) {
      setError('Invalid branch code')
      return
    }

    setBranch(branchName)
    localStorage.setItem('tablet_branch', branchName)
    setError('')
    fetchStaff(branchName)
  }

  const fetchStaff = async (branchName) => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`/api/tablet/staff/${encodeURIComponent(branchName)}`)
      setStaff(response.data)
    } catch (err) {
      setError('Failed to load staff: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  const handleClock = async (staffId, staffName, clockType) => {
    if (clockingIn[staffId]) return // Prevent double-clicking

    setClockingIn(prev => ({ ...prev, [staffId]: true }))
    setSuccessMessage('')
    setError('')

    try {
      const clockTime = new Date().toISOString()
      await axios.post(`${import.meta.env.VITE_API_URL}/api/tablet/clock', {
        staffId,
        clockTime,
        clockType,
        branch: branch
      })

      setSuccessMessage(`${staffName} ${clockType === 'clock_in' ? 'clocked in' : 'clocked out'} successfully!`)
      
      // Refresh staff list to update clock status
      setTimeout(() => {
        fetchStaff(branch)
        setSuccessMessage('')
      }, 2000)

      // Clear clocking state after a delay
      setTimeout(() => {
        setClockingIn(prev => {
          const newState = { ...prev }
          delete newState[staffId]
          return newState
        })
      }, 1000)
    } catch (err) {
      setError(`Failed to ${clockType === 'clock_in' ? 'clock in' : 'clock out'}: ${err.response?.data?.error || err.message}`)
      setClockingIn(prev => {
        const newState = { ...prev }
        delete newState[staffId]
        return newState
      })
    }
  }

  const getCurrentStatus = (staffMember) => {
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = staffMember.todayRecord

    if (!todayRecord) {
      return { canClockIn: true, canClockOut: false, status: 'not_clocked' }
    }

    if (todayRecord.clock_in_time && !todayRecord.clock_out_time) {
      return { canClockIn: false, canClockOut: true, status: 'clocked_in' }
    }

    if (todayRecord.clock_in_time && todayRecord.clock_out_time) {
      return { canClockIn: false, canClockOut: false, status: 'clocked_out' }
    }

    return { canClockIn: true, canClockOut: false, status: 'not_clocked' }
  }

  const formatTime = (timeString) => {
    if (!timeString) return null
    const date = new Date(timeString)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }

  // If branch not set, show branch selection
  if (!branch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tablet Clock System</h1>
            <p className="text-gray-600">Enter your branch code to continue</p>
          </div>
          
          <form onSubmit={handleBranchSubmit} className="space-y-4">
            <div>
              <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 mb-2">
                Branch Code
              </label>
              <input
                type="text"
                id="branchCode"
                value={branchCode}
                onChange={(e) => setBranchCode(e.target.value)}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter branch name"
                autoFocus
              />
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              Available branches: {BRANCHES.join(', ')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Main clock interface
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{branch} Branch</h1>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('tablet_branch')
                setBranch(null)
                setStaff([])
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg"
            >
              Change Branch
            </button>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {successMessage}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Staff Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading staff...</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600">No staff members found for this branch</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {staff.map((staffMember) => {
              const status = getCurrentStatus(staffMember)
              const isProcessing = clockingIn[staffMember.id]

              return (
                <div
                  key={staffMember.id}
                  className={`bg-white rounded-lg shadow-sm p-4 border-2 transition-all ${
                    status.status === 'clocked_in'
                      ? 'border-green-500 bg-green-50'
                      : status.status === 'clocked_out'
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-blue-300 bg-blue-50'
                  }`}
                >
                  <div className="text-center mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1">
                      {staffMember.name}
                    </h3>
                    <p className="text-sm text-gray-600">{staffMember.employee_code}</p>
                  </div>

                  {/* Status Display */}
                  <div className="mb-3 text-center">
                    {status.status === 'clocked_in' && (
                      <div className="text-sm">
                        <p className="text-green-700 font-medium">Clocked In</p>
                        <p className="text-gray-600 text-xs">
                          {formatTime(staffMember.todayRecord?.clock_in_time)}
                        </p>
                      </div>
                    )}
                    {status.status === 'clocked_out' && (
                      <div className="text-sm">
                        <p className="text-gray-700 font-medium">Clocked Out</p>
                        <p className="text-gray-600 text-xs">
                          {formatTime(staffMember.todayRecord?.clock_in_time)} - {formatTime(staffMember.todayRecord?.clock_out_time)}
                        </p>
                      </div>
                    )}
                    {status.status === 'not_clocked' && (
                      <p className="text-sm text-blue-700 font-medium">Not Clocked In</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    {status.canClockIn && (
                      <button
                        onClick={() => handleClock(staffMember.id, staffMember.name, 'clock_in')}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                          isProcessing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Clock In'}
                      </button>
                    )}
                    {status.canClockOut && (
                      <button
                        onClick={() => handleClock(staffMember.id, staffMember.name, 'clock_out')}
                        disabled={isProcessing}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-colors ${
                          isProcessing
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {isProcessing ? 'Processing...' : 'Clock Out'}
                      </button>
                    )}
                    {!status.canClockIn && !status.canClockOut && (
                      <div className="w-full py-3 rounded-lg bg-gray-200 text-gray-600 text-center font-semibold">
                        Complete
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TabletClock

