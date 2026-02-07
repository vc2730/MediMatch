/**
 * MediMatch Database Service
 * Firestore CRUD operations for all collections
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  writeBatch,
  increment
} from 'firebase/firestore';
import { db } from '../firebase/config';

// ============================================
// USER MANAGEMENT
// ============================================

/**
 * Get user profile by ID
 * @param {string} userId - User document ID
 * @returns {Promise<Object|null>} User data or null
 */
export const getUserProfile = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Create or update user profile
 * @param {string} userId - User document ID
 * @param {Object} userData - User data to save
 * @returns {Promise<void>}
 */
export const saveUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const timestamp = Timestamp.now();

    const dataToSave = {
      ...userData,
      updatedAt: timestamp,
      createdAt: userData.createdAt || timestamp
    };

    await setDoc(userRef, dataToSave, { merge: true });
    console.log('User profile saved:', userId);
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Update user profile fields
 * @param {string} userId - User document ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now()
    });
    console.log('User profile updated:', userId);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Get all patients (for admin/matching purposes)
 * @returns {Promise<Array>} Array of patient objects
 */
export const getAllPatients = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'patient'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching patients:', error);
    throw error;
  }
};

/**
 * Get all doctors
 * @returns {Promise<Array>} Array of doctor objects
 */
export const getAllDoctors = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'doctor'),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
};

/**
 * Get patients waiting for matches (no recent matches)
 * @returns {Promise<Array>} Array of patient objects
 */
export const getPatientsWaitingForMatch = async () => {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'patient'),
      where('lastMatchedAt', '==', null),
      orderBy('registeredAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching waiting patients:', error);
    throw error;
  }
};

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

/**
 * Create a new appointment slot
 * @param {string} doctorId - Doctor's user ID
 * @param {Object} appointmentData - Appointment details
 * @returns {Promise<string>} Created appointment ID
 */
export const createAppointment = async (doctorId, appointmentData) => {
  try {
    const appointmentRef = doc(collection(db, 'appointments'));
    const timestamp = Timestamp.now();

    const appointment = {
      ...appointmentData,
      doctorId,
      status: 'available',
      patientId: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      matchedAt: null,
      confirmedAt: null
    };

    await setDoc(appointmentRef, appointment);
    console.log('Appointment created:', appointmentRef.id);
    return appointmentRef.id;
  } catch (error) {
    console.error('Error creating appointment:', error);
    throw error;
  }
};

/**
 * Get available appointments by specialty and date range
 * @param {string} specialty - Medical specialty
 * @param {Date} startDate - Start date (optional)
 * @param {number} limitCount - Max results (default 50)
 * @returns {Promise<Array>} Array of available appointments
 */
export const getAvailableAppointments = async (specialty, startDate = new Date(), limitCount = 50) => {
  try {
    console.log(`📅 Fetching appointments for specialty: ${specialty}`);

    // Simplified query to work without composite index
    const q = query(
      collection(db, 'appointments'),
      where('specialty', '==', specialty),
      where('status', '==', 'available'),
      limit(limitCount * 2)
    );
    const snapshot = await getDocs(q);

    // Filter and sort on client side
    const startTimestamp = Timestamp.fromDate(startDate);
    const appointments = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(apt => apt.date >= startTimestamp)
      .sort((a, b) => a.date.seconds - b.date.seconds)
      .slice(0, limitCount);

    console.log(`✅ Found ${appointments.length} appointments for ${specialty}`);

    // Fallback to demo data if none found
    if (appointments.length === 0) {
      console.log('⚠️ No appointments in Firestore, using demo data');
      const { getDemoAppointmentsBySpecialty } = await import('./demoAppointments');
      return getDemoAppointmentsBySpecialty(specialty, limitCount);
    }

    return appointments;
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);

    // On error, fallback to demo data
    try {
      console.log('⚠️ Using demo appointments as fallback');
      const { getDemoAppointmentsBySpecialty } = await import('./demoAppointments');
      return getDemoAppointmentsBySpecialty(specialty, limitCount);
    } catch (demoError) {
      console.error('Error loading demo appointments:', demoError);
      return [];
    }
  }
};

/**
 * Get all available appointments (any specialty)
 * @param {Date} startDate - Start date (optional)
 * @param {number} limitCount - Max results
 * @returns {Promise<Array>} Array of available appointments
 */
export const getAllAvailableAppointments = async (startDate = new Date(), limitCount = 100) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('status', '==', 'available'),
      where('date', '>=', Timestamp.fromDate(startDate)),
      orderBy('date', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching all available appointments:', error);
    throw error;
  }
};

/**
 * Update appointment status
 * @param {string} appointmentId - Appointment ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional fields to update
 * @returns {Promise<void>}
 */
