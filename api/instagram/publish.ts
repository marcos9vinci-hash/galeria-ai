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

  const { igId, imageUrl, caption, scheduledAt } = req.body;
  if (!igId || !imageUrl || !caption) {
    return res.status(400).json({ error: 'Missing igId, imageUrl, or caption' });
  }

  try {
    const { data: accounts } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('ig_id', igId)
      .single();

    if (!accounts) return res.status(404).json({ error: 'Instagram account not found' });

    const accessToken = accounts.access_token;

    // Step 1: Create media container
    const mediaType = imageUrl.includes('.mp4') || imageUrl.includes('.mov') ? 'REELS' : 'IMAGE';
    const createResp = await fetch(`https://graph.facebook.com/v23.0/${igId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        media_type: mediaType,
        access_token: accessToken,
      }),
    });
    const createData = await createResp.json();
    if (!createResp.ok || !createData.id) {
      throw new Error(createData.error?.message || 'Failed to create media container');
    }

    const creationId = createData.id;

    // Step 2: Check status (for Reels)
    if (mediaType === 'REELS') {
      let status = 'IN_PROGRESS';
      let attempts = 0;
      while (status === 'IN_PROGRESS' && attempts < 30) {
        await new Promise(r => setTimeout(r, 2000));
        const statusResp = await fetch(`https://graph.facebook.com/v23.0/${creationId}?fields=status_code&access_token=${accessToken}`);
        const statusData = await statusResp.json();
        status = statusData.status_code;
        attempts++;
        if (status === 'ERROR') throw new Error('Reel processing failed');
      }
    }

    // Step 3: Publish or schedule
    let publishResp, publishData;
    if (scheduledAt) {
      const scheduledTime = Math.floor(new Date(scheduledAt).getTime() / 1000);
      publishResp = await fetch(`https://graph.facebook.com/v23.0/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          scheduled_publish_time: scheduledTime,
          access_token: accessToken,
        }),
      });
    } else {
      publishResp = await fetch(`https://graph.facebook.com/v23.0/${igId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken,
        }),
      });
    }
    publishData = await publishResp.json();
    if (!publishResp.ok || !publishData.id) {
      throw new Error(publishData.error?.message || 'Failed to publish');
    }

    // Store in DB
    await supabase.from('posts').insert({
      user_id: user.id,
      ig_id: igId,
      image_url: imageUrl,
      caption,
      status: scheduledAt ? 'agendado_instagram' : 'publicado_instagram',
      instagram_post_id: publishData.id,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      published_at: scheduledAt ? null : new Date().toISOString(),
    });

    return res.status(200).json({ success: true, postId: publishData.id, scheduled: !!scheduledAt });
  } catch (err) {
    console.error('Instagram publish error:', err);
    return res.status(500).json({ error: err.message });
  }
}