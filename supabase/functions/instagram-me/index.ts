// supabase/functions/instagram-me/index.ts
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
    const token = req.headers.get("x-facebook-token");
    
    if (!token) {
      return new Response(JSON.stringify({ 
        connected: false, 
        error: "No token provided" 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Validate token with Facebook Graph API
    const resp = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${token}`);
    const data = await resp.json();

    if (data.error) {
      return new Response(JSON.stringify({ 
        connected: false, 
        error: data.error.message 
      }), { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Get Instagram Business Account
    const igResp = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${token}`);
    const igData = await igResp.json();
    
    let igId = null;
    let igUsername = null;
    
    if (igData.data) {
      for (const account of igData.data) {
        if (account.instagram_business_account) {
          igId = account.instagram_business_account.id;
          igUsername = account.name;
          break;
        }
      }
    }

    return new Response(JSON.stringify({ 
      connected: true,
      user: data,
      igId,
      igUsername,
      token: token // Return for frontend storage
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      connected: false, 
      error: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});