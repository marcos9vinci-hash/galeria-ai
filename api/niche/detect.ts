import { type VercelRequest, type VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text, imageUrl } = req.body;
  if (!text && !imageUrl) return res.status(400).json({ error: 'Missing text or imageUrl' });

  // Simple niche detection based on keywords
  const niches = {
    'fine line': ['fine line', 'minimalista', 'delicado', 'traço fino', 'single needle'],
    'realism': ['realismo', 'retrato', 'fotorealista', 'hiper-realista', '3d'],
    'traditional': ['traditional', 'old school', 'tradicional', 'bold', 'contorno grosso'],
    'geometric': ['geométrico', 'geometric', 'mandala', 'sagrado', 'geometria'],
    'watercolor': ['aquarela', 'watercolor', 'pintura', 'colorido', 'splash'],
    'blackwork': ['blackwork', 'preto', 'blackout', 'tribal', 'ornamental'],
    'dotwork': ['dotwork', 'pontilhismo', 'pontos', 'stippling'],
    'script': ['lettering', 'escrita', 'frases', 'nomes', 'caligrafia'],
  };

  const lowerText = (text || '').toLowerCase();
  let detected = 'fine line';
  let maxMatches = 0;

  for (const [niche, keywords] of Object.entries(niches)) {
    const matches = keywords.filter(k => lowerText.includes(k)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      detected = niche;
    }
  }

  return res.status(200).json({ niche: detected, confidence: maxMatches > 0 ? 0.8 : 0.3 });
}