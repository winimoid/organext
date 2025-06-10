import { handleAppError } from '../../utils/helpers';
import { Message } from './aiSlice';
import axios from 'axios';

// ✅ Le type des fournisseurs inclut maintenant HuggingFace
export type AIProvider = 'OpenAI' | 'OpenRouter' | 'Gemini' | 'Qwen' | 'DeepSeek' | 'Groq' | 'HuggingFace';

// ✅ Interface pour définir un modèle
export interface Model {
    id: string;      // ID technique pour l'API (ex: 'gpt-4o')
    name: string;    // Nom lisible (ex: 'GPT-4o')
}

// ✅ Liste centralisée des modèles pour chaque fournisseur
export const AI_MODELS: Record<AIProvider, Model[]> = {
    OpenAI: [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
    Gemini: [
        { id: 'gemini-1.5-pro-latest', name: 'Gemini 1.5 Pro (Latest)' },
        { id: 'gemini-1.5-flash-latest', name: 'Gemini 1.5 Flash (Latest)' },
        { id: 'gemini-pro', name: 'Gemini 1.0 Pro' },
    ],
    Groq: [
        { id: 'llama3-8b-8192', name: 'LLaMA3 8b (Groq)' },
        { id: 'llama3-70b-8192', name: 'LLaMA3 70b (Groq)' },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7b (Groq)' },
    ],
    OpenRouter: [
        { id: 'openai/gpt-4o', name: 'GPT-4o (OpenRouter)' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro (OpenRouter)' },
        { id: 'anthropic/claude-3-haiku', name: 'Claude 3 Haiku (OpenRouter)' },
    ],
    DeepSeek: [
        { id: 'deepseek-chat', name: 'DeepSeek Chat' },
        { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ],
    Qwen: [
        { id: 'qwen-turbo', name: 'Qwen Turbo' },
        { id: 'qwen-plus', name: 'Qwen Plus' },
    ],
    HuggingFace: [
        // Cas spécial : le modèle est défini par l'utilisateur
        { id: 'custom', name: 'Custom Model' },
    ],
};

// Interfaces de configuration pour chaque fournisseur
interface ProviderAPIConfig {
    baseURL: (modelId: string) => string;
    headers: (apiKey: string) => Record<string, string>;
    data: (prompt: string, modelId: string) => Record<string, any>;
    extractContent: (responseData: any) => string;
}

const providerAPIConfigs: Record<AIProvider, ProviderAPIConfig> = {
    OpenAI: {
        baseURL: () => 'https://api.openai.com/v1/chat/completions',
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }),
        data: (prompt, modelId) => ({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
        extractContent: data => data?.choices?.[0]?.message?.content,
    },
    OpenRouter: {
        baseURL: () => 'https://openrouter.ai/api/v1/chat/completions',
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}` }),
        data: (prompt, modelId) => ({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
        extractContent: data => data?.choices?.[0]?.message?.content,
    },
    Gemini: {
        baseURL: modelId => `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent`,
        headers: () => ({ 'Content-Type': 'application/json' }),
        data: prompt => ({ contents: [{ parts: [{ text: prompt }] }] }),
        extractContent: data => data?.candidates?.[0]?.content?.parts?.[0]?.text,
    },
    Groq: {
        baseURL: () => 'https://api.groq.com/openai/v1/chat/completions',
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }),
        data: (prompt, modelId) => ({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
        extractContent: data => data?.choices?.[0]?.message?.content,
    },
    DeepSeek: {
        baseURL: () => 'https://api.deepseek.com/chat/completions',
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}` }),
        data: (prompt, modelId) => ({ model: modelId, messages: [{ role: 'user', content: prompt }] }),
        extractContent: data => data?.choices?.[0]?.message?.content,
    },
    Qwen: {
        baseURL: () => 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}` }),
        data: (prompt, modelId) => ({ model: modelId, input: { prompt } }),
        extractContent: data => data?.output?.text,
    },
    HuggingFace: {
        baseURL: modelId => `https://api-inference.huggingface.co/models/${modelId}`,
        headers: apiKey => ({ 'Authorization': `Bearer ${apiKey}` }),
        data: prompt => ({ inputs: prompt, parameters: { return_full_text: false } }),
        extractContent: data => data?.[0]?.generated_text,
    },
};

/**
 * Génère du texte en utilisant le fournisseur et le modèle configurés.
 */
export const generateText = async (prompt: string, provider: AIProvider, apiKey: string, modelId: string): Promise<string> => {
    const config = providerAPIConfigs[provider];
    if (!config) throw new Error(`Provider ${provider} is not supported.`);
    if (!apiKey) throw new Error(`API key for ${provider} is missing.`);
    if (!modelId) throw new Error(`Model ID for ${provider} is missing.`);

    try {
        let url = config.baseURL(modelId);
        // Cas spécial pour Gemini où la clé est dans l'URL
        if (provider === 'Gemini') {
            url += `?key=${apiKey}`;
        }

        const response = await axios.post(url, config.data(prompt, modelId), {
            headers: config.headers(apiKey),
            timeout: 30000,
        });

        const content = config.extractContent(response.data);
        if (!content) {
            console.error('AI Response Error:', response.data);
            throw new Error('Could not parse AI response.');
        }

        return content.trim();
    } catch (error) {
        const message = handleAppError(error, 'aiService: generateText');
        
        if (axios.isAxiosError(error)) {console.log(error);
            console.error(`Axios error calling ${provider}:`, error.response?.data || error.message);
            if (error.response?.status === 401) throw new Error('Unauthorized: Invalid API Key.');
            if (error.response?.status === 429) throw new Error('Rate limit exceeded.');
            throw new Error(error.response?.data?.error?.message || 'API request failed.');
        } else {
            console.error(`Unknown error calling ${provider}:`, error);
            throw new Error('An unknown error occurred.');
        }
    }
};

export const getAvailableModels = (provider: AIProvider): Model[] => {
    return AI_MODELS[provider] || [];
};