import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../providers/AuthProvider'

const ProtectedRoute = ({ allowedRole, children }) => {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'patient' ? '/patient' : '/'} replace />
  }

  return children
}

export default ProtectedRoute
