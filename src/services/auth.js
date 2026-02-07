/**
 * Firebase Authentication Service
 * Handles user registration, login, and authentication state
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

/**
 * Register a new patient
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} patientData - Patient profile data
 * @returns {Promise<Object>} User credential and patient ID
 */
export const registerPatient = async (email, password, patientData) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: patientData.fullName
    });

    // Create patient document in Firestore
    const patientDoc = {
      ...patientData,
      role: 'patient',
      email: user.email,
      uid: user.uid,
      createdAt: Timestamp.now(),
      registeredAt: Timestamp.now(),
      waitTimeDays: 0,
      totalMatches: 0
    };

    await setDoc(doc(db, 'users', user.uid), patientDoc);

    console.log('✅ Patient registered successfully:', user.uid);

    return {
      user,
      patientId: user.uid
    };
  } catch (error) {
    console.error('❌ Error registering patient:', error);
    throw error;
  }
};

/**
 * Register a new doctor
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} doctorData - Doctor profile data
 * @returns {Promise<Object>} User credential and doctor ID
 */
export const registerDoctor = async (email, password, doctorData) => {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name
    await updateProfile(user, {
      displayName: doctorData.fullName
    });

    // Create doctor document in Firestore
    const doctorDoc = {
      ...doctorData,
      role: 'doctor',
      email: user.email,
      uid: user.uid,
      createdAt: Timestamp.now()
    };

    await setDoc(doc(db, 'users', user.uid), doctorDoc);

    console.log('✅ Doctor registered successfully:', user.uid);

    return {
      user,
      doctorId: user.uid
    };
  } catch (error) {
    console.error('❌ Error registering doctor:', error);
    throw error;
  }
};

/**
 * Sign in an existing user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential and profile
 */
export const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const profile = userDoc.data();

    console.log('✅ User signed in:', user.uid);

    return {
      user,
      profile
    };
  } catch (error) {
    console.error('❌ Error signing in:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ User signed out');
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
};

/**
 * Get the current user's profile from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User profile
 */
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    return {
      id: userDoc.id,
      ...userDoc.data()
    };
  } catch (error) {
    console.error('❌ Error getting user profile:', error);
    throw error;
  }
};

/**
 * Subscribe to authentication state changes
 * @param {Function} callback - Callback function to handle auth state
 * @returns {Function} Unsubscribe function
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Get authentication error message
 * @param {string} errorCode - Firebase error code
 * @returns {string} User-friendly error message
 */
export const getAuthErrorMessage = (errorCode) => {
  const errorMessages = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Please check your connection.'
  };

  return errorMessages[errorCode] || 'An error occurred. Please try again.';
};
