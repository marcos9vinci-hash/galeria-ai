// supabase/functions/niche-hashtags/index.ts
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
    const { niche, count = 30 } = await req.json();

    if (!niche) {
      return new Response(JSON.stringify({ error: "niche required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const prompt = `Gere ${count} hashtags relevantes para o nicho "${niche}" no Instagram.
    Mix: 10 populares (100k-1M), 10 médias (10k-100k), 10 nicho (<10k).
    Retorne APENAS array JSON: ["#tag1", "#tag2", ...]`;

    const resp = await fetch(`${ROUTER_PROXY_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "auto",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 800,
        temperature: 0.5
      })
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    return new Response(JSON.stringify({ 
      data: JSON.parse(content),
      model: data.model 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});