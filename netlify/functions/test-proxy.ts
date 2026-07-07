import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      hasKey: !!key,
      keyLength: key?.length,
      keyStart: key?.substring(0, 50),
      keyEnd: key?.substring(Math.max(0, (key?.length || 0) - 50)),
      fullKey: key
    }),
  };
};

export { handler };
