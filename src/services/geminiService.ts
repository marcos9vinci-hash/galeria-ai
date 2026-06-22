import axios from "axios";

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Gera uma imagem baseada em um prompt e configurações opcionais chamando o backend.
   */
  async generateImage(prompt: string, config: { 
    aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
    systemInstruction?: string;
  } = {}) {
    try {
      const response = await axios.post("/api/ai/generate-image", {
        prompt,
        aspectRatio: config.aspectRatio || "1:1",
        systemInstruction: config.systemInstruction
      });

      if (response.data.imageUrl) {
        return response.data.imageUrl;
      }
      throw new Error("Resposta da API não contém imageUrl");
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      console.error("Erro ao gerar imagem via API:", msg);
      throw new Error(msg);
    }
  }

  /**
   * Tenta sincronizar as instruções de uma Gem usando Airtop para navegar no site.
   */
  async syncGemWithAirtop(gemUrl: string) {
    try {
      const response = await axios.post("/api/airtop/scrape-gem", { gemUrl });
      if (response.data.instructions) {
        return response.data.instructions;
      }
      throw new Error("Não foi possível extrair instruções. Verifique a URL ou tente manualmente.");
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      console.error("Erro no Sync Airtop:", msg);
      throw new Error(msg);
    }
  }

  /**
   * Gera uma tatuagem automatizando a navegação via Airtop no site do Gemini.
   */
  async generateTattooWithAirtop(prompt: string, gemUrl: string) {
    try {
      const response = await axios.post("/api/airtop/generate-tattoo", { prompt, gemUrl });
      if (response.data.imageUrl) {
        return response.data.imageUrl;
      }
      throw new Error("Não foi possível capturar a imagem gerada.");
    } catch (error: any) {
      const msg = error.response?.data?.error || error.message;
      console.error("Erro na Geração Airtop:", msg);
      throw new Error(msg);
    }
  }

  /**
   * Executa um prompt de visão (imagem + texto) - via base44 InvokeLLM já existente ou nova rota
   */
  async analyzeImage(imageUri: string, prompt: string) {
    // Implementação futura ou usar o que já existe no AgenteStudioService
    return null;
  }
}
