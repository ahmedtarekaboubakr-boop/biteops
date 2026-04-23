import { useState, useMemo } from 'react'

const TITLES = ['Crew', 'Cashier', 'Line Leader', 'Supervisor', 'Assistant Manager', 'Branch Manager', 'Area Manager', 'Operations Manager']
const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills', 'Multi-Branch']

function StaffList({ staff, onEdit, onDelete, onReactivate, isHR }) {
  const [titleFilter, setTitleFilter] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short', day: 'numeric' })
  }

  // Filter staff based on selected filters
  const filteredStaff = useMemo(() => {
    // Defensive check: ensure staff is an array
    if (!Array.isArray(staff)) {
      console.error('Staff is not an array:', staff)
      return []
    }
    
    return staff.filter(s => {
      const matchesTitle = !titleFilter || s.title === titleFilter
      const matchesBranch = !branchFilter || s.branch === branchFilter
      const matchesStatus = !statusFilter || statusFilter === 'all' || (s.status || 'active') === statusFilter
      return matchesTitle && matchesBranch && matchesStatus
    })
  }, [staff, titleFilter, branchFilter, statusFilter])

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">👥</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Staff Yet</h3>
        <p className="text-gray-500">Create your first staff profile to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">🔍 Filters:</span>
          </div>
          
          {/* Title Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Title:</label>
            <select
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">All Titles</option>
              {TITLES.map(title => (
                <option key={title} value={title}>{title}</option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Branch:</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">All Branches</option>
              {BRANCHES.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>

          {/* Status Filter - Only for HR */}
          {isHR && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="all">All</option>
              </select>
            </div>
          )}

          {/* Clear Filters */}
          {(titleFilter || branchFilter || (isHR && statusFilter !== 'active')) && (
            <button
              onClick={() => {
                setTitleFilter('')
                setBranchFilter('')
                setStatusFilter('active')
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕ Clear Filters
            </button>
          )}

          {/* Results Count */}
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredStaff.length} of {staff.length} staff
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                Photo
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name / Code
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title / Branch
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Off
              </th>
              {isHR && (
                <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              )}
              <th className="px-3 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.length === 0 ? (
              <tr>
                <td colSpan={isHR ? "8" : "7"} className="px-6 py-12 text-center">
                  <div className="text-gray-400 text-4xl mb-2">🔍</div>
                  <p className="text-gray-500">No staff found matching the selected filters</p>
                </td>
              </tr>
            ) : (
              filteredStaff.map((staffMember) => {
                const isActive = (staffMember.status || 'active') === 'active'
                return (
                  <tr key={staffMember.id} className={`hover:bg-gray-50 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                    <td className="px-3 py-3">
                      {staffMember.photo ? (
                        <img 
                          src={staffMember.photo} 
                          alt={staffMember.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"%3E%3Ccircle cx="20" cy="20" r="20" fill="%23e5e7eb"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16" font-weight="600"%3E' + (staffMember.name?.charAt(0) || '?') + '%3C/text%3E%3C/svg%3E'
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold text-sm">
                          {staffMember.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">{staffMember.name}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{staffMember.employeeCode}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 font-mono">{staffMember.username}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 inline-block w-fit">
                            {staffMember.title || 'N/A'}
                          </span>
                          {staffMember.healthCertificate && (
                            <span className="text-xs" title="Health Certificate Available">✅</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">{staffMember.branch}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs text-gray-500">{formatDate(staffMember.startDate)}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900">
                        {staffMember.totalLeaveDays !== undefined ? staffMember.totalLeaveDays : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">days</div>
                    </td>
                    {isHR && (
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                          isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(staffMember)}
                          className="px-2 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                          title="Edit staff profile"
                        >
                          ✏️
                        </button>
                        {isActive ? (
                          <button
                            onClick={() => onDelete(staffMember.id)}
                            className="px-2 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors shadow-sm"
                            title="Deactivate staff member"
                          >
                            🚫
                          </button>
                        ) : (
                          onReactivate && (
                            <button
                              onClick={() => onReactivate(staffMember.id)}
                              className="px-2 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors shadow-sm"
                              title="Reactivate staff member"
                            >
                              ✅
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default StaffList

