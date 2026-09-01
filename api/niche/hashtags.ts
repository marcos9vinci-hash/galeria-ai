import { type VercelRequest, type VercelResponse } from '@vercel/node';

const HASHTAGS_BY_NICHE: Record<string, string[]> = {
  'fine line': ['#finelinetattoo', '#minimaltattoo', '#singleneedle', '#delicatetattoo', '#finelineart', '#tattooart', '#tattoodesign', '#minimalisttattoo', '#blackink', '#tattoolovers'],
  'realism': ['#realismtattoo', '#portraittattoo', '#hyperrealism', '#3dtattoo', '#realistictattoo', '#tattooart', '#tattoodesign', '#blackandgrey', '#tattoolovers', '#inked'],
  'traditional': ['#traditionaltattoo', '#oldschooltattoo', '#traditional', '#boldtattoo', '#tattooflash', '#tattooart', '#tattoodesign', '#americantraditional', '#tattoolovers', '#inked'],
  'geometric': ['#geometrictattoo', '#mandalatattoo', '#sacredgeometry', '#geometricart', '#tattooart', '#tattoodesign', '#blackwork', '#dotwork', '#tattoolovers', '#spiritualtattoo'],
  'watercolor': ['#watercolortattoo', '#watercolorart', '#colorfultattoo', '#painterlytattoo', '#tattooart', '#tattoodesign', '#arttattoo', '#vibranttattoo', '#tattoolovers', '#inked'],
  'blackwork': ['#blackworktattoo', '#blackwork', '#blackouttattoo', '#tribal', '#ornamentaltattoo', '#tattooart', '#tattoodesign', '#blackink', '#tattoolovers', '#boldtattoo'],
  'dotwork': ['#dotworktattoo', '#dotwork', '#stippling', '#pointillism', '#tattooart', '#tattoodesign', '#blackwork', '#geometrictattoo', '#tattoolovers', '#detailedtattoo'],
  'script': ['#letteringtattoo', '#scripttattoo', '#calligraphytattoo', '#quotetattoo', '#nametattoo', '#tattooart', '#tattoodesign', '#finelinescript', '#tattoolovers', '#wordstattoo'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { niche, count = 15 } = req.query;
  const detectedNiche = (niche as string) || 'fine line';
  const hashtags = HASHTAGS_BY_NICHE[detectedNiche] || HASHTAGS_BY_NICHE['fine line'];
  
  return res.status(200).json({ 
    niche: detectedNiche, 
    hashtags: hashtags.slice(0, Number(count)) 
  });
}