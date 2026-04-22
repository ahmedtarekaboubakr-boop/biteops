import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import axios from 'axios'
import StaffForm from './StaffForm'
import StaffList from './StaffList'
import Schedule from './Schedule'
import Tutorials from './Tutorials'
import Rating from './Rating'
import Requests from './Requests'
import Penalties from './Penalties'
import AnnouncementBanner from './AnnouncementBanner'
import Announcements from './Announcements'
import BranchManagement from './BranchManagement'
import Leaderboard from './Leaderboard'
import ChangePasswordModal from './ChangePasswordModal'
import Sidebar from './Sidebar'

function ManagerDashboard() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const isHR = user?.role === 'hr_manager'
  
  // Get role display name
  const getRoleDisplayName = () => {
    const roleNames = {
      manager: t('branchManager'),
      hr_manager: 'HR Manager',
      operations_manager: t('operationsManager'),
      area_manager: t('areaManager'),
    }
    return roleNames[user?.role] || 'Manager'
  }
  
  const [activeTab, setActiveTab] = useState(isHR ? 'staff' : 'schedule')
  const [staff, setStaff] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      // HR can see all staff (active and inactive), others only see active
      const url = isHR ? '/api/staff?status=all' : '/api/staff'
      const response = await axios.get(url)
      setStaff(response.data)
    } catch (error) {
      console.error('Failed to fetch staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateStaff = () => {
    setEditingStaff(null)
    setShowForm(true)
  }

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingStaff(null)
  }

  const handleFormSuccess = (wasEditing) => {
    fetchStaff()
    handleFormClose()
    // Show success message
    if (wasEditing) {
      alert('Staff profile updated successfully!')
    }
  }

  const handleDeleteStaff = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this staff member? Their information will be preserved and they can be reactivated later.')) {
      return
    }

    try {
      await axios.delete(`/api/staff/${id}`)
      fetchStaff()
    } catch (error) {
      alert('Failed to deactivate staff: ' + (error.response?.data?.error || error.message))
    }
  }

  const handleReactivateStaff = async (id) => {
    if (!window.confirm('Are you sure you want to reactivate this staff member?')) {
      return
    }

    try {
      await axios.put(`/api/staff/${id}/reactivate`)
      fetchStaff()
    } catch (error) {
      alert('Failed to reactivate staff: ' + (error.response?.data?.error || error.message))
    }
  }

  // Build tabs based on role
  const tabs = []
  if (isHR) {
    tabs.push({ id: 'staff', label: t('staff') })
    tabs.push({ id: 'branches', label: 'Branches' })
  }
  tabs.push({ id: 'schedule', label: t('schedule') })
  tabs.push({ id: 'rating', label: t('performance') })
  tabs.push({ id: 'requests', label: t('requests') })
  tabs.push({ id: 'penalties', label: t('penalties') })
  if (!isHR) {
    tabs.push({ id: 'tutorials', label: t('tutorials') })
    tabs.push({ id: 'leaderboard', label: 'Leaderboard' })
  }
  tabs.push({ id: 'announcements', label: 'Announcements' })

  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        user={user}
        onChangePassword={() => setShowChangePassword(true)}
        onLogout={logout}
      />

      {/* Main Content with left margin for sidebar */}
      <div className="ml-56">
        {/* Header */}
        <header className="bg-[#f5f5f0] border-b border-gray-300 px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">JJ's</h1>
            <p className="text-base text-gray-600 mt-1">{getRoleDisplayName()} Dashboard</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-8 py-6">
          {/* Announcement Banner */}
          <AnnouncementBanner />

        {/* Staff Tab - Only for HR Manager */}
        {activeTab === 'staff' && isHR && (
          <>
            <div className="mb-8 flex justify-between items-center">
              <h2 className="text-4xl font-bold text-gray-900">{t('staff')}</h2>
              <button
                onClick={handleCreateStaff}
                className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
              >
                + {t('createStaffProfile')}
              </button>
            </div>

            {showForm && (
              <StaffForm
                staff={editingStaff}
                onClose={handleFormClose}
                onSuccess={() => handleFormSuccess(!!editingStaff)}
              />
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="text-gray-500">Loading staff...</div>
              </div>
            ) : (
            <StaffList
              staff={staff}
              onEdit={handleEditStaff}
              onDelete={handleDeleteStaff}
              onReactivate={handleReactivateStaff}
              isHR={isHR}
            />
            )}
          </>
        )}

        {/* Branches Tab - Only for HR Manager */}
        {activeTab === 'branches' && isHR && <BranchManagement />}

        {/* Schedule Tab - read-only for HR */}
        {activeTab === 'schedule' && <Schedule staff={staff} readOnly={isHR} />}

        {/* Rating Tab - read-only for HR */}
        {activeTab === 'rating' && <Rating readOnly={isHR} />}

        {/* Tutorials Tab - only for managers, not HR */}
        {activeTab === 'tutorials' && !isHR && <Tutorials />}

        {/* Requests Tab - HR can only approve/deny, not create */}
        {activeTab === 'requests' && <Requests staff={staff} isHR={isHR} />}

        {/* Penalties Tab */}
        {activeTab === 'penalties' && <Penalties staff={staff} />}

        {/* Leaderboard Tab - only for branch managers */}
        {activeTab === 'leaderboard' && !isHR && <Leaderboard />}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && <Announcements />}
        </main>
      </div>

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  )
}

export default ManagerDashboard

