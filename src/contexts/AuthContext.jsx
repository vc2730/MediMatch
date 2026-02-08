/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, getUserProfile as getProfile, signOutUser } from '../services/auth'
import { DEMO_PATIENTS, DEMO_DOCTORS } from '../services/seedData'

/**
 * AuthContext - Manages user authentication state with Firebase
 * Supports demo mode for hackathon presentations
 */

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isDemoMode, setIsDemoMode] = useState(false)

  useEffect(() => {
    // Check if we're resuming a demo session from localStorage
    const storedDemo = localStorage.getItem('isDemoMode')
    const storedRole = localStorage.getItem('userRole')
    const storedId = storedRole === 'patient'
      ? localStorage.getItem('currentPatientId')
      : localStorage.getItem('currentDoctorId')

    if (storedDemo === 'true' && storedId) {
      const demoData = storedRole === 'patient'
        ? DEMO_PATIENTS.find(p => p.id === storedId) || DEMO_PATIENTS[0]
        : DEMO_DOCTORS.find(d => d.id === storedId) || DEMO_DOCTORS[0]

      setUser({ uid: demoData.id, email: demoData.email, isDemo: true })
      setUserProfile({ ...demoData, id: demoData.id })
      setIsDemoMode(true)
      setLoading(false)
      return
    }

    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getProfile(firebaseUser.uid)
          setUser(firebaseUser)
          setUserProfile(profile)
          setIsDemoMode(false)

          if (profile?.role === 'patient') {
            localStorage.setItem('currentPatientId', firebaseUser.uid)
          } else if (profile?.role === 'doctor') {
            localStorage.setItem('currentDoctorId', firebaseUser.uid)
            const name = profile?.fullName || profile?.name || 'Doctor'
            localStorage.setItem('loggedInDoctor', JSON.stringify({ doctorId: firebaseUser.uid, doctorName: name }))
            localStorage.setItem('activeDemoDoctor', JSON.stringify({ doctorId: firebaseUser.uid, doctorName: name }))
          }
          localStorage.setItem('userRole', profile?.role || '')
          localStorage.removeItem('isDemoMode')
        } catch (error) {
          console.error('Error loading user profile:', error)
          // Don't clear user state if profile fetch fails — user is still authed
          // Just set the firebase user without profile so they can still navigate
          setUser(firebaseUser)
        }
      } else {
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  /**
   * Log in as a demo user (no Firebase auth needed)
   * @param {'patient'|'doctor'} role
   * @param {number} index - Which demo user to use (default 0)
   */
  const loginDemo = (role, index = 0) => {
    const demoData = role === 'patient'
      ? DEMO_PATIENTS[index] || DEMO_PATIENTS[0]
      : DEMO_DOCTORS[index] || DEMO_DOCTORS[0]

    setUser({ uid: demoData.id, email: demoData.email, isDemo: true })
    setUserProfile({ ...demoData, id: demoData.id })
    setIsDemoMode(true)
    setLoading(false)

    localStorage.setItem('isDemoMode', 'true')
    localStorage.setItem('userRole', role)
    if (role === 'patient') {
      localStorage.setItem('currentPatientId', demoData.id)
    } else {
      localStorage.setItem('currentDoctorId', demoData.id)
    }
  }

  const login = (uid, role, profile = null) => {
    // Set auth state immediately so ProtectedRoute doesn't redirect while
    // waiting for the onAuthChange listener to fire
    if (profile) {
      setUser({ uid, email: profile.email, isDemo: false })
      setUserProfile({ ...profile, id: uid, role })
    }
    setIsDemoMode(false)
    if (role === 'patient') {
      localStorage.setItem('currentPatientId', uid)
    } else if (role === 'doctor') {
      localStorage.setItem('currentDoctorId', uid)
      // Write loggedInDoctor immediately so patient pages can detect it
      const name = profile?.fullName || profile?.name || 'Doctor'
      localStorage.setItem('loggedInDoctor', JSON.stringify({ doctorId: uid, doctorName: name }))
      localStorage.setItem('activeDemoDoctor', JSON.stringify({ doctorId: uid, doctorName: name }))
    }
    localStorage.setItem('userRole', role)
    localStorage.removeItem('isDemoMode')
  }

  const logout = async () => {
    try {
      if (!isDemoMode) {
        await signOutUser()
      }
      setUser(null)
      setUserProfile(null)
      setIsDemoMode(false)
      localStorage.removeItem('currentPatientId')
      localStorage.removeItem('currentDoctorId')
      localStorage.removeItem('userRole')
      localStorage.removeItem('isDemoMode')
      localStorage.removeItem('loggedInDoctor')
      localStorage.removeItem('activeDemoDoctor')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    userId: user?.uid || null,
    userProfile,
    userRole: userProfile?.role || null,
    isAuthenticated: !!user,
    isPatient: userProfile?.role === 'patient',
    isDoctor: userProfile?.role === 'doctor',
    isDemoMode,
    loading,
    login,
    loginDemo,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
