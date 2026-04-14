import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const TITLES = ['Crew', 'Cashier', 'Line Leader', 'Supervisor', 'Assistant Manager', 'Branch Manager', 'Area Manager', 'Operations Manager']

function StaffForm({ staff, onClose, onSuccess }) {
  const { user } = useAuth()
  const isHR = user?.role === 'hr_manager'
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    dateOfBirth: '',
    employeeCode: '',
    title: '',
    phoneNumber: '',
    idNumber: '',
    startDate: '',
    payrollInfo: '',
    branch: '',
    salary: '',
    totalLeaveDays: '',
    area: ''
  })
  const [branches, setBranches] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [certificateFile, setCertificateFile] = useState(null)
  const [certificatePreview, setCertificatePreview] = useState(null)
  const [uploadingCertificate, setUploadingCertificate] = useState(false)
  const [employmentHistory, setEmploymentHistory] = useState([])
  const [manOfTheMonthCount, setManOfTheMonthCount] = useState(0)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    fetchBranches()
    if (staff?.id) {
      fetchEmploymentHistory()
    }
  }, [])

  const fetchBranches = async () => {
    try {
      // Try to fetch from branches API (for HR)
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/branches`)
        setBranches(response.data.map(b => b.name))
      } catch (err) {
        // If not HR or API fails, fall back to getting unique branches from users
        const staffResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/staff`)
        const uniqueBranches = [...new Set(staffResponse.data.map(s => s.branch).filter(Boolean))]
        setBranches(uniqueBranches.length > 0 ? uniqueBranches : ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills', 'Multi-Branch'])
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error)
      // Fallback to default branches
      setBranches(['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills', 'Multi-Branch'])
    }
  }

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || '',
        username: staff.username || '',
        password: '', // Don't pre-fill password for security
        dateOfBirth: staff.dateOfBirth || '',
        employeeCode: staff.employeeCode || '',
        title: staff.title || '',
        phoneNumber: staff.phoneNumber || '',
        idNumber: staff.idNumber || '',
        startDate: staff.startDate || '',
        payrollInfo: staff.payrollInfo || '',
        branch: staff.title === 'Area Manager' ? '' : (staff.branch || ''), // Clear branch for Area Managers
        salary: staff.salary || '',
        totalLeaveDays: staff.totalLeaveDays || '',
        area: staff.area || ''
      })
      if (staff.photo) {
        // If photo is a relative path, prepend the base URL
        const photoUrl = staff.photo.startsWith('http') ? staff.photo : staff.photo
        setPhotoPreview(photoUrl)
      }
      if (staff.healthCertificate) {
        setCertificatePreview(staff.healthCertificate)
      }
    } else if (user?.role === 'manager' && user?.branch && formData.title !== 'Area Manager') {
      // Auto-fill branch for managers when creating new staff (but not for Area Managers)
      setFormData(prev => ({
        ...prev,
        branch: user.branch
      }))
    }
  }, [staff, user])

  const fetchEmploymentHistory = async () => {
    if (!staff?.id) return
    try {
      const response = await axios.get(`/api/staff/${staff.id}/employment-history`)
      setEmploymentHistory(response.data.history || response.data || [])
      setManOfTheMonthCount(response.data.manOfTheMonthCount || 0)
    } catch (error) {
      console.error('Failed to fetch employment history:', error)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size must be less than 5MB')
        return
      }
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadPhoto = async () => {
    if (!photoFile || !staff?.id) return
    
    setUploadingPhoto(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('photo', photoFile)
      
      const response = await axios.post(`/api/staff/${staff.id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setPhotoPreview(response.data.photo)
      setPhotoFile(null)
      alert('Photo uploaded successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleCertificateChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Certificate size must be less than 10MB')
        return
      }
      setCertificateFile(file)
      // For PDFs, we can't preview, but for images we can
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setCertificatePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else {
        setCertificatePreview(file.name)
      }
    }
  }

  const handleUploadCertificate = async () => {
    if (!certificateFile || !staff?.id) return
    
    setUploadingCertificate(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('certificate', certificateFile)
      
      const response = await axios.post(`/api/staff/${staff.id}/health-certificate`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      setCertificatePreview(response.data.healthCertificate)
      setCertificateFile(null)
      alert('Health certificate uploaded successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload health certificate')
    } finally {
      setUploadingCertificate(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    // If title changes to Area Manager, clear branch field
    if (name === 'title' && value === 'Area Manager') {
      setFormData({
        ...formData,
        [name]: value,
        branch: '' // Clear branch for Area Managers
      })
    } else if (name === 'title' && value !== 'Area Manager') {
      // If title changes away from Area Manager, clear the area field
      setFormData({
        ...formData,
        [name]: value,
        area: ''
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate area is required for Area Managers
    if (formData.title === 'Area Manager' && !formData.area) {
      setError('Area is required when selecting Area Manager as title')
      return
    }
    
    setLoading(true)

    try {
      if (staff) {
        // For updates, only send password if it's been changed
        const updateData = { ...formData }
        if (!updateData.password) {
          delete updateData.password
        }
        // Convert salary to number if provided
        if (updateData.salary) {
          updateData.salary = parseFloat(updateData.salary)
        }
        // Convert totalLeaveDays to number if provided
        if (updateData.totalLeaveDays) {
          updateData.totalLeaveDays = parseInt(updateData.totalLeaveDays) || 0
        }
        await axios.put(`/api/staff/${staff.id}`, updateData)
        
        // Upload photo separately if a new one was selected
        if (photoFile) {
          await handleUploadPhoto()
        }
        // Upload certificate separately if a new one was selected
        if (certificateFile) {
          await handleUploadCertificate()
        }
      } else {
        // Convert salary to number if provided
        const submitData = { ...formData }
        if (submitData.salary) {
          submitData.salary = parseFloat(submitData.salary)
        }
        // Convert totalLeaveDays to number if provided
        if (submitData.totalLeaveDays) {
          submitData.totalLeaveDays = parseInt(submitData.totalLeaveDays) || 0
        }
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/staff`, submitData)
        
        // Upload photo if provided for new staff
        if (photoFile && response.data.id) {
          const formDataPhoto = new FormData()
          formDataPhoto.append('photo', photoFile)
          await axios.post(`/api/staff/${response.data.id}/photo`, formDataPhoto, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        }
        // Upload certificate if provided for new staff
        if (certificateFile && response.data.id) {
          const formDataCert = new FormData()
          formDataCert.append('certificate', certificateFile)
          await axios.post(`/api/staff/${response.data.id}/health-certificate`, formDataCert, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        }
      }
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save staff profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900">
              {staff ? 'Edit Staff Profile' : 'Create Staff Profile'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee Photo
            </label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <div className="relative">
                  <img 
                    src={photoPreview.startsWith('data:') ? photoPreview : photoPreview} 
                    alt="Preview" 
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                  />
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-600"
                />
                {staff && photoFile && (
                  <button
                    type="button"
                    onClick={handleUploadPhoto}
                    disabled={uploadingPhoto}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Health Certificate Upload Section */}
          <div className="border-b border-gray-200 pb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Health Certificate <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {certificatePreview && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {certificatePreview.startsWith('data:') || certificatePreview.startsWith('/uploads/') ? (
                    <>
                      {certificatePreview.includes('.pdf') || certificatePreview.endsWith('.pdf') ? (
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📄</span>
                          <span className="text-sm text-gray-700">PDF Certificate</span>
                        </div>
                      ) : (
                        <img 
                          src={certificatePreview} 
                          alt="Certificate Preview" 
                          className="w-20 h-20 object-cover border-2 border-gray-300 rounded"
                        />
                      )}
                      <a
                        href={certificatePreview}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded text-sm font-semibold hover:bg-blue-700"
                      >
                        View Certificate
                      </a>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">📄</span>
                      <span className="text-sm text-gray-700">{certificatePreview}</span>
                    </div>
                  )}
                </div>
              )}
              <div>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
                  onChange={handleCertificateChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand file:text-white hover:file:bg-brand-600"
                />
                <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, JPG, PNG, GIF, WEBP (Max 10MB)</p>
                {staff && certificateFile && (
                  <button
                    type="button"
                    onClick={handleUploadCertificate}
                    disabled={uploadingCertificate}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploadingCertificate ? 'Uploading...' : 'Upload Certificate'}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Enter staff's full name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Enter username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password {!staff && <span className="text-red-500">*</span>}
                {staff && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required={!staff}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder={staff ? "Enter new password (optional)" : "Enter password"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="employeeCode" className="block text-sm font-medium text-gray-700 mb-2">
                Employee Code <span className="text-red-500">*</span>
              </label>
              <input
                id="employeeCode"
                name="employeeCode"
                type="text"
                value={formData.employeeCode}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="e.g., STF001"
              />
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <select
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
            >
              <option value="">Select title</option>
              {TITLES.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* Area field - only shown when Area Manager is selected */}
          {formData.title === 'Area Manager' && (
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Area <span className="text-red-500">*</span>
              </label>
              <select
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              >
                <option value="">Select area</option>
                <option value="Fifth Settlement">Fifth Settlement</option>
                <option value="6th of October">6th of October</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="e.g., 01xxxxxxxxx"
              />
            </div>

            <div>
              <label htmlFor="idNumber" className="block text-sm font-medium text-gray-700 mb-2">
                ID Number <span className="text-red-500">*</span>
              </label>
              <input
                id="idNumber"
                name="idNumber"
                type="text"
                value={formData.idNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="National ID Number"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>

            {/* Branch field - hidden for Area Managers */}
            {formData.title !== 'Area Manager' && (
              <div>
                <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-2">
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  id="branch"
                  name="branch"
                  value={formData.branch}
                  onChange={handleChange}
                  required
                  disabled={user?.role === 'manager' && !staff} // Disable for managers when creating (auto-filled)
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select branch</option>
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
                {user?.role === 'manager' && !staff && (
                  <p className="mt-1 text-xs text-gray-500">Branch is automatically set to your branch</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-2">
                Salary {isHR && <span className="text-red-500">*</span>}
              </label>
              <input
                id="salary"
                name="salary"
                type="number"
                step="0.01"
                min="0"
                value={formData.salary}
                onChange={handleChange}
                required={isHR}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Enter salary amount"
              />
            </div>
            <div>
              <label htmlFor="totalLeaveDays" className="block text-sm font-medium text-gray-700 mb-2">
                Total Days Off {isHR && <span className="text-red-500">*</span>}
              </label>
              <input
                id="totalLeaveDays"
                name="totalLeaveDays"
                type="number"
                min="0"
                step="1"
                value={formData.totalLeaveDays}
                onChange={handleChange}
                required={isHR}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
                placeholder="Enter total leave days (e.g., 20)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="payrollInfo" className="block text-sm font-medium text-gray-700 mb-2">
              Payroll Information
            </label>
            <textarea
              id="payrollInfo"
              name="payrollInfo"
              value={formData.payrollInfo}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent"
              placeholder="Enter payroll details (bank account, etc.)"
            />
          </div>

          {/* Employment History Section (only when editing) */}
          {staff && isHR && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">Employment History</h4>
                  {manOfTheMonthCount > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      🏆 Man of the Month: <span className="font-semibold text-brand">{manOfTheMonthCount} time{manOfTheMonthCount !== 1 ? 's' : ''}</span>
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(!showHistory)}
                  className="text-sm text-brand hover:text-brand-600 font-medium"
                >
                  {showHistory ? 'Hide' : 'Show'} History
                </button>
              </div>
              {showHistory && (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {employmentHistory.length === 0 ? (
                    <p className="text-gray-500 text-sm">No employment history recorded yet.</p>
                  ) : (
                    employmentHistory.map((entry) => (
                      <div key={entry.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">
                              {entry.change_type === 'deactivation' 
                                ? `Left on ${new Date(entry.change_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`
                                : entry.previous_title 
                                  ? `${entry.previous_title} → ${entry.new_title}` 
                                  : `Started as ${entry.new_title}`}
                            </p>
                            {entry.change_type !== 'deactivation' && (
                              <p className="text-gray-600 text-xs mt-1">
                                {new Date(entry.change_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            )}
                            {entry.notes && (
                              <p className="text-gray-500 text-xs mt-1">{entry.notes}</p>
                            )}
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.change_type === 'deactivation' 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {entry.change_type === 'deactivation' ? 'Left' : entry.change_type}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : staff ? 'Update Profile' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffForm

