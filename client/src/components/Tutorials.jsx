import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function Tutorials() {
  const { user } = useAuth()
  const [tutorials, setTutorials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    video: null
  })
  const [error, setError] = useState('')

  const isOwner = user?.role === 'owner'

  useEffect(() => {
    fetchTutorials()
  }, [])

  const fetchTutorials = async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/api/tutorials`)
      setTutorials(response.data)
    } catch (error) {
      console.error('Failed to fetch tutorials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Check file size (500MB limit)
      if (file.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB')
        return
      }
      // Check file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv']
      if (!allowedTypes.some(type => file.type.includes(type.split('/')[1])) && !file.type.startsWith('video/')) {
        setError('Please select a valid video file')
        return
      }
      setUploadForm(prev => ({ ...prev, video: file }))
      setError('')
    }
  }

  const handleUpload = async (e) => {
    e.preventDefault()
    setError('')

    if (!uploadForm.title) {
      setError('Title is required')
      return
    }

    if (!uploadForm.video) {
      setError('Please select a video file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('title', uploadForm.title)
      formData.append('description', uploadForm.description || '')
      formData.append('video', uploadForm.video)

      await axios.post(`${API_URL}/api/tutorials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setUploadForm({ title: '', description: '', video: null })
      setShowUploadForm(false)
      fetchTutorials()
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload tutorial')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) {
      return
    }

    try {
      await axios.delete(`${API_URL}/api/tutorials/${id}`)
      fetchTutorials()
    } catch (error) {
      alert('Failed to delete tutorial: ' + (error.response?.data?.error || error.message))
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVideoUrl = (filePath) => {
    // Extract relative path from absolute path
    // Handle both Windows and Unix paths
    const relativePath = filePath.replace(/^.*[\\\/]uploads[\\\/]/, '/uploads/')
    // Use the backend server URL for video files
    return `${API_URL}${relativePath.replace(/\\/g, '/')}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">Tutorials</h2>
        {isOwner && (
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
          >
            + Upload Tutorial
          </button>
        )}
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && isOwner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Upload Tutorial Video</h3>
                <button
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadForm({ title: '', description: '', video: null })
                    setError('')
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter tutorial title"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter tutorial description (optional)"
                />
              </div>

              <div>
                <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-2">
                  Video File <span className="text-red-500">*</span>
                </label>
                <input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                {uploadForm.video && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {uploadForm.video.name} ({formatFileSize(uploadForm.video.size)})
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 500MB. Supported formats: MP4, AVI, MOV, WMV, FLV, WebM, MKV
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadForm({ title: '', description: '', video: null })
                    setError('')
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload Tutorial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tutorials List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Loading tutorials...</div>
        </div>
      ) : tutorials.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">🎥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tutorials Yet</h3>
          <p className="text-gray-500">
            {isOwner ? 'Upload your first tutorial video to get started.' : 'No tutorials available at the moment.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <div key={tutorial.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{tutorial.title}</h3>
                    {tutorial.description && (
                      <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                    )}
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleDelete(tutorial.id)}
                      className="text-red-600 hover:text-red-800 ml-2"
                      title="Delete"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="mb-4">
                  <video
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '300px' }}
                  >
                    <source src={getVideoUrl(tutorial.file_path)} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Uploaded by: {tutorial.uploaded_by_name}</p>
                  <p>Date: {formatDate(tutorial.created_at)}</p>
                  {tutorial.file_size && (
                    <p>Size: {formatFileSize(tutorial.file_size)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Tutorials

