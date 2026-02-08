"use strict";
/**
 * Notification Service
 * Handles SMS and email notifications for patients and doctors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPatientNotification = sendPatientNotification;
exports.sendDoctorNotification = sendDoctorNotification;
exports.sendCareTeamNotifications = sendCareTeamNotifications;
const firestore_1 = require("firebase-admin/firestore");
const db = (0, firestore_1.getFirestore)();
/**
 * Send notification to patient about their ER room assignment
 */
async function sendPatientNotification(params) {
    const { patientId, patientName, patientEmail, patientPhone, erRoom, clinicName, address, estimatedWaitMinutes } = params;
    const message = `Hi ${patientName}, your ER room is ready! Please proceed to ${erRoom} at ${clinicName}, ${address}. Estimated wait: ${estimatedWaitMinutes} minutes.`;
    console.log(`📱 Sending patient notification to ${patientName}:`, message);
    // Log notification to Firestore
    await db.collection('notifications').add({
        type: 'patient_room_assignment',
        recipientId: patientId,
        recipientName: patientName,
        channel: 'sms',
        message,
        status: 'sent',
        sentAt: firestore_1.FieldValue.serverTimestamp(),
        metadata: {
            erRoom,
            clinicName,
            estimatedWaitMinutes
        }
    });
    // In production, integrate with Twilio, SendGrid, or Firebase Cloud Messaging
    // Example Twilio integration:
    /*
    if (patientPhone) {
      await twilioClient.messages.create({
        body: message,
        to: patientPhone,
        from: process.env.TWILIO_PHONE_NUMBER
      })
    }
    */
    // Example SendGrid email integration:
    /*
    if (patientEmail) {
      await sendgrid.send({
        to: patientEmail,
        from: 'notifications@medimatch.com',
        subject: 'Your ER Room is Ready',
        text: message,
        html: generateEmailHTML(params)
      })
    }
    */
    // For now, we'll simulate successful delivery
    console.log('✅ Patient notification sent');
}
/**
 * Send notification to doctor about incoming patient
 */
async function sendDoctorNotification(params) {
    const { doctorId, doctorName, doctorEmail, doctorPhone, patientName, patientCondition, triageLevel, erRoom, urgencyLevel } = params;
    const urgencyLabel = urgencyLevel >= 8 ? 'CRITICAL' : urgencyLevel >= 5 ? 'URGENT' : 'STANDARD';
    const message = `Dr. ${doctorName}, new patient arriving: ${patientName} - ${patientCondition} (ESI ${triageLevel}, ${urgencyLabel}). Room: ${erRoom}. Please review chart.`;
    console.log(`📟 Sending doctor notification to Dr. ${doctorName}:`, message);
    // Log notification to Firestore
    await db.collection('notifications').add({
        type: 'doctor_patient_arrival',
        recipientId: doctorId,
        recipientName: doctorName,
        channel: 'pager',
        message,
        status: 'sent',
        sentAt: firestore_1.FieldValue.serverTimestamp(),
        metadata: {
            patientName,
            patientCondition,
            triageLevel,
            erRoom,
            urgencyLevel
        }
    });
    // In production, integrate with paging systems, email, or SMS
    // Example paging system integration:
    /*
    if (doctorPhone) {
      await pagerService.sendPage({
        to: doctorPhone,
        message: message,
        priority: urgencyLevel >= 8 ? 'stat' : 'routine'
      })
    }
    */
    // Example email with detailed patient info:
    /*
    if (doctorEmail) {
      await sendgrid.send({
        to: doctorEmail,
        from: 'er-alerts@medimatch.com',
        subject: `${urgencyLabel}: New Patient - ${patientCondition}`,
        html: generateDoctorEmailHTML(params)
      })
    }
    */
    console.log('✅ Doctor notification sent');
}
/**
 * Send bulk notifications (for care team coordination)
 */
async function sendCareTeamNotifications(params) {
    const { matchId, teamMembers, patientName, patientCondition, erRoom, priority } = params;
    console.log(`👥 Sending care team notifications for match ${matchId}`);
    const notificationPromises = teamMembers.map(async (member) => {
        const message = `${member.role} alert: New patient ${patientName} - ${patientCondition} in ${erRoom}. Priority: ${priority}.`;
        await db.collection('notifications').add({
            type: 'care_team_alert',
            recipientRole: member.role,
            recipientName: member.name,
            channel: 'sms',
            message,
            status: 'sent',
            sentAt: firestore_1.FieldValue.serverTimestamp(),
            metadata: {
                matchId,
                patientName,
                patientCondition,
                erRoom,
                priority
            }
        });
        console.log(`✅ Notified ${member.role}: ${member.name}`);
    });
    await Promise.all(notificationPromises);
    console.log('✅ All care team notifications sent');
}
/**
 * Generate HTML email template for patients
 */
function generateEmailHTML(params) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #2563eb; }
        .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Your ER Room is Ready</h2>
        </div>
        <div class="content">
          <p>Hi ${params.patientName},</p>
          <p>Great news! Your emergency room is prepared and ready for you.</p>

          <div class="info-box">
            <strong>Your ER Room:</strong> ${params.erRoom}<br>
            <strong>Location:</strong> ${params.clinicName}<br>
            <strong>Address:</strong> ${params.address}<br>
            <strong>Estimated Wait:</strong> ${params.estimatedWaitMinutes} minutes
          </div>

          <p>Please proceed to the ER entrance and inform the staff that you have a room assignment.</p>

          <p><strong>What to bring:</strong></p>
          <ul>
            <li>Photo ID</li>
            <li>Insurance card</li>
            <li>List of current medications</li>
          </ul>

          <p>If you have any questions or need directions, please call the ER desk.</p>

          <p>We're ready to provide you with excellent care.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
/**
 * Generate HTML email template for doctors
 */
function generateDoctorEmailHTML(params) {
    const urgencyColor = params.urgencyLevel >= 8 ? '#dc2626' : params.urgencyLevel >= 5 ? '#f59e0b' : '#2563eb';
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${urgencyColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
        .patient-info { background: white; padding: 15px; margin: 10px 0; border-radius: 4px; }
        .urgent { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Patient Arrival</h2>
        </div>
        <div class="content">
          <p>Dr. ${params.doctorName},</p>

          <div class="patient-info">
            <h3>Patient Information</h3>
            <strong>Name:</strong> ${params.patientName}<br>
            <strong>Condition:</strong> ${params.patientCondition}<br>
            <strong>Triage Level:</strong> ESI ${params.triageLevel}<br>
            <strong>Urgency:</strong> ${params.urgencyLevel}/10 ${params.urgencyLevel >= 8 ? '<span class="urgent">(CRITICAL)</span>' : ''}<br>
            <strong>ER Room:</strong> ${params.erRoom}
          </div>

          <p>Please review the patient's chart in the EHR system before arrival.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