export const updateAppointmentStatus = async (appointmentId, status, additionalData = {}) => {
  try {
    const appointmentRef = doc(db, 'appointments', appointmentId);
    const updates = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    // Add status-specific timestamps
    if (status === 'matched') {
      updates.matchedAt = Timestamp.now();
    } else if (status === 'confirmed') {
      updates.confirmedAt = Timestamp.now();
    }

    await updateDoc(appointmentRef, updates);
    console.log('Appointment status updated:', appointmentId, status);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
};

/**
 * Get appointments for a specific doctor
 * @param {string} doctorId - Doctor's user ID
 * @param {string} statusFilter - Optional status filter
 * @returns {Promise<Array>} Array of appointments
 */
export const getDoctorAppointments = async (doctorId, statusFilter = null) => {
  try {
    let q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      orderBy('date', 'asc')
    );

    if (statusFilter) {
      q = query(
        collection(db, 'appointments'),
        where('doctorId', '==', doctorId),
        where('status', '==', statusFilter),
        orderBy('date', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    throw error;
  }
};

/**
 * Get appointment by ID
 * @param {string} appointmentId - Appointment ID
 * @returns {Promise<Object|null>}
 */
export const getAppointmentById = async (appointmentId) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (appointmentDoc.exists()) {
      return { id: appointmentDoc.id, ...appointmentDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching appointment:', error);
    throw error;
  }
};

// ============================================
// MATCH MANAGEMENT
// ============================================

/**
 * Create a new match between patient and appointment
 * @param {string} patientId - Patient's user ID
 * @param {string} appointmentId - Appointment ID
 * @param {Object} scores - Scoring data
 * @returns {Promise<string>} Created match ID
 */
export const createMatch = async (patientId, appointmentId, scores) => {
  try {
    const batch = writeBatch(db);
    const matchRef = doc(collection(db, 'matches'));
    const timestamp = Timestamp.now();

    // Create match document
    const match = {
      patientId,
      appointmentId,
      ...scores,
      status: 'pending',
      matchedAt: timestamp,
      respondedAt: null,
      confirmedAt: null,
      completedAt: null,
      notificationSent: false,
      remindersSent: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    batch.set(matchRef, match);

    // Update appointment status
    const appointmentRef = doc(db, 'appointments', appointmentId);
    batch.update(appointmentRef, {
      status: 'matched',
      patientId,
      matchedAt: timestamp,
      updatedAt: timestamp
    });

    // Update patient's last matched time
    const patientRef = doc(db, 'users', patientId);
    batch.update(patientRef, {
      lastMatchedAt: timestamp,
      totalMatches: increment(1),
      updatedAt: timestamp
    });

    await batch.commit();
    console.log('Match created:', matchRef.id);
    return matchRef.id;
  } catch (error) {
    console.error('Error creating match:', error);
    throw error;
  }
};

/**
 * Update match status
 * @param {string} matchId - Match ID
 * @param {string} status - New status
 * @param {Object} additionalData - Additional fields
 * @returns {Promise<void>}
 */
export const updateMatchStatus = async (matchId, status, additionalData = {}) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    const updates = {
      status,
      updatedAt: Timestamp.now(),
      ...additionalData
    };

    // Add status-specific timestamps
    if (status === 'confirmed') {
      updates.confirmedAt = Timestamp.now();
      updates.respondedAt = updates.respondedAt || Timestamp.now();
    } else if (status === 'completed') {
      updates.completedAt = Timestamp.now();
    } else if (status === 'rejected') {
      updates.respondedAt = updates.respondedAt || Timestamp.now();
    }

    await updateDoc(matchRef, updates);
    console.log('Match status updated:', matchId, status);

    // If confirmed, update appointment status
    if (status === 'confirmed') {
      const matchDoc = await getDoc(matchRef);
      if (matchDoc.exists()) {
        const { appointmentId } = matchDoc.data();
        await updateAppointmentStatus(appointmentId, 'confirmed');
      }
    }

    // If rejected or cancelled, make appointment available again
    if (status === 'rejected' || status === 'cancelled') {
      const matchDoc = await getDoc(matchRef);
      if (matchDoc.exists()) {
        const { appointmentId } = matchDoc.data();
        await updateAppointmentStatus(appointmentId, 'available', { patientId: null });
      }
    }
  } catch (error) {
    console.error('Error updating match status:', error);
    throw error;
  }
};

/**
 * Get matches for a patient
 * @param {string} patientId - Patient's user ID
 * @param {string} statusFilter - Optional status filter
 * @returns {Promise<Array>} Array of matches
 */
export const getPatientMatches = async (patientId, statusFilter = null) => {
  try {
    let q = query(
      collection(db, 'matches'),
      where('patientId', '==', patientId),
      orderBy('matchedAt', 'desc')
    );

    if (statusFilter) {
      q = query(
        collection(db, 'matches'),
        where('patientId', '==', patientId),
        where('status', '==', statusFilter),
        orderBy('matchedAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching patient matches:', error);
    throw error;
  }
};

/**
 * Get matches for a doctor
 * @param {string} doctorId - Doctor's user ID
 * @param {string} statusFilter - Optional status filter
 * @returns {Promise<Array>} Array of matches with appointment data
 */
export const getDoctorMatches = async (doctorId, statusFilter = null) => {
  try {
    // First get appointments for this doctor
    const appointments = await getDoctorAppointments(doctorId, statusFilter);
    const appointmentIds = appointments.map(apt => apt.id);

    if (appointmentIds.length === 0) {
      return [];
    }

    // Then get matches for those appointments
    // Note: Firestore 'in' queries limited to 10 items, so we may need to batch
    const matches = [];
    const batchSize = 10;

    for (let i = 0; i < appointmentIds.length; i += batchSize) {
      const batch = appointmentIds.slice(i, i + batchSize);
      const q = query(
        collection(db, 'matches'),
        where('appointmentId', 'in', batch),
        orderBy('matchedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      matches.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    return matches;
  } catch (error) {
    console.error('Error fetching doctor matches:', error);
    throw error;
  }
};

/**
 * Get all pending matches (for admin/processing)
 * @param {number} limitCount - Max results
 * @returns {Promise<Array>} Array of pending matches
 */
export const getPendingMatches = async (limitCount = 100) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('status', '==', 'pending'),
      orderBy('priorityTier', 'asc'),
      orderBy('totalMatchScore', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching pending matches:', error);
    throw error;
  }
};

/**
 * Get match by ID
 * @param {string} matchId - Match ID
 * @returns {Promise<Object|null>}
 */
export const getMatchById = async (matchId) => {
  try {
    const matchDoc = await getDoc(doc(db, 'matches', matchId));
    if (matchDoc.exists()) {
      return { id: matchDoc.id, ...matchDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching match:', error);
    throw error;
  }
};

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Create a notification for a user
 * @param {string} userId - User ID to notify
 * @param {Object} notificationData - Notification details
 * @returns {Promise<string>} Created notification ID
 */
export const createNotification = async (userId, notificationData) => {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    const timestamp = Timestamp.now();

    const notification = {
      userId,
      ...notificationData,
      read: false,
      readAt: null,
      createdAt: timestamp
    };

    await setDoc(notificationRef, notification);
    console.log('Notification created:', notificationRef.id);
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {boolean} unreadOnly - Only fetch unread notifications
 * @returns {Promise<Array>} Array of notifications
 */
export const getUserNotifications = async (userId, unreadOnly = false) => {
  try {
    let q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (unreadOnly) {
      q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: Timestamp.now()
    });
    console.log('Notification marked as read:', notificationId);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const notifications = await getUserNotifications(userId, true);
    const batch = writeBatch(db);
    const timestamp = Timestamp.now();

    notifications.forEach(notification => {
      const notificationRef = doc(db, 'notifications', notification.id);
      batch.update(notificationRef, {
        read: true,
        readAt: timestamp
      });
    });

    await batch.commit();
    console.log('All notifications marked as read for user:', userId);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// ============================================
// REAL-TIME LISTENERS
// ============================================

/**
 * Subscribe to user profile updates
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function with user data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserProfile = (userId, callback) => {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Error in user profile subscription:', error);
  });
};

/**
 * Subscribe to patient matches
 * @param {string} patientId - Patient ID
 * @param {Function} callback - Callback function with matches array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPatientMatches = (patientId, callback) => {
  const q = query(
    collection(db, 'matches'),
    where('patientId', '==', patientId),
    orderBy('matchedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const matches = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(matches);
  }, (error) => {
    console.error('Error in patient matches subscription:', error);
  });
};

/**
 * Subscribe to user notifications
 * @param {string} userId - User ID
 * @param {Function} callback - Callback function with notifications array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToUserNotifications = (userId, callback) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  }, (error) => {
    console.error('Error in notifications subscription:', error);
  });
};

/**
 * Subscribe to doctor appointments
 * @param {string} doctorId - Doctor ID
 * @param {Function} callback - Callback function with appointments array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDoctorAppointments = (doctorId, callback) => {
  const q = query(
    collection(db, 'appointments'),
    where('doctorId', '==', doctorId),
    orderBy('date', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(appointments);
  }, (error) => {
    console.error('Error in doctor appointments subscription:', error);
  });
};

/**
 * Subscribe to available appointments by specialty
 * @param {string} specialty - Medical specialty
 * @param {Function} callback - Callback function with appointments array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAvailableAppointments = (specialty, callback) => {
  const q = query(
    collection(db, 'appointments'),
    where('status', '==', 'available'),
    where('specialty', '==', specialty),
    where('date', '>=', Timestamp.now()),
    orderBy('date', 'asc'),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const appointments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(appointments);
  }, (error) => {
    console.error('Error in available appointments subscription:', error);
  });
};
