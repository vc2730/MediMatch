"use strict";
/**
 * Workflow Automation Functions
 * Replaces FlowGlad integration with self-hosted workflow automation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.workflowWebhook = exports.getWorkflowStatus = exports.triggerMatchWorkflow = exports.onMatchCreated = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-functions/v2/firestore");
const firestore_2 = require("firebase-admin/firestore");
const notifications_1 = require("./notifications");
const db = (0, firestore_2.getFirestore)();
/**
 * Trigger workflow when match is created
 * Automatically fires when a new match is created in Firestore
 */
exports.onMatchCreated = (0, firestore_1.onDocumentCreated)('matches/{matchId}', async (event) => {
    const matchId = event.params.matchId;
    const matchData = event.data?.data();
    if (!matchData) {
        console.error('No match data found for', matchId);
        return;
    }
    console.log('🔄 Auto-triggering workflow for new match:', matchId);
    try {
        const workflowId = await triggerWorkflow({
            matchId,
            patientId: matchData.patientId,
            doctorId: matchData.doctorId,
            appointmentId: matchData.appointmentId,
            priority: matchData.priorityTier <= 2 ? 'critical' : 'standard'
        });
        // Update match with workflow ID
        await db.collection('matches').doc(matchId).update({
            workflowId,
            workflowStatus: 'triggered'
        });
        console.log('✅ Workflow triggered:', workflowId);
    }
    catch (error) {
        console.error('❌ Failed to trigger workflow:', error);
    }
});
/**
 * Manually trigger workflow for a match
 */
exports.triggerMatchWorkflow = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const { matchId } = request.data;
    if (!matchId) {
        throw new https_1.HttpsError('invalid-argument', 'matchId is required');
    }
    const matchRef = db.collection('matches').doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Match not found');
    }
    const matchData = matchSnap.data() || {};
    const workflowId = await triggerWorkflow({
        matchId,
        patientId: matchData.patientId,
        doctorId: matchData.doctorId,
        appointmentId: matchData.appointmentId,
        priority: matchData.priorityTier <= 2 ? 'critical' : 'standard'
    });
    await matchRef.update({
        workflowId,
        workflowStatus: 'triggered',
        workflowTriggeredAt: firestore_2.FieldValue.serverTimestamp()
    });
    return { workflowId, status: 'triggered' };
});
/**
 * Core workflow trigger logic
 */
async function triggerWorkflow(params) {
    const { matchId, patientId, doctorId, appointmentId, priority } = params;
    // Create workflow document
    const workflowRef = db.collection('workflows').doc();
    const workflowId = workflowRef.id;
    const workflowData = {
        matchId,
        status: 'pending',
        triggeredAt: firestore_2.Timestamp.now(),
        metadata: {
            patientId,
            doctorId,
            appointmentId
        },
        actions: [
            { action: 'send_patient_notification', status: 'pending' },
            { action: 'send_doctor_notification', status: 'pending' },
            { action: 'update_calendar', status: 'pending' },
            { action: 'prepare_er_room', status: 'pending' }
        ]
    };
    await workflowRef.set(workflowData);
    // Execute workflow actions asynchronously
    executeWorkflow(workflowId, workflowData).catch(err => {
        console.error('❌ Workflow execution failed:', err);
    });
    return workflowId;
}
/**
 * Execute workflow actions sequentially
 */
