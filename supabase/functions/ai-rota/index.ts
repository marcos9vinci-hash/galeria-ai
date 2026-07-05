// supabase/functions/ai-rota/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROUTER_PROXY_URL = Deno.env.get("ROUTER_PROXY_URL") || "https://r8ggzey.abc-tunnel.us/v1";

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
    const { task, prompt, systemInstruction, maxTokens, temperature } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: "prompt is required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const messages = [];
    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const requestBody = {
      model: "auto",
      messages,
      max_tokens: maxTokens || 4096,
      temperature: temperature ?? 0.7,
      stream: false
    };

    // Try primary router (tunnel or deployed 9Router)
    let response = await callRouter(ROUTER_PROXY_URL, requestBody);
    let data = await response.json();

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

    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({
      text: content,
      model: data.model,
      provider: data.provider,
      taskType: data.task_type || task,
      success: true,
      auto_routed: data.auto_routed
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, success: false }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});