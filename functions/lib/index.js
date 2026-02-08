"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.k2ExplainMatch = exports.getCoordinationPlan = exports.generateCoordinationPlan = exports.onMatchCreated = exports.workflowWebhook = exports.getWorkflowStatus = exports.triggerMatchWorkflow = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
const k2_1 = require("./prompts/k2");
const k2Provider_1 = require("./providers/k2Provider");
const config_1 = require("./config");
// Export workflow automation functions
var workflowAutomation_1 = require("./workflowAutomation");
Object.defineProperty(exports, "triggerMatchWorkflow", { enumerable: true, get: function () { return workflowAutomation_1.triggerMatchWorkflow; } });
Object.defineProperty(exports, "getWorkflowStatus", { enumerable: true, get: function () { return workflowAutomation_1.getWorkflowStatus; } });
Object.defineProperty(exports, "workflowWebhook", { enumerable: true, get: function () { return workflowAutomation_1.workflowWebhook; } });
Object.defineProperty(exports, "onMatchCreated", { enumerable: true, get: function () { return workflowAutomation_1.onMatchCreated; } });
// Export care coordination functions
var careCoordination_1 = require("./careCoordination");
Object.defineProperty(exports, "generateCoordinationPlan", { enumerable: true, get: function () { return careCoordination_1.generateCoordinationPlan; } });
Object.defineProperty(exports, "getCoordinationPlan", { enumerable: true, get: function () { return careCoordination_1.getCoordinationPlan; } });
if (!(0, app_1.getApps)().length) {
    (0, app_1.initializeApp)();
}
const db = (0, firestore_1.getFirestore)();
exports.k2ExplainMatch = (0, https_1.onCall)({ cors: true }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'Authentication required');
    }
    const matchId = request.data?.matchId;
    if (!matchId || typeof matchId !== 'string') {
        throw new https_1.HttpsError('invalid-argument', 'matchId is required');
    }
    const matchRef = db.collection('matches').doc(matchId);
    const matchSnap = await matchRef.get();
    if (!matchSnap.exists) {
        throw new https_1.HttpsError('not-found', 'Match not found');
    }
    const matchData = matchSnap.data() || {};
    const provider = new k2Provider_1.K2Provider();
    const k2Config = (0, config_1.getK2Config)();
    await matchRef.set({
        reasoning: {
            status: 'generating',
            provider: k2Config.providerName,
            model: k2Config.model,
            generatedAt: firestore_1.FieldValue.serverTimestamp()
        }
    }, { merge: true });
    try {
        const patientId = matchData.patientId;
        const doctorId = matchData.doctorId;
        const appointmentId = matchData.appointmentId;
        const [patientSnap, doctorSnap, appointmentSnap] = await Promise.all([
            patientId ? db.collection('users').doc(patientId).get() : Promise.resolve(null),
            doctorId ? db.collection('users').doc(doctorId).get() : Promise.resolve(null),
            appointmentId ? db.collection('appointments').doc(appointmentId).get() : Promise.resolve(null)
        ]);
        const prompt = (0, k2_1.buildK2Prompt)({
            match: matchData,
            patient: patientSnap?.exists ? patientSnap.data() : null,
            doctor: doctorSnap?.exists ? doctorSnap.data() : null,
            appointment: appointmentSnap?.exists ? appointmentSnap.data() : null
        });
        const reasoning = await provider.generateReasoning({ matchId, prompt });
        await matchRef.set({
            reasoning: {
                status: 'ready',
                patientSummary: reasoning.patientSummary,
                doctorSummary: reasoning.doctorSummary,
                equityExplanation: reasoning.equityExplanation,
                warnings: reasoning.warnings,
                provider: reasoning.provider,
                model: reasoning.model,
                generatedAt: firestore_1.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        return { status: 'ready' };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        await matchRef.set({
            reasoning: {
                status: 'error',
                errorMessage: message,
                provider: k2Config.providerName,
                model: k2Config.model,
                generatedAt: firestore_1.FieldValue.serverTimestamp()
            }
        }, { merge: true });
        throw new https_1.HttpsError('internal', 'Failed to generate reasoning');
    }
});
