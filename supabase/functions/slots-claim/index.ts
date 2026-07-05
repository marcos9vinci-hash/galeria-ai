// supabase/functions/slots-claim/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
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
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const date = formData.get("date") as string;
    const hour = formData.get("hour") as string;

    if (!file || !date || !hour) {
      return new Response(JSON.stringify({ error: "file, date, hour required" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `uploads/${date}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('galeria-images')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('galeria-images')
      .getPublicUrl(filePath);

    // Create post record
    const scheduledAt = `${date}T${hour.padStart(2, '0')}:00:00`;
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        image_url: publicUrl,
        scheduled_at: scheduledAt,
        status: 'agendado',
        type: 'feed'
      })
      .select()
      .single();

    if (postError) throw postError;

    return new Response(JSON.stringify({ 
      success: true, 
      post,
      imageUrl: publicUrl 
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});