/**
 * Flowglad Billing Integration
 * Usage-based billing: hospitals pay per successful ER match
 * API: https://app.flowglad.com/api/v1
 */

import { updateDoc, doc, setDoc, Timestamp, collection } from 'firebase/firestore'
import { db } from '../firebase/config'

// Use Vite proxy in dev to avoid CORS, direct URL in production
const FLOWGLAD_API = import.meta.env.DEV
  ? '/api/flowglad/v1'
  : 'https://app.flowglad.com/api/v1'
const USAGE_METER_SLUG = 'er-matches'

// ER Routing product (created 2026-02-08, test mode)
export const ER_ROUTING_PRODUCT_ID = 'prod_ze5k5as4yGioEvEAFR0Lp'
export const ER_ROUTING_PRICE_ID = 'price_B8dxExKqcORg2425Cj5dV'

function getApiKey() {
  return import.meta.env.VITE_FLOWGLAD_API_KEY
}

/**
 * Create or retrieve a Flowglad customer for a doctor/hospital
 * Called on doctor registration
 */
export const createBillingCustomer = async (userId, name, email) => {
  const apiKey = getApiKey()
  if (!apiKey) return null

  try {
    const response = await fetch(`${FLOWGLAD_API}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          name,
          email,
          externalId: userId
        }
      })
    })

    if (!response.ok) {
      // Customer may already exist — try to find them
      const listRes = await fetch(`${FLOWGLAD_API}/customers?externalId=${userId}`, {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      })
      if (listRes.ok) {
        const listData = await listRes.json()
        if (listData.data?.[0]) return listData.data[0].customer
      }
      return null
    }

    const data = await response.json()
    console.log('✅ Flowglad customer created:', data.data?.customer?.id)
    return data.data?.customer
  } catch (error) {
    console.error('❌ Flowglad customer creation failed:', error.message)
    return null
  }
}

/**
 * Look up a Flowglad customer by externalId, returns the customer object or null
 */
const findCustomerByExternalId = async (externalId) => {
  const apiKey = getApiKey()
  if (!apiKey) return null
  try {
    const response = await fetch(`${FLOWGLAD_API}/customers?externalId=${encodeURIComponent(externalId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.data?.[0] || null
  } catch {
    return null
  }
}

/**
 * Create a Flowglad checkout session for subscribing to ER Routing
 * Returns the checkout URL to redirect to
 */
export const createCheckoutSession = async (customerExternalId, name, email, successUrl, cancelUrl, priceId = ER_ROUTING_PRICE_ID) => {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.error('❌ Flowglad API key not configured')
    throw new Error('Flowglad API key not configured. Add VITE_FLOWGLAD_API_KEY to .env')
  }

  console.log('🔧 Creating Flowglad customer if needed...')
  // Ensure customer exists with real name/email
  await createBillingCustomer(customerExternalId, name || customerExternalId, email || `${customerExternalId}@medimatch.ai`)

  console.log('🛒 Creating checkout session...')
  console.log('Price ID:', priceId)
  console.log('Customer:', customerExternalId)

  const response = await fetch(`${FLOWGLAD_API}/checkout-sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      checkoutSession: {
        type: 'product',
        priceId,
        customerExternalId,
        successUrl,
        cancelUrl
      }
    })
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('❌ Flowglad checkout failed:', err)
    throw new Error(`Checkout session failed: ${err}`)
  }

  const data = await response.json()
  console.log('✅ Checkout response:', data)

  const url = data.checkoutSession?.url || data.url || data.data?.url
  if (!url) {
    console.error('❌ No URL in response:', data)
    throw new Error('No checkout URL returned from Flowglad')
  }

  console.log('🌐 Checkout URL:', url)
  return url
}

/**
 * Create a Flowglad customer portal session
 * Returns the portal URL where customers can manage their subscriptions
 */
export const createCustomerPortalSession = async (customerExternalId) => {
  const apiKey = getApiKey()
  if (!apiKey) return null

  try {
    // First, find the customer by externalId
    const customer = await findCustomerByExternalId(customerExternalId)
    if (!customer) {
      console.warn('Customer not found for portal session')
      return null
    }

    // Create portal session
    const response = await fetch(`${FLOWGLAD_API}/customer-portal-sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customerPortalSession: {
          customerId: customer.id,
          returnUrl: window.location.href
        }
      })
    })

    if (!response.ok) {
      console.warn('Failed to create portal session')
      return null
    }

    const data = await response.json()
    return data.customerPortalSession?.url || data.url || null
  } catch (error) {
    console.error('Portal session error:', error)
    return null
  }
}

