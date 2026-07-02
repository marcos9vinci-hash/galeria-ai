/**
 * ROTa-IA — Roteador Inteligente de IAs
 * Lógica: tenta o melhor → se falhar (quota/erro/rate limit) → próxima → próxima → ...
 * Nunca paga. Ciclo infinito gratuito.
 */

import axios from 'axios';
import { FALLBACK_CHAINS, TaskType, type ModelInfo } from './ai-registry.js';

interface RotaRequest {
  task: TaskType;
  prompt: string;
  systemInstruction?: string;
  maxTokens?: number;
  temperature?: number;
  imageUrl?: string; // Para chamadas com imagem
  jsonMode?: boolean;
}

interface RotaResponse {
  text: string;
  modelUsed: string;
  provider: string;
  success: boolean;
  attempt: number;
  error?: string;
  fallbackHistory: string[]; // modelos tentados antes de funcionar
}

interface KeyStatus {
  gemini: boolean;
  openrouter: boolean;
  opencode: boolean;
  cohere: boolean;
  groq: boolean;
}

// ─────────────────────────────────────────────────────────────────
// STATUS DE KEYS — detecta quais APIs estão disponíveis
// ─────────────────────────────────────────────────────────────────

function getAvailableKeys(): KeyStatus {
  const keys = {
    openrouter: !!(
      process.env.OPENROUTER_API_KEY &&
      process.env.OPENROUTER_API_KEY.trim() &&
      process.env.OPENROUTER_API_KEY !== 'undefined'
    ),
    gemini: !!(
      (process.env.GEMINI_API_KEY &&
       process.env.GEMINI_API_KEY.trim() &&
       process.env.GEMINI_API_KEY !== 'undefined') ||
      (process.env.GOOGLE_API_KEY &&
       process.env.GOOGLE_API_KEY.trim() &&
       process.env.GOOGLE_API_KEY !== 'undefined')
    ),
    opencode: !!(
      process.env.OPENCODE_ZEN_API_KEY &&
      process.env.OPENCODE_ZEN_API_KEY.trim() &&
      process.env.OPENCODE_ZEN_API_KEY !== 'undefined'
    ),
    cohere: !!(
      process.env.COHERE_API_KEY &&
      process.env.COHERE_API_KEY.trim() &&
      process.env.COHERE_API_KEY !== 'undefined'
    ),
    groq: !!(
      process.env.GROQ_API_KEY &&
      process.env.GROQ_API_KEY.trim() &&
      process.env.GROQ_API_KEY !== 'undefined'
    ),
  };
  
  console.log(`[RotaIA] Keys disponíveis: OR=${keys.openrouter} GEM=${keys.gemini} OC=${keys.opencode} CO=${keys.cohere} GR=${keys.groq}`);
  return keys;
}

// ─────────────────────────────────────────────────────────────────
// PARSE model shorthand: "provider:model" → { provider, modelId }
// ─────────────────────────────────────────────────────────────────

function parseModelRef(ref: string): { provider: string; modelId: string } {
  if (ref.includes(':')) {
    const [provider, modelId] = ref.split(':');
    return { provider, modelId };
  }
  // Se não tem provider prefix, assume openrouter
  return { provider: 'openrouter', modelId: ref };
}

// ─────────────────────────────────────────────────────────────────
// CALL PROVIDERS — uma função por provider
// ─────────────────────────────────────────────────────────────────

async function callOpenRouter(
  modelId: string,
  prompt: string,
  options: {
    systemInstruction?: string;
    maxTokens?: number;
    temperature?: number;
    imageUrl?: string;
    jsonMode?: boolean;
  }
): Promise<{ text: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  const messages: any[] = [];
  
  // Constrói conteúdo (texto + imagem se tiver)
  if (options.imageUrl) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: options.imageUrl } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const body: any = {
    model: modelId,
    messages,
  };

  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.jsonMode) body.response_format = { type: 'json_object' };
  if (options.systemInstruction) {
    body.messages.unshift({ role: 'system', content: options.systemInstruction });
  }

  const response = await axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    body,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://galeria-ia.up.railway.app',
        'X-Title': 'RotaIA - InkDream',
      },
      timeout: 60000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || '';
  return { text };
}

async function callGemini(
  modelId: string,
  prompt: string,
  options: {
    systemInstruction?: string;
    maxTokens?: number;
    imageUrl?: string;
    jsonMode?: boolean;
  }
): Promise<{ text: string }> {
  // Tenta GOOGLE_API_KEY primeiro, depois GEMINI_API_KEY
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  
  // Import dinâmico do Gemini SDK
  const { GoogleGenAI } = await import('@google/genai');
  const client = new GoogleGenAI({ apiKey: apiKey! });

  const contents: any = { parts: [{ text: prompt }] };
  
  const config: any = {};
  if (options.maxTokens) config.maxOutputTokens = options.maxTokens;
  if (options.jsonMode) {
    config.responseMimeType = 'application/json';
  }
  if (options.systemInstruction) {
    config.systemInstruction = { parts: [{ text: options.systemInstruction }] };
  }

  const response = await client.models.generateContent({
    model: modelId,
    contents,
    config,
  });

  return { text: response.text || '' };
}

async function callOpenCode(
  modelId: string,
  prompt: string,
  options: { maxTokens?: number; temperature?: number }
): Promise<{ text: string }> {
  const apiKey = process.env.OPENCODE_ZEN_API_KEY;

  const body: any = {
    messages: [{ role: 'user', content: prompt }],
  };

  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.temperature !== undefined) body.temperature = options.temperature;

  const response = await axios.post(
    'https://opencode.ai/api/chat',
    body,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const text = response.data?.choices?.[0]?.message?.content || 
               response.data?.text ||
               response.data?.message ||
               JSON.stringify(response.data);
  return { text };
}

async function callCohere(
  modelId: string,
  prompt: string,
  options: { maxTokens?: number; temperature?: number }
): Promise<{ text: string }> {
  const apiKey = process.env.COHERE_API_KEY;

  const response = await axios.post(
    'https://api.cohere.ai/v1/chat',
    {
      model: modelId,
      message: prompt,
      max_tokens: options.maxTokens || 4096,
      temperature: options.temperature ?? 0.7,
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Cohere-version': '2024-06-06',
      },
      timeout: 60000,
    }
  );

  return { text: response.data.text || '' };
}

async function callGroq(
  modelId: string,
  prompt: string,
  options: {
    systemInstruction?: string;
    maxTokens?: number;
    temperature?: number;
    jsonMode?: boolean;
  }
): Promise<{ text: string }> {
  const apiKey = process.env.GROQ_API_KEY;

  const messages: any[] = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: prompt });

  const body: any = {
    model: modelId,
    messages,
  };

  if (options.maxTokens) body.max_tokens = options.maxTokens;
  if (options.temperature !== undefined) body.temperature = options.temperature;
  if (options.jsonMode) body.response_format = { type: 'json_object' };

  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    body,
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  return { text: response.data?.choices?.[0]?.message?.content || '' };
}

async function callPollinations(
  prompt: string,
  options: { maxTokens?: number; temperature?: number }
): Promise<{ text: string }> {
  const encoded = encodeURIComponent(prompt);
  const params = new URLSearchParams({
    model: 'text',
    messages: JSON.stringify([{ role: 'user', content: prompt }]),
  });
  if (options.maxTokens) params.set('max_tokens', options.maxTokens.toString());
  if (options.temperature !== undefined) params.set('temperature', options.temperature.toString());

  const response = await axios.get(
    `https://text.pollinations.ai/?${params.toString()}`,
    { timeout: 60000 }
  );

  return { text: typeof response.data === 'string' ? response.data : JSON.stringify(response.data) };
}

// ─────────────────────────────────────────────────────────────────
// ROTEADOR PRINCIPAL
// ─────────────────────────────────────────────────────────────────

export async function callWithRota(
  request: RotaRequest,
  forcedChain?: string[] // Sobrescreve fallback chain (útil pra testes)
): Promise<RotaResponse> {
  const { task, prompt, systemInstruction, maxTokens, temperature, imageUrl, jsonMode } = request;

  const keys = getAvailableKeys();
  const chain = forcedChain || FALLBACK_CHAINS[task] || FALLBACK_CHAINS.chat;
  const fallbackHistory: string[] = [];

  console.log(`[RotaIA] Task: ${task} | Chain: ${chain.length} providers`);

  for (let i = 0; i < chain.length; i++) {
    const ref = chain[i];
    const { provider, modelId } = parseModelRef(ref);
    const attempt = i + 1;

    console.log(`[RotaIA] Tentando #${attempt}: ${provider}/${modelId}`);

    try {
      let result: { text: string };

      switch (provider) {
        case 'openrouter': {
          if (!keys.openrouter) {
            console.log(`[RotaIA] Skip openrouter — sem key`);
            continue;
          }
          result = await callOpenRouter(modelId, prompt, {
            systemInstruction,
            maxTokens,
            temperature,
            imageUrl,
            jsonMode,
          });
          break;
        }

        case 'gemini': {
          if (!keys.gemini) {
            console.log(`[RotaIA] Skip gemini — sem key`);
            continue;
          }
          result = await callGemini(modelId, prompt, {
            systemInstruction,
            maxTokens,
            imageUrl,
            jsonMode,
          });
          break;
        }

        case 'opencode': {
          if (!keys.opencode) {
            console.log(`[RotaIA] Skip opencode — sem key`);
            continue;
          }
          result = await callOpenCode(modelId, prompt, { maxTokens, temperature });
          break;
        }

        case 'cohere': {
          if (!keys.cohere) {
            console.log(`[RotaIA] Skip cohere — sem key`);
            continue;
          }
          result = await callCohere(modelId, prompt, { maxTokens, temperature });
          break;
        }

        case 'groq': {
          if (!keys.groq) {
            console.log(`[RotaIA] Skip groq — sem key`);
            continue;
          }
          result = await callGroq(modelId, prompt, {
            systemInstruction,
            maxTokens,
            temperature,
            jsonMode,
          });
          break;
        }

        case 'pollinations': {
          result = await callPollinations(prompt, { maxTokens, temperature });
          break;
        }

        default:
          console.log(`[RotaIA] Provider desconhecido: ${provider}`);
          continue;
      }

      if (result.text && result.text.trim().length > 0) {
        console.log(`[RotaIA] ✅ Sucesso com ${provider}/${modelId} (tentativa #${attempt})`);
        return {
          text: result.text,
          modelUsed: `${provider}/${modelId}`,
          provider,
          success: true,
          attempt,
          fallbackHistory,
        };
      } else {
        console.log(`[RotaIA] Resposta vazia com ${provider}/${modelId}, tentando próximo...`);
        fallbackHistory.push(`${provider}/${modelId}:empty_response`);
      }

    } catch (error: any) {
      const status = error.response?.status;
      const errorMsg = error.response?.data?.error?.message || error.message;
      
      console.log(`[RotaIA] Erro #${attempt} (${provider}/${modelId}): ${status || 'no-status'} — ${errorMsg}`);

      // ── Detecta se é erro de quota/rate limit → pula pra próxima ──
      const isQuotaError = 
        status === 429 ||                          // Rate limit
        status === 403 ||                          // Forbidden / quota
        status === 402 ||                          // Payment required
        errorMsg.includes('quota') ||
        errorMsg.includes('rate limit') ||
        errorMsg.includes('rate_limit') ||
        errorMsg.includes('exceeded') ||
        errorMsg.includes('limit') ||
        errorMsg.includes('free_tier_limit') ||
        errorMsg.includes('RATE_LIMIT') ||
        errorMsg.includes('Too Many Requests') ||
        errorMsg.includes('429');

      if (isQuotaError) {
        console.log(`[RotaIA] ⏭️  Quota/rate limit detectado — avançando para próximo`);
        fallbackHistory.push(`${provider}/${modelId}:quota`);
        continue;
      }

      // ── Erro temporário (timeout, 503, etc) → tenta próxima ──
      const isRetryable = 
        status === 503 ||                          // Service unavailable
        status === 502 ||                          // Bad gateway
        status === 504 ||                          // Gateway timeout
        status === 500 ||                          // Internal server error
        errorMsg.includes('timeout') ||
        errorMsg.includes('connection') ||
        errorMsg.includes('ECONNREFUSED') ||
        errorMsg.includes('ENOTFOUND');

      if (isRetryable) {
        console.log(`[RotaIA] ⏭️  Erro temporário — avançando para próximo`);
        fallbackHistory.push(`${provider}/${modelId}:${status || 'transient'}`);
        continue;
      }

      // ── Erro irreversível → tenta próxima mesmo assim ──
      fallbackHistory.push(`${provider}/${modelId}:${status || 'error'}:${errorMsg.substring(0, 50)}`);
      continue;
    }
  }

  // Se chegou aqui, todas falharam
  const lastError = fallbackHistory[fallbackHistory.length - 1] || 'all_providers_failed';
  console.error(`[RotaIA] ❌ TODOS os providers falharam. Histórico: ${fallbackHistory.join(' → ')}`);

  return {
    text: '',
    modelUsed: 'none',
    provider: 'none',
    success: false,
    attempt: chain.length,
    error: `Nenhum provider disponível. Todas as IAs gratuitas falharam. Histórico: ${fallbackHistory.join(' | ')}`,
    fallbackHistory,
  };
}

// ─────────────────────────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────────────────────────

export function isFreeTierError(error: any): boolean {
  const msg = (error?.response?.data?.error?.message || error?.message || '').toLowerCase();
  const status = error?.response?.status;
  return (
    status === 429 ||
    status === 402 ||
    status === 403 ||
    msg.includes('quota') ||
    msg.includes('free_tier') ||
    msg.includes('exceeded') ||
    msg.includes('rate limit') ||
    msg.includes('rate_limit') ||
    msg.includes('too many requests')
  );
}

export function getTaskLabel(task: TaskType): string {
  const labels: Record<TaskType, string> = {
    chat: '💬 Chat',
    coding: '💻 Código',
    creative: '✨ Criativo',
    image: '🖼️ Imagem',
    vision: '👁️ Visão',
    long_context: '📄 Contexto longo',
    fast: '⚡ Rápido',
    reasoning: '🧠 Raciocínio',
    strategy: '🎯 Estratégia',
    translation: '🌐 Tradução',
    summary: '📝 Resumo',
  };
  return labels[task] || task;
}