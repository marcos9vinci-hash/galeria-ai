import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  try {
    const { data: accounts, error: dbError } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id);

    if (dbError) throw dbError;

    if (!accounts?.length) {
      return res.status(200).json({ accounts: [], hasPublishPerm: false });
    }

    // Check publish permissions for first account
    const acc = accounts[0];
    const permResp = await fetch(`https://graph.facebook.com/v23.0/${acc.ig_id}?fields=id,username&access_token=${acc.access_token}`);
    const permData = await permResp.json();
    
    const hasPublishPerm = permResp.ok && permData.id;

    return res.status(200).json({ 
      accounts, 
      hasPublishPerm,
      connected: true 
    });
  } catch (err) {
    console.error('Instagram me error:', err);
    return res.status(500).json({ error: 'Failed to fetch Instagram account' });
  }
}