function ManagerList({ managers, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      hr_manager: { label: 'HR Manager', bg: 'bg-purple-100', text: 'text-purple-800' },
      operations_manager: { label: 'Operations Manager', bg: 'bg-green-100', text: 'text-green-800' },
      area_manager: { label: 'Area Manager', bg: 'bg-amber-100', text: 'text-amber-800' },
      manager: { label: 'Branch Manager', bg: 'bg-blue-100', text: 'text-blue-800' }
    }
    const config = roleConfig[role] || roleConfig.manager
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  if (managers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="text-gray-400 text-6xl mb-4">👤</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Profiles Yet</h3>
        <p className="text-gray-500">Create your first profile to get started.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Branch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {managers.map((manager) => (
              <tr key={manager.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{manager.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getRoleBadge(manager.role)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">{manager.username}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-mono">{manager.employeeCode}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">{manager.branch || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(manager.startDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => onEdit(manager)}
                    className="text-brand hover:text-brand-700 mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(manager.id)}
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
  )
}

export default ManagerList
