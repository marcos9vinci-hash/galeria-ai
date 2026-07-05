// supabase/functions/llm-invoke/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROUTER_PROXY_URL = Deno.env.get("ROUTER_PROXY_URL") || "https://r8ggzey.abc-tunnel.us/v1";

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
    const { prompt, systemInstruction, maxTokens, temperature, model } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const resp = await fetch(`${ROUTER_PROXY_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model || "auto",
        messages,
        max_tokens: maxTokens || 4096,
        temperature: temperature ?? 0.7,
        stream: false
      })
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ 
      text: content,
      model: data.model,
      provider: data.provider,
      success: true
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, success: false }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});