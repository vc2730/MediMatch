/**
 * K2Think AI Service
 * Uses MBZUAI-IFM/K2-Think-v2 reasoning model for clinical triage advice
 */

/**
 * Scan text for balanced JSON objects and return the last valid one.
 * This handles cases where the model outputs multiple {}-delimited blocks
 * (e.g. reasoning examples) before the final answer.
 */
function extractLastJson(text) {
  let last = null
  let i = 0
  while (i < text.length) {
    if (text[i] === '{') {
      let depth = 0
      let j = i
      while (j < text.length) {
        if (text[j] === '{') depth++
        else if (text[j] === '}') {
          depth--
          if (depth === 0) {
            const candidate = text.slice(i, j + 1)
            try {
              last = JSON.parse(candidate)
            } catch {
              // not valid JSON, keep scanning
            }
            break
          }
        }
        j++
      }
      i = j + 1
    } else {
      i++
    }
  }
  return last
}

const K2_ENDPOINT = import.meta.env.VITE_K2_BASE_URL || 'https://api.k2think.ai/v1/chat/completions'
const K2_MODEL = import.meta.env.VITE_K2_MODEL || 'MBZUAI-IFM/K2-Think-v2'

/**
 * Generate clinical insights for a doctor about an incoming patient
 * @param {Object} patient - Patient profile object
 * @returns {Promise<{clinicalSummary, immediateActions, differentials, watchOuts}>}
 */
export const generateDoctorInsights = async (patient) => {
  const apiKey = import.meta.env.VITE_K2_API_KEY
  if (!apiKey) throw new Error('K2Think API key not configured')

  const cacheKey = `k2_doctor_${patient.id}_${patient.medicalCondition}_${patient.urgencyLevel}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch { /* ignore */ }

  const prompt = `You are an emergency medicine clinical decision support AI. An ER doctor needs a rapid briefing on an incoming patient.

Patient arriving:
- Condition: ${patient.medicalCondition || 'Unknown'}
- Symptoms: ${patient.symptoms || 'Not documented'}
- Urgency: ${patient.urgencyLevel || patient.aiUrgencyScore || 5}/10
- Triage: ESI Level ${patient.triageLevel || 3}
- Specialty needed: ${patient.specialty?.replace('_', ' ') || 'General'}
- Insurance: ${patient.insurance || 'Unknown'}
- Transportation: ${patient.transportation || 'Unknown'}

Provide a rapid clinical briefing in JSON only:
{
  "clinicalSummary": "<2 sentence overview of the patient's presentation>",
  "immediateActions": ["<action 1>", "<action 2>", "<action 3>"],
  "differentials": ["<diagnosis 1>", "<diagnosis 2>", "<diagnosis 3>"],
  "watchOuts": ["<red flag 1>", "<red flag 2>"]
}`

  const res = await fetch(K2_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: K2_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 600
    })
  })

  if (!res.ok) throw new Error(`K2Think API error ${res.status}`)

  const data = await res.json()
  const rawText = data?.choices?.[0]?.message?.content || ''
  const text = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  const result = extractLastJson(text)
  if (!result) throw new Error('Could not parse K2Think response')

  try { sessionStorage.setItem(cacheKey, JSON.stringify(result)) } catch { /* ignore */ }
  return result
}

const ESI_LABELS = {
  1: 'ESI Level 1 — Immediate (life-threatening)',
  2: 'ESI Level 2 — Emergent (high risk)',
  3: 'ESI Level 3 — Urgent',
  4: 'ESI Level 4 — Less Urgent',
  5: 'ESI Level 5 — Non-Urgent'
}

/**
 * Generate triage status and action items for a patient using K2Think
 * Results are cached in sessionStorage for the session to avoid repeated calls.
 *
 * @param {Object} patient - Patient profile object
 * @returns {Promise<{triageAssessment: string, priorityLabel: string, priorityColor: string, actionItems: Array}>}
 */
export const generateTriageAdvice = async (patient) => {
  const apiKey = import.meta.env.VITE_K2_API_KEY
  if (!apiKey) throw new Error('K2Think API key not configured')

  // Cache key based on patient condition/urgency so we don't re-call on every render
  const cacheKey = `k2_triage_${patient.id}_${patient.medicalCondition}_${patient.urgencyLevel}`
  try {
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) return JSON.parse(cached)
  } catch {
    // ignore sessionStorage errors
  }

  const triageLabel = ESI_LABELS[patient.triageLevel] || ESI_LABELS[3]
  const urgency = patient.urgencyLevel || patient.aiUrgencyScore || 5

  const prompt = `You are a clinical triage assistant helping ER patients understand their situation.

Patient Information:
- Condition: ${patient.medicalCondition || 'Not specified'}
- Symptoms: ${patient.symptoms || 'Not provided'}
- Urgency: ${urgency}/10
- Triage: ${triageLabel}
- Specialty needed: ${patient.specialty?.replace('_', ' ') || 'General'}
- Insurance: ${patient.insurance || 'Unknown'}
- Transportation: ${patient.transportation || 'Unknown'}

Provide:
1. A clear triage status assessment (2-3 sentences) explaining their current priority and what to expect
2. 3-4 specific actionable tips they should follow right now while waiting for care

Respond ONLY in valid JSON:
{
  "triageAssessment": "<assessment text>",
  "priorityLabel": "<one of: IMMEDIATE, EMERGENT, URGENT, STANDARD>",
  "actionItems": [
    {"title": "<short title>", "description": "<specific instruction>", "icon": "<one of: alert, clock, heart, phone, clipboard, shield>"},
    ...
  ]
}`

  const res = await fetch(K2_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: K2_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 800
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`K2Think API error ${res.status}: ${errText}`)
  }

  const data = await res.json()
  const rawText = data?.choices?.[0]?.message?.content || ''

  // K2-Think-v2 emits <think>...</think> reasoning blocks that contain
  // curly braces — strip them before trying to extract the JSON response.
  const text = rawText
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim()

  // Find all top-level JSON objects and return the last valid one
  // (the model's final answer always comes after its reasoning)
  const result = extractLastJson(text)
  if (!result) throw new Error('Could not parse K2Think response')

  // Add color based on priority
  const colors = {
    IMMEDIATE: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-500/30' },
    EMERGENT: { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-500/30' },
    URGENT: { bg: 'bg-yellow-100 dark:bg-yellow-500/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-500/30' },
    STANDARD: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-500/30' }
  }

  const output = {
    ...result,
    colors: colors[result.priorityLabel] || colors.STANDARD
  }

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(output))
  } catch {
    // ignore
  }

  return output
}
