import { useState, useEffect } from 'react'
import { API_URL } from '../config'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import MonthlyRoster from './MonthlyRoster'

const BRANCHES = ['Mivida', 'Leven', 'Sodic Villete', 'Arkan', 'Palm Hills']

const SHIFTS = [
  { id: 'morning', label: 'Morning', time: '9:00 – 17:30',  bg: 'bg-amber-50',  text: 'text-amber-800',  border: 'border-amber-200' },
  { id: 'middle',  label: 'Middle',  time: '13:00 – 21:00', bg: 'bg-blue-50',   text: 'text-blue-800',   border: 'border-blue-200' },
  { id: 'night',   label: 'Night',   time: '16:00 – 00:30', bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
]

function Schedule({ staff, readOnly: propReadOnly = false }) {
  const { user } = useAuth()

  const isAreaManager       = user?.role === 'area_manager'
  const isOperationsManager = user?.role === 'operations_manager'
  const readOnly = propReadOnly || isAreaManager || isOperationsManager

  const [currentWeek,      setCurrentWeek]      = useState(new Date())
  const [schedules,        setSchedules]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [selectedCell,     setSelectedCell]     = useState(null)
  const [showStaffPicker,  setShowStaffPicker]  = useState(false)
  const [swapMode,         setSwapMode]         = useState(null)
  const [selectedBranch,   setSelectedBranch]   = useState(null)
  const [submissionStatus, setSubmissionStatus] = useState(null)
  const [submitting,       setSubmitting]       = useState(false)
  const [notifications,    setNotifications]    = useState([])
  const [showNotifications,setShowNotifications]= useState(false)
  const [userBranch,       setUserBranch]       = useState(null)
  const [editMode,         setEditMode]         = useState(false)
  const [branches,         setBranches]         = useState([])
  const [areaManagerBranches, setAreaManagerBranches] = useState([])

  const [viewMode, setViewMode] = useState('weekly')

  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const operationsManagerBranches = branches.length > 0 ? branches.map(b => b.name) : BRANCHES

  // ── Branches ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/branches`)
        if (!Array.isArray(res.data)) { setBranches([]); setAreaManagerBranches([]); return }
        setBranches(res.data)
        if (isAreaManager && user?.area) {
          setAreaManagerBranches(res.data.filter(b => b.area === user.area).map(b => b.name))
        }
      } catch {
        setBranches(BRANCHES.map(name => ({ name, area: null })))
      }
    }
    fetchBranches()
  }, [isAreaManager, user?.area])

  useEffect(() => { if (user?.branch) setUserBranch(user.branch) }, [user])

  // ── Week helpers ──────────────────────────────────────────────────────────
  const getWeekDates = (date) => {
    const start = new Date(date)
    const day = start.getDay()
    start.setDate(start.getDate() - ((day + 1) % 7))
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  const fmt = (date) => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const weekDays = () => {
    const { start } = getWeekDates(currentWeek)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d
    })
  }

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const { start, end } = getWeekDates(currentWeek)
      const res = await axios.get(`${API_URL}/api/schedules`, {
        params: { startDate: fmt(start), endDate: fmt(end) }
      })
      setSchedules(res.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchSubmissionStatus = async () => {
    try {
      const { start } = getWeekDates(currentWeek)
      const res = await axios.get(`${API_URL}/api/schedules/submission-status`, {
        params: { weekStart: fmt(start) }
      })
      setSubmissionStatus(readOnly ? res.data : (res.data[0] || null))
    } catch (err) { console.error(err) }
  }

  const fetchNotifications = async () => {
    if (!readOnly) return
    try {
      const res = await axios.get(`${API_URL}/api/notifications`, { params: { unreadOnly: 'false' } })
      setNotifications(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    fetchSchedules()
    fetchSubmissionStatus()
    if (readOnly) fetchNotifications()
  }, [currentWeek])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handlePublish = async (isEdit = false) => {
    if (schedules.length === 0) { alert('Add at least one staff member before publishing.'); return }
    if (!window.confirm(isEdit ? 'Save changes and re-publish the schedule?' : 'Publish this schedule to your team and management?')) return
    setSubmitting(true)
    try {
      const { start, end } = getWeekDates(currentWeek)
      await axios.post(`${API_URL}/api/schedules/submit`, {
        weekStart: fmt(start), weekEnd: fmt(end), isEdit
      })
      alert(isEdit ? 'Changes saved and published!' : 'Schedule published!')
      fetchSubmissionStatus()
    } catch (err) { alert(err.response?.data?.error || 'Failed to publish') }
    finally { setSubmitting(false) }
  }

  const handleAddStaff = async (staffId) => {
    if (!selectedCell) return
    try {
      await axios.post(`${API_URL}/api/schedules`, {
        staffId, date: fmt(selectedCell.date), shift: selectedCell.shift
      })
      setShowStaffPicker(false)
      setSelectedCell(null)
      fetchSchedules()
    } catch (err) { alert(err.response?.data?.error || 'Failed to add staff') }
  }

  const handleRemoveStaff = async (scheduleId) => {
    if (submissionStatus?.status && !editMode) return
    if (!window.confirm('Remove this staff member from the shift?')) return
    try {
      await axios.delete(`${API_URL}/api/schedules/${scheduleId}`)
      fetchSchedules()
    } catch (err) { alert(err.response?.data?.error || 'Failed to remove staff') }
  }

  const handleStartSwap = (schedule, e) => {
    e.stopPropagation()
    if (submissionStatus?.status && !editMode) return
    setSwapMode({ scheduleId: schedule.id, date: schedule.date, shift: schedule.shift, staffName: schedule.staff_name })
  }

  const handleCompleteSwap = async (targetScheduleId) => {
    if (!swapMode) return
    try {
      await axios.post(`${API_URL}/api/schedules/swap`, { scheduleId1: swapMode.scheduleId, scheduleId2: targetScheduleId })
      setSwapMode(null)
      fetchSchedules()
    } catch (err) { alert(err.response?.data?.error || 'Failed to swap'); setSwapMode(null) }
  }

  const markNotificationRead    = async (id) => { try { await axios.put(`${API_URL}/api/notifications/${id}/read`);   fetchNotifications() } catch {} }
  const markAllNotificationsRead = async ()   => { try { await axios.put(`${API_URL}/api/notifications/read-all`);     fetchNotifications() } catch {} }

  // ── Derived ───────────────────────────────────────────────────────────────
  const days              = weekDays()
  const { start }         = getWeekDates(currentWeek)
  const weekRange         = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  const unreadCount       = notifications.filter(n => !n.is_read).length
  const isMultiBranch     = readOnly || isAreaManager || isOperationsManager
  const showContent       = !isMultiBranch || selectedBranch
  const branchTabList     = isOperationsManager ? operationsManagerBranches : isAreaManager ? areaManagerBranches : BRANCHES
  const canEditWeekly     = !readOnly && (!submissionStatus?.status || editMode)

  const getSubmissionForBranch = (b) => Array.isArray(submissionStatus) ? submissionStatus.find(s => s.branch === b) : null

  const getCellSchedules = (date, shiftId) =>
    schedules.filter(s => {
      const match = s.date === fmt(date) && s.shift === shiftId
      if (isMultiBranch && selectedBranch) return match && s.branch === selectedBranch
      return match
    })

  return (
    <div className="space-y-6">

      {/* Header row */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Schedule</h2>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {['weekly', 'monthly'].map(m => (
              <button key={m} onClick={() => setViewMode(m)}
                className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors
                  ${viewMode === m ? 'bg-brand text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                {m}
              </button>
            ))}
          </div>
        </div>
        {readOnly && (
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors relative">
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Branch selector (HR / ops / area managers) */}
      {isMultiBranch && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
            {readOnly ? '📋 View Only — Schedules are created by Branch Managers'
              : isOperationsManager ? '📋 Operations Manager View'
              : '📋 Area Manager View'}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Location</p>
            <div className="flex flex-wrap gap-2">
              {branchTabList.map(branch => {
                const sub = getSubmissionForBranch(branch)
                return (
                  <button key={branch} onClick={() => setSelectedBranch(branch)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2
                      ${selectedBranch === branch ? 'bg-brand text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {branch}
                    {sub && <span className={`w-2 h-2 rounded-full ${sub.status === 'submitted' ? 'bg-green-400' : sub.status === 'edited' ? 'bg-yellow-400' : 'bg-gray-400'}`} />}
                  </button>
                )
              })}
            </div>
          </div>

          {!selectedBranch && (
            <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              Select a location to view the schedule.
            </p>
          )}

          {selectedBranch && (() => {
            const sub = getSubmissionForBranch(selectedBranch)
            return (
              <div className={`rounded-xl px-4 py-3 flex items-center justify-between border
                ${sub?.status === 'edited' ? 'bg-yellow-50 border-yellow-300'
                  : sub?.status === 'submitted' ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏪</span>
                  <div>
                    <p className="font-semibold text-gray-800">{selectedBranch} Branch Schedule</p>
                    {sub && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {sub.status === 'edited'
                          ? `⚠️ Updated by ${sub.manager_name} on ${new Date(sub.last_edited_at || sub.submitted_at).toLocaleDateString()}`
                          : `✅ Published by ${sub.manager_name} on ${new Date(sub.submitted_at).toLocaleDateString()}`}
                      </p>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium border
                  ${sub?.status === 'edited' ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                    : sub?.status === 'submitted' ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                  {sub?.status === 'edited' ? '⚠ Updated' : sub?.status === 'submitted' ? '✓ Published' : 'Not Published'}
                </span>
              </div>
            )
          })()}
        </div>
      )}

      {showContent && (
        <>
          {/* ── WEEKLY VIEW ─────────────────────────────────────────────── */}
          {viewMode === 'weekly' && (
            <div className="space-y-4">

              {/* Week navigation */}
              <div className="flex flex-wrap justify-center sm:justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentWeek(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">← Prev</button>
                  <button onClick={() => setCurrentWeek(new Date())}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">Today</button>
                  <span className="text-base font-semibold text-gray-700 min-w-[200px] text-center">{weekRange}</span>
                  <button onClick={() => setCurrentWeek(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm">Next →</button>
                </div>

                {/* Publish status bar (managers only) */}
                {!readOnly && (
                  <div className={`flex items-center gap-3 px-4 py-2 rounded-lg border text-sm
                    ${editMode ? 'bg-blue-50 border-blue-200'
                      : submissionStatus?.status === 'submitted' ? 'bg-green-50 border-green-200'
                      : submissionStatus?.status === 'edited'    ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-gray-50 border-gray-200'}`}>
                    <span>
                      {editMode ? '✏️ Editing'
                        : submissionStatus?.status === 'submitted' ? '✅ Published'
                        : submissionStatus?.status === 'edited'    ? '⚠️ Updated'
                        : '📤 Not published'}
                    </span>
                    {!submissionStatus?.status ? (
                      <button onClick={() => handlePublish(false)} disabled={submitting}
                        className="px-4 py-1.5 bg-brand text-white rounded-lg font-semibold text-xs hover:bg-brand-600 disabled:opacity-50">
                        {submitting ? 'Publishing…' : 'Publish'}
                      </button>
                    ) : editMode ? (
                      <button onClick={async () => { await handlePublish(true); setEditMode(false) }} disabled={submitting}
                        className="px-4 py-1.5 bg-green-600 text-white rounded-lg font-semibold text-xs hover:bg-green-700 disabled:opacity-50">
                        {submitting ? 'Saving…' : '✓ Done'}
                      </button>
                    ) : (
                      <button onClick={() => setEditMode(true)}
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-lg font-semibold text-xs hover:bg-blue-700">
                        Edit
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Notifications panel */}
              {readOnly && showNotifications && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900 text-sm">🔔 Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllNotificationsRead} className="text-xs text-brand hover:text-brand-600">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0
                      ? <p className="p-4 text-center text-sm text-gray-400">No notifications</p>
                      : notifications.slice(0, 20).map(n => (
                        <div key={n.id} className={`p-3 flex justify-between items-start ${n.is_read ? 'bg-white' : 'bg-brand-50'}`}>
                          <div>
                            <p className="text-xs text-gray-700">{n.message}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleString()}</p>
                          </div>
                          {!n.is_read && (
                            <button onClick={() => markNotificationRead(n.id)} className="text-xs text-gray-400 hover:text-gray-600 ml-3">✓</button>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Swap banner */}
              {swapMode && !readOnly && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                  <p className="text-sm text-blue-800">
                    <strong>Swap mode:</strong> click another staff member to swap with <strong>{swapMode.staffName}</strong>
                  </p>
                  <button onClick={() => setSwapMode(null)} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700">
                    Cancel
                  </button>
                </div>
              )}

              {/* Schedule grid */}
              {loading ? (
                <div className="text-center py-16 text-gray-400 text-sm">Loading schedule…</div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 whitespace-nowrap">Shift</th>
                          {days.map((date, i) => {
                            const isToday = fmt(date) === fmt(new Date())
                            const isFri   = date.getDay() === 5
                            const isSat   = date.getDay() === 6
                            return (
                              <th key={i} className={`px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide min-w-[130px]
                                ${isToday ? 'bg-brand-50 text-brand' : isFri ? 'text-blue-700' : isSat ? 'text-amber-700' : 'text-gray-500'}`}>
                                <div className={`inline-flex flex-col items-center gap-0.5`}>
                                  <span>{DAY_NAMES[date.getDay()].slice(0, 3)}</span>
                                  <span className={`text-base font-bold ${isToday ? 'w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center' : ''}`}>
                                    {date.getDate()}
                                  </span>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {SHIFTS.map(shift => (
                          <tr key={shift.id}>
                            {/* Shift label */}
                            <td className="px-4 py-3 bg-gray-50 align-top whitespace-nowrap">
                              <div className={`inline-flex flex-col px-3 py-2 rounded-lg border text-xs ${shift.bg} ${shift.text} ${shift.border}`}>
                                <span className="font-bold">{shift.label}</span>
                                <span className="opacity-70 font-normal mt-0.5">{shift.time}</span>
                              </div>
                            </td>
                            {/* Day cells */}
                            {days.map((date, di) => {
                              const cell      = getCellSchedules(date, shift.id)
                              const clickable = canEditWeekly
                              return (
                                <td key={di}
                                  onClick={() => { if (!clickable) return; setSelectedCell({ date, shift: shift.id }); setShowStaffPicker(true) }}
                                  className={`px-2 py-2 align-top border-l border-gray-100 min-h-[80px]
                                    ${clickable ? 'cursor-pointer hover:bg-gray-50' : ''}
                                    ${!canEditWeekly && submissionStatus?.status ? 'bg-gray-50/50' : ''}`}>
                                  <div className="space-y-1 min-h-[60px]">
                                    {cell.map(s => {
                                      const isSwapSrc = swapMode?.scheduleId === s.id
                                      const isSwapTgt = swapMode && swapMode.scheduleId !== s.id && s.date === fmt(date) && s.shift === shift.id
                                      return (
                                        <div key={s.id}
                                          onClick={e => { e.stopPropagation(); if (swapMode && isSwapTgt) handleCompleteSwap(s.id) }}
                                          className={`group flex items-center justify-between gap-1 px-2 py-1.5 rounded-lg border text-xs
                                            ${shift.bg} ${shift.border}
                                            ${isSwapSrc ? 'ring-2 ring-brand ring-offset-1' : ''}
                                            ${isSwapTgt ? 'ring-2 ring-blue-400 ring-offset-1 cursor-pointer' : ''}`}>
                                          <div className="flex-1 min-w-0">
                                            <p className={`font-semibold truncate ${shift.text}`}>{s.staff_name}</p>
                                            {s.title && <p className="text-gray-400 truncate">{s.title}</p>}
                                          </div>
                                          {canEditWeekly && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                              {!swapMode && (
                                                <button onClick={e => handleStartSwap(s, e)}
                                                  title="Swap" className="text-blue-500 hover:text-blue-700 text-sm font-bold leading-none">⇄</button>
                                              )}
                                              <button onClick={e => { e.stopPropagation(); handleRemoveStaff(s.id) }}
                                                title="Remove" className="text-red-400 hover:text-red-600 text-base font-bold leading-none">×</button>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                    {cell.length === 0 && (
                                      <div className="flex items-center justify-center h-10 text-gray-300 text-xs">
                                        {clickable ? '+ add' : '—'}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── MONTHLY VIEW ───────────────────────────────────────────── */}
          {viewMode === 'monthly' && (
            <MonthlyRoster staff={staff} selectedBranch={selectedBranch} readOnly={readOnly} />
          )}
        </>
      )}

      {/* ── Staff picker modal ──────────────────────────────────────── */}
      {showStaffPicker && selectedCell && !readOnly && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col max-h-[85vh]">
            {/* Modal header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900">Add Staff</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {SHIFTS.find(s => s.id === selectedCell.shift)?.label} shift ·{' '}
                  {selectedCell.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <button onClick={() => { setShowStaffPicker(false); setSelectedCell(null) }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-light leading-none">×</button>
            </div>

            {/* Staff list */}
            <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
              {!Array.isArray(staff) || staff.length === 0
                ? <p className="text-center text-sm text-gray-400 py-6">No staff available</p>
                : staff.filter(s => !['Area Manager','Operations Manager'].includes(s.title) && !['area_manager','operations_manager'].includes(s.role)).map(member => {
                  const already = schedules.some(s =>
                    s.staff_id === member.id &&
                    s.date === fmt(selectedCell.date) &&
                    s.shift === selectedCell.shift
                  )
                  return (
                    <button key={member.id} onClick={() => !already && handleAddStaff(member.id)} disabled={already}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors
                        ${already ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:bg-brand-50 hover:border-brand-200'}`}>
                      <p className="font-semibold text-sm text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{member.title || ''} {member.employeeCode ? `· ${member.employeeCode}` : ''}</p>
                      {already && <p className="text-xs text-gray-400 mt-0.5">Already scheduled</p>}
                    </button>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedule
