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

  const { postId } = req.query;
  if (!postId) return res.status(400).json({ error: 'Missing postId' });

  try {
    const { data: post } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .eq('user_id', user.id)
      .single();

    if (!post) return res.status(404).json({ error: 'Post not found' });

    // If scheduled, check if it's time to publish
    if (post.status === 'agendado_instagram' && post.scheduled_at) {
      const scheduledTime = new Date(post.scheduled_at).getTime();
      const now = Date.now();
      if (now >= scheduledTime) {
        // Trigger publish via Instagram API
        const { data: account } = await supabase
          .from('instagram_accounts')
          .select('access_token')
          .eq('ig_id', post.ig_id)
          .single();

        if (account) {
          const publishResp = await fetch(`https://graph.facebook.com/v23.0/${post.ig_id}/media_publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              creation_id: post.instagram_post_id,
              access_token: account.access_token,
            }),
          });
          const publishData = await publishResp.json();
          if (publishResp.ok && publishData.id) {
            await supabase.from('posts').update({
              status: 'publicado_instagram',
              published_at: new Date().toISOString(),
            }).eq('id', postId);
            return res.status(200).json({ status: 'published', postId: publishData.id });
          }
        }
      }
    }

    return res.status(200).json({ status: post.status });
  } catch (err) {
    console.error('Scheduled status error:', err);
    return res.status(500).json({ error: err.message });
  }
}