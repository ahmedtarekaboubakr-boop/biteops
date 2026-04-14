import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function Leaderboard() {
  const { user } = useAuth()
  const [activeView, setActiveView] = useState('staff') // 'staff' or 'branches'
  const [staffLeaderboard, setStaffLeaderboard] = useState([])
  const [branchLeaderboard, setBranchLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30') // days: '7', '30', '90', 'all'

  useEffect(() => {
    fetchLeaderboard()
  }, [activeView, timeRange])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      if (activeView === 'staff') {
        const response = await axios.get(`/api/leaderboard/staff?days=${timeRange}`)
        setStaffLeaderboard(response.data)
      } else {
        const response = await axios.get(`/api/leaderboard/branches?days=${timeRange}`)
        setBranchLeaderboard(response.data)
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error)
      alert('Failed to fetch leaderboard: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 font-bold'
    if (score >= 75) return 'text-blue-600 font-semibold'
    if (score >= 60) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const formatScore = (score) => {
    return score.toFixed(1)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Leaderboard</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="bg-white rounded-xl shadow-sm p-1 flex gap-2">
        <button
          onClick={() => setActiveView('staff')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeView === 'staff'
              ? 'bg-brand text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          👥 Staff Leaderboard
        </button>
        <button
          onClick={() => setActiveView('branches')}
          className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
            activeView === 'branches'
              ? 'bg-brand text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          🏢 Branch Leaderboard
        </button>
      </div>

      {/* Staff Leaderboard */}
      {activeView === 'staff' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-brand to-brand-600 p-6 text-white">
            <h3 className="text-2xl font-bold">Staff Performance Leaderboard</h3>
            <p className="text-brand-100 mt-1">Ranked by performance points (0-5) - Staff members in your branch</p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading leaderboard...</div>
          ) : staffLeaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500">No ratings or attendance data found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Total Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Penalties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffLeaderboard.map((staff, index) => (
                    <tr key={staff.staff_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getRankEmoji(index + 1)}</span>
                          {index < 3 && (
                            <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{staff.staff_name}</div>
                        <div className="text-sm text-gray-500">{staff.employee_code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.avg_performance !== null ? formatScore(staff.avg_performance) : 'N/A'}
                          {staff.avg_performance !== null && (
                            <span className="text-xs text-gray-500 ml-1">/ 5.0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.avg_total_score !== null ? formatScore(staff.avg_total_score) : 'N/A'}
                          {staff.avg_total_score !== null && (
                            <span className="text-xs text-gray-500 ml-1">/ 10.0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {staff.attendance_rate !== null ? `${formatScore(staff.attendance_rate)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${staff.penalty_count > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {staff.penalty_count || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${getScoreColor(staff.overall_score)}`}>
                          {formatScore(staff.overall_score)}
                        </div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Branch Leaderboard */}
      {activeView === 'branches' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <h3 className="text-2xl font-bold">Branch Competition Leaderboard</h3>
            <p className="text-purple-100 mt-1">Ranking all branches against each other</p>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading leaderboard...</div>
          ) : branchLeaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Data Available</h3>
              <p className="text-gray-500">No branch data found for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Staff Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Attendance Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Penalties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Overall Score
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {branchLeaderboard.map((branch, index) => (
                    <tr key={branch.branch} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{getRankEmoji(index + 1)}</span>
                          {index < 3 && (
                            <span className="text-lg font-bold text-gray-900">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{branch.branch}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {branch.avg_performance !== null ? formatScore(branch.avg_performance) : 'N/A'}
                          {branch.avg_performance !== null && (
                            <span className="text-xs text-gray-500 ml-1">/ 5.0</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {branch.avg_attendance_rate !== null ? `${formatScore(branch.avg_attendance_rate)}%` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${branch.total_penalties > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {branch.total_penalties || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{branch.staff_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${getScoreColor(branch.overall_score)}`}>
                          {formatScore(branch.overall_score)}
                        </div>
                        <div className="text-xs text-gray-500">/ 100</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Leaderboard


