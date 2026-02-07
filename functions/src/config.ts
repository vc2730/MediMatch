import * as functions from 'firebase-functions'

type K2Config = {
  baseUrl: string
  apiKey: string
  model: string
  providerName: string
}

const getFunctionsConfig = () => {
  try {
    return functions.config()
  } catch {
    return {}
  }
}

export const getK2Config = (): K2Config => {
  const config = getFunctionsConfig()
  return {
    baseUrl: process.env.K2_BASE_URL || config.k2?.base_url || 'https://api.k2think.ai/v1/chat/completions',
    apiKey: process.env.K2_API_KEY || config.k2?.api_key || '',
    model: process.env.K2_MODEL || config.k2?.model || 'MBZUAI-IFM/K2-Think-v2',
    providerName: 'k2'
  }
}

export const assertK2Config = () => {
  const config = getK2Config()
  if (!config.baseUrl || !config.apiKey) {
    throw new Error('K2 configuration missing. Set K2_BASE_URL and K2_API_KEY.')
  }
  return config
}
