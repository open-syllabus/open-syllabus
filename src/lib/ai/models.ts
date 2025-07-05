export interface AIModel {
  id: string;
  name: string;
  description: string;
  tier: 'free' | 'pro';
  provider: string;
  costPerMillionTokensInput: number;
  costPerMillionTokensOutput: number;
}

export const AI_MODELS: Record<string, AIModel> = {
  'grok-3-mini': {
    id: 'grok-3-mini',
    name: 'Grok-3 Mini',
    description: 'Fast and efficient for everyday tasks',
    tier: 'free',
    provider: 'x-ai',
    costPerMillionTokensInput: 0.30,
    costPerMillionTokensOutput: 0.50
  },
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Advanced reasoning and complex problem solving',
    tier: 'pro',
    provider: 'openai',
    costPerMillionTokensInput: 0.40,
    costPerMillionTokensOutput: 1.60
  },
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    description: 'Latest knowledge with ultra-fast responses',
    tier: 'pro',
    provider: 'google',
    costPerMillionTokensInput: 0.30,
    costPerMillionTokensOutput: 2.50
  }
};

export const DEFAULT_MODEL = 'grok-3-mini';

export function getModelById(modelId: string): AIModel {
  return AI_MODELS[modelId] || AI_MODELS[DEFAULT_MODEL];
}

export function getAvailableModels(tier: string): AIModel[] {
  if (tier === 'pro' || tier === 'school' || tier === 'beta_tester') {
    return Object.values(AI_MODELS);
  }
  return Object.values(AI_MODELS).filter(model => model.tier === 'free');
}

export function isModelAvailableForTier(modelId: string, tier: string): boolean {
  const model = AI_MODELS[modelId];
  if (!model) return false;
  
  if (model.tier === 'free') return true;
  return tier === 'pro' || tier === 'school' || tier === 'beta_tester';
}

// Map internal model IDs to OpenRouter model strings
export function getOpenRouterModelString(modelId: string): string {
  const mapping: Record<string, string> = {
    'grok-3-mini': 'x-ai/grok-3-mini',
    'gpt-4.1-mini': 'openai/gpt-4.1-mini', 
    'gemini-2.5-flash': 'google/gemini-2.5-flash'
  };
  
  return mapping[modelId] || mapping[DEFAULT_MODEL];
}