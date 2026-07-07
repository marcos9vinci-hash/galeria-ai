import { supabase } from '@/lib/supabase';

export interface Embedding {
  id: string;
  organization_id: string;
  content: string;
  embedding?: number[];
  metadata: Record<string, any>;
  source_type: 'post' | 'caption' | 'hashtag' | 'strategy' | 'custom';
  source_id?: string;
  created_at: string;
}

export interface FineTuningDataset {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  base_model: string;
  status: 'preparing' | 'uploading' | 'training' | 'completed' | 'failed';
  training_file_id?: string;
  validation_file_id?: string;
  fine_tuned_model_id?: string;
  hyperparameters: Record<string, any>;
  metrics: Record<string, any>;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface AIGenerationLog {
  id: string;
  organization_id: string;
  user_id?: string;
  type: 'caption' | 'hashtags' | 'strategy' | 'image_prompt' | 'analysis' | 'chat';
  model: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt: string;
  response: string;
  metadata: Record<string, any>;
  latency_ms?: number;
  success: boolean;
  error_message?: string;
  created_at: string;
}

export interface RAGQueryLog {
  id: string;
  organization_id: string;
  user_id?: string;
  query: string;
  retrieved_chunks: Array<{ content: string; similarity: number; metadata: Record<string, any> }>;
  response?: string;
  model?: string;
  tokens_used?: number;
  latency_ms?: number;
  created_at: string;
}

export const aiService = {
  // Embeddings
  async createEmbedding(
    organizationId: string,
    content: string,
    sourceType: Embedding['source_type'],
    sourceId?: string,
    metadata?: Record<string, any>
  ): Promise<Embedding> {
    // Call Edge Function to generate embedding
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ content }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate embedding');

    const { data: embedding, error } = await supabase
      .from('embeddings')
      .insert({
        organization_id: organizationId,
        content,
        embedding: data.embedding,
        source_type: sourceType,
        source_id: sourceId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) throw error;
    return embedding;
  },

  async searchSimilar(
    organizationId: string,
    query: string,
    options?: {
      limit?: number;
      threshold?: number;
      sourceTypes?: Embedding['source_type'][];
    }
  ): Promise<Array<{ content: string; similarity: number; metadata: Record<string, any> }>> {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ content: query }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate query embedding');

    // Use RPC for vector similarity search
    const { data: results, error } = await supabase.rpc('match_embeddings', {
      query_embedding: data.embedding,
      match_threshold: options?.threshold || 0.7,
      match_count: options?.limit || 5,
      org_id: organizationId,
      source_types: options?.sourceTypes,
    });

    if (error) throw error;
    return results || [];
  },

  // RAG Query
  async ragQuery(
    organizationId: string,
    query: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<{ response: string; retrievedChunks: Array<{ content: string; similarity: number; metadata: Record<string, any> }> }> {
    const retrievedChunks = await this.searchSimilar(organizationId, query, {
      limit: 5,
      threshold: 0.7,
    });

    const context = retrievedChunks
      .map((c, i) => `[${i + 1}] ${c.content}`)
      .join('\n\n');

    const systemPrompt = options?.systemPrompt || 
      'Você é um assistente especializado em marketing de tatuagem. Use o contexto fornecido para responder de forma útil e relevante.';

    const fullPrompt = `${systemPrompt}\n\nContexto relevante:\n${context}\n\nPergunta: ${query}`;

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        model: options?.model || 'gemini-1.5-flash',
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: options?.temperature || 0.7,
        max_tokens: options?.maxTokens || 2000,
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to generate response');

    // Log RAG query
    await this.logRAGQuery(organizationId, query, retrievedChunks, data.content);

    return {
      response: data.content,
      retrievedChunks,
    };
  },

  async logRAGQuery(
    organizationId: string,
    query: string,
    retrievedChunks: Array<{ content: string; similarity: number; metadata: Record<string, any> }>,
    response?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('rag_query_logs')
      .insert({
        organization_id: organizationId,
        query,
        retrieved_chunks: retrievedChunks,
        response,
      });

    if (error) console.error('Failed to log RAG query:', error);
  },

  // AI Generation with logging
  async generate(
    organizationId: string,
    type: AIGenerationLog['type'],
    prompt: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<{ response: string; logId: string }> {
    const startTime = Date.now();
    const model = options?.model || 'gemini-1.5-flash';

    try {
      const messages = [];
      if (options?.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options?.temperature || 0.7,
          max_tokens: options?.maxTokens || 2000,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate');

      const latencyMs = Date.now() - startTime;

      // Log generation
      const { data: log, error: logError } = await supabase
        .from('ai_generation_logs')
        .insert({
          organization_id: organizationId,
          type,
          model,
          prompt,
          response: data.content,
          metadata: { systemPrompt: options?.systemPrompt },
          latency_ms: latencyMs,
          success: true,
        })
        .select()
        .single();

      if (logError) console.error('Failed to log generation:', logError);

      return { response: data.content, logId: log?.id };
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      
      // Log error
      await supabase
        .from('ai_generation_logs')
        .insert({
          organization_id: organizationId,
          type,
          model,
          prompt,
          response: '',
          metadata: { systemPrompt: options?.systemPrompt },
          latency_ms: latencyMs,
          success: false,
          error_message: err.message,
        });

      throw err;
    }
  },

  // Fine-tuning datasets
  async createFineTuningDataset(
    organizationId: string,
    name: string,
    description?: string,
    baseModel: string = 'gpt-3.5-turbo'
  ): Promise<FineTuningDataset> {
    const { data, error } = await supabase
      .from('fine_tuning_datasets')
      .insert({
        organization_id: organizationId,
        name,
        description,
        base_model: baseModel,
        status: 'preparing',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getFineTuningDatasets(organizationId: string): Promise<FineTuningDataset[]> {
    const { data, error } = await supabase
      .from('fine_tuning_datasets')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async addFineTuningExamples(
    datasetId: string,
    examples: Array<{ messages: Array<{ role: string; content: string }>; weight?: number; isValidation?: boolean }>
  ): Promise<void> {
    const { error } = await supabase
      .from('fine_tuning_examples')
      .insert(
        examples.map(e => ({
          dataset_id: datasetId,
          messages: e.messages,
          weight: e.weight || 1.0,
          is_validation: e.isValidation || false,
        }))
      );

    if (error) throw error;
  },

  async startFineTuning(datasetId: string): Promise<void> {
    // This would call an Edge Function to start fine-tuning via OpenAI API
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai/fine-tune`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ datasetId }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to start fine-tuning');
  },

  // Analytics
  async getAIGenerationStats(organizationId: string, since?: Date): Promise<{
    totalGenerations: number;
    byType: Record<string, number>;
    totalTokens: number;
    avgLatencyMs: number;
    successRate: number;
  }> {
    let query = supabase
      .from('ai_generation_logs')
      .select('type, total_tokens, latency_ms, success')
      .eq('organization_id', organizationId);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = data || [];
    const totalGenerations = logs.length;
    const successful = logs.filter(l => l.success).length;
    
    const byType: Record<string, number> = {};
    let totalTokens = 0;
    let totalLatency = 0;

    for (const log of logs) {
      byType[log.type] = (byType[log.type] || 0) + 1;
      totalTokens += log.total_tokens || 0;
      totalLatency += log.latency_ms || 0;
    }

    return {
      totalGenerations,
      byType,
      totalTokens,
      avgLatencyMs: totalGenerations > 0 ? Math.round(totalLatency / totalGenerations) : 0,
      successRate: totalGenerations > 0 ? Math.round((successful / totalGenerations) * 100) : 0,
    };
  },

  async getRAGQueryStats(organizationId: string, since?: Date): Promise<{
    totalQueries: number;
    avgTokens: number;
    avgLatencyMs: number;
  }> {
    let query = supabase
      .from('rag_query_logs')
      .select('tokens_used, latency_ms')
      .eq('organization_id', organizationId);

    if (since) {
      query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    const logs = data || [];
    const totalQueries = logs.length;
    const totalTokens = logs.reduce((sum, l) => sum + (l.tokens_used || 0), 0);
    const totalLatency = logs.reduce((sum, l) => sum + (l.latency_ms || 0), 0);

    return {
      totalQueries,
      avgTokens: totalQueries > 0 ? Math.round(totalTokens / totalQueries) : 0,
      avgLatencyMs: totalQueries > 0 ? Math.round(totalLatency / totalQueries) : 0,
    };
  },
};

// Specialized AI generation functions
export const aiGenerators = {
  async generateCaption(
    organizationId: string,
    imageDescription: string,
    niche: string,
    tone: string = 'professional',
    hashtagCount: number = 10
  ) {
    return aiService.generate(organizationId, 'caption', `
      Gere uma legenda para Instagram de tatuagem.
      
      Descrição da imagem: ${imageDescription}
      Nicho: ${niche}
      Tom: ${tone}
      Número de hashtags: ${hashtagCount}
      
      A legenda deve ser envolvente, usar storytelling, incluir call-to-action para agendamento,
      e ter exatamente ${hashtagCount} hashtags relevantes no final.
    `, {
      systemPrompt: 'Você é um especialista em copywriting para estúdios de tatuagem de luxo. Crie legendas que convertam seguidores em agendamentos.',
    });
  },

  async generateStrategy(
    organizationId: string,
    images: Array<{ description: string; type?: string }>,
    insights: any,
    profileInfo: any
  ) {
    return aiService.generate(organizationId, 'strategy', `
      Crie uma estratégia de conteúdo para Instagram de tatuagem.
      
      Imagens disponíveis: ${images.map((img, i) => `${i + 1}. ${img.description} (${img.type || 'feed'})`).join('\n')}
      
      Insights da conta: ${JSON.stringify(insights, null, 2)}
      Info do perfil: ${JSON.stringify(profileInfo, null, 2)}
      
      Retorne um array JSON com estratégia para cada imagem:
      - index: número da imagem
      - type: "feed" | "carousel" | "reels" | "story"
      - date: ISO date string (distribuir ao longo de 2-4 semanas)
      - caption: legenda completa
      - hashtags: array de hashtags
      - reasoning: por que essa escolha
    `, {
      systemPrompt: 'Você é um estrategista de conteúdo para tatuadores. Crie calendários que maximizem engajamento e agendamentos.',
    });
  },

  async generateHashtags(
    organizationId: string,
    niche: string,
    imageDescription: string,
    count: number = 15
  ) {
    return aiService.generate(organizationId, 'hashtags', `
      Gere ${count} hashtags relevantes para tatuagem.
      
      Nicho: ${niche}
      Descrição: ${imageDescription}
      
      Misture hashtags de:
      - Nicho específico (ex: #finelinetattoo)
      - Localização (ex: #saopaulo #tattoosp)
      - Estilo (ex: #blackwork #minimalist)
      - Comunidade (ex: #tattoocommunity #inked)
      - Marca própria (ex: #inkdream)
      
      Retorne apenas array JSON de strings.
    `);
  },
};