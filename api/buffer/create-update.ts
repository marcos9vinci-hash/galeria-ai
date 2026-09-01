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

  const { profileId, text, media, scheduledAt, publishMode } = req.body;
  if (!profileId || !text) return res.status(400).json({ error: 'Missing profileId or text' });

  try {
    const { data: profile } = await supabase
      .from('user_settings')
      .select('buffer_access_token')
      .eq('user_id', user.id)
      .single();

    const bufferToken = profile?.buffer_access_token;
    if (!bufferToken) return res.status(401).json({ error: 'Buffer not connected' });

    const payload: any = {
      profile_ids: [profileId],
      text,
      access_token: bufferToken,
    };
    if (media) payload.media = media;
    if (publishMode === 'scheduled' && scheduledAt) {
      payload.scheduled_at = new Date(scheduledAt).toISOString();
    }

    const resp = await fetch('https://api.bufferapp.com/1/updates/create.json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Buffer create failed');

    // Store in DB
    await supabase.from('posts').insert({
      user_id: user.id,
      buffer_profile_id: profileId,
      caption: text,
      image_url: media?.[0]?.url || null,
      status: scheduledAt ? 'agendado_buffer' : 'publicado_buffer',
      buffer_update_id: data.updates?.[0]?.id,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      published_at: scheduledAt ? null : new Date().toISOString(),
    });

    return res.status(200).json({ success: true, update: data.updates?.[0], scheduled: !!scheduledAt });
  } catch (err) {
    console.error('Buffer create error:', err);
    return res.status(500).json({ error: err.message });
  }
}