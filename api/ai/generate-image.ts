import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { supabase } from '../../../lib/supabase';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

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

  const { prompt, style, aspectRatio, model } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

  try {
    // Call Gemini API for image generation
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `${prompt}. Style: ${style || 'tattoo design'}. Aspect ratio: ${aspectRatio || '1:1'}` }],
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
          responseModalities: ['IMAGE', 'TEXT'],
        },
      }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.error?.message || 'Gemini API error');

    // Extract image from response
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    const imageUrl = imagePart?.inlineData?.data ? `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}` : null;

    if (!imageUrl) throw new Error('No image generated');

    return res.status(200).json({ success: true, imageUrl, prompt });
  } catch (err) {
    console.error('AI generate image error:', err);
    return res.status(500).json({ error: err.message });
  }
}