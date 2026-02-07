/**
 * React Hook for Patient Data
 */

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { subscribeToUserProfile } from '../services/database';
import { DEMO_PATIENTS } from '../services/seedData';

/**
 * Get all patients (with demo data fallback)
 */
export const usePatients = (useDemoFallback = true) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingDemo, setUsingDemo] = useState(false);

  useEffect(() => {
    const loadPatients = async () => {
      try {
        setLoading(true);

        // Try to fetch from Firestore with simplified query
        console.log('📥 Fetching patients from Firestore...');

        const q = query(
          collection(db, 'users'),
          where('role', '==', 'patient')
        );

        const snapshot = await getDocs(q);
        const firestorePatients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log(`✅ Found ${firestorePatients.length} patients in Firestore`);

        if (firestorePatients.length > 0) {
          setPatients(firestorePatients);
          setUsingDemo(false);
          setError(null);
        } else if (useDemoFallback) {
          // Fallback to demo data if Firestore is empty
          console.log('⚠️ No patients in Firestore, using demo data');

          // Convert demo patients to have proper format
          const demoData = DEMO_PATIENTS.map(p => ({
            ...p,
            // Convert dates if they're Date objects
            registeredAt: p.registeredAt instanceof Date
              ? { toDate: () => p.registeredAt }
              : p.registeredAt,
            dateOfBirth: p.dateOfBirth instanceof Date
              ? { toDate: () => p.dateOfBirth }
              : p.dateOfBirth
          }));

          setPatients(demoData);
          setUsingDemo(true);
          setError(null);
        } else {
          setPatients([]);
          setUsingDemo(false);
          setError('No patients found');
        }
      } catch (err) {
        console.error('❌ Error loading patients:', err);

        // If error and demo fallback enabled, use demo data
        if (useDemoFallback) {
          console.log('⚠️ Error loading from Firestore, using demo data');
          const demoData = DEMO_PATIENTS.map(p => ({
            ...p,
            registeredAt: p.registeredAt instanceof Date
              ? { toDate: () => p.registeredAt }
              : p.registeredAt,
            dateOfBirth: p.dateOfBirth instanceof Date
              ? { toDate: () => p.dateOfBirth }
              : p.dateOfBirth
          }));
          setPatients(demoData);
          setUsingDemo(true);
        }

        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadPatients();
  }, [useDemoFallback]);

  const refresh = async () => {
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'patient')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (data.length > 0) {
        setPatients(data);
        setUsingDemo(false);
      }
    } catch (err) {
      console.error('Error refreshing patients:', err);
    }
  };

  return { patients, loading, error, refresh, usingDemo };
};

/**
 * Get single patient with real-time updates
 */
export const usePatient = (patientId) => {
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to real-time updates
    const unsubscribe = subscribeToUserProfile(patientId, (data) => {
      setPatient(data);
      setLoading(false);
      setError(null);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [patientId]);

  return { patient, loading, error };
};
