import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import { API_URL } from '../config'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`)
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    const token = localStorage.getItem('token')
    if (!token) return
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`)
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      setUser(null)
    }
  }

  const login = async (emailOrUsername, password) => {
    const startTime = performance.now()
    console.log('[Login] Starting login process...')
    
    // Determine if it's an email or username
    const isEmail = emailOrUsername.includes('@')
    const payload = isEmail 
      ? { email: emailOrUsername, password }
      : { username: emailOrUsername, password }
    
    console.log(`[Login] Payload prepared (${(performance.now() - startTime).toFixed(2)}ms)`)
    
    const requestStart = performance.now()
    const response = await axios.post(`${API_URL}/api/auth/login`, payload)
    const requestTime = performance.now() - requestStart
    console.log(`[Login] Server response received in ${requestTime.toFixed(2)}ms`)
    
    const { token, user } = response.data
    localStorage.setItem('token', token)
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    
    const totalTime = performance.now() - startTime
    console.log(`[Login] Login completed successfully in ${totalTime.toFixed(2)}ms`)
    console.log(`[Login] Breakdown: Request=${requestTime.toFixed(2)}ms, Total=${totalTime.toFixed(2)}ms`)
    
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading,
    refreshUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
