/* eslint-disable react-refresh/only-export-components */
/**
 * @deprecated This file is no longer used. Use /src/contexts/AuthContext.jsx instead.
 * This is kept for reference only and should not be imported.
 */
import React, { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {} })

const getStoredUser = () => {
  const stored = localStorage.getItem('auth')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    localStorage.removeItem('auth')
    return null
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getStoredUser)

  const login = (role, email) => {
    const nextUser = { role, email }
    localStorage.setItem('auth', JSON.stringify(nextUser))
    setUser(nextUser)
  }

  const logout = () => {
    localStorage.removeItem('auth')
    setUser(null)
  }

  const value = useMemo(() => ({ user, login, logout }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
