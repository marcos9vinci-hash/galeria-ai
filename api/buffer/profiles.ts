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

  // Get buffer token from DB or cookie
  const { data: profile } = await supabase
    .from('user_settings')
    .select('buffer_access_token')
    .eq('user_id', user.id)
    .single();

  const bufferToken = profile?.buffer_access_token;
  if (!bufferToken) return res.status(401).json({ error: 'Buffer not connected' });

  try {
    const resp = await fetch('https://api.buffer.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bufferToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `{
          me {
            profiles {
              id
              service
              serviceUsername
              avatarUrl
              formattedUsername
            }
          }
        }`,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.errors?.[0]?.message || 'Buffer API error');

    return res.status(200).json({ profiles: data.data?.me?.profiles || [] });
  } catch (err) {
    console.error('Buffer profiles error:', err);
    return res.status(500).json({ error: err.message });
  }
}