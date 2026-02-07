/*
  Local emulator-friendly test for k2ExplainMatch.
  Requires:
  - Firebase emulators running (functions + firestore)
  - FIRESTORE_EMULATOR_HOST set (e.g., 127.0.0.1:8080)
  - Match doc already created or script will create one.
*/

const admin = require('firebase-admin')

const projectId = process.env.GCLOUD_PROJECT || 'medimatch-local'

if (!admin.apps.length) {
  admin.initializeApp({ projectId })
}

const db = admin.firestore()

db.settings({ host: process.env.FIRESTORE_EMULATOR_HOST || '127.0.0.1:8080', ssl: false })

const main = async () => {
  const matchId = process.env.MATCH_ID || 'test_match_1'
  const matchRef = db.collection('matches').doc(matchId)

  const matchDoc = await matchRef.get()
  if (!matchDoc.exists) {
    await matchRef.set({
      patientId: 'patient_1',
      doctorId: 'doctor_1',
      appointmentId: 'appointment_1',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }

  console.log(`✅ Match doc ready: ${matchId}`)
  console.log('Now call the function via Functions emulator:')
  console.log(
    'firebase functions:shell --project ${PROJECT_ID}\n' +
      'k2ExplainMatch({ matchId: "' + matchId + '" }, { auth: { uid: "test_user" } })'
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
/* global process, require */
