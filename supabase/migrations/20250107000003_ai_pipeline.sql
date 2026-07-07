-- AI Pipeline: Embeddings, RAG, Fine-tuning data
-- Migration: 20250107000003_ai_pipeline.sql

-- Embeddings table for RAG
CREATE TABLE IF NOT EXISTS public.embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-small dimensions
  metadata JSONB DEFAULT '{}',
  source_type TEXT NOT NULL CHECK (source_type IN ('post', 'caption', 'hashtag', 'strategy', 'custom')),
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fine-tuning datasets
CREATE TABLE IF NOT EXISTS public.fine_tuning_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'uploading', 'training', 'completed', 'failed')),
  training_file_id TEXT,
  validation_file_id TEXT,
  fine_tuned_model_id TEXT,
  hyperparameters JSONB DEFAULT '{}',
  metrics JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fine-tuning examples (JSONL entries)
CREATE TABLE IF NOT EXISTS public.fine_tuning_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID NOT NULL REFERENCES public.fine_tuning_datasets(id) ON DELETE CASCADE,
  messages JSONB NOT NULL, -- OpenAI chat format: [{role, content}, ...]
  weight NUMERIC DEFAULT 1.0,
  is_validation BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Generation logs (for analytics and RAG)
CREATE TABLE IF NOT EXISTS public.ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('caption', 'hashtags', 'strategy', 'image_prompt', 'analysis', 'chat')),
  model TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  latency_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RAG query logs
CREATE TABLE IF NOT EXISTS public.rag_query_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  query TEXT NOT NULL,
  retrieved_chunks JSONB NOT NULL DEFAULT '[]',
  response TEXT,
  model TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_tuning_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fine_tuning_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_query_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Org members can manage embeddings" ON public.embeddings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Org members can manage fine-tuning datasets" ON public.fine_tuning_datasets
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Org members can manage fine-tuning examples" ON public.fine_tuning_examples
  FOR ALL USING (
    dataset_id IN (
      SELECT id FROM public.fine_tuning_datasets 
      WHERE organization_id IN (
        SELECT organization_id FROM public.organization_members 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
      )
    )
  );

CREATE POLICY "Org members can view AI logs" ON public.ai_generation_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert AI logs" ON public.ai_generation_logs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

CREATE POLICY "Org members can view RAG logs" ON public.rag_query_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can insert RAG logs" ON public.rag_query_logs
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Service role full access
CREATE POLICY "Service role full access embeddings" ON public.embeddings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access fine_tuning_datasets" ON public.fine_tuning_datasets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access fine_tuning_examples" ON public.fine_tuning_examples FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ai_generation_logs" ON public.ai_generation_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access rag_query_logs" ON public.rag_query_logs FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_embeddings_org_id ON public.embeddings(organization_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_source ON public.embeddings(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_datasets_org_id ON public.fine_tuning_datasets(organization_id);
CREATE INDEX IF NOT EXISTS idx_fine_tuning_examples_dataset_id ON public.fine_tuning_examples(dataset_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_org_id ON public.ai_generation_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_generation_logs_type_created ON public.ai_generation_logs(type, created_at);
CREATE INDEX IF NOT EXISTS idx_rag_query_logs_org_id ON public.rag_query_logs(organization_id);

-- Enable pgvector extension (run once)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Create HNSW index for vector similarity search (after extension enabled)
-- CREATE INDEX IF NOT EXISTS idx_embeddings_embedding_hnsw ON public.embeddings 
--   USING hnsw (embedding vector_cosine_ops) 
--   WITH (m = 16, ef_construction = 64);