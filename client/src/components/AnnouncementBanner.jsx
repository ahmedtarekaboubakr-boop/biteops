import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

function AnnouncementBanner() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [dismissedIds, setDismissedIds] = useState(new Set())

  useEffect(() => {
    if (user) {
      fetchAnnouncements()
    }
  }, [user])

  const fetchAnnouncements = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/announcements`)
      setAnnouncements(response.data || [])
    } catch (error) {
      console.error('Failed to fetch announcements:', error)
    }
  }

  const handleDismiss = async (announcementId) => {
    try {
      await axios.post(`/api/announcements/${announcementId}/dismiss`)
      setDismissedIds(prev => new Set([...prev, announcementId]))
    } catch (error) {
      console.error('Failed to dismiss announcement:', error)
    }
  }

  const activeAnnouncements = announcements.filter(a => !dismissedIds.has(a.id))

  if (activeAnnouncements.length === 0) return null

  return (
    <div className="space-y-3 mb-6">
      {activeAnnouncements.map((announcement) => (
        <div
          key={announcement.id}
          className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 relative"
        >
          <button
            onClick={() => handleDismiss(announcement.id)}
            className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 text-xl font-bold"
            aria-label="Dismiss"
          >
            ×
          </button>
          <div className="pr-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-1">{announcement.title}</h3>
            <p className="text-blue-800">{announcement.message}</p>
            <p className="text-xs text-blue-600 mt-2">
              From: {announcement.created_by_name} • {new Date(announcement.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AnnouncementBanner

