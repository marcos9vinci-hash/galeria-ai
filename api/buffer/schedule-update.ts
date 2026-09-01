import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  const { id, text, scheduled_at, media } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing update id' });

  try {
    const { data: profile } = await supabase
      .from('user_settings')
      .select('buffer_access_token')
      .eq('user_id', user.id)
      .single();

    const bufferToken = profile?.buffer_access_token;
    if (!bufferToken) return res.status(401).json({ error: 'Buffer not connected' });

    const payload: any = { text, access_token: bufferToken };
    if (scheduled_at) payload.scheduled_at = scheduled_at;
    if (media) payload.media = media;

    const resp = await fetch(`https://api.bufferapp.com/1/updates/${id}/update.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Buffer update failed');

    return res.status(200).json({ success: true, update: data });
  } catch (err) {
    console.error('Buffer schedule update error:', err);
    return res.status(500).json({ error: err.message });
  }
}