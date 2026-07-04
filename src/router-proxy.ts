import express, { Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

const NINE_ROUTER_URL = process.env.NINE_ROUTER_URL || "http://localhost:20128";
const NINE_ROUTER_API_KEY = process.env.NINE_ROUTER_API_KEY;

const TASK_KEYWORDS = {
  code: {
    keywords: [
      "codigo", "code", "javascript", "typescript", "python", "node", "react",
      "função", "function", "array", "objeto", "debug", "bug", "deploy", "git",
      "npm", "css", "html", "api", "endpoint", "backend", "frontend", "refatora",
      "script", "terminal", "bash", "sql", "database", "docker", "yaml", "json",
      "error", "exception", "classe", "import", "export", "loop", "if else",
      "claude code", "opencode", "codex", "cursor", "vscode",
      "cron", "job", "scheduler", "schedule", "tarefa", "automação", "automation",
      "linux", "hermes", "skill", "provider", "config", "variável", "env",
      "middleware", "server", "client", "proxy", "router", "gateway",
      "build", "compile", "install", "package", "dependency"
    ],
    model: "master-combo",
    tier: "smart"
  },
  creative: {
    keywords: [
      "tatuagem", "tattoo", "design", "logo", "arte", "art", "desenho",
      "prompt", "imagem", "gerar", "midjourney", "stable diffusion", "figurino",
      "ilustração", "sketch", "wireframe", "layout", "visual", "portfólio",
      "estúdio", "estilo", "composição", "anatômico", "grid", "flow"
    ],
    model: "master-combo",
    tier: "smart"
  },
  occult: {
    keywords: [
      "tarô", "tarot", "astrologia", "horóscopo", "oráculo", "gnose",
      "alquimia", "kabbalah", "ritual", "simbologia", "chakra", "energia",
      "espiritual", "místico", "ocultismo", "magia", "meditação", "zen",
      "budismo", "tao", "sagrado", "mandalas", "yoga", "hermetismo",
      "sacred", "mystic", "ritual", "occult"
    ],
    model: "master-combo",
    tier: "smart"
  },
  research: {
    keywords: [
      "pesquisar", "research", "resuma", "resumo", "análise", "comparar",
      "estude", "investigar", "relatório", "documento", "spec", "especificação",
      "arquitetura", "fluxo", "diagrama", "pipeline", "estratégia", "plano",
      "estude", "review", "auditoria", "inspecione", "como funciona"
    ],
    model: "master-combo",
    tier: "smart"
  },
  social: {
    keywords: [
      "post", "instagram", "legenda", "caption", "hashtag", "bio", "copy",
      "marketing", "anuncio", "script", "roteiro", "youtube", "thread",
      "twitter", "linkedin", "facebook", "mensagem cliente", "whatsapp",
      "reels", "tiktok", "campanha", "agência", "branding", "venda"
    ],
    model: "master-combo",
    tier: "fast"
  },
  vision: {
    keywords: [
      "imagem", "foto", "análise", "analisar", "detectar", "ocr", "leia",
      "extraia", "descreva", "screenshot", "printscreen", "vídeo", "video",
      "anexa", "attachment", "print"
    ],
    model: "master-combo",
    tier: "smart"
  },
  tattoo_workflow: {
    keywords: [
      "briefing", "projeto", "cliente", "caminho do ouro", "design",
      "direção visual", "oracle", "fotógrafo", "lettering", "fineline",
      "floral", "mandala", "geométrico", "pointing", "参考"
    ],
    model: "master-combo",
    tier: "smart"
  }
};

function classifyTask(text: string): { type: string; model: string; tier: string; score: number; confidence: string } {
  if (!text || text.trim().length === 0) {
    return { type: "fast", model: "master-combo", tier: "fast", score: 0, confidence: "low" };
  }

  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [taskType, config] of Object.entries(TASK_KEYWORDS)) {
    scores[taskType] = 0;
    for (const keyword of config.keywords) {
      if (lower.includes(keyword)) {
        scores[taskType]++;
      }
    }
  }

  let maxScore = 0;
  let bestType = "social";

  for (const [taskType, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestType = taskType;
    }
  }

  const config = TASK_KEYWORDS[bestType as keyof typeof TASK_KEYWORDS];

  return {
    type: bestType,
    model: config.model,
    tier: config.tier,
    score: maxScore,
    confidence: maxScore >= 2 ? "high" : maxScore === 1 ? "medium" : "low"
  };
}

function hasImageContent(messages: any[]): boolean {
  for (const msg of messages) {
    const content = msg.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (part.type === "image_url" || part.image_url) {
          return true;
        }
      }
    }
  }
  return false;
}

async function routeRequest(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    const { model, messages, max_tokens, temperature, stream } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" });
    }

    let selectedModel = model;
    let taskType = "chat";
    let classification: any = null;

    if (model === "auto" || !model) {
      const lastMessage = messages[messages.length - 1];
      const textContent = Array.isArray(lastMessage.content) 
        ? lastMessage.content.filter((c: any) => c.type === "text").map((c: any) => c.text).join(" ")
        : lastMessage.content || "";
      
      const hasImage = hasImageContent(messages);
      
      if (hasImage) {
        classification = { type: "vision", model: "master-combo", tier: "smart", score: 1, confidence: "high" };
        taskType = "vision";
      } else {
        classification = classifyTask(textContent);
        taskType = classification.type;
      }
      
      selectedModel = classification.model;
    }

    const payload: any = {
      model: selectedModel,
      messages,
      max_tokens: max_tokens || 4096,
      temperature: temperature ?? 0.7,
      stream: stream ?? false
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (NINE_ROUTER_API_KEY) {
      headers["Authorization"] = `Bearer ${NINE_ROUTER_API_KEY}`;
    }

    const response = await axios.post(
      `${NINE_ROUTER_URL}/v1/chat/completions`,
      payload,
      { headers, timeout: 120000 }
    );

    const data = response.data;
    const content = data.choices?.[0]?.message?.content || "";
    const usedModel = data.model || selectedModel;

    res.json({
      text: content,
      model: usedModel,
      provider: data.provider || "9router",
      taskType,
      classification: classification ? {
        type: classification.type,
        tier: classification.tier,
        confidence: classification.confidence,
        score: classification.score
      } : null,
      success: true,
      latencyMs: Date.now() - startTime,
      tokens: data.usage?.total_tokens || 0
    });

  } catch (error: any) {
    console.error("[Router Proxy] Error:", error.message);
    res.status(500).json({
      error: error.message,
      success: false,
      latencyMs: Date.now() - startTime
    });
  }
}

app.post("/v1/chat/completions", routeRequest);
app.get("/health", (req: Request, res: Response) => res.json({ ok: true }));

const PORT = process.env.ROUTER_PROXY_PORT || 20129;
app.listen(PORT, () => {
  console.log(`🔮 Router Proxy running on port ${PORT} → 9Router at ${NINE_ROUTER_URL}`);
});

export { classifyTask, routeRequest };