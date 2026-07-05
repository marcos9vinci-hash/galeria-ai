// supabase/functions/generate-caption/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ROUTER_PROXY_URL = Deno.env.get("ROUTER_PROXY_URL") || "https://r8ggzey.abc-tunnel.us/v1";
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

const CAPTION_PROMPT = `Você é um especialista em marketing para tatuadores. 
Gere uma caption ENGAJANTE para Instagram de um post de tatuagem.

REGRAS:
- Tom: profissional, artístico, acolhedor
- Use 3-5 hashtags relevantes (mix popular + nicho)
- Inclua CTA sutil (ex: "Agende seu horário", "Qual estilo você faria?")
- MÁXIMO 2200 caracteres
- PT-BR

Retorne APENAS a caption, sem explicações.`;

async function callRouter(url: string, body: any) {
  const response = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return response;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const { imageUrl, postId } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const requestBody = {
      model: "auto",
      messages: [
        { role: "system", content: CAPTION_PROMPT },
        { role: "user", content: `Imagem: ${imageUrl}. Gere caption para tatuagem.` }
      ],
      max_tokens: 500,
      temperature: 0.8,
      stream: false
    };

    // Try primary router (tunnel or deployed 9Router)
    let response = await callRouter(ROUTER_PROXY_URL, requestBody);
    let data = await response.json();

    // If primary fails, log but don't silently fallback (user controls via ROUTER_PROXY_URL env)
    if (!response.ok) {
      console.error(`9Router error (${response.status}):`, data);
      return new Response(JSON.stringify({ 
        error: `9Router unavailable: ${data.error?.message || response.statusText}`,
        hint: "Check ROUTER_PROXY_URL env var - tunnel may be down. Deploy 9Router to Oracle/Fly.io for production."
      }), { 
        status: 502, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const caption = data.choices?.[0]?.message?.content || "";

    if (postId) {
      await supabase
        .from('posts')
        .update({ caption, status: 'legenda_pronta' })
        .eq('id', postId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      caption,
      model: data.model,
      provider: data.provider
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});