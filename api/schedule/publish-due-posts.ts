import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Find posts ready to publish (scheduled time passed, not yet published)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, image_url, caption, scheduled_at, buffer_profile_id, ig_id, status')
      .in('status', ['agendado_buffer', 'agendado_instagram', 'legenda_pronta'])
      .lte('scheduled_at', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${posts?.length || 0} posts ready to publish`);

    let published = 0;
    for (const post of posts || []) {
      try {
        if (post.status === 'agendado_instagram' && post.ig_id) {
          // Publish to Instagram via API
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
                instagram_post_id: publishData.id,
              }).eq('id', post.id);
              published++;
            }
          }
        } else if (post.status === 'agendado_buffer' && post.buffer_profile_id) {
          // Publish to Buffer
          const { data: profile } = await supabase
            .from('user_settings')
            .select('buffer_access_token')
            .eq('user_id', post.user_id)
            .single();
          
          if (profile?.buffer_access_token) {
            const payload = {
              profile_ids: [post.buffer_profile_id],
              text: post.caption,
              access_token: profile.buffer_access_token,
            };
            if (post.image_url) payload.media = [{ url: post.image_url }];

            const resp = await fetch('https://api.bufferapp.com/1/updates/create.json', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });
            const data = await resp.json();
            if (resp.ok && data.updates?.[0]?.id) {
              await supabase.from('posts').update({
                status: 'publicado_buffer',
                published_at: new Date().toISOString(),
                buffer_update_id: data.updates[0].id,
              }).eq('id', post.id);
              published++;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to publish post ${post.id}:`, err);
      }
    }

    return res.status(200).json({ processed: posts?.length || 0, published });
  } catch (err) {
    console.error('Publish due posts cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}