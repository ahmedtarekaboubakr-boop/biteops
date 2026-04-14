import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Login'
import OwnerDashboard from './components/OwnerDashboard'
import ManagerDashboard from './components/ManagerDashboard'
import StaffDashboard from './components/StaffDashboard'
import TabletClock from './components/TabletClock'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'owner' ? <OwnerDashboard /> : ['manager', 'hr_manager', 'operations_manager', 'area_manager'].includes(user?.role) ? <ManagerDashboard /> : user?.role === 'staff' ? <StaffDashboard /> : <Navigate to="/login" replace />}
          </ProtectedRoute>
        }
      />
      <Route path="/tablet" element={<TabletClock />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
