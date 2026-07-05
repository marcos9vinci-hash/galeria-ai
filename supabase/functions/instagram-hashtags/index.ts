// supabase/functions/instagram-hashtags/index.ts
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
  const hashtag = url.searchParams.get("hashtag");

  if (!token) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { 
      status: 401, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
  if (!igId || !hashtag) {
    return new Response(JSON.stringify({ error: "Missing parameters" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    const searchResp = await fetch(`https://graph.facebook.com/v21.0/ig_hashtag_search?user_id=${igId}&q=${encodeURIComponent(hashtag)}&access_token=${token}`);
    const searchData = await searchResp.json();

    const hashtagId = searchData.data?.[0]?.id;
    if (!hashtagId) {
      return new Response(JSON.stringify({ posts: [], message: "Hashtag not found" }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const topPostsResp = await fetch(`https://graph.facebook.com/v21.0/${hashtagId}/top_media?user_id=${igId}&fields=id,caption,media_type,media_url,permalink&access_token=${token}&limit=15`);
    const topPostsData = await topPostsResp.json();

    return new Response(JSON.stringify(topPostsData.data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});