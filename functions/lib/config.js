"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertK2Config = exports.getK2Config = void 0;
const functions = __importStar(require("firebase-functions"));
const getFunctionsConfig = () => {
    try {
        return functions.config();
    }
    catch {
        return {};
    }
};
const getK2Config = () => {
    const config = getFunctionsConfig();
    return {
        baseUrl: process.env.K2_BASE_URL || config.k2?.base_url || 'https://api.k2think.ai/v1/chat/completions',
        apiKey: process.env.K2_API_KEY || config.k2?.api_key || '',
        model: process.env.K2_MODEL || config.k2?.model || 'MBZUAI-IFM/K2-Think-v2',
        providerName: 'k2'
    };
};
exports.getK2Config = getK2Config;
const assertK2Config = () => {
    const config = (0, exports.getK2Config)();
    if (!config.baseUrl || !config.apiKey) {
        throw new Error('K2 configuration missing. Set K2_BASE_URL and K2_API_KEY.');
    }
    return config;
};
exports.assertK2Config = assertK2Config;
