import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { requestMatchReasoning } from '../services/reasoning'

export const useMatchReasoning = (matchId) => {
  const [reasoning, setReasoning] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!matchId) {
      setReasoning(null)
      return undefined
    }

    const ref = doc(db, 'matches', matchId)
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data()
        setReasoning(data?.reasoning || null)
      },
      (err) => {
        setError(err.message)
      }
    )

    return () => unsubscribe()
  }, [matchId])

  const generate = async () => {
    if (!matchId) return
    setLoading(true)
    setError('')
    try {
      await requestMatchReasoning(matchId)
    } catch (err) {
      setError(err?.message || 'Failed to generate reasoning')
    } finally {
      setLoading(false)
    }
  }

  return { reasoning, generate, loading, error }
}
