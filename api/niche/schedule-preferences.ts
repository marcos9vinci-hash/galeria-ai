import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('niche_schedule_preferences')
      .select('*')
      .eq('ig_id', req.query.igId)
      .single();
    return res.status(200).json({ preferences: data });
  }

  if (req.method === 'POST') {
    const { igId, scheduleHours, timezone } = req.body;
    if (!igId || !scheduleHours) return res.status(400).json({ error: 'Missing igId or scheduleHours' });

    const { data, error: upsertError } = await supabase
      .from('niche_schedule_preferences')
      .upsert({ ig_id: igId, schedule_hours: scheduleHours, timezone, updated_at: new Date().toISOString() }, { onConflict: 'ig_id' })
      .select()
      .single();

    if (upsertError) throw upsertError;
    return res.status(200).json({ success: true, preferences: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}