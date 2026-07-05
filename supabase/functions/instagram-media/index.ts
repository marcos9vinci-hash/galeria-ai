// supabase/functions/instagram-media/index.ts
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
  const mediaId = url.searchParams.get("mediaId");
  const mediaType = url.searchParams.get("mediaType");

  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
  if (!mediaId) {
    return new Response(JSON.stringify({ error: "Missing mediaId" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    let metrics = "engagement,impressions,reach,saved";
    if (mediaType === 'REELS' || mediaType === 'VIDEO') {
      metrics = "plays,reach,saved,shares,total_interactions";
    } else if (mediaType === 'CAROUSEL_ALBUM') {
      metrics = "carousel_album_engagement,carousel_album_impressions,carousel_album_reach,carousel_album_saved";
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${mediaId}/insights?metric=${metrics}&access_token=${token}`);
    const data = await response.json();
    return new Response(JSON.stringify(data.data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});