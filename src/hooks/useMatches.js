/**
 * React Hook for Patient/Doctor Matches
 */

import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  getPatientMatches,
  getDoctorMatches,
  subscribeToPatientMatches,
  updateMatchStatus,
  subscribeToDoctorAppointments
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
  const batchMapsRef = useRef({});
  const matchUnsubsRef = useRef([]);
  const directMatchesRef = useRef([]);

  // Merge appointment-based matches and direct doctorId matches, deduplicate by id
  const mergeAndSet = () => {
    const apptMatches = Object.values(batchMapsRef.current).flat();
    const direct = directMatchesRef.current;
    const seen = new Set();
    const merged = [];
    for (const m of [...direct, ...apptMatches]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        merged.push(m);
      }
    }
    merged.sort((a, b) => {
      if (!a.matchedAt || !b.matchedAt) return 0;
      return b.matchedAt.seconds - a.matchedAt.seconds;
    });
    setMatches(merged);
  };

  useEffect(() => {
    if (!doctorId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    setLoading(true);

    const clearMatchListeners = () => {
      matchUnsubsRef.current.forEach((unsub) => unsub());
      matchUnsubsRef.current = [];
      batchMapsRef.current = {};
    };

    // Direct query by doctorId — catches matches from the patient demo flow
    const directQ = query(collection(db, 'matches'), where('doctorId', '==', doctorId));
    const unsubDirect = onSnapshot(
      directQ,
      (snapshot) => {
        directMatchesRef.current = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        mergeAndSet();
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.warn('Direct doctorId match query error:', err);
        setLoading(false);
      }
    );

    const unsubscribeAppointments = subscribeToDoctorAppointments(doctorId, (appointments) => {
      clearMatchListeners();

      const appointmentIds = appointments.map((apt) => apt.id);
      if (appointmentIds.length === 0) {
        mergeAndSet();
        setLoading(false);
        return;
      }

      const batches = [];
      for (let i = 0; i < appointmentIds.length; i += 10) {
        batches.push(appointmentIds.slice(i, i + 10));
      }

      batches.forEach((batch, index) => {
        const q = query(
          collection(db, 'matches'),
          where('appointmentId', 'in', batch)
        );

        const unsub = onSnapshot(
          q,
          (snapshot) => {
            batchMapsRef.current[index] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            mergeAndSet();
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('Error in doctor matches subscription:', err);
            setError(err.message);
            setLoading(false);
          }
        );

        matchUnsubsRef.current.push(unsub);
      });
    });

    return () => {
      unsubDirect();
      unsubscribeAppointments();
      clearMatchListeners();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
