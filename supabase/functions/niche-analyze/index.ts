// supabase/functions/niche-analyze/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-facebook-token, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const ROUTER_PROXY_URL = Deno.env.get("ROUTER_PROXY_URL") || "https://r8ggzey.abc-tunnel.us/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const url = new URL(req.url);
    const igId = url.searchParams.get("igId");
    const igUsername = url.searchParams.get("igUsername");
    const token = req.headers.get("x-facebook-token");

    if (!token || !igId || !igUsername) {
      return new Response(JSON.stringify({ error: "Missing params" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get insights for best posting times
    const insightsResp = await fetch(`https://graph.facebook.com/v21.0/${igId}/insights?metric=online_followers&period=lifetime&access_token=${token}`);
    const insightsData = await insightsResp.json();

    // Get recent media performance
    const mediaResp = await fetch(`https://graph.facebook.com/v21.0/${igId}/media?fields=id,media_type,like_count,comments_count,timestamp,insights.metric(impressions,reach,engagement)&limit=50&access_token=${token}`);
    const mediaData = await mediaResp.json();

    // Analyze with AI
    const prompt = `Analise os dados do Instagram @${igUsername} e retorne horários otimizados de postagem.
    Dados de seguidores online: ${JSON.stringify(insightsData.data?.[0]?.values || [])}
    Mídia recente: ${JSON.stringify((mediaData.data || []).slice(0, 10).map((m: any) => ({
      type: m.media_type,
      likes: m.like_count,
      comments: m.comments_count,
      hour: new Date(m.timestamp).getHours(),
      impressions: m.insights?.data?.[0]?.values?.[0]?.value,
      reach: m.insights?.data?.[1]?.values?.[0]?.value,
      engagement: m.insights?.data?.[2]?.values?.[0]?.value
    })))}
    
    Retorne JSON: {
      "optimizedSlots": [{"day": "2026-01-15", "hour": 18, "reason": "peak engagement"}],
      "bestHours": [18, 20, 12],
      "bestDays": ["Wednesday", "Friday", "Sunday"],
      "contentStrategy": "string"
    }`;

    const resp = await fetch(`${ROUTER_PROXY_URL}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "auto",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        temperature: 0.4
      })
    });

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content || "{}";

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