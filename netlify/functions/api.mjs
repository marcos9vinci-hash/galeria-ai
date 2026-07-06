import serverless from "serverless-http";

// Dynamically import and wrap the Express app
let cachedHandler: any = null;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    // Force server to export app instead of listening
    process.env.NETLIFY_FUNCTION = "true";
    const mod = await import("../../server");
    const app = mod.app || (await mod.startServer?.());
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
