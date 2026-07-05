// supabase/functions/airtop-scrape/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const AIRTOP_API_KEY = Deno.env.get("AIRTOP_API_KEY") || "e4b5a3bd03db0863.cc7J8WlJbO8CJldFMiyaw2t4jKlombiQjQJXPELpTb";
const BASE_URL = "https://api.airtop.ai/v1";

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
    const { gemUrl } = await req.json();
    
    if (!gemUrl) {
      return new Response(JSON.stringify({ error: "URL da Gem é obrigatória." }), { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Create browser session
    const sessionRes = await fetch(`${BASE_URL}/browser-sessions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTOP_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ configuration: { timeoutMinutes: 5 } })
    });
    const sessionData = await sessionRes.json();
    const sessionId = sessionData.data.id;

    // Wait for session ready
    let sessionReady = false;
    for (let i = 0; i < 15; i++) {
      const checkRes = await fetch(`${BASE_URL}/browser-sessions/${sessionId}`, {
        headers: { "Authorization": `Bearer ${AIRTOP_API_KEY}` }
      });
      const checkData = await checkRes.json();
      if (checkData.data.status === "ready") {
        sessionReady = true;
        break;
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!sessionReady) throw new Error("Timeout ao iniciar sessão Airtop.");

    // Open window
    const windowRes = await fetch(`${BASE_URL}/browser-sessions/${sessionId}/windows`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTOP_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ url: gemUrl })
    });
    const windowData = await windowRes.json();
    const windowId = windowData.data.windowId;

    // Wait for load
    await new Promise(r => setTimeout(r, 5000));

    // Execute scrape command
    const scrapeRes = await fetch(`${BASE_URL}/browser-windows/${windowId}/execute-command`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AIRTOP_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        prompt: "Extract the text of the system instructions or the prompt that defines this Gem. If there is a 'Custom instructions' field, get its value. If it asks for login, just return 'REQUER_LOGIN'."
      })
    });
    const scrapeData = await scrapeRes.json();
    let instructions = scrapeData.data.output;

    if (instructions === "REQUER_LOGIN" || (instructions && instructions.toLowerCase().includes("sign in"))) {
      instructions = "ERRO: O Airtop parou na tela de login do Google. Devido à segurança do Google, voce deve carregar as instruções manualmente (copiar e colar do Gemini).";
    }

    return new Response(JSON.stringify({
      gemUrl,
      instructions,
      sessionId,
      windowId,
      status: "success"
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ 
      error: "Failed to scrape Gem instructions", 
      details: error.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });
  }
});