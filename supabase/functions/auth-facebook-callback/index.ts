// supabase/functions/auth-facebook-callback/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const FACEBOOK_APP_ID = Deno.env.get("FACEBOOK_APP_ID")!;
const FACEBOOK_APP_SECRET = Deno.env.get("FACEBOOK_APP_SECRET")!;
const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/auth-facebook-callback`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return new Response(JSON.stringify({ error: "No code provided" }), { 
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }

  try {
    // Exchange code for access token
    const tokenResp = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `code=${code}`);

    const tokenData = await tokenResp.json();
    const accessToken = tokenData.access_token;

    // Get long-lived token
    const longLivedResp = await fetch(`https://graph.facebook.com/v21.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${accessToken}`);

    const longLivedData = await longLivedResp.json();

    // Redirect back to frontend with token
    const frontendUrl = `${Deno.env.get("FRONTEND_URL") || "http://localhost:5173"}/instagram/callback?token=${longLivedData.access_token}`;
    
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, "Location": frontendUrl }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});