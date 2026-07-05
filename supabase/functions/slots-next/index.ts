// supabase/functions/slots-next/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    // Get next available slot from posts table
    const { data: slots, error } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'rascunho')
      .order('scheduled_at', { ascending: true })
      .limit(1);

    if (error) throw error;

    if (!slots || slots.length === 0) {
      // Generate next available time slot
      const now = new Date();
      const nextSlot = new Date(now);
      nextSlot.setHours(Math.ceil(now.getHours() / 4) * 4, 0, 0, 0);
      if (nextSlot <= now) nextSlot.setHours(nextSlot.getHours() + 4);
      
      return new Response(JSON.stringify({ 
        slot: {
          date: nextSlot.toISOString().split('T')[0],
          hour: nextSlot.getHours(),
          available: true
        }
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ slot: slots[0] }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});