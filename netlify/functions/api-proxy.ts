import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const SUPABASE_URL = "https://wrybqqitsylqyhgzodyc.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const path = event.path.replace(/^\/.*netlify\/functions\/api-proxy/, "").replace(/^\/api/, "");
  const segments = path.split("/").filter(Boolean);
  const functionName = segments[0] || "health";
  const subPath = segments.length > 1 ? "/" + segments.slice(1).join("/") : "";
  const url = `${SUPABASE_URL}/functions/v1/${functionName}${subPath}${event.rawQuery ? `?${event.rawQuery}` : ""}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  // Forward relevant headers
  if (event.headers.authorization) {
    headers["Authorization"] = event.headers.authorization;
  } else if (SUPABASE_SERVICE_ROLE_KEY) {
    headers["Authorization"] = `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;
  }
  
  if (event.headers.cookie) {
    headers["Cookie"] = event.headers.cookie;
  }
  
  const response = await fetch(url, {
    method: event.httpMethod,
    headers,
    body: ["GET", "HEAD"].includes(event.httpMethod) ? undefined : event.body,
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
