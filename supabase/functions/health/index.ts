// supabase/functions/health/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({ ok: true, timestamp: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
  return new Response("Method not allowed", { status: 405 });
});