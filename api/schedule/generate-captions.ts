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
    // Find posts that need captions (scheduled within 15 minutes, no caption yet)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, image_url, scheduled_at')
      .in('status', ['rascunho', 'draft'])
      .lte('scheduled_at', new Date(Date.now() + 15 * 60 * 1000).toISOString())
      .gt('scheduled_at', new Date().toISOString())
      .is('caption', null);

    if (error) throw error;

    console.log(`Found ${posts?.length || 0} posts needing captions`);

    // For each post, generate caption via AI service
    // This would call your AI service to generate captions
    for (const post of posts || []) {
      // TODO: Call AI service to generate caption
      // await supabase.from('posts').update({ caption: generatedCaption }).eq('id', post.id);
    }

    return res.status(200).json({ processed: posts?.length || 0 });
  } catch (err) {
    console.error('Generate captions cron error:', err);
    return res.status(500).json({ error: err.message });
  }
}