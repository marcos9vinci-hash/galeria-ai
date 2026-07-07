import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const SUPABASE_URL = "https://wrybqqitsylqyhgzodyc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const url = `${SUPABASE_URL}/functions/v1/health`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (SUPABASE_SERVICE_ROLE_KEY) {
    headers["Authorization"] = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  }
  
  const response = await fetch(url, {
    method: "GET",
    headers,
  });
  
  const responseHeaders: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    responseHeaders[key] = value;
  });
  
  return {
    statusCode: response.status,
    headers: responseHeaders,
    body: await response.text(),
  };
};

export { handler };
