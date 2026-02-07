/**
 * React Hook for Patient/Doctor Matches
 */

import { useState, useEffect } from 'react';
import {
  getPatientMatches,
  getDoctorMatches,
  subscribeToPatientMatches,
  updateMatchStatus
} from '../services/database';

/**
 * Get patient matches with real-time updates
 */
export const usePatientMatches = (patientId, realTime = true) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setLoading(false);
      return;
    }

    if (realTime) {
      // Real-time subscription
      setLoading(true);
      const unsubscribe = subscribeToPatientMatches(patientId, (data) => {
        setMatches(data);
        setLoading(false);
        setError(null);
      });

      return () => unsubscribe();
    } else {
      // One-time fetch
      const loadMatches = async () => {
        try {
          setLoading(true);
          const data = await getPatientMatches(patientId);
          setMatches(data);
          setError(null);
        } catch (err) {
          console.error('Error loading matches:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };

      loadMatches();
    }
  }, [patientId, realTime]);

  const updateStatus = async (matchId, status) => {
    try {
      await updateMatchStatus(matchId, status);
    } catch (err) {
      console.error('Error updating match status:', err);
    }
  };

  const pendingMatches = matches.filter(m => m.status === 'pending');
  const confirmedMatches = matches.filter(m => m.status === 'confirmed');

  return {
    matches,
    pendingMatches,
    confirmedMatches,
    loading,
    error,
    updateStatus
  };
};

/**
 * Get doctor matches
 */
export const useDoctorMatches = (doctorId) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!doctorId) {
      setLoading(false);
      return;
    }

    const loadMatches = async () => {
      try {
        setLoading(true);
        const data = await getDoctorMatches(doctorId);
        setMatches(data);
        setError(null);
      } catch (err) {
        console.error('Error loading doctor matches:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [doctorId]);

  const refresh = async () => {
    try {
      const data = await getDoctorMatches(doctorId);
      setMatches(data);
    } catch (err) {
      console.error('Error refreshing matches:', err);
    }
  };

  return { matches, loading, error, refresh };
};
