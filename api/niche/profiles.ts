import { type VercelRequest, type VercelResponse } from '@vercel/node';

const NICHE_PROFILES = [
  { id: 'fine_line', name: 'Fine Line', description: 'Traço fino, minimalista, single needle', tags: ['minimalista', 'delicado', 'elegante'] },
  { id: 'realism', name: 'Realismo', description: 'Retratos, hiper-realismo, 3D', tags: ['retrato', 'fotorealista', 'detalhado'] },
  { id: 'traditional', name: 'Traditional', description: 'Old school, contorno grosso, cores sólidas', tags: ['bold', 'clássico', 'colorido'] },
  { id: 'geometric', name: 'Geométrico', description: 'Mandalas, geometria sagrada, simetria', tags: ['simétrico', 'espiritual', 'preciso'] },
  { id: 'watercolor', name: 'Aquarela', description: 'Efeito pintura, splash, colorido', tags: ['artístico', 'vibrante', 'fluido'] },
  { id: 'blackwork', name: 'Blackwork', description: 'Preto sólido, tribal, ornamental', tags: ['bold', 'gráfico', 'impactante'] },
  { id: 'dotwork', name: 'Dotwork', description: 'Pontilhismo, stippling, textura', tags: ['detalhado', 'texturizado', 'paciente'] },
  { id: 'script', name: 'Lettering', description: 'Caligrafia, frases, nomes, scripts', tags: ['tipografia', 'personalizado', 'significativo'] },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') return res.status(200).end();

  return res.status(200).json({ profiles: NICHE_PROFILES });
}