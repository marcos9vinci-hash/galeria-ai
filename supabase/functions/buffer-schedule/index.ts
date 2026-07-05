// supabase/functions/buffer-schedule/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN")!;

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

  if (!BUFFER_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: "Buffer not configured" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    const resp = await fetch(`https://api.bufferapp.com/1/updates/${id}.json?access_token=${BUFFER_ACCESS_TOKEN}`);
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