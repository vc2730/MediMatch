import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { buildK2Prompt } from './prompts/k2'
import { K2Provider } from './providers/k2Provider'
import { getK2Config } from './config'

// Export workflow automation functions
export {
  triggerMatchWorkflow,
  getWorkflowStatus,
  workflowWebhook,
  onMatchCreated
} from './workflowAutomation'

// Export care coordination functions
export {
  generateCoordinationPlan,
  getCoordinationPlan
} from './careCoordination'

if (!getApps().length) {
  initializeApp()
}

const db = getFirestore()

export const k2ExplainMatch = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required')
  }

  const matchId = request.data?.matchId
  if (!matchId || typeof matchId !== 'string') {
    throw new HttpsError('invalid-argument', 'matchId is required')
  }

  const matchRef = db.collection('matches').doc(matchId)
  const matchSnap = await matchRef.get()

  if (!matchSnap.exists) {
    throw new HttpsError('not-found', 'Match not found')
  }

  const matchData = matchSnap.data() || {}
  const provider = new K2Provider()
  const k2Config = getK2Config()

  await matchRef.set(
    {
      reasoning: {
        status: 'generating',
        provider: k2Config.providerName,
        model: k2Config.model,
        generatedAt: FieldValue.serverTimestamp()
      }
    },
    { merge: true }
  )

  try {
    const patientId = matchData.patientId
    const doctorId = matchData.doctorId
    const appointmentId = matchData.appointmentId

    const [patientSnap, doctorSnap, appointmentSnap] = await Promise.all([
      patientId ? db.collection('users').doc(patientId).get() : Promise.resolve(null),
      doctorId ? db.collection('users').doc(doctorId).get() : Promise.resolve(null),
      appointmentId ? db.collection('appointments').doc(appointmentId).get() : Promise.resolve(null)
    ])

    const prompt = buildK2Prompt({
      match: matchData,
      patient: patientSnap?.exists ? patientSnap.data() : null,
      doctor: doctorSnap?.exists ? doctorSnap.data() : null,
      appointment: appointmentSnap?.exists ? appointmentSnap.data() : null
    })

    const reasoning = await provider.generateReasoning({ matchId, prompt })

    await matchRef.set(
      {
        reasoning: {
          status: 'ready',
          patientSummary: reasoning.patientSummary,
          doctorSummary: reasoning.doctorSummary,
          equityExplanation: reasoning.equityExplanation,
          warnings: reasoning.warnings,
          provider: reasoning.provider,
          model: reasoning.model,
          generatedAt: FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    )

    return { status: 'ready' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await matchRef.set(
      {
        reasoning: {
          status: 'error',
          errorMessage: message,
          provider: k2Config.providerName,
          model: k2Config.model,
          generatedAt: FieldValue.serverTimestamp()
        }
      },
      { merge: true }
    )
    throw new HttpsError('internal', 'Failed to generate reasoning')
  }
})