async function executeWorkflow(workflowId, workflowData) {
    const workflowRef = db.collection('workflows').doc(workflowId);
    await workflowRef.update({ status: 'in_progress' });
    const { matchId, metadata } = workflowData;
    const { patientId, doctorId, appointmentId } = metadata;
    // Fetch related data
    const [matchSnap, patientSnap, doctorSnap, appointmentSnap] = await Promise.all([
        db.collection('matches').doc(matchId).get(),
        db.collection('users').doc(patientId).get(),
        db.collection('users').doc(doctorId).get(),
        db.collection('appointments').doc(appointmentId).get()
    ]);
    const match = matchSnap.data();
    const patient = patientSnap.data();
    const doctor = doctorSnap.data();
    const appointment = appointmentSnap.data();
    // Execute each action
    for (let i = 0; i < workflowData.actions.length; i++) {
        const action = workflowData.actions[i];
        try {
            // Update action status to in_progress
            await workflowRef.update({
                [`actions.${i}.status`]: 'in_progress'
            });
            // Execute the action
            await executeAction(action.action, {
                match,
                patient,
                doctor,
                appointment
            });
            // Mark action as completed
            await workflowRef.update({
                [`actions.${i}.status`]: 'completed',
                [`actions.${i}.completedAt`]: firestore_2.FieldValue.serverTimestamp()
            });
            console.log(`✅ Completed action: ${action.action}`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // Mark action as failed
            await workflowRef.update({
                [`actions.${i}.status`]: 'failed',
                [`actions.${i}.error`]: errorMessage
            });
            console.error(`❌ Failed action: ${action.action}`, error);
        }
    }
    // Mark workflow as completed
    await workflowRef.update({
        status: 'completed',
        completedAt: firestore_2.FieldValue.serverTimestamp()
    });
    // Update match status
    await db.collection('matches').doc(matchId).update({
        workflowStatus: 'completed',
        workflowCompletedAt: firestore_2.FieldValue.serverTimestamp()
    });
}
/**
 * Execute individual workflow action
 */
async function executeAction(actionName, context) {
    const { match, patient, doctor, appointment } = context;
    switch (actionName) {
        case 'send_patient_notification':
            await (0, notifications_1.sendPatientNotification)({
                patientId: patient.id,
                patientName: patient.fullName || patient.name,
                patientEmail: patient.email,
                patientPhone: patient.phone,
                erRoom: appointment.erRoom,
                clinicName: appointment.clinicName,
                address: appointment.address,
                estimatedWaitMinutes: appointment.estimatedWaitMinutes
            });
            break;
        case 'send_doctor_notification':
            await (0, notifications_1.sendDoctorNotification)({
                doctorId: doctor.id,
                doctorName: doctor.fullName || doctor.name,
                doctorEmail: doctor.email,
                doctorPhone: doctor.phone,
                patientName: patient.fullName || patient.name,
                patientCondition: patient.medicalCondition,
                triageLevel: patient.triageLevel,
                erRoom: appointment.erRoom,
                urgencyLevel: patient.urgencyLevel
            });
            break;
        case 'update_calendar':
            // Update doctor's calendar
            await db.collection('appointments').doc(appointment.id).update({
                status: 'confirmed',
                confirmedAt: firestore_2.FieldValue.serverTimestamp(),
                patientId: patient.id,
                patientName: patient.fullName || patient.name
            });
            // Create calendar event
            await db.collection('calendar_events').add({
                doctorId: doctor.id,
                patientId: patient.id,
                appointmentId: appointment.id,
                type: 'er_appointment',
                title: `ER: ${patient.medicalCondition}`,
                startTime: firestore_2.Timestamp.now(),
                estimatedDuration: appointment.estimatedWaitMinutes || 60,
                erRoom: appointment.erRoom,
                createdAt: firestore_2.FieldValue.serverTimestamp()
            });
            break;
        case 'prepare_er_room':
            // Update ER room status
            await db.collection('er_rooms').doc(appointment.erRoom).update({
                status: 'preparing',
                assignedPatientId: patient.id,
                assignedAt: firestore_2.FieldValue.serverTimestamp(),
                priority: match.priorityTier,
                expectedArrival: firestore_2.Timestamp.fromMillis(Date.now() + 10 * 60 * 1000) // 10 minutes
            });
            break;
        default:
            console.warn(`Unknown action: ${actionName}`);
    }
}
/**
 * Get workflow status
 */
exports.getWorkflowStatus = (0, https_1.onCall)({ cors: true }, async (request) => {
    const { workflowId } = request.data;
    if (!workflowId) {
        throw new https_1.HttpsError('invalid-argument', 'workflowId is required');
    }
    const workflowSnap = await db.collection('workflows').doc(workflowId).get();
    if (!workflowSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Workflow not found');
    }
    return workflowSnap.data();
});
/**
 * Webhook endpoint for external services
 */
exports.workflowWebhook = (0, https_1.onRequest)({ cors: true }, async (req, res) => {
    if (req.method !== 'POST') {
        res.status(405).send('Method not allowed');
        return;
    }
    const { workflowId, action, status, data } = req.body;
    if (!workflowId || !action) {
        res.status(400).json({ error: 'workflowId and action are required' });
        return;
    }
    try {
        // Log webhook receipt
        await db.collection('webhook_logs').add({
            workflowId,
            action,
            status,
            data,
            receivedAt: firestore_2.FieldValue.serverTimestamp()
        });
        // Update workflow based on webhook data
        const workflowRef = db.collection('workflows').doc(workflowId);
        const workflowSnap = await workflowRef.get();
        if (!workflowSnap.exists) {
            res.status(404).json({ error: 'Workflow not found' });
            return;
        }
        const workflowData = workflowSnap.data();
        const actionIndex = workflowData?.actions.findIndex((a) => a.action === action);
        if (actionIndex !== -1) {
            await workflowRef.update({
                [`actions.${actionIndex}.status`]: status,
                [`actions.${actionIndex}.webhookData`]: data,
                [`actions.${actionIndex}.updatedAt`]: firestore_2.FieldValue.serverTimestamp()
            });
        }
        res.status(200).json({ success: true, workflowId });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
