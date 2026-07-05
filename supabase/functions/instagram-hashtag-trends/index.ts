// supabase/functions/instagram-hashtag-trends/index.ts
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

  try {
    const url = new URL(req.url);
    const igId = url.searchParams.get("igId");
    const hashtag = url.searchParams.get("hashtag");
    const token = req.headers.get("x-facebook-token");

    if (!token || !igId || !hashtag) {
      return new Response(JSON.stringify({ error: "Missing params" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Search hashtag
    const searchResp = await fetch(`https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${igId}&q=${hashtag}&access_token=${token}`);
    const searchData = await searchResp.json();

    if (!searchData.data || searchData.data.length === 0) {
      return new Response(JSON.stringify({ data: [] }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const hashtagId = searchData.data[0].id;

    // Get recent media for hashtag
    const mediaResp = await fetch(`https://graph.facebook.com/v21.0/${hashtagId}/recent_media?user_id=${igId}&fields=id,media_type,media_url,like_count,comments_count,timestamp&limit=20&access_token=${token}`);
    const mediaData = await mediaResp.json();

    return new Response(JSON.stringify({ data: mediaData.data || [] }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});