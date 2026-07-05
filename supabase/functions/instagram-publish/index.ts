// supabase/functions/instagram-publish/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-facebook-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

  try {
    const { igId, imageUrl, caption, scheduledAt } = await req.json();
    const token = req.headers.get("x-facebook-token");

    if (!token || !igId) {
      return new Response(JSON.stringify({ error: "Missing authentication or igId" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 1. Create Media Container
    const containerResp = await fetch(`https://graph.facebook.com/v21.0/${igId}/media`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image_url: imageUrl,
        caption: caption,
        access_token: token
      })
    });

    const containerData = await containerResp.json();
    const creationId = containerData.id;

    if (!creationId) {
      return new Response(JSON.stringify({ error: containerData.error?.message || "Failed to create media container" }), { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // 2. Publish or Schedule
    let publishUrl = `https://graph.facebook.com/v21.0/${igId}/media_publish`;
    let publishBody: any = { creation_id: creationId, access_token: token };

    if (scheduledAt) {
      publishBody.scheduled_publish_time = Math.floor(new Date(scheduledAt).getTime() / 1000);
    }

    const publishResp = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(publishBody)
    });

    const publishData = await publishResp.json();

    return new Response(JSON.stringify({ 
      success: true, 
      status: scheduledAt ? "scheduled" : "published", 
      post_id: publishData.id 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});