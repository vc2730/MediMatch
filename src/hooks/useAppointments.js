/**
 * React Hook for Appointments
 */

import { useState, useEffect } from 'react';
import {
  getAvailableAppointments,
  getAllAvailableAppointments,
  subscribeToAvailableAppointments
} from '../services/database';

/**
 * Get available appointments with optional real-time updates
 */
export const useAvailableAppointments = (specialty = null, realTime = false) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (realTime && specialty) {
      // Real-time subscription
      setLoading(true);
      const unsubscribe = subscribeToAvailableAppointments(specialty, (data) => {
        setAppointments(data);
        setLoading(false);
        setError(null);
      });

      return () => unsubscribe();
    } else {
      // One-time fetch
      const loadAppointments = async () => {
        try {
          setLoading(true);
          const data = specialty
            ? await getAvailableAppointments(specialty)
            : await getAllAvailableAppointments();
          setAppointments(data);
          setError(null);
        } catch (err) {
          console.error('Error loading appointments:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadAppointments();
    }
  }, [specialty, realTime]);

  return { appointments, loading, error };
};
