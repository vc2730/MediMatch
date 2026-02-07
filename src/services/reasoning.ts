import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase/config'

const functions = getFunctions(app)

export const requestMatchReasoning = async (matchId: string): Promise<void> => {
  const callable = httpsCallable(functions, 'k2ExplainMatch')
  await callable({ matchId })
}
