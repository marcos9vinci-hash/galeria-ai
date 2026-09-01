import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = 'https://wrybqqitsylqyhgzodyc.supabase.co/functions/v1/api/auth/facebook/callback';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const scope = 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement';
    const state = Math.random().toString(36).substring(2, 15);
    
    const authUrl = `https://www.facebook.com/v23.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `response_type=code&` +
      `state=${state}`;

    return res.status(200).json({ url: authUrl, state });
  } catch (error) {
    console.error('Facebook auth URL error:', error);
    return res.status(500).json({ error: 'Failed to generate auth URL' });
  }
}