import { AIProvider, ReasoningOutput, ReasoningPayload } from './aiProvider'
import { assertK2Config, getK2Config } from '../config'

type K2Response = {
  choices?: Array<{ message?: { content?: string }; text?: string }>
  output?: string
  content?: string
}

const extractJson = (text: string) => {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
  }
  const first = trimmed.indexOf('{')
  const last = trimmed.lastIndexOf('}')
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1)
  }
  return trimmed
}

const parseResponse = (response: K2Response) => {
  const raw =
    response.output ||
    response.content ||
    response.choices?.[0]?.message?.content ||
    response.choices?.[0]?.text ||
    ''

  const jsonText = extractJson(raw)
  return JSON.parse(jsonText)
}

export class K2Provider implements AIProvider {
  async generateReasoning(payload: ReasoningPayload): Promise<ReasoningOutput> {
    const config = assertK2Config()

    const response = await fetch(config.baseUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'You generate JSON-only reasoning summaries for care matching.'
          },
          {
            role: 'user',
            content: payload.prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`K2 request failed: ${response.status} ${text}`)
    }

    const data: K2Response = await response.json()
    const parsed = parseResponse(data)

    return {
      patientSummary: parsed.patientSummary || 'Summary unavailable',
      doctorSummary: parsed.doctorSummary || 'Summary unavailable',
      equityExplanation: parsed.equityExplanation || 'No explanation provided',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      provider: getK2Config().providerName,
      model: getK2Config().model
    }
  }
}
