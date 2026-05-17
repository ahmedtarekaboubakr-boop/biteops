import { useState, useEffect, useCallback, useRef } from 'react'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const STATUSES = [
  { code: 'P',  label: 'Present',      bg: 'bg-green-100',  text: 'text-green-800',  border: 'border-green-300' },
  { code: 'O',  label: 'Day Off',      bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  { code: 'A',  label: 'Absent',       bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-300' },
  { code: 'X',  label: 'Absent (X)',   bg: 'bg-red-200',    text: 'text-red-900',    border: 'border-red-400' },
  { code: 'C',  label: 'Catering',     bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  { code: 'H',  label: 'Holiday',      bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-300' },
  { code: 'V',  label: 'Vacation',     bg: 'bg-teal-100',   text: 'text-teal-700',   border: 'border-teal-300' },
  { code: 'SL', label: 'Sick Leave',   bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-300' },
]

function statusStyle(code) {
  return STATUSES.find(s => s.code === code) || null
}

function MonthlyRoster({ staff = [], selectedBranch, readOnly }) {
  const { user } = useAuth()
  const isManager = user?.role === 'manager'

  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [entries, setEntries]       = useState({})    // `${staffId}-${day}` → code
  const [saving, setSaving]         = useState({})    // `${staffId}-${day}` → bool
  const [submission, setSubmission] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [editMode, setEditMode]     = useState(false)

  // Picker popup state
  const [picker, setPicker] = useState(null)   // { staffId, day, x, y }
  const pickerRef = useRef(null)

  const year  = currentMonth.getFullYear()
  const month = currentMonth.getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const branch = isManager ? user?.branch : selectedBranch
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchRoster = useCallback(async () => {
    if (!branch) return
    try {
      const params = { year, month }
      if (!isManager) params.branch = branch
      const res = await axios.get(`${API_URL}/api/monthly-roster`, { params })
      const map = {}
      res.data.forEach(e => { map[`${e.staff_id}-${e.day}`] = e.status })
      setEntries(map)
    } catch (err) { console.error('Failed to fetch roster:', err) }
  }, [branch, year, month, isManager])

  const fetchSubmission = useCallback(async () => {
    if (!branch) return
    try {
      const params = { year, month }
      if (!isManager) params.branch = branch
      const res = await axios.get(`${API_URL}/api/monthly-roster/submission-status`, { params })
      setSubmission(res.data)
    } catch (err) { console.error('Failed to fetch submission:', err) }
  }, [branch, year, month, isManager])

  useEffect(() => {
    setEntries({})
    setSubmission(null)
    setEditMode(false)
    setPicker(null)
    fetchRoster()
    fetchSubmission()
  }, [fetchRoster, fetchSubmission])

  // Close picker on outside click
  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setPicker(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Open picker ─────────────────────────────────────────────────────────────
  const handleCellClick = (staffId, day, e) => {
    if (readOnly) return
    if (submission?.status === 'submitted' && !editMode) return
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setPicker({ staffId, day, top: rect.bottom + window.scrollY, left: rect.left + window.scrollX })
  }

  // ── Pick a status ────────────────────────────────────────────────────────────
  const applyStatus = async (code) => {
    if (!picker) return
    const { staffId, day } = picker
    const key = `${staffId}-${day}`
    const prev = entries[key]
    setPicker(null)

    setEntries(p => { const n = { ...p }; if (code === null) delete n[key]; else n[key] = code; return n })
    setSaving(p => ({ ...p, [key]: true }))
    try {
      if (code === null) {
        await axios.delete(`${API_URL}/api/monthly-roster/entry`, { data: { staffId, year, month, day } })
      } else {
        await axios.put(`${API_URL}/api/monthly-roster/entry`, { staffId, year, month, day, status: code })
      }
    } catch (err) {
      setEntries(p => { const n = { ...p }; if (prev === undefined) delete n[key]; else n[key] = prev; return n })
      alert(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(p => { const n = { ...p }; delete n[key]; return n })
    }
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!window.confirm(`${submission ? 'Re-submit' : 'Submit'} the roster for ${monthLabel}? HR will be notified.`)) return
    setSubmitting(true)
    try {
      await axios.post(`${API_URL}/api/monthly-roster/submit`, { year, month })
      alert(`Roster ${submission ? 'updated' : 'submitted'} successfully!`)
      setEditMode(false)
      fetchSubmission()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1)
    return { num: i + 1, abbr: DAY_ABBR[d.getDay()] }
  })

  const canEdit = !readOnly && (!submission?.status || editMode)
  const rosterStaff = staff.filter(s => {
    if (s.title === 'Area Manager' || s.title === 'Operations Manager') return false
    // Managers already receive only their branch's staff from the parent
    if (isManager) return true
    // For HR/Owner: filter by the selected branch
    if (!branch) return false
    return s.branch?.trim().toLowerCase() === branch.trim().toLowerCase()
  })

  if (!branch) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-800 text-sm">
        Select a branch to view the monthly roster.
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* Picker popup (portal-like, position: fixed) */}
      {picker && (
        <div
          ref={pickerRef}
          style={{ position: 'fixed', top: picker.top, left: picker.left, zIndex: 9999 }}
          className="bg-white border border-gray-200 rounded-xl shadow-xl p-2 flex flex-wrap gap-1.5 max-w-[220px]"
        >
          {STATUSES.map(s => (
            <button
              key={s.code}
              onClick={() => applyStatus(s.code)}
              className={`px-2.5 py-1 rounded-lg border font-bold text-xs transition-opacity hover:opacity-80 ${s.bg} ${s.text} ${s.border}`}
              title={s.label}
            >
              {s.code}
            </button>
          ))}
          <button
            onClick={() => applyStatus(null)}
            className="px-2.5 py-1 rounded-lg border border-gray-300 text-gray-500 text-xs hover:bg-gray-100"
            title="Clear"
          >
            ✕
          </button>
        </div>
      )}

      {/* Month nav + actions */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">← Prev</button>
          <button onClick={() => setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">This Month</button>
          <span className="text-lg font-semibold text-gray-800 min-w-[180px] text-center">{monthLabel}</span>
          <button onClick={() => setCurrentMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Next →</button>
        </div>

        <div className="flex items-center gap-3">
          {submission && (
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${submission.status === 'submitted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {submission.status === 'submitted' ? '✓ Submitted' : '⚠ Updated after submit'}
            </span>
          )}
          {!readOnly && submission?.status === 'submitted' && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">
              ✏️ Edit
            </button>
          )}
          {!readOnly && (canEdit || editMode) && (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-5 py-2 bg-brand text-white rounded-lg font-semibold hover:bg-brand-600 disabled:opacity-50 text-sm">
              {submitting ? 'Submitting…' : submission ? '🔄 Re-submit' : '📤 Submit to HR'}
            </button>
          )}
        </div>
      </div>

      {/* Submitted notice */}
      {submission?.status === 'submitted' && !editMode && !readOnly && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-800">
          ✅ Roster submitted. Click <strong>Edit</strong> to make changes and re-submit.
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {STATUSES.map(s => (
          <span key={s.code} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${s.bg} ${s.text} ${s.border}`}>
            <strong>{s.code}</strong> — {s.label}
          </span>
        ))}
        {canEdit && <span className="text-xs text-gray-400 italic self-center ml-1">Click a cell to set status</span>}
      </div>

      {/* Grid */}
      {rosterStaff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">No staff found for this branch.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="sticky left-0 z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border border-gray-200 min-w-[140px] whitespace-nowrap">Name</th>
                  <th className="sticky left-[140px] z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border border-gray-200 min-w-[110px] whitespace-nowrap">Position</th>
                  <th className="sticky left-[250px] z-20 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-600 border border-gray-200 min-w-[70px] whitespace-nowrap">Code</th>
                  {days.map(d => (
                    <th key={d.num}
                      className={`px-1 py-1 text-center font-semibold border border-gray-200 min-w-[36px]
                        ${d.abbr === 'Fri' ? 'bg-blue-50 text-blue-700' : d.abbr === 'Sat' ? 'bg-amber-50 text-amber-700' : 'text-gray-600'}`}>
                      <div className="font-bold leading-tight">{d.num}</div>
                      <div className="font-normal text-gray-400 leading-tight">{d.abbr}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rosterStaff.map((member, ri) => {
                  const rowBg = ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  return (
                    <tr key={member.id} className={rowBg}>
                      <td className={`sticky left-0 z-10 px-3 py-1.5 border border-gray-200 font-medium text-gray-900 whitespace-nowrap truncate max-w-[140px] ${rowBg}`}>{member.name}</td>
                      <td className={`sticky left-[140px] z-10 px-3 py-1.5 border border-gray-200 text-gray-600 whitespace-nowrap truncate max-w-[110px] ${rowBg}`}>{member.title || '—'}</td>
                      <td className={`sticky left-[250px] z-10 px-3 py-1.5 border border-gray-200 text-gray-500 whitespace-nowrap ${rowBg}`}>{member.employeeCode || '—'}</td>
                      {days.map(d => {
                        const key = `${member.id}-${d.num}`
                        const val = entries[key]
                        const isSaving = saving[key]
                        const st = val ? statusStyle(val) : null
                        const isWeekend = d.abbr === 'Fri' || d.abbr === 'Sat'
                        return (
                          <td
                            key={d.num}
                            onClick={(e) => handleCellClick(member.id, d.num, e)}
                            className={`border border-gray-200 text-center font-bold transition-colors select-none h-7
                              ${canEdit ? 'cursor-pointer' : ''}
                              ${isSaving ? 'opacity-40' : ''}
                              ${st ? `${st.bg} ${st.text}` : isWeekend ? (d.abbr === 'Fri' ? 'bg-blue-50' : 'bg-amber-50') : ''}
                              ${canEdit && !st ? 'hover:bg-gray-100' : ''}
                            `}
                          >
                            {isSaving ? '…' : (val || '')}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default MonthlyRoster
