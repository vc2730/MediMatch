/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'

const ThemeContext = createContext({ theme: 'system', setTheme: () => {}, resolvedTheme: 'light' })

const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const getStoredTheme = () => {
  if (typeof window === 'undefined') return 'system'
  return localStorage.getItem('theme') || 'system'
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getStoredTheme)
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  useEffect(() => {
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => setSystemTheme(media.matches ? 'dark' : 'light')

    if (media.addEventListener) {
      media.addEventListener('change', updateTheme)
      return () => media.removeEventListener('change', updateTheme)
    }

    media.addListener(updateTheme)
    return () => media.removeListener(updateTheme)
  }, [])

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolvedTheme])

  const value = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, resolvedTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)
