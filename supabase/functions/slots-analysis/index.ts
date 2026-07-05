// supabase/functions/slots-analysis/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-facebook-token, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

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

  const url = new URL(req.url);
  const token = req.headers.get("x-facebook-token");
  const igId = url.searchParams.get("igId");

  if (!igId) {
    return new Response(JSON.stringify({ error: "igId is required" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    if (token) {
      const response = await fetch(`https://graph.facebook.com/v21.0/${igId}/insights?metric=online_followers&period=lifetime&access_token=${token}`);
      const data = await response.json();
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    throw new Error("No token");
  } catch (error) {
    // Fallback peak hours
    const today = new Date().toISOString().split('T')[0];
    const peakSlots = [
      { hour: 8, day: today, available: true, reason: "Peak morning activity" },
      { hour: 12, day: today, available: true, reason: "Peak lunch activity" },
      { hour: 16, day: today, available: true, reason: "Peak afternoon activity" },
      { hour: 20, day: today, available: true, reason: "Peak evening activity" }
    ];
    return new Response(JSON.stringify({ optimizedSlots: peakSlots, analysis: "AI analysis unavailable, serving peak-based fallback" }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});