/**
 * AI Registry — Mapa completo de provedores gratuitos/cheap
 * Cada provedor tem: capabilities, custo, prioridade, modelos
 * O roteador usa isso pra decidir qual IA usar por tipo de tarefa
 */

export type TaskType = 
  | 'chat'           // Conversa geral
  | 'coding'         // Código / debugging
  | 'creative'       // Creative writing / copywriting
  | 'image'          // Geração de imagem
  | 'vision'         // Análise de imagem
  | 'long_context'   // Contexto longo / documentos
  | 'fast'           // Resposta rápida / baixa latência
  | 'reasoning'      // Raciocínio profundo
  | 'strategy'       // Planejamento / estratégia
  | 'translation'    // Tradução
  | 'summary';       // Resumo

export interface ModelInfo {
  id: string;
  name: string;
  provider: ProviderName;
  contextWindow: number;
  cost: 'free' | 'cheap' | 'paid';
  supports: TaskType[];
  priority: number; // 1 = melhor, quanto maior = menos prioridade
  minTurns?: number; // Créditos mínimos por requisição
  notes?: string;
}

export type ProviderName = 
  | 'openrouter'
  | 'gemini'
  | 'opencode'
  | 'pollinations'
  | 'cohere'
  | 'groq'
  | 'openai';

export interface ProviderConfig {
  name: ProviderName;
  displayName: string;
  requiresKey: boolean;
  baseUrl?: string;
  models: ModelInfo[];
}

// ─────────────────────────────────────────────────────────────────
// REGISTRY — Ordem = prioridade (1 = tenta primeiro)
// ─────────────────────────────────────────────────────────────────

export const PROVIDER_REGISTRY: ProviderConfig[] = [
  // ═══════════════════════════════════════════════════════════════
  // TIER 1: 100% FREE — sem necessidade de API key
  // ═══════════════════════════════════════════════════════════════

  {
    name: 'pollinations',
    displayName: 'Pollinations.ai',
    requiresKey: false,
    models: [
      {
        id: 'text',
        name: 'Pollinations Text (auto-route)',
        provider: 'pollinations',
        contextWindow: 8000,
        cost: 'free',
        supports: ['chat', 'creative', 'coding', 'fast'],
        priority: 1,
        notes: 'Roteamento automático entre modelos gratuitos. Sem key.',
      },
      {
        id: 'image',
        name: 'Pollinations Image',
        provider: 'pollinations',
        contextWindow: 0,
        cost: 'free',
        supports: ['image'],
        priority: 1,
        notes: 'Gera imagem via URL: https://image.pollinations.ai/p/{prompt}',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 2: FREE por quota — com API key (saldo gratuito)
  // ═══════════════════════════════════════════════════════════════

  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    requiresKey: true,
    baseUrl: 'https://openrouter.ai/api/v1',
    models: [
      // ── COMPLETAMENTE FREE (prompt=0, completion=0) ──
      {
        id: 'cohere/command-r7b-12-2024',
        name: 'Cohere Command R7B',
        provider: 'openrouter',
        contextWindow: 128000,
        cost: 'free',
        supports: ['chat', 'reasoning', 'coding', 'creative', 'long_context'],
        priority: 2,
        notes: 'Gratuito Infinity — melhor modelo gratuito geral',
      },
      {
        id: 'cohere/command-r-plus-8b',
        name: 'Cohere Command R+ 8B',
        provider: 'openrouter',
        contextWindow: 128000,
        cost: 'free',
        supports: ['chat', 'reasoning', 'coding', 'long_context'],
        priority: 2,
        notes: 'Gratuito Infinity — raciocínio forte',
      },
      {
        id: 'qwen/qwen-2.5-72b-instruct',
        name: 'Qwen 2.5 72B',
        provider: 'openrouter',
        contextWindow: 32768,
        cost: 'free',
        supports: ['chat', 'coding', 'creative', 'fast'],
        priority: 3,
        notes: 'Gratuito Infinity — muito capaz, 72B',
      },
      {
        id: 'qwen/qwen-2.5-coder-32b-instruct',
        name: 'Qwen Coder 32B',
        provider: 'openrouter',
        contextWindow: 32768,
        cost: 'free',
        supports: ['chat', 'coding'],
        priority: 3,
        notes: 'Gratuito Infinity — otimizado para código',
      },
      {
        id: 'meta-llama/llama-3.3-70b-instruct',
        name: 'Llama 3.3 70B',
        provider: 'openrouter',
        contextWindow: 131072,
        cost: 'free',
        supports: ['chat', 'coding', 'creative', 'long_context'],
        priority: 3,
        notes: 'Gratuito Infinity — grande e versátil',
      },
      {
        id: 'mistralai/mistral-nemo-instruct',
        name: 'Mistral Nemo',
        provider: 'openrouter',
        contextWindow: 131072,
        cost: 'free',
        supports: ['chat', 'creative', 'fast'],
        priority: 4,
        notes: 'Gratuito Infinity — rápido e eficiente',
      },
      {
        id: 'microsoft/phi-4-mini-instruct',
        name: 'Microsoft Phi-4 Mini',
        provider: 'openrouter',
        contextWindow: 16384,
        cost: 'free',
        supports: ['chat', 'fast'],
        priority: 4,
        notes: 'Gratuito Infinity — ultra-rápido, bom para tasks simples',
      },
      {
        id: 'nvidia/nemotron-3.5-content-safety:free',
        name: 'NVIDIA Nemotron 3.5 Safety',
        provider: 'openrouter',
        contextWindow: 4096,
        cost: 'free',
        supports: ['fast'],
        priority: 5,
        notes: 'Gratuito Infinity — só para tasks básicas',
      },
      {
        id: 'sao10k/f1:free',
        name: 'SAO10K F1',
        provider: 'openrouter',
        contextWindow: 32000,
        cost: 'free',
        supports: ['chat', 'coding'],
        priority: 4,
        notes: 'Gratuito Infinity',
      },
      {
        id: 'deepseek/deepseek-prover-v2',
        name: 'DeepSeek Prover V2',
        provider: 'openrouter',
        contextWindow: 16384,
        cost: 'free',
        supports: ['reasoning'],
        priority: 5,
        notes: 'Gratuito Infinity — provas e raciocínio formal',
      },
      // ── FREE com límite diário (com saldo gratuito) ──
      {
        id: 'google/gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        provider: 'openrouter',
        contextWindow: 1000000,
        cost: 'free',
        supports: ['chat', 'vision', 'fast', 'coding', 'creative', 'long_context', 'reasoning'],
        priority: 5,
        notes: 'Free tier OpenRouter — rápido e com visão',
      },
      {
        id: 'google/gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite',
        provider: 'openrouter',
        contextWindow: 65536,
        cost: 'free',
        supports: ['fast', 'chat', 'creative'],
        priority: 5,
        notes: 'Free tier OpenRouter — mais barato e rápido',
      },
      {
        id: 'anthropic/claude-3-haiku',
        name: 'Claude 3 Haiku',
        provider: 'openrouter',
        contextWindow: 200000,
        cost: 'free',
        supports: ['chat', 'fast', 'vision'],
        priority: 5,
        notes: 'Free tier OpenRouter — rápido e com visão',
      },
      // ── CHEAP (custo mínimo) ──
      {
        id: 'google/gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        provider: 'openrouter',
        contextWindow: 1000000,
        cost: 'cheap',
        supports: ['chat', 'vision', 'fast', 'coding', 'creative', 'long_context', 'reasoning', 'strategy'],
        priority: 6,
        notes: '$0.075/1M tokens — excelente custo-benefício',
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openrouter',
        contextWindow: 128000,
        cost: 'cheap',
        supports: ['chat', 'vision', 'fast', 'coding'],
        priority: 6,
        notes: '$0.15/1M tokens — confiável e rápido',
      },
      {
        id: 'meta-llama/llama-3.1-70b-instruct',
        name: 'Llama 3.1 70B',
        provider: 'openrouter',
        contextWindow: 131072,
        cost: 'cheap',
        supports: ['chat', 'coding', 'creative', 'long_context', 'reasoning'],
        priority: 7,
        notes: '$0.40/1M tokens — muito potente',
      },
      {
        id: 'mistralai/mistral-large',
        name: 'Mistral Large 2',
        provider: 'openrouter',
        contextWindow: 128000,
        cost: 'cheap',
        supports: ['chat', 'coding', 'reasoning', 'strategy', 'long_context'],
        priority: 7,
        notes: '$2/1M tokens — raciocínio profundo',
      },
    ],
  },

  {
    name: 'gemini',
    displayName: 'Google Gemini (direto)',
    requiresKey: true,
    baseUrl: 'https://generativelanguage.googleapis.com',
    models: [
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash (direto)',
        provider: 'gemini',
        contextWindow: 1000000,
        cost: 'free',
        supports: ['chat', 'vision', 'fast', 'coding', 'creative', 'long_context', 'reasoning'],
        priority: 3,
        notes: 'Gratuito via tier Gemini — 1500 req/min, 15000 req/dia',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash (direto)',
        provider: 'gemini',
        contextWindow: 1000000,
        cost: 'free',
        supports: ['chat', 'vision', 'fast', 'coding', 'creative', 'long_context', 'reasoning', 'strategy'],
        priority: 4,
        notes: 'Gratuito via tier Gemini — excelente geral',
      },
      {
        id: 'gemini-3.1-flash-lite',
        name: 'Gemini 3.1 Flash Lite (direto)',
        provider: 'gemini',
        contextWindow: 65536,
        cost: 'free',
        supports: ['fast', 'chat', 'creative'],
        priority: 5,
        notes: 'Gratuito via tier Gemini — mais barato',
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini',
        contextWindow: 1000000,
        cost: 'free',
        supports: ['chat', 'vision', 'coding', 'long_context'],
        priority: 5,
        notes: 'Gratuito via tier Gemini — grande contexto',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        provider: 'gemini',
        contextWindow: 2000000,
        cost: 'cheap',
        supports: ['chat', 'vision', 'coding', 'reasoning', 'strategy', 'long_context'],
        priority: 7,
        notes: '$0.50-2.50/1M tokens — o mais potente Gemini',
      },
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini 2.5 Flash Image',
        provider: 'gemini',
        contextWindow: 1000000,
        cost: 'cheap',
        supports: ['image', 'vision'],
        priority: 5,
        notes: 'Geração de imagem nativa do Gemini',
      },
    ],
  },

  {
    name: 'opencode',
    displayName: 'OpenCode Zen',
    requiresKey: true,
    baseUrl: 'https://opencode.ai/api',
    models: [
      {
        id: 'opencode',
        name: 'OpenCode (auto-route)',
        provider: 'opencode',
        contextWindow: 200000,
        cost: 'free',
        supports: ['coding', 'chat'],
        priority: 2,
        notes: 'Gratuito — especializado em código (terminal)',
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // TIER 3: API direta (sem OpenRouter) — mais cheap
  // ═══════════════════════════════════════════════════════════════

  {
    name: 'cohere',
    displayName: 'Cohere',
    requiresKey: true,
    baseUrl: 'https://api.cohere.ai',
    models: [
      {
        id: 'command-r7b-12-2024',
        name: 'Command R7B (direto)',
        provider: 'cohere',
        contextWindow: 128000,
        cost: 'free',
        supports: ['chat', 'reasoning', 'coding', 'long_context'],
        priority: 3,
        notes: 'Gratuito Infinity via Cohere — sem rate limits Altos',
      },
      {
        id: 'command-r-plus-08-2024',
        name: 'Command R+ (direto)',
        provider: 'cohere',
        contextWindow: 128000,
        cost: 'free',
        supports: ['chat', 'reasoning', 'coding', 'long_context'],
        priority: 3,
        notes: 'Gratuito Infinity via Cohere',
      },
    ],
  },

  {
    name: 'groq',
    displayName: 'Groq',
    requiresKey: true,
    baseUrl: 'https://api.groq.com/openai/v1',
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B Versatile',
        provider: 'groq',
        contextWindow: 128000,
        cost: 'free',
        supports: ['chat', 'coding', 'creative', 'long_context', 'fast'],
        priority: 2,
        notes: 'Gratuito — velocidade extrema (inferência Groq)',
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B Instant',
        provider: 'groq',
        contextWindow: 8192,
        cost: 'free',
        supports: ['chat', 'fast'],
        priority: 2,
        notes: 'Gratuito — ultra-rápido',
      },
      {
        id: 'mixtral-8x7b-32768',
        name: 'Mixtral 8x7B',
        provider: 'groq',
        contextWindow: 32768,
        cost: 'free',
        supports: ['chat', 'coding'],
        priority: 3,
        notes: 'Gratuito — bom geral',
      },
      {
        id: 'gemma2-9b-it',
        name: 'Gemma 2 9B',
        provider: 'groq',
        contextWindow: 8192,
        cost: 'free',
        supports: ['chat', 'fast'],
        priority: 3,
        notes: 'Gratuito — leve e rápido',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────

export function getAllModels(): ModelInfo[] {
  return PROVIDER_REGISTRY
    .flatMap(p => p.models)
    .sort((a, b) => a.priority - b.priority);
}

export function getModelsForTask(task: TaskType, maxCost: 'free' | 'cheap' | 'paid' = 'free'): ModelInfo[] {
  return getAllModels().filter(
    m => m.supports.includes(task) && (m.cost === 'free' || (m.cost === 'cheap' && maxCost !== 'free'))
  );
}

export function getModelById(id: string): ModelInfo | undefined {
  return getAllModels().find(m => m.id === id);
}

export function getProviderConfig(name: ProviderName): ProviderConfig | undefined {
  return PROVIDER_REGISTRY.find(p => p.name === name);
}

export function getBestModelForTask(task: TaskType, availableKeys: {
  gemini?: boolean;
  openrouter?: boolean;
  opencode?: boolean;
  cohere?: boolean;
  groq?: boolean;
}): ModelInfo | null {
  const candidates = getModelsForTask(task, 'free');
  
  for (const model of candidates) {
    const providerCfg = getProviderConfig(model.provider);
    
    // Se não precisa de key, pode usar
    if (!providerCfg || !providerCfg.requiresKey) return model;
    
    // Se precisa de key, verifica se tem
    if (model.provider === 'gemini' && availableKeys.gemini) return model;
    if (model.provider === 'openrouter' && availableKeys.openrouter) return model;
    if (model.provider === 'opencode' && availableKeys.opencode) return model;
    if (model.provider === 'cohere' && availableKeys.cohere) return model;
    if (model.provider === 'groq' && availableKeys.groq) return model;
  }
  
  return null;
}

// ─────────────────────────────────────────────────────────────────
// FALLBACK CHAINS — ordem de prioridade por task
// ─────────────────────────────────────────────────────────────────

export const FALLBACK_CHAINS: Record<TaskType, string[]> = {
  chat: [
    'cohere/command-r7b-12-2024',      // Free Infinity (OR)
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity (OR)
    'qwen/qwen-2.5-72b-instruct',       // Free Infinity (OR)
    'groq:llama-3.3-70b-versatile',      // Free Groq (ultra-fast)
    'groq:llama-3.1-8b-instant',        // Free Groq
    'gemini:gemini-2.0-flash',          // Free Gemini direto
    'gemini:gemini-2.5-flash',          // Free Gemini direto
    'pollinations:text',                // Last resort free
  ],
  coding: [
    'opencode:opencode',                // Especialista em código
    'cohere/command-r7b-12-2024',       // Free Infinity
    'qwen/qwen-2.5-coder-32b-instruct', // Free Infinity (coder)
    'groq:llama-3.3-70b-versatile',     // Free Groq
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity
    'gemini:gemini-2.5-flash',          // Free Gemini
    'pollinations:text',                // Last resort
  ],
  creative: [
    'cohere/command-r7b-12-2024',       // Free Infinity
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity
    'qwen/qwen-2.5-72b-instruct',       // Free Infinity
    'mistralai/mistral-nemo-instruct',  // Free Infinity
    'gemini:gemini-2.5-flash',          // Free Gemini
    'pollinations:text',                // Last resort
  ],
  image: [
    'gemini:gemini-2.5-flash-image',   // Gemini nativo (cheap)
    'pollinations:image',              // Pollinations (free)
  ],
  vision: [
    'gemini:gemini-2.0-flash',          // Free Gemini com visão
    'anthropic/claude-3-haiku',         // Free via OR
    'gemini:gemini-2.5-flash',          // Free Gemini
    'openai/gpt-4o-mini',               // Cheap via OR
  ],
  long_context: [
    'cohere/command-r7b-12-2024',       // Free Infinity 128k
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity 128k
    'gemini:gemini-2.0-flash',          // Free Gemini 1M context
    'gemini:gemini-2.5-flash',          // Free Gemini 1M context
    'openai/gpt-4o-mini',               // Cheap 128k
  ],
  fast: [
    'groq:llama-3.1-8b-instant',        // Free Groq (instant)
    'mistralai/mistral-nemo-instruct',  // Free Infinity
    'microsoft/phi-4-mini-instruct',    // Free Infinity
    'nvidia/nemotron-3.5-content-safety:free', // Free Infinity
    'gemini:gemini-2.5-flash',          // Free Gemini
    'pollinations:text',                // Last resort
  ],
  reasoning: [
    'cohere/command-r7b-12-2024',       // Free Infinity (forte em reasoning)
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity
    'mistralai/mistral-large',          // Cheap Mistral Large
    'gemini:gemini-2.5-pro',             // Cheap Gemini Pro
  ],
  strategy: [
    'cohere/command-r7b-12-2024',       // Free Infinity
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity 70B
    'mistralai/mistral-large',          // Cheap
    'gemini:gemini-2.5-pro',            // Cheap
  ],
  translation: [
    'qwen/qwen-2.5-72b-instruct',       // Free Infinity
    'meta-llama/llama-3.3-70b-instruct', // Free Infinity
    'cohere/command-r7b-12-2024',       // Free Infinity
    'gemini:gemini-2.5-flash',          // Free Gemini
  ],
  summary: [
    'groq:llama-3.1-8b-instant',        // Free Groq (instant)
    'cohere/command-r7b-12-2024',       // Free Infinity
    'gemini:gemini-2.0-flash',          // Free Gemini
    'pollinations:text',                // Last resort
  ],
};