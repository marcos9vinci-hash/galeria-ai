import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://galeria-ia-inkdream.netlify.app",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const ROUTER_PROXY_URL = Deno.env.get("ROUTER_PROXY_URL") || "";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "");

  // POST /ai/embeddings
  if (path === "/ai/embeddings" && req.method === "POST") {
    const { content } = await req.json();
    if (!content) {
      return json({ error: "Missing content" }, 400);
    }

    try {
      // Use the LLM proxy for embeddings (assuming it supports embeddings endpoint)
      const embeddingRes = await fetch(`${ROUTER_PROXY_URL}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: content,
        }),
      });

      const data = await embeddingRes.json();
      if (!embeddingRes.ok) {
        throw new Error(data.error?.message || "Embedding generation failed");
      }

      return json({ embedding: data.data[0]?.embedding });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  // POST /ai/fine-tune
  if (path === "/ai/fine-tune" && req.method === "POST") {
    const { datasetId } = await req.json();
    if (!datasetId) {
      return json({ error: "Missing datasetId" }, 400);
    }

    try {
      // Get dataset with examples
      const { data: dataset, error: dsError } = await supabase
        .from("fine_tuning_datasets")
        .select("*")
        .eq("id", datasetId)
        .single();

      if (dsError || !dataset) {
        throw new Error("Dataset not found");
      }

      const { data: examples, error: exError } = await supabase
        .from("fine_tuning_examples")
        .select("messages")
        .eq("dataset_id", datasetId);

      if (exError) throw exError;

      // Prepare training file (JSONL)
      const trainingLines = examples?.map(e => JSON.stringify({ messages: e.messages })).join("\n") || "";
      
      // Upload to OpenAI via proxy
      // This is a simplified version - in production you'd upload file first
      const ftRes = await fetch(`${ROUTER_PROXY_URL}/fine_tuning/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          training_file: trainingLines, // Would need file upload in real implementation
          model: dataset.base_model,
          hyperparameters: dataset.hyperparameters,
        }),
      });

      const data = await ftRes.json();
      if (!ftRes.ok) {
        throw new Error(data.error?.message || "Fine-tuning start failed");
      }

      // Update dataset status
      await supabase
        .from("fine_tuning_datasets")
        .update({
          status: "training",
          training_file_id: data.training_file_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", datasetId);

      return json({ jobId: data.id, status: "training" });
    } catch (err: any) {
      await supabase
        .from("fine_tuning_datasets")
        .update({
          status: "failed",
          error_message: err.message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", datasetId);
      
      return json({ error: err.message }, 500);
    }
  }

  // POST /ai/generate — unified generation endpoint
  if (path === "/ai/generate" && req.method === "POST") {
    const { type, prompt, systemPrompt, model, temperature, maxTokens, organizationId } = await req.json();
    
    if (!type || !prompt || !organizationId) {
      return json({ error: "Missing required fields" }, 400);
    }

    const startTime = Date.now();
    const usedModel = model || "gemini-1.5-flash";

    try {
      const messages = [];
      if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
      messages.push({ role: "user", content: prompt });

      const llmRes = await fetch(ROUTER_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: usedModel,
          messages,
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 2000,
        }),
      });

      const data = await llmRes.json();
      if (!llmRes.ok) {
        throw new Error(data.error?.message || "Generation failed");
      }

      const latencyMs = Date.now() - startTime;

      // Log generation
      await supabase.from("ai_generation_logs").insert({
        organization_id: organizationId,
        type,
        model: usedModel,
        prompt,
        response: data.content || data.choices?.[0]?.message?.content || "",
        metadata: { systemPrompt },
        latency_ms: latencyMs,
        success: true,
      });

      return json({ content: data.content || data.choices?.[0]?.message?.content || "" });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      
      await supabase.from("ai_generation_logs").insert({
        organization_id: organizationId,
        type,
        model: usedModel,
        prompt,
        response: "",
        metadata: { systemPrompt },
        latency_ms: latencyMs,
        success: false,
        error_message: err.message,
      });

      return json({ error: err.message }, 500);
    }
  }

  // POST /ai/rag-query
  if (path === "/ai/rag-query" && req.method === "POST") {
    const { query, organizationId, model, temperature, maxTokens, systemPrompt } = await req.json();
    
    if (!query || !organizationId) {
      return json({ error: "Missing required fields" }, 400);
    }

    try {
      // Get query embedding
      const embRes = await fetch(`${ROUTER_PROXY_URL}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: query,
        }),
      });

      const embData = await embRes.json();
      if (!embRes.ok) throw new Error("Embedding failed");

      const queryEmbedding = embData.data[0]?.embedding;
      if (!queryEmbedding) throw new Error("No embedding generated");

      // Search similar embeddings via RPC
      const { data: results, error: rpcError } = await supabase.rpc("match_embeddings", {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        org_id: organizationId,
      });

      if (rpcError) throw rpcError;

      const retrievedChunks = results || [];
      const context = retrievedChunks
        .map((c: any, i: number) => `[${i + 1}] ${c.content}`)
        .join("\n\n");

      const usedSystemPrompt = systemPrompt || 
        "Você é um assistente especializado em marketing de tatuagem. Use o contexto fornecido para responder de forma útil e relevante.";

      const fullPrompt = `${usedSystemPrompt}\n\nContexto relevante:\n${context}\n\nPergunta: ${query}`;

      const llmRes = await fetch(ROUTER_PROXY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: model || "gemini-1.5-flash",
          messages: [{ role: "user", content: fullPrompt }],
          temperature: temperature || 0.7,
          max_tokens: maxTokens || 2000,
        }),
      });

      const data = await llmRes.json();
      if (!llmRes.ok) throw new Error(data.error?.message || "RAG generation failed");

      const response = data.content || data.choices?.[0]?.message?.content || "";

      // Log RAG query
      await supabase.from("rag_query_logs").insert({
        organization_id: organizationId,
        query,
        retrieved_chunks: retrievedChunks,
        response,
        model: model || "gemini-1.5-flash",
        tokens_used: data.usage?.total_tokens,
      });

      return json({ response, retrievedChunks });
    } catch (err: any) {
      return json({ error: err.message }, 500);
    }
  }

  return json({ error: "Not found" }, 404);
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}