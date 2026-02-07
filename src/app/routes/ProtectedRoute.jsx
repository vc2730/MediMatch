import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const ProtectedRoute = ({ allowedRole, children }) => {
  const { user, userRole, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'patient' ? '/patient/dashboard' : '/doctor/dashboard'} replace />
  }

  return children
}

export default ProtectedRoute