/**
 * Get paid subscription status for a customer (excludes free plan)
 * Returns array of active paid subscriptions, or empty array if none
 */
export const getCustomerSubscriptions = async (customerExternalId) => {
  const apiKey = getApiKey()
  if (!apiKey) return []

  try {
    // Step 1: look up customer by externalId to get their internal customerId
    const customer = await findCustomerByExternalId(customerExternalId)
    if (!customer) return []

    // Step 2: query subscriptions by customerId
    const response = await fetch(`${FLOWGLAD_API}/subscriptions?customerId=${encodeURIComponent(customer.id)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!response.ok) return []
    const data = await response.json()

    // Step 3: filter out free plan subscriptions — only return paid active ones
    return (data.data || []).filter(s => !s.isFreePlan && s.status === 'active')
  } catch {
    return []
  }
}

/**
 * Record a usage event for a successful ER match
 * This bills the hospital/doctor per match
 * Each call generates a UNIQUE transaction ID to allow unlimited test payments
 */
export const recordMatchBillingEvent = async (matchId, subscriptionId, matchDetails = {}) => {
  const apiKey = getApiKey()
  if (!apiKey) return null

  // Use demo subscription if none provided
  const subId = subscriptionId ||
    import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID

  if (!subId) {
    console.warn('No subscription ID for billing event')
    return null
  }

  // Generate UNIQUE transaction ID to allow unlimited test payments
  // Format: match_[matchId]_[timestamp]_[random]
  const uniqueTransactionId = `match_${matchId}_${Date.now()}_${Math.random().toString(36).substring(7)}`

  try {
    const response = await fetch(`${FLOWGLAD_API}/usage-events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        usageEvent: {
          subscriptionId: subId,
          amount: 1,
          transactionId: uniqueTransactionId,
          usageMeterSlug: USAGE_METER_SLUG,
          properties: {
            matchId,
            patientPriority: matchDetails.priority || 'standard',
            erRoom: matchDetails.erRoom || 'unknown',
            timestamp: new Date().toISOString(),
            testMode: true // Flag for identifying test payments
          }
        }
      })
    })

    if (!response.ok) {
      const err = await response.text()
      console.warn('Flowglad usage event failed:', err)
      return null
    }

    const data = await response.json()
    console.log('💰 Flowglad billing event recorded:', data.usageEvent?.id)
    console.log('📝 Transaction ID:', uniqueTransactionId)
    return data.usageEvent
  } catch (error) {
    console.error('❌ Flowglad billing event failed:', error.message)
    return null
  }
}

/**
 * Test function to trigger a billing event manually
 * Useful for testing payment flow without going through full patient matching
 */
export const triggerTestPayment = async (testDetails = {}) => {
  const testMatchId = `test_${Date.now()}`
  const result = await recordMatchBillingEvent(testMatchId, null, {
    priority: testDetails.priority || 'test',
    erRoom: testDetails.erRoom || 'TEST-ER-001',
    ...testDetails
  })

  if (result) {
    console.log('✅ Test payment successful!')
    console.log('💰 Billing Event ID:', result.id)
    return {
      success: true,
      billingEventId: result.id,
      transactionId: result.transactionId,
      amount: result.amount,
      timestamp: new Date().toISOString()
    }
  } else {
    console.log('❌ Test payment failed')
    return {
      success: false,
      error: 'Billing event not created'
    }
  }
}

