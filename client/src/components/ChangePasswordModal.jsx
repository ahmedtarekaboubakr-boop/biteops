import { useState } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

export default function ChangePasswordModal({ isOpen, onClose }) {
  const { refreshUser } = useAuth()
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!isOpen) return null

  const handleClose = () => {
    setError('')
    setCurrentPassword('')
    setNewPassword('')
    setConfirm('')
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError(t('passwordsDoNotMatch'))
      return
    }
    setSaving(true)
    try {
      await axios.put(`${API_URL}/api/auth/password`, { currentPassword, newPassword })
      await refreshUser()
      handleClose()
      alert(t('passwordChangeSuccess'))
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="change-password-title">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 id="change-password-title" className="text-lg font-semibold text-gray-900">
            {t('changePassword')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            aria-label={t('cancel')}
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="cp-current" className="block text-sm font-medium text-gray-700 mb-1">
              {t('currentPassword')}
            </label>
            <input
              id="cp-current"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>
          <div>
            <label htmlFor="cp-new" className="block text-sm font-medium text-gray-700 mb-1">
              {t('newPassword')}
            </label>
            <input
              id="cp-new"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>
          <div>
            <label htmlFor="cp-confirm" className="block text-sm font-medium text-gray-700 mb-1">
              {t('confirmNewPassword')}
            </label>
            <input
              id="cp-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-brand rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {saving ? t('loading') : t('updatePassword')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
