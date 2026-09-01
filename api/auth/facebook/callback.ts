import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../../lib/supabase';
import { setCookie } from '../../../../lib/cookie';

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const REDIRECT_URI = 'https://wrybqqitsylqyhgzodyc.supabase.co/functions/v1/api/auth/facebook/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://galeria-ia-cloudflare.vercel.app';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', FRONTEND_URL);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { code, state, error, error_reason, error_description } = req.query;

  if (error) {
    const html = `<html><body><script>window.location.href = "${FRONTEND_URL}/instagram?error=${encodeURIComponent(error_reason + ': ' + error_description)}";</script></body></html>`;
    return res.status(400).send(html);
  }

  if (!code) {
    return res.status(400).send('Missing code parameter');
  }

  try {
    // Exchange code for short-lived token
    const tokenResp = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `code=${code}`);
    
    const tokenData = await tokenResp.json();
    if (!tokenResp.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to get access token');
    }

    const shortToken = tokenData.access_token;

    // Exchange for long-lived token (60 days)
    const longResp = await fetch(`https://graph.facebook.com/v23.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${FACEBOOK_APP_ID}&` +
      `client_secret=${FACEBOOK_APP_SECRET}&` +
      `fb_exchange_token=${shortToken}`);
    
    const longData = await longResp.json();
    const longToken = longData.access_token || shortToken;

    // Get user's pages and Instagram accounts
    const pagesResp = await fetch(`https://graph.facebook.com/v23.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${longToken}`);
    const pagesData = await pagesResp.json();

    if (!pagesResp.ok || !pagesData.data?.length) {
      throw new Error('No Facebook pages found');
    }

    // Find pages with Instagram Business accounts
    const igAccounts = pagesData.data
      .filter((p: any) => p.instagram_business_account)
      .map((p: any) => ({
        pageId: p.id,
        pageName: p.name,
        pageAccessToken: p.access_token,
        igId: p.instagram_business_account.id,
        igUsername: p.instagram_business_account.username,
      }));

    if (!igAccounts.length) {
      throw new Error('No Instagram Business accounts linked to your pages');
    }

    // Store tokens in Supabase (upsert per user)
    // Get user from session cookie or create anonymous session
    const authHeader = req.headers.get('authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (user) userId = user.id;
    }

    // Upsert Instagram account for this user
    for (const acc of igAccounts) {
      await supabase.from('instagram_accounts').upsert({
        user_id: userId,
        ig_id: acc.igId,
        ig_username: acc.igUsername,
        page_id: acc.pageId,
        page_name: acc.pageName,
        access_token: acc.pageAccessToken,
        long_lived_token: longToken,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,ig_id' });
    }

    // Set cookie with token for frontend
    setCookie(res, 'fb_access_token', longToken);
    setCookie(res, 'fb_user_id', userId);

    // Redirect to frontend with success
    const html = `<html><body><script>window.location.href = "${FRONTEND_URL}/instagram?connected=true";</script></body></html>`;
    return res.status(200).send(html);

  } catch (err) {
    console.error('Facebook callback error:', err);
    const html = `<html><body><script>window.location.href = "${FRONTEND_URL}/instagram?error=${encodeURIComponent(err.message)}";</script></body></html>`;
    return res.status(500).send(html);
  }
}