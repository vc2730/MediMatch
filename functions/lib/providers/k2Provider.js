"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.K2Provider = void 0;
const config_1 = require("../config");
const extractJson = (text) => {
    const trimmed = text.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        return trimmed;
    }
    const first = trimmed.indexOf('{');
    const last = trimmed.lastIndexOf('}');
    if (first >= 0 && last > first) {
        return trimmed.slice(first, last + 1);
    }
    return trimmed;
};
const parseResponse = (response) => {
    const raw = response.output ||
        response.content ||
        response.choices?.[0]?.message?.content ||
        response.choices?.[0]?.text ||
        '';
    const jsonText = extractJson(raw);
    return JSON.parse(jsonText);
};
class K2Provider {
    async generateReasoning(payload) {
        const config = (0, config_1.assertK2Config)();
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
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`K2 request failed: ${response.status} ${text}`);
        }
        const data = await response.json();
        const parsed = parseResponse(data);
        return {
            patientSummary: parsed.patientSummary || 'Summary unavailable',
            doctorSummary: parsed.doctorSummary || 'Summary unavailable',
            equityExplanation: parsed.equityExplanation || 'No explanation provided',
            warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
            provider: (0, config_1.getK2Config)().providerName,
            model: (0, config_1.getK2Config)().model
        };
    }
}
exports.K2Provider = K2Provider;
