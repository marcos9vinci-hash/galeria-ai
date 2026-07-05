// supabase/functions/buffer-create/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUFFER_ACCESS_TOKEN=Deno.e...N") || "";

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

  if (!BUFFER_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Buffer token não configurado" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const { profileId, service, imageUrl, text, scheduledAt, publishMode } = await req.json();

    const payload: any = {
      profile_ids: [profileId],
      text: text,
      media: { photo: imageUrl }
    };

    if (publishMode === 'scheduled' && scheduledAt) {
      payload.scheduled_at = new Date(scheduledAt).toISOString();
    }

    const response = await fetch(`https://api.bufferapp.com/1/updates/create.json?access_token=${BUFFER_ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return new Response(JSON.stringify({ success: true, update: data.updates?.[0] }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});