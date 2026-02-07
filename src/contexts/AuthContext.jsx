import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthChange, getUserProfile as getProfile, signOutUser } from '../services/auth'

/**
 * AuthContext - Manages user authentication state with Firebase
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

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // User is signed in, get their profile from Firestore
          const profile = await getProfile(firebaseUser.uid)
          setUser(firebaseUser)
          setUserProfile(profile)

          // Also store in localStorage for backward compatibility with demo data
          localStorage.setItem('currentPatientId', firebaseUser.uid)
          localStorage.setItem('currentDoctorId', firebaseUser.uid)
          localStorage.setItem('userRole', profile.role)
        } catch (error) {
          console.error('Error loading user profile:', error)
          setUser(null)
          setUserProfile(null)
        }
      } else {
        // User is signed out
        setUser(null)
        setUserProfile(null)
      }
      setLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const login = (uid, role, profile) => {
    // This is called after successful authentication
    // The onAuthChange listener will handle setting the state
    if (role === 'patient') {
      localStorage.setItem('currentPatientId', uid)
    } else if (role === 'doctor') {
      localStorage.setItem('currentDoctorId', uid)
    }
    localStorage.setItem('userRole', role)
  }

  const logout = async () => {
    try {
      await signOutUser()
      localStorage.removeItem('currentPatientId')
      localStorage.removeItem('currentDoctorId')
      localStorage.removeItem('userRole')
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
    loading,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
