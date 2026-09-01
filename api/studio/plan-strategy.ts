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

  const { briefing, niche, style, references } = req.body;
  if (!briefing) return res.status(400).json({ error: 'Missing briefing' });

  try {
    // This would call your AI service (Gemini, etc.) to generate strategy
    // For now, return a structured response
    const strategy = {
      concept: `Estratégia para ${niche || 'tatuagem'} - ${style || 'personalizado'}`,
      prompts: [
        `Tatuagem ${style || 'fine line'} de ${briefing}, estilo ${niche}, alta qualidade`,
        `Design minimalista para ${briefing}, traço fino, preto e cinza`,
        `Composição anatômica para ${briefing}, posicionamento ideal`,
      ],
      recommendations: [
        'Tamanho sugerido: 5-8cm',
        'Localização: antebraço/braço',
        'Sessões estimadas: 1-2',
      ],
      generatedAt: new Date().toISOString(),
    };

    // Store in DB
    await supabase.from('studio_projects').insert({
      user_id: user.id,
      briefing,
      niche,
      style,
      references,
      strategy,
      status: 'rascunho',
    });

    return res.status(200).json({ success: true, strategy });
  } catch (err) {
    console.error('Studio plan strategy error:', err);
    return res.status(500).json({ error: err.message });
  }
}