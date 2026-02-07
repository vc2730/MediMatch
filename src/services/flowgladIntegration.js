/**
 * FlowGlad Workflow Integration
 * Helper functions for triggering and tracking FlowGlad workflows
 *
 * NOTE: This file provides the structure for Person 3 to implement
 * The actual API calls will be handled by Person 3's integration service
 */

import { updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Trigger FlowGlad workflow when a match is created
 * @param {string} matchId - Match document ID
 * @param {Object} matchData - Match details
 * @returns {Promise<string>} FlowGlad workflow ID
 */
export const triggerMatchWorkflow = async (matchId, matchData) => {
  try {
    // This is a placeholder for Person 3's FlowGlad API integration
    // Person 3 will implement the actual API call

    console.log('🔄 Triggering FlowGlad workflow for match:', matchId);

    // Example workflow data structure
    const workflowPayload = {
      matchId,
      patientId: matchData.patientId,
      appointmentId: matchData.appointmentId,
      priorityTier: matchData.priorityTier,
      urgencyScore: matchData.urgencyScore,
      timestamp: new Date().toISOString(),
      workflowType: 'patient_appointment_match',
      actions: [
        {
          action: 'send_patient_notification',
          data: {
            patientId: matchData.patientId,
            notificationType: 'sms_and_email',
            template: 'match_found'
          }
        },
        {
          action: 'send_doctor_notification',
          data: {
            doctorId: matchData.doctorId,
            notificationType: 'email',
            template: 'new_patient_match'
          }
        },
        {
          action: 'schedule_reminder',
          data: {
            reminderTime: '+24_hours',
            recipientId: matchData.patientId,
            message: 'Reminder: Please confirm your appointment'
          }
        }
      ]
    };

    // TODO (Person 3): Replace with actual FlowGlad API call
    // const response = await fetch('https://api.flowglad.com/workflows', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${import.meta.env.VITE_FLOWGLAD_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify(workflowPayload)
    // });
    //
    // const data = await response.json();
    // const workflowId = data.workflowId;

    // Placeholder workflow ID for development
    const workflowId = `workflow_${matchId}_${Date.now()}`;

    // Update match document with workflow ID
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      flowgladWorkflowId: workflowId,
      workflowStatus: 'in_progress',
      workflowTriggeredAt: Timestamp.now()
    });

    console.log('✅ FlowGlad workflow triggered:', workflowId);
    return workflowId;
  } catch (error) {
    console.error('❌ Error triggering FlowGlad workflow:', error);
    throw error;
  }
};

/**
 * Update workflow status (called by FlowGlad webhook or polling)
 * @param {string} matchId - Match document ID
 * @param {string} status - Workflow status
 * @param {Object} details - Additional details
 */
export const updateWorkflowStatus = async (matchId, status, details = {}) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      workflowStatus: status,
      workflowUpdatedAt: Timestamp.now(),
      ...details
    });

    console.log(`✅ Workflow status updated for match ${matchId}:`, status);
  } catch (error) {
    console.error('❌ Error updating workflow status:', error);
    throw error;
  }
};

/**
 * Handle FlowGlad webhook callback
 * @param {Object} webhookPayload - Webhook data from FlowGlad
 */
export const handleFlowGladWebhook = async (webhookPayload) => {
  try {
    const { workflowId, status, matchId, completedActions, error } = webhookPayload;

    console.log('📨 Received FlowGlad webhook:', { workflowId, status });

    // Update match status based on workflow completion
    await updateWorkflowStatus(matchId, status, {
      workflowCompletedActions: completedActions,
      workflowError: error || null
    });

    // If workflow completed, update match accordingly
    if (status === 'completed') {
      console.log('✅ FlowGlad workflow completed successfully');
      // Additional logic here (e.g., mark notifications as sent)
    } else if (status === 'failed') {
      console.error('❌ FlowGlad workflow failed:', error);
      // Handle failure (e.g., alert admin, retry)
    }
  } catch (error) {
    console.error('❌ Error handling FlowGlad webhook:', error);
    throw error;
  }
};

/**
 * Check workflow status (for polling-based implementation)
 * @param {string} workflowId - FlowGlad workflow ID
 * @returns {Promise<Object>} Workflow status details
 */
export const checkWorkflowStatus = async (workflowId) => {
  try {
    // TODO (Person 3): Replace with actual FlowGlad API call
    // const response = await fetch(`https://api.flowglad.com/workflows/${workflowId}`, {
    //   headers: {
    //     'Authorization': `Bearer ${import.meta.env.VITE_FLOWGLAD_API_KEY}`
    //   }
    // });
    //
    // const data = await response.json();
    // return data;

    // Placeholder for development
    return {
      workflowId,
      status: 'in_progress',
      completedActions: [],
      pendingActions: ['send_patient_notification', 'send_doctor_notification']
    };
  } catch (error) {
    console.error('❌ Error checking workflow status:', error);
    throw error;
  }
};

/**
 * Cancel FlowGlad workflow
 * @param {string} workflowId - FlowGlad workflow ID
 * @param {string} matchId - Match document ID
 */
export const cancelWorkflow = async (workflowId, matchId) => {
  try {
    // TODO (Person 3): Replace with actual FlowGlad API call
    // await fetch(`https://api.flowglad.com/workflows/${workflowId}/cancel`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${import.meta.env.VITE_FLOWGLAD_API_KEY}`
    //   }
    // });

    // Update match status
    await updateWorkflowStatus(matchId, 'cancelled');

    console.log('✅ FlowGlad workflow cancelled:', workflowId);
  } catch (error) {
    console.error('❌ Error cancelling workflow:', error);
    throw error;
  }
};

/**
 * Retry failed workflow
 * @param {string} matchId - Match document ID
 * @param {Object} matchData - Match details
 */
export const retryWorkflow = async (matchId, matchData) => {
  try {
    console.log('🔄 Retrying FlowGlad workflow for match:', matchId);

    // Cancel old workflow if exists
    if (matchData.flowgladWorkflowId) {
      await cancelWorkflow(matchData.flowgladWorkflowId, matchId);
    }

    // Trigger new workflow
    const newWorkflowId = await triggerMatchWorkflow(matchId, matchData);

    console.log('✅ Workflow retried with new ID:', newWorkflowId);
    return newWorkflowId;
  } catch (error) {
    console.error('❌ Error retrying workflow:', error);
    throw error;
  }
};

// Export workflow status constants
export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};
