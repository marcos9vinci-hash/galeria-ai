// supabase/functions/niche-config/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      const url = new URL(req.url);
      const igUsername = url.searchParams.get("igUsername");

      if (!igUsername) {
        return new Response(JSON.stringify({ error: "igUsername required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const { data, error } = await supabase
        .from("niche_configs")
        .select("*")
        .eq("ig_username", igUsername)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      return new Response(JSON.stringify({ data: data || null }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    if (req.method === "POST") {
      const { igUsername, config } = await req.json();

      if (!igUsername || !config) {
        return new Response(JSON.stringify({ error: "igUsername and config required" }), { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
      }

      const { data, error } = await supabase
        .from("niche_configs")
        .upsert({ ig_username: igUsername, config, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ data }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), { 
      status: 405, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});