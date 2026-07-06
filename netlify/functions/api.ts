import serverless from "serverless-http";
import { createApp } from "../../server";

const app = await createApp();
export const handler = serverless(app);