/**
 * Get all usage events for a subscription
 * Useful for viewing billing history and testing
 */
export const getUsageEvents = async (subscriptionId = null) => {
  const apiKey = getApiKey()
  if (!apiKey) return []

  const subId = subscriptionId || import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID
  if (!subId) return []

  try {
    const response = await fetch(`${FLOWGLAD_API}/usage-events?subscriptionId=${encodeURIComponent(subId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    if (!response.ok) return []

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Failed to fetch usage events:', error)
    return []
  }
}

/**
 * Look up the active paid subscription ID for a doctor by externalId
 * Falls back to demo subscription if none found
 */
const getDoctorSubscriptionId = async (doctorExternalId) => {
  try {
    const customer = await findCustomerByExternalId(doctorExternalId)
    if (!customer) return import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID
    const apiKey = getApiKey()
    const resp = await fetch(`${FLOWGLAD_API}/subscriptions?customerId=${encodeURIComponent(customer.id)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    if (!resp.ok) return import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID
    const data = await resp.json()
    // Prefer paid subscription; fall back to any active subscription
    const paid = (data.data || []).find(s => !s.isFreePlan && s.status === 'active')
    const any = (data.data || []).find(s => s.status === 'active')
    return paid?.id || any?.id || import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID
  } catch {
    return import.meta.env.VITE_FLOWGLAD_DEMO_SUBSCRIPTION_ID
  }
}

/**
 * Trigger match workflow — real Firestore operations + Flowglad billing
 * Steps execute sequentially and update the workflow document in real time
 * @param {string} matchId - Match document ID
 * @param {Object} matchData - { priorityTier, erRoom, doctorId, patientId, patientName, condition }
 * @returns {Promise<string>} Workflow ID
 */
export const triggerMatchWorkflow = async (matchId, matchData = {}) => {
  console.log('🔄 Triggering workflow for match:', matchId)

  const workflowId = `wf_${matchId}_${Date.now()}`
  const workflowRef = doc(collection(db, 'workflows'), workflowId)
  const matchRef = doc(db, 'matches', matchId)

  const completeAction = async (action) => {
    await updateDoc(workflowRef, {
      [`actions.${action}`]: { status: 'completed', completedAt: Timestamp.now() },
      lastUpdatedAt: Timestamp.now()
    }).catch(() => {})
    console.log(`✅ Workflow action: ${action}`)
  }

  try {
    await setDoc(workflowRef, {
      workflowId, matchId, status: 'in_progress',
      actions: {}, billingEventId: null,
      createdAt: Timestamp.now(), lastUpdatedAt: Timestamp.now()
    })

    await setDoc(matchRef, {
      workflowId, workflowStatus: 'in_progress', workflowTriggeredAt: Timestamp.now()
    }, { merge: true })

    // Run workflow in background so UI doesn't block
    ;(async () => {
      try {
        // Step 1: Notify patient — write to notifications collection
        await setDoc(doc(db, 'notifications', `${matchId}_patient`), {
          recipientId: matchData.patientId || 'unknown',
          type: 'patient_matched',
          message: `You have been matched to ${matchData.erRoom || 'an ER room'}. Please proceed immediately.`,
          erRoom: matchData.erRoom,
          priority: matchData.priorityTier <= 2 ? 'critical' : 'standard',
          read: false,
          createdAt: Timestamp.now()
        }).catch(() => {})
        await completeAction('send_patient_notification')

        // Step 2: Notify doctor — update demoSessions so dashboard reacts
        if (matchData.doctorId) {
          await setDoc(doc(db, 'demoSessions', matchData.doctorId), {
            workflowAlert: {
              matchId, patientName: matchData.patientName || 'Patient',
              condition: matchData.condition || 'Unknown',
              erRoom: matchData.erRoom, priority: matchData.priorityTier,
              alertedAt: Timestamp.now().toMillis()
            },
            updatedAt: new Date().toISOString()
          }, { merge: true }).catch(() => {})
        }
        await completeAction('send_doctor_notification')

        // Step 3: Update appointment status to 'in_progress'
        if (matchData.appointmentId) {
          await setDoc(doc(db, 'appointments', matchData.appointmentId), {
            status: 'occupied', patientMatchId: matchId,
            occupiedAt: Timestamp.now(), patientName: matchData.patientName
          }, { merge: true }).catch(() => {})
        }
        await completeAction('update_calendar')

        // Step 4: Mark ER room as being prepared
        await setDoc(matchRef, {
          roomPrepared: true, roomPreppedAt: Timestamp.now()
        }, { merge: true }).catch(() => {})
        await completeAction('prepare_er_room')

        // Step 5: Record real Flowglad billing event against doctor's subscription
        const subscriptionId = await getDoctorSubscriptionId(matchData.doctorId)
        const billingEvent = await recordMatchBillingEvent(matchId, subscriptionId, {
          priority: matchData.priorityTier <= 2 ? 'critical' : 'standard',
          erRoom: matchData.erRoom
        })
        await completeAction('record_billing_event')

        // Complete workflow
        await updateDoc(workflowRef, {
          status: 'completed',
          billingEventId: billingEvent?.id || null,
          completedAt: Timestamp.now(), lastUpdatedAt: Timestamp.now()
        }).catch(() => {})

        await setDoc(matchRef, {
          workflowStatus: 'completed',
          workflowCompletedActions: ['send_patient_notification', 'send_doctor_notification', 'update_calendar', 'prepare_er_room', 'record_billing_event'],
          workflowCompletedAt: Timestamp.now(),
          billingEventId: billingEvent?.id || null
        }, { merge: true }).catch(() => {})

        console.log('✅ Workflow + billing complete:', workflowId, '| Flowglad event:', billingEvent?.id)
      } catch (err) {
        console.error('❌ Workflow execution error:', err)
        await updateDoc(workflowRef, { status: 'failed', lastUpdatedAt: Timestamp.now() }).catch(() => {})
      }
    })()

    return workflowId
  } catch (error) {
    console.error('❌ Error triggering workflow:', error)
    throw error
  }
}

/**
 * Update workflow status in Firestore
 */
export const updateWorkflowStatus = async (matchId, status, details = {}) => {
  const matchRef = doc(db, 'matches', matchId)
  await setDoc(matchRef, {
    workflowStatus: status,
    workflowUpdatedAt: Timestamp.now(),
    ...details
  }, { merge: true })
}

/**
 * Check workflow status
 */
export const checkWorkflowStatus = async (workflowId) => {
  try {
    const { getDoc } = await import('firebase/firestore')
    const snap = await getDoc(doc(db, 'workflows', workflowId))
    if (!snap.exists()) return { workflowId, status: 'not_found', completedActions: [] }

    const data = snap.data()
    const completedActions = Object.entries(data.actions || {})
      .filter(([, v]) => v.status === 'completed').map(([k]) => k)

    return { workflowId, status: data.status, completedActions, billingEventId: data.billingEventId }
  } catch (error) {
    return { workflowId, status: 'unknown', completedActions: [] }
  }
}

export const cancelWorkflow = async (workflowId, matchId) => {
  await updateDoc(doc(db, 'workflows', workflowId), { status: 'cancelled', lastUpdatedAt: Timestamp.now() })
  await updateWorkflowStatus(matchId, 'cancelled')
}

export const retryWorkflow = async (matchId, matchData) => {
  if (matchData.workflowId) await cancelWorkflow(matchData.workflowId, matchId).catch(() => {})
  return triggerMatchWorkflow(matchId, matchData)
}

export const handleFlowGladWebhook = async (webhookPayload) => {
  const { status, matchId, completedActions, error } = webhookPayload
  await updateWorkflowStatus(matchId, status, { workflowCompletedActions: completedActions, workflowError: error || null })
}

export const WORKFLOW_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}
