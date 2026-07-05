// supabase/functions/publish-instagram/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-facebook-token, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

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
    const { postId, igId, imageUrl, caption, scheduledAt } = await req.json();
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

    if (!publishResp.ok) throw new Error(publishData.error?.message || "Publish failed");

    // Update post status
    if (postId) {
      await supabase
        .from('posts')
        .update({ 
          status: scheduledAt ? 'agendado_instagram' : 'publicado_instagram',
          instagram_post_id: publishData.id,
          published_at: new Date().toISOString()
        })
        .eq('id', postId);
    }

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