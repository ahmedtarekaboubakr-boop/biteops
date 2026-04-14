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
import Attendance from './Attendance'
import Penalties from './Penalties'
import DailyChecklist from './DailyChecklist'
import LanguageToggle from './LanguageToggle'
import AnnouncementBanner from './AnnouncementBanner'
import Announcements from './Announcements'
import BranchManagement from './BranchManagement'
import Leaderboard from './Leaderboard'
import Maintenance from './Maintenance'

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JJ's</h1>
              <p className="text-sm text-gray-600">{getRoleDisplayName()} Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <LanguageToggle />
              <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Announcement Banner */}
        <AnnouncementBanner />
        
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {/* Staff tab - only visible to HR Manager */}
            {isHR && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`${
                  activeTab === 'staff'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('staff')}
              </button>
            )}
            {/* Branches tab - only visible to HR Manager */}
            {isHR && (
              <button
                onClick={() => setActiveTab('branches')}
                className={`${
                  activeTab === 'branches'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Branches
              </button>
            )}
            <button
              onClick={() => setActiveTab('schedule')}
              className={`${
                activeTab === 'schedule'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('schedule')}
            </button>
            <button
              onClick={() => setActiveTab('rating')}
              className={`${
                activeTab === 'rating'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('performance')}
            </button>
            <button
              onClick={() => setActiveTab('attendance')}
              className={`${
                activeTab === 'attendance'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('attendance')}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`${
                activeTab === 'requests'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('requests')}
            </button>
            <button
              onClick={() => setActiveTab('penalties')}
              className={`${
                activeTab === 'penalties'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              {t('penalties')}
            </button>
            {/* Tutorials tab - hidden for HR */}
            {!isHR && (
              <button
                onClick={() => setActiveTab('tutorials')}
                className={`${
                  activeTab === 'tutorials'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('tutorials')}
              </button>
            )}
            {/* Daily Checklist - only for branch managers */}
            {!isHR && (
              <button
                onClick={() => setActiveTab('checklist')}
                className={`${
                  activeTab === 'checklist'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {t('dailyChecklist')}
              </button>
            )}
            {/* Leaderboard - only for branch managers */}
            {!isHR && (
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`${
                  activeTab === 'leaderboard'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Leaderboard
              </button>
            )}
            {/* Maintenance - for branch managers and operations managers */}
            {!isHR && (
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`${
                  activeTab === 'maintenance'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Maintenance
              </button>
            )}
            {/* Announcements tab */}
            <button
              onClick={() => setActiveTab('announcements')}
              className={`${
                activeTab === 'announcements'
                  ? 'border-brand text-brand'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Announcements
            </button>
          </nav>
        </div>

        {/* Staff Tab - Only for HR Manager */}
        {activeTab === 'staff' && isHR && (
          <>
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-3xl font-bold text-gray-900">{t('staff')}</h2>
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

        {/* Attendance Tab - read-only for HR */}
        {activeTab === 'attendance' && <Attendance staff={staff} readOnly={isHR} />}

        {/* Rating Tab - read-only for HR */}
        {activeTab === 'rating' && <Rating readOnly={isHR} />}

        {/* Tutorials Tab - only for managers, not HR */}
        {activeTab === 'tutorials' && !isHR && <Tutorials />}

        {/* Requests Tab - HR can only approve/deny, not create */}
        {activeTab === 'requests' && <Requests staff={staff} isHR={isHR} />}

        {/* Penalties Tab */}
        {activeTab === 'penalties' && <Penalties staff={staff} />}

        {/* Daily Checklist Tab - only for branch managers */}
        {activeTab === 'checklist' && !isHR && <DailyChecklist />}


        {/* Leaderboard Tab - only for branch managers */}
        {activeTab === 'leaderboard' && !isHR && <Leaderboard />}

        {/* Maintenance Tab - for branch managers and operations managers */}
        {activeTab === 'maintenance' && !isHR && <Maintenance />}

        {/* Announcements Tab */}
        {activeTab === 'announcements' && <Announcements />}
      </main>
    </div>
  )
}

export default ManagerDashboard

