-- RPC function for vector similarity search
-- Migration: 20250107000004_match_embeddings.sql

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the match_embeddings RPC function
CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  org_id uuid,
  source_types text[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  metadata jsonb,
  source_type text,
  source_id text,
  similarity float
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    e.id,
    e.content,
    e.metadata,
    e.source_type,
    e.source_id,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM public.embeddings e
  WHERE e.organization_id = org_id
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
    AND (source_types IS NULL OR e.source_type = ANY(source_types))
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create HNSW index for fast vector search
-- Note: Requires pgvector >= 0.5.0
CREATE INDEX IF NOT EXISTS idx_embeddings_embedding_hnsw 
  ON public.embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.match_embeddings TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_embeddings TO service_role;