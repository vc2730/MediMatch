export type ReasoningOutput = {
  patientSummary: string
  doctorSummary: string
  equityExplanation: string
  warnings: string[]
  provider: string
  model: string
}

export type ReasoningPayload = {
  matchId: string
  prompt: string
}

export interface AIProvider {
  generateReasoning(payload: ReasoningPayload): Promise<ReasoningOutput>
}
