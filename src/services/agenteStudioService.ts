import { base44 } from "@/api/base44Client";

export interface AgentStep {
  agent: string;
  role: string;
  log: string;
  output: any;
}

export class AgenteStudioService {
  // Bússola Estratégica (Orientação Interna)
  private static MARKET_ORIENTATION = `
    SUA MISSÃO: Educar o público através da Visão Oculta. Você não "vende" tatuagens; você revela o propósito espiritual gravado na pele.
    
    PILARES DO CONTEÚDO:
    1. Educação Iniciática: Revele uma curiosidade ou significado profundo sobre os elementos da imagem. Evite começar sempre da mesma forma. Varie entre perguntas, afirmações ousadas ou mergulhos diretos na história.
    2. Simbologia e Alquimia: Conecte o desenho a conceitos de Ocultismo, Botânica Sagrada ou Astrologia. A planta na pele é um "selo energético".
    3. Psicologia e Espiritualidade: Explique a atração arquetípica do desenho. O que ele comunica sobre o inconsciente de quem o escolhe?
    4. Conexão Orgânica: A narrativa deve ser fluida, como se você estivesse lendo as linhas da mão de alguém.
    
    TOM DE VOZ: Sábio, profundo, instigante e autoritário.
    
    DIRETRIZ DE NARRATIVA: Integre o conhecimento de forma orgânica em um texto coeso. NUNCA use colchetes como [A REVELAÇÃO] ou [O ESPELHO] no texto final. Deixe que o leitor descubra essas camadas através da leitura.
  `;

  static async runWorkflow(topic: string, igId: string, profileInfo: any, fileUrls: string[] = []) {
    const steps: AgentStep[] = [];
    const agoraStr = new Date().toLocaleString('pt-BR');
    const hojeIso = new Date().toISOString().split('T')[0];

    try {
      // --- AGENTE 0: ANALISADOR DE INSIGHTS PRÓPRIOS ---
      const insightsResp = await fetch(`https://galeria-ia-production.up.railway.app/api/instagram/insights?igId=${igId}`);
      const myData = await insightsResp.json();
      
      const agente0 = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o Agente 0 - Analisador de Insights Sociais.
        DATA/HORA ATUAL: ${agoraStr}
        ORIENTAÇÃO ESTRATÉGICA: ${AgenteStudioService.MARKET_ORIENTATION}
        
        Analise a performance real do perfil: ${profileInfo?.username}
        Recent Media: ${JSON.stringify(myData.recentMedia)}
        
        Extraia: O que magnetiza este público especificamente hoje?`,
      });
      
      steps.push({
        agent: "Agente 0",
        role: "Analisador de Insights",
        log: agente0,
        output: myData
      });

      // --- AGENTE 1: RADAR DE MERCADO ---
      const hashtagToSearch = topic.split(' ')[0] || 'tattoo'; 
      const hashtagResp = await fetch(`/api/instagram/hashtag-trends?igId=${igId}&hashtag=${hashtagToSearch}`);
      const trends = await hashtagResp.json();

      const agente1 = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o Agente 1 - Radar de Mercado.
        DATA/HORA ATUAL: ${agoraStr}
        
        Tendências #${hashtagToSearch}: ${JSON.stringify(trends)}
        Identifique: Que estéticas e conceitos estão sendo celebrados agora no topo do algoritmo?`,
      });

      steps.push({
        agent: "Agente 1",
        role: "Radar de Mercado",
        log: agente1,
        output: trends
      });

      // --- AGENTE 2: PLANEJADOR ESTRATÉGICO ---
      const agente2 = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o Agente 2 - Planejador Estratégico.
        DATA/HORA ATUAL: ${agoraStr} 
        
        Insights: ${steps[0].log}
        Tendências: ${steps[1].log}
        Tópico: ${topic}
        
        Crie uma narrativa de lote para ${fileUrls.length} imagens. Não apenas posts soltos, mas uma jornada.`,
      });

      steps.push({
        agent: "Agente 2",
        role: "Planejador Estratégico",
        log: agente2,
        output: null
      });

      // --- AGENTE 3: NARRADOR VISUAL & COPYWRITER PROFUNDO ---
      const finalResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é o Agente 3 - O NARRADOR DA VISÃO OCULTA.
        ESTRATÉGIA: ${AgenteStudioService.MARKET_ORIENTATION}
        DATA ATUAL: ${agoraStr}
        
        Sua missão é gerar conteúdo para ${fileUrls.length} imagens.
        
        REGRAS DE OURO:
        - Use Visão Computacional para identificar elementos da imagem e conectá-los a saberes ancestrais.
        - Não seja descritivo; seja REVELADOR e NARRATIVO.
        - Integre as camadas (Mistério, Geometria, Psicologia) em um texto ÚNICO e FLUÍDO.
        - PROIBIDO usar colchetes [] ou títulos de seção na legenda.
        - Varie os ganchos iniciais: comece com uma afirmação filosófica, um dado botânico curioso ou uma reflexão sobre a pele como pergaminho.

        Tópico do usuário: ${topic}
        Planejamento Estratégico: ${steps[2].log}`,
        file_urls: fileUrls.slice(0, 5),
        response_json_schema: {
          type: "object",
          properties: {
            caption: { type: "string", description: "Legenda profunda e simbólica de alto impacto" },
            reasoning: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            format_suggestion: { type: "string", enum: ["REELS", "FEED", "CARROSSEL"] },
            suggested_schedule: { type: "string" },
            media_assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  media_index: { type: "number" },
                  type: { type: "string" },
                  date: { type: "string" }
                }
              }
            }
          },
          required: ["caption", "reasoning", "hashtags", "format_suggestion", "suggested_schedule"]
        }
      });

      steps.push({
        agent: "Agente 3",
        role: "Narrador & Orquestrador",
        log: finalResult.reasoning,
        output: finalResult
      });

      return { steps, final: finalResult };
    } catch (error) {
      console.error("Workflow Error:", error);
      throw error;
    }
  }
}
