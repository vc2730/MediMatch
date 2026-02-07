type MatchContext = {
  match: Record<string, unknown>
  patient?: Record<string, unknown> | null
  doctor?: Record<string, unknown> | null
  appointment?: Record<string, unknown> | null
}

export const buildK2Prompt = (context: MatchContext) => {
  const { match, patient, doctor, appointment } = context

  return `You are a clinical operations assistant generating NON-clinical, non-diagnostic explanations for a match.

Safety rules:
- Do NOT diagnose or provide medical advice.
- Do NOT make up facts. If data is missing, say it is unavailable.
- If severe red flags are present, recommend urgent care or emergency services.

Return ONLY strict JSON with keys:
patientSummary, doctorSummary, equityExplanation, warnings

Context (JSON):
${JSON.stringify({ match, patient, doctor, appointment }, null, 2)}

Output example (must be valid JSON only):
{
  "patientSummary": "...",
  "doctorSummary": "...",
  "equityExplanation": "...",
  "warnings": ["..."]
}
`
}
