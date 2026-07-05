// supabase/functions/publish-buffer/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUFFER_ACCESS_TOKEN = Deno.env.get("BUFFER_ACCESS_TOKEN")!;
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
    const { postId, profileId, imageUrl, caption, scheduledAt } = await req.json();

    if (!BUFFER_ACCESS_TOKEN) {
      return new Response(JSON.stringify({ error: "Buffer token not configured" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const payload: any = {
      profile_ids: [profileId],
      text: caption,
      media: { photo: imageUrl }
    };

    if (scheduledAt) {
      payload.scheduled_at = new Date(scheduledAt).toISOString();
    }

    const response = await fetch("https://api.bufferapp.com/1/updates/create.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${BUFFER_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) throw new Error(data.error || "Buffer API error");

    // Update post status
    if (postId) {
      await supabase
        .from('posts')
        .update({ 
          status: scheduledAt ? 'agendado_buffer' : 'publicado_buffer',
          buffer_update_id: data.updates[0].id,
          published_at: new Date().toISOString()
        })
        .eq('id', postId);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      update: data.updates[0] 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});