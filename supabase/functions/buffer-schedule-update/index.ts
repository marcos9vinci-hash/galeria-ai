// supabase/functions/buffer-schedule-update/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUFFER_ACCESS_TOKEN=Deno.e...ync (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  if (!BUFFER_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Buffer not configured" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const { id, text, scheduled_at, media } = await req.json();

    const payload: any = { text };
    if (scheduled_at) payload.scheduled_at = scheduled_at;
    if (media) payload.media = media;

    const resp = await fetch(`https://api.bufferapp.com/1/updates/${id}/update.json?access_token=${BUFFER_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();

    return new Response(JSON.stringify({ data }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});