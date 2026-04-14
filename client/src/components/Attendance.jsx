import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Attendance({ staff, readOnly = false }) {
  const { user } = useAuth()
  const isHR = user?.role === 'hr_manager'
  const isOwner = user?.role === 'owner'
  const isOperationsManager = user?.role === 'operations_manager'
  const canViewBranchStats = isHR || isOwner || isOperationsManager
  
  const [activeSection, setActiveSection] = useState('fingerprint')
  const [fingerprintLogs, setFingerprintLogs] = useState([])
  const [attendanceRecords, setAttendanceRecords] = useState([])
  const [attendanceSummary, setAttendanceSummary] = useState([])
  const [branchStatistics, setBranchStatistics] = useState([])
  const [loading, setLoading] = useState(false)
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  })
  const [selectedStaff, setSelectedStaff] = useState('')

  useEffect(() => {
    fetchData()
  }, [activeSection, dateRange, selectedStaff])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      }
      if (selectedStaff) {
        params.staffId = selectedStaff
      }

      if (activeSection === 'fingerprint') {
        const response = await axios.get('/api/attendance/fingerprint', { params })
        setFingerprintLogs(response.data)
      } else if (activeSection === 'records') {
        const response = await axios.get('/api/attendance', { params })
        setAttendanceRecords(response.data)
      } else if (activeSection === 'summary') {
        const response = await axios.get('/api/attendance/summary', { params })
        setAttendanceSummary(response.data)
      } else if (activeSection === 'branch-stats' && canViewBranchStats) {
        const response = await axios.get('/api/attendance/branch-statistics', { params })
        setBranchStatistics(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch attendance data:', error)
      alert('Failed to fetch attendance data: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleManualClock = async (staffId, clockType) => {
    if (!window.confirm(`Are you sure you want to record ${clockType === 'clock_in' ? 'clock in' : 'clock out'} for this staff?`)) {
      return
    }

    try {
      const clockTime = new Date().toISOString()
      await axios.post('/api/attendance/clock', {
        staffId,
        clockTime,
        clockType
      })
      alert(`${clockType === 'clock_in' ? 'Clock in' : 'Clock out'} recorded successfully`)
      fetchData()
    } catch (error) {
      alert('Failed to record clock: ' + (error.response?.data?.error || error.message))
    }
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

  const formatTime = (time) => {
    if (!time) return 'N/A'
    return time
  }

  const formatMinutes = (minutes) => {
    if (!minutes) return '0'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Attendance</h2>
      </div>

      {/* Read-only indicator for HR */}
      {readOnly && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <span className="text-gray-600">📋 View Only - Attendance records are managed by branch managers</span>
        </div>
      )}

      {/* Date Range and Staff Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Staff</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
            >
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employeeCode})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('fingerprint')}
            className={`${
              activeSection === 'fingerprint'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Fingerprint Logs
          </button>
          <button
            onClick={() => setActiveSection('records')}
            className={`${
              activeSection === 'records'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Clock In/Out Records
          </button>
          <button
            onClick={() => setActiveSection('summary')}
            className={`${
              activeSection === 'summary'
                ? 'border-brand text-brand'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Summary (Late Hours, Absence, Overtime)
          </button>
          {canViewBranchStats && (
            <button
              onClick={() => setActiveSection('branch-stats')}
              className={`${
                activeSection === 'branch-stats'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Branch Statistics
            </button>
          )}
        </nav>
      </div>

      {/* Content Sections */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading attendance data...</div>
        </div>
      ) : (
        <>
          {/* Fingerprint Logs Section */}
          {activeSection === 'fingerprint' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Fingerprint Logs</h3>
                <p className="text-sm text-gray-600 mt-1">All fingerprint scans from the fingerprint system</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scan Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Device ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fingerprintLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No fingerprint logs found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      fingerprintLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {log.staff_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.employee_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(log.scan_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                log.scan_type === 'clock_in'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {log.scan_type === 'clock_in' ? 'Clock In' : 'Clock Out'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.device_id || 'N/A'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clock In/Out Records Section */}
          {activeSection === 'records' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Clock In/Out Records</h3>
                <p className="text-sm text-gray-600 mt-1">Detailed attendance records with clock in/out times</p>
              </div>
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
                        Shift
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clock In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clock Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overtime
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceRecords.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="px-6 py-4 text-center text-gray-500">
                          No attendance records found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      attendanceRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {record.staff_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {record.shift}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(record.clock_in_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDateTime(record.clock_out_time)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatMinutes(record.late_minutes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatMinutes(record.overtime_minutes)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                record.status === 'present'
                                  ? 'bg-green-100 text-green-800'
                                  : record.status === 'late'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : record.status === 'absent'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {record.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            {!readOnly && (
                              <>
                                {!record.clock_in_time && (
                                  <button
                                    onClick={() => handleManualClock(record.staff_id, 'clock_in')}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    Clock In
                                  </button>
                                )}
                                {record.clock_in_time && !record.clock_out_time && (
                                  <button
                                    onClick={() => handleManualClock(record.staff_id, 'clock_out')}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    Clock Out
                                  </button>
                                )}
                              </>
                            )}
                            {readOnly && <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Section */}
          {activeSection === 'summary' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Attendance Summary</h3>
                <p className="text-sm text-gray-600 mt-1">Late hours, absence, and overtime summary by staff</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Days
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Overtime Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Early Leave Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendanceSummary.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                          No attendance summary found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      attendanceSummary.map((summary) => (
                        <tr key={summary.staff_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {summary.staff_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {summary.employee_code}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {summary.total_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                            {summary.present_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                            {summary.absent_days}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-semibold">
                            {parseFloat(summary.total_late_hours).toFixed(2)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                            {parseFloat(summary.total_overtime_hours).toFixed(2)}h
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-brand font-semibold">
                            {parseFloat(summary.total_early_leave_hours).toFixed(2)}h
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Branch Statistics Section - Only for HR, Owner, Operations Manager */}
          {activeSection === 'branch-stats' && canViewBranchStats && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Branch Attendance Statistics</h3>
                <p className="text-sm text-gray-600 mt-1">Attendance statistics grouped by branch for the selected date range</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Records
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Present
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Absent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Late
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Half Day
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        On Leave
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Late Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Overtime Hours
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {branchStatistics.length === 0 ? (
                      <tr>
                        <td colSpan="11" className="px-6 py-4 text-center text-gray-500">
                          No attendance statistics found for the selected date range
                        </td>
                      </tr>
                    ) : (
                      branchStatistics.map((stat) => (
                        <tr key={stat.branch} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {stat.branch}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.total_staff}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.total_records}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            {stat.present_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            {stat.absent_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                            {stat.late_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.half_day_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {stat.on_leave_count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`font-medium ${
                              stat.attendance_rate >= 90 ? 'text-green-600' :
                              stat.attendance_rate >= 75 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {stat.attendance_rate}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.total_late_hours} hrs
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {stat.total_overtime_hours} hrs
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Attendance

