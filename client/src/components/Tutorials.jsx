import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

function Tutorials() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner'

  // null = root folder view; object = inside a folder
  const [activeFolder, setActiveFolder] = useState(null)

  const [folders, setFolders] = useState([])
  const [foldersLoading, setFoldersLoading] = useState(true)

  const [videos, setVideos] = useState([])
  const [videosLoading, setVideosLoading] = useState(false)

  // New Folder modal
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [folderError, setFolderError] = useState('')
  const [savingFolder, setSavingFolder] = useState(false)

  // Add Video modal
  const [showAddVideo, setShowAddVideo] = useState(false)
  const [videoForm, setVideoForm] = useState({ title: '', file: null })
  const [videoError, setVideoError] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [])

  useEffect(() => {
    if (activeFolder) fetchVideos(activeFolder.id)
  }, [activeFolder])

  const fetchFolders = async () => {
    setFoldersLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/tutorials/folders`)
      setFolders(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch folders:', err)
      setFolders([])
    } finally {
      setFoldersLoading(false)
    }
  }

  const fetchVideos = async (folderId) => {
    setVideosLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/tutorials`, { params: { folderId } })
      setVideos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('Failed to fetch videos:', err)
      setVideos([])
    } finally {
      setVideosLoading(false)
    }
  }

  const handleCreateFolder = async (e) => {
    e.preventDefault()
    setFolderError('')
    if (!folderName.trim()) { setFolderError('Folder name is required'); return }
    setSavingFolder(true)
    try {
      await axios.post(`${API_URL}/api/tutorials/folders`, { name: folderName.trim() })
      setFolderName('')
      setShowNewFolder(false)
      fetchFolders()
    } catch (err) {
      setFolderError(err.response?.data?.error || 'Failed to create folder')
    } finally {
      setSavingFolder(false)
    }
  }

  const handleDeleteFolder = async (id) => {
    if (!window.confirm('Delete this folder and all its videos? This cannot be undone.')) return
    try {
      await axios.delete(`${API_URL}/api/tutorials/folders/${id}`)
      fetchFolders()
    } catch (err) {
      alert('Failed to delete folder: ' + (err.response?.data?.error || err.message))
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 500 * 1024 * 1024) { setVideoError('File size must be less than 500MB'); return }
    if (!file.type.startsWith('video/')) { setVideoError('Please select a valid video file'); return }
    setVideoForm(prev => ({ ...prev, file }))
    setVideoError('')
  }

  const handleAddVideo = async (e) => {
    e.preventDefault()
    setVideoError('')
    if (!videoForm.title.trim()) { setVideoError('Title is required'); return }
    if (!videoForm.file) { setVideoError('Please select a video file'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('title', videoForm.title.trim())
      formData.append('folderId', activeFolder.id)
      formData.append('video', videoForm.file)
      await axios.post(`${API_URL}/api/tutorials`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setVideoForm({ title: '', file: null })
      setShowAddVideo(false)
      fetchVideos(activeFolder.id)
      // Update folder video count
      fetchFolders()
    } catch (err) {
      setVideoError(err.response?.data?.error || 'Failed to upload video')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteVideo = async (id) => {
    if (!window.confirm('Delete this video?')) return
    try {
      await axios.delete(`${API_URL}/api/tutorials/${id}`)
      fetchVideos(activeFolder.id)
      fetchFolders()
    } catch (err) {
      alert('Failed to delete video: ' + (err.response?.data?.error || err.message))
    }
  }

  const getVideoUrl = (filePath) => {
    const relativePath = filePath.replace(/^.*[\\\/]uploads[\\\/]/, '/uploads/')
    return `${API_URL}${relativePath.replace(/\\/g, '/')}`
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })

  // ─── Root view (folder list) ────────────────────────────────────────────────
  if (!activeFolder) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-gray-900">Tutorials</h2>
          {isOwner && (
            <button
              onClick={() => { setFolderName(''); setFolderError(''); setShowNewFolder(true) }}
              className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
            >
              + New Folder
            </button>
          )}
        </div>

        {/* New Folder Modal */}
        {showNewFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">New Folder</h3>
                <button onClick={() => setShowNewFolder(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
              </div>
              <form onSubmit={handleCreateFolder} className="p-6 space-y-4">
                {folderError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{folderError}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    autoFocus
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                    placeholder="e.g. Onboarding, Kitchen Safety…"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowNewFolder(false)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={savingFolder} className="px-5 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 disabled:opacity-50">
                    {savingFolder ? 'Creating…' : 'Create Folder'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Folder Grid */}
        {foldersLoading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : folders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Folders Yet</h3>
            <p className="text-gray-500">
              {isOwner ? 'Create your first folder to start organising tutorials.' : 'No tutorial folders available yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <button
                  onClick={() => setActiveFolder(folder)}
                  className="w-full p-6 text-left"
                >
                  <div className="text-5xl mb-3">📂</div>
                  <h3 className="text-lg font-bold text-gray-900 truncate">{folder.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {folder.video_count} video{folder.video_count !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">{formatDate(folder.created_at)}</p>
                </button>
                {isOwner && (
                  <div className="px-6 pb-4">
                    <button
                      onClick={() => handleDeleteFolder(folder.id)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Delete folder
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ─── Folder contents view ───────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Breadcrumb + header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setActiveFolder(null)} className="hover:text-brand font-medium">
            Tutorials
          </button>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{activeFolder.name}</span>
        </div>
        {isOwner && (
          <button
            onClick={() => { setVideoForm({ title: '', file: null }); setVideoError(''); setShowAddVideo(true) }}
            className="bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-brand-600 transition-colors shadow-sm"
          >
            + Add Video
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveFolder(null)}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand font-medium"
        >
          ← Back
        </button>
        <h2 className="text-3xl font-bold text-gray-900">{activeFolder.name}</h2>
      </div>

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Add Video</h3>
              <button onClick={() => setShowAddVideo(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">×</button>
            </div>
            <form onSubmit={handleAddVideo} className="p-6 space-y-5">
              {videoError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{videoError}</div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                  placeholder="Enter video title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                />
                {videoForm.file && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: {videoForm.file.name} ({formatFileSize(videoForm.file.size)})
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Max 500MB — MP4, AVI, MOV, WMV, WebM, MKV</p>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddVideo(false)} className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={uploading} className="px-5 py-2 bg-brand text-white rounded-lg hover:bg-brand-600 disabled:opacity-50">
                  {uploading ? 'Uploading…' : 'Upload Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Grid */}
      {videosLoading ? (
        <div className="text-center py-12 text-gray-500">Loading…</div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🎥</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Videos Yet</h3>
          <p className="text-gray-500">
            {isOwner ? 'Click "Add Video" to upload the first video to this folder.' : 'No videos in this folder yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex-1 pr-2">{video.title}</h3>
                  {isOwner && (
                    <button
                      onClick={() => handleDeleteVideo(video.id)}
                      className="text-red-500 hover:text-red-700 text-xl font-bold leading-none"
                      title="Delete video"
                    >
                      ×
                    </button>
                  )}
                </div>
                <video controls className="w-full rounded-lg mb-3" style={{ maxHeight: '240px' }}>
                  <source src={getVideoUrl(video.file_path)} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="text-xs text-gray-400 space-y-0.5">
                  <p>Uploaded by: {video.uploaded_by_name}</p>
                  <p>{formatDate(video.created_at)}{video.file_size ? ` · ${formatFileSize(video.file_size)}` : ''}</p>
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
