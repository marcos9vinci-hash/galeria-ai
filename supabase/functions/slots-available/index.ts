// supabase/functions/slots-available/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
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
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId is required" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  const peakHours = [8, 12, 16, 20];
  const slots = [];

  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() + day);
    const dayStr = date.toISOString().split('T')[0];

    for (const hour of peakHours) {
      slots.push({
        id: `slot-${dayStr}-${hour}`,
        date: dayStr,
        hour,
        available: true,
        reason: `Peak activity at ${hour}h`
      });
    }
  }

  return new Response(JSON.stringify({ slots, total: slots.length }), { 
    headers: { ...corsHeaders, "Content-Type": "application/json" } 
  });
});