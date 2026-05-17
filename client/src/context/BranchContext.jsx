import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuth } from './AuthContext'

const BranchContext = createContext({
  branches: [],
  branchNames: [],
  refreshBranches: () => {},
  loading: false
})

export function useBranches() {
  return useContext(BranchContext)
}

export function BranchProvider({ children }) {
  const { user } = useAuth()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchBranches = async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await axios.get(`${API_URL}/api/branches`)
      setBranches(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error('BranchContext: failed to fetch branches', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBranches()
    } else {
      setBranches([])
    }
  }, [user?.id])

  const branchNames = branches.map(b => b.name)

  return (
    <BranchContext.Provider value={{ branches, branchNames, refreshBranches: fetchBranches, loading }}>
      {children}
    </BranchContext.Provider>
  )
}
