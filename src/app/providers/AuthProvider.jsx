import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext({ user: null, login: () => {}, logout: () => {} })

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('auth')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('auth')
      }
    }
  }, [])

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
