import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

const handler: Handler = async (event: HandlerEvent, _context: HandlerContext) => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasKey = !!serviceRoleKey;
  const keyPreview = hasKey ? `${serviceRoleKey.substring(0, 20)}...${serviceRoleKey.substring(serviceRoleKey.length - 10)}` : 'NOT SET';
  
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      hasServiceRoleKey: hasKey,
      keyPreview,
      envKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    }),
  };
};

export { handler };
