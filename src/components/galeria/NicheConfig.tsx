import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Target, X, Plus, Sparkles, TrendingUp, RefreshCw, 
  Hash, Users, Award, Activity, Loader2, BarChart2, Zap,
  Clock
} from "lucide-react";

interface NicheConfigProps {
  igUsername: string;
  igId: string;
  onClose: () => void;
}

export default function NicheConfig({ igUsername, igId, onClose }: NicheConfigProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newHashtag, setNewHashtag] = useState("");
  const [newProfile, setNewProfile] = useState("");
  const [newHour, setNewHour] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Benchmarks states
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [intelligence, setIntelligence] = useState<any>(null);

  const handleHoursAction = async (action: "add" | "remove", targetHour: string) => {
    let hours = config?.bestHours || ["12:00", "18:00", "20:00"];
    if (action === "add") {
      const trimmed = targetHour.trim();
      if (!trimmed.match(/^\d{2}:\d{2}$/)) {
        alert("Formato inválido! Use HH:MM (ex: 19:30)");
        return;
      }
      if (!hours.includes(trimmed)) {
        hours = [...hours, trimmed];
      }
    } else {
      hours = hours.filter((h: string) => h !== targetHour);
    }

    try {
      setActionLoading(true);
      const resp = await fetch("https://galeria-ia-production.up.railway.app/api/niche/schedule-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUsername,
          bestHours: hours
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
        if (action === "add") setNewHour("");
      }
    } catch (e) {
      console.error("Error saving hours:", e);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [igUsername]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`https://galeria-ia-production.up.railway.app/api/niche/config?igUsername=${igUsername}`);
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
      } else if (resp.status === 404) {
        // Auto-run detection if no config exists
        await handleDetect();
      }
    } catch (e) {
      console.error("Error loading niche config:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleDetect = async (force: boolean = false) => {
    try {
      setDetecting(true);
      const resp = await fetch("https://galeria-ia-production.up.railway.app/api/niche/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ igId, igUsername, force })
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
      }
    } catch (e) {
      console.error("Error detecting niche:", e);
    } finally {
      setDetecting(false);
    }
  };

  const handleHashtagAction = async (action: "add" | "remove", targetTag: string) => {
    if (action === "add" && !targetTag.trim()) return;
    try {
      setActionLoading(true);
      const resp = await fetch("https://galeria-ia-production.up.railway.app/api/niche/hashtags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUsername,
          action,
          hashtag: targetTag.trim()
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
        if (action === "add") setNewHashtag("");
      }
    } catch (e) {
      console.error("Error managing hashtag:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleProfileAction = async (action: "add" | "remove", targetProfile: string) => {
    if (action === "add" && !targetProfile.trim()) return;
    try {
      setActionLoading(true);
      const resp = await fetch("https://galeria-ia-production.up.railway.app/api/niche/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igUsername,
          action,
          handle: targetProfile.trim()
        })
      });
      if (resp.ok) {
        const data = await resp.json();
        setConfig(data);
        if (action === "add") setNewProfile("");
      }
    } catch (e) {
      console.error("Error managing benchmark profile:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const runNicheAnalysis = async () => {
    try {
      setAnalyzeLoading(true);
      const resp = await fetch(`/api/niche/analyze?igId=${igId}&igUsername=${igUsername}`);
      if (resp.ok) {
        const data = await resp.json();
        setIntelligence(data);
      }
    } catch (e) {
      console.error("Error performing full niche analysis:", e);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-card border border-border/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-border/60 flex items-center justify-between bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 flex items-center justify-center text-primary">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Estratégia e Inteligência de Nicho</h2>
              <p className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider">Perfil @{igUsername}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
          {loading || detecting ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
              <Sparkles className="w-10 h-10 text-primary animate-spin" />
              <div className="text-center">
                <p className="text-sm font-bold">Mapeando seu Ecossistema Digital...</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[320px]">Analisando bio, postagens e hashtags recentes para estruturar o seu nicho.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Nicho Base / Detectado */}
              <div className="rounded-2xl p-5 border border-primary/20 bg-primary/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 transform translate-x-4 -translate-y-4 opacity-5 pointer-events-none">
                  <Zap className="w-32 h-32 text-primary" />
                </div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Nicho Detectado por IA</span>
                    <h3 className="text-xl font-bold capitalize text-card-foreground">
                      {config?.detectedNiche || "Não Detectado"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      A IA lê a sua presença e calibra o tom das legendas para ressoar perfeitamente com esse nicho.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {config?.detected?.confidence && (
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        config.detected.confidence === "alta" ? "bg-emerald-500/10 text-emerald-500" :
                        config.detected.confidence === "média" ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        Configuração {config.detected.confidence}
                      </span>
                    )}
                    <button 
                      onClick={() => handleDetect(true)}
                      className="p-2 rounded-xl border border-border hover:bg-muted/50 transition duration-150 cursor-pointer text-muted-foreground"
                      title="Recomeçar Identificação"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* hashtags de nicho */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-foreground/80">
                    <Hash className="w-4 h-4 text-primary" />
                    <span>Hashtags Estratégicas ({config?.hashtags?.length || 0})</span>
                  </div>
                </div>
                
                <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 min-h-[90px] flex flex-wrap gap-2 items-center">
                  {config?.hashtags?.map((tag: string) => (
                    <span 
                      key={tag} 
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-card border border-primary/10 pl-2.5 pr-1 py-1 rounded-full text-foreground/90 transition-all hover:border-primary/30"
                    >
                      <span>{tag}</span>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleHashtagAction("remove", tag)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                  {config?.hashtags?.length === 0 && (
                    <span className="text-xs text-muted-foreground w-full text-center">Nenhuma hashtag adicionada.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleHashtagAction("add", newHashtag); }}
                    placeholder="Adicionar hashtag (Ex: #finelinetattoo)"
                    className="flex-1 text-xs py-2.5 px-3.5 rounded-xl border border-border bg-card focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button 
                    disabled={actionLoading || !newHashtag.trim()}
                    onClick={() => handleHashtagAction("add", newHashtag)}
                    className="px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Perfis Benchmarks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-foreground/80">
                    <Users className="w-4 h-4 text-primary" />
                    <span>Perfis de Referência / Benchmarks ({config?.profileHandles?.length || 0})</span>
                  </div>
                </div>
                
                <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 min-h-[90px] flex flex-wrap gap-2 items-center">
                  {config?.profileHandles?.map((p: string) => (
                    <span 
                      key={p} 
                      className="inline-flex items-center gap-1 text-[11px] font-bold bg-card border border-primary/10 pl-2.5 pr-1 py-1 rounded-full text-foreground/90 transition-all hover:border-primary/30"
                    >
                      <span>@{p}</span>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleProfileAction("remove", p)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                  {config?.profileHandles?.length === 0 && (
                    <span className="text-xs text-muted-foreground w-full text-center">Mapeie competidores ou referências do seu nicho para monitorar métricas.</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newProfile}
                    onChange={(e) => setNewProfile(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleProfileAction("add", newProfile); }}
                    placeholder="Adicionar perfil (Ex: @tattoomaster)"
                    className="flex-1 text-xs py-2.5 px-3.5 rounded-xl border border-border bg-card focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button 
                    disabled={actionLoading || !newProfile.trim()}
                    onClick={() => handleProfileAction("add", newProfile)}
                    className="px-4 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground tracking-tight pt-1">
                  * Perfis devem ser contas profissionais/criadores de conteúdo para funcionar via Business Discovery.
                </p>
              </div>

              {/* Horários de Pico dos Insights Reais */}
              <div className="space-y-4 pt-4 border-t border-border/50">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-tight text-foreground/80">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Horários de Pico de Audiência (Insights Reais)</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Insira exatamente os horários de maior pico que você visualiza no aplicativo do seu Instagram (ex: do link oficial de insights). O Estúdio IA de Lotes usará estes horários preferenciais para agendar automaticamente com 100% de exatidão!
                  </p>
                </div>

                <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 min-h-[70px] flex flex-wrap gap-2 items-center">
                  {(config?.bestHours || ["12:00", "18:00", "20:00"]).map((h: string) => (
                    <span 
                      key={h} 
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-card border border-indigo-500/15 pl-2.5 pr-1 py-1 rounded-full text-indigo-600 transition-all hover:border-indigo-600/30"
                    >
                      <Clock className="w-3 h-3 text-indigo-500" />
                      <span>{h}</span>
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleHoursAction("remove", h)}
                        className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-muted cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newHour}
                    onChange={(e) => setNewHour(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleHoursAction("add", newHour); }}
                    placeholder="Adicionar novo horário real (HH:MM) - Ex: 19:30"
                    className="flex-1 text-xs py-2.5 px-3.5 rounded-xl border border-border bg-card focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                  <button 
                    disabled={actionLoading || !newHour.trim()}
                    onClick={() => handleHoursAction("add", newHour)}
                    className="px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition duration-150 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Botão de Análise de Nicho */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-center bg-card/40 p-3 rounded-2xl border border-border flex-wrap gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-primary" /> Painel de Inteligência de Nicho</p>
                    <p className="text-[10px] text-muted-foreground">Estude o engajamento médio do nicho e o formato rei</p>
                  </div>
                  <button 
                    disabled={analyzeLoading}
                    onClick={runNicheAnalysis}
                    className="px-4 py-2 bg-foreground text-background font-bold text-xs rounded-xl hover:bg-foreground/90 transition duration-150 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {analyzeLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart2 className="w-3.5 h-3.5" />
                        Analisar Nicho
                      </>
                    )}
                  </button>
                </div>

                {/* Resultado da Inteligência de Nicho */}
                <AnimatePresence>
                  {intelligence && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4 overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-muted/40 p-3 border border-border rounded-xl">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Formato Forte</span>
                          <p className="text-lg font-bold text-foreground capitalize flex items-center gap-1">
                            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                            {intelligence.topFormat || "feed"}
                          </p>
                        </div>
                        <div className="bg-muted/40 p-3 border border-border rounded-xl">
                          <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Engajamento Médio do Nicho</span>
                          <p className="text-lg font-bold text-foreground">
                            {intelligence.nicheAvgEngagement ? `${intelligence.nicheAvgEngagement} interações` : "N/A"}
                          </p>
                        </div>
                      </div>

                      {/* Tabela de Benchmarks */}
                      {intelligence.profileInsights && intelligence.profileInsights.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Users className="w-3 h-3 text-primary" /> Análise Comparativa de Perfis</p>
                          <div className="divide-y divide-border/50 text-xs">
                            {intelligence.profileInsights.map((prof: any) => (
                              <div key={prof.handle} className="flex justify-between py-2 align-middle gap-2">
                                <span className="font-semibold text-foreground/80">@{prof.handle}</span>
                                <div className="flex gap-4 text-right text-muted-foreground text-[11px]">
                                  <span>{prof.followers ? `${(prof.followers / 1000).toFixed(1)}k seg` : "-"}</span>
                                  <span className="capitalize">{prof.topFormat || "feed"} ({prof.postFrequency})</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hashtags Insights */}
                      {intelligence.hashtagInsights && intelligence.hashtagInsights.length > 0 && (
                        <div className="space-y-1.5 p-3 rounded-xl border border-border bg-card">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Hash className="w-3 h-3 text-primary" /> Performance de Hashtags</p>
                          <div className="divide-y divide-border/50 text-xs text-muted-foreground">
                            {intelligence.hashtagInsights.map((hash: any) => (
                              <div key={hash.hashtag} className="flex justify-between py-1.5 justify-center">
                                <span className="font-semibold text-foreground/80">{hash.hashtag}</span>
                                <span className="text-[11px]">Média: {hash.avgLikes} likes / {hash.avgComments} com.</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Simple absolute fallback for Button if not styled exactly
function Button({ children, className = "", variant = "solid", size = "md", ...props }: any) {
  const baseStyle = "inline-flex items-center justify-center font-bold tracking-tight text-xs transition duration-150 rounded-xl focus:outline-hidden";
  const sizeStyle = size === "icon" ? "w-9 h-9" : size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5";
  const variantStyle = variant === "ghost" 
    ? "bg-transparent text-muted-foreground hover:bg-muted" 
    : variant === "outline" 
      ? "bg-transparent border border-border hover:bg-muted text-foreground" 
      : "bg-primary text-primary-foreground hover:bg-primary/95";

  return (
    <button className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`} {...props}>
      {children}
    </button>
  );
}
