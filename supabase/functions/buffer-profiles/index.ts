// supabase/functions/buffer-profiles/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN") || "";

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
    return new Response(JSON.stringify({ data: { profiles: [] } }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const response = await fetch(`https://api.bufferapp.com/1/profiles.json?access_token=${BUFFER_ACCESS_TOKEN}`);
    const data = await response.json();
    return new Response(JSON.stringify({ data: { profiles: data } }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ data: { profiles: [] } }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});