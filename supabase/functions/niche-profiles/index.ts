// supabase/functions/niche-profiles/index.ts
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
    const token = req.headers.get("x-facebook-token");

    if (!token || !igId) {
      return new Response(JSON.stringify({ error: "Missing params" }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get connected Instagram accounts
    const resp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,instagram_business_account{id,username,profile_picture_url}&access_token=${token}`);
    const data = await resp.json();

    const profiles = (data.data || [])
      .filter((acc: any) => acc.instagram_business_account)
      .map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        igId: acc.instagram_business_account.id,
        igUsername: acc.instagram_business_account.username,
        profilePicture: acc.instagram_business_account.profile_picture_url
      }));

    return new Response(JSON.stringify({ data: { profiles } }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});