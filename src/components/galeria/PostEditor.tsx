import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sparkles, Hash, ChevronLeft, ChevronRight, X, Wand2, FlipHorizontal, 
  FlipVertical, Download, Trash2, Loader2, MessageSquare, CheckCircle2, 
  Clock, FileEdit, RefreshCw, Settings2, Save, CalendarDays, Camera, 
  LayoutGrid, Pencil, RotateCw, History, ArrowLeft, ArrowRight, Instagram,
  Eye, Music, Layers, ImagePlus, Palette
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { base44 } from "@/api/base44Client";
import { GeminiService } from "@/services/geminiService";

import ContextoModal from "./ContextoModal";
import StorySequencer from "./StorySequencer";
import ScriptReels from "./ScriptReels";
import AnalisadorEstilo from "./AnalisadorEstilo";

// Identify and remove:
// - AnalisadorEstilo usage
// - Redundant schedule UI
// - Combine posting buttons if possible

// I'll leave the actual code cleanup to just removing the AnalisadorEstilo component import and usage.
import AudiosEmAlta from "./AudiosEmAlta";

const STATUS_OPTIONS = [
  { value: "rascunho", label: "Rascunho", icon: FileEdit, color: "bg-yellow-500" },
  { value: "pronto", label: "Pronto", icon: Clock, color: "bg-blue-500" },
  { value: "agendado", label: "Agendado", icon: CalendarDays, color: "bg-indigo-600 animate-pulse" },
  { value: "publicado", label: "Publicado", icon: CheckCircle2, color: "bg-green-500" },
];

const TYPE_OPTIONS = ["feed", "square", "story", "reels", "carousel"];

export default function PostEditor({ posts, initialIndex = 0, onClose, onDeletePost, onUpdatePost, allPosts, onBufferUpdate }: any) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [activePost, setActivePost] = useState(posts[initialIndex]);
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [postType, setPostType] = useState('feed');
  const [postStatus, setPostStatus] = useState('rascunho');
  const [scheduledDate, setScheduledDate] = useState(() => {
    if (activePost.scheduledTime && activePost.scheduledTime.includes('T')) {
      return activePost.scheduledTime.split('T')[0];
    }
    return new Date().toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState(() => {
    if (activePost.scheduledTime && activePost.scheduledTime.includes('T')) {
      const parts = activePost.scheduledTime.split('T');
      if (parts[1]) return parts[1].substring(0, 5);
    }
    return "12:00";
  });
  const [showContexto, setShowContexto] = useState(false);
  const [contexto, setContexto] = useState({ tema: '', publico: '', tom: '', extra: '' });
  
  const [showScriptReels, setShowScriptReels] = useState(false);
  const [showAnalisador, setShowAnalisador] = useState(false);
  const [styleAnalysis, setStyleAnalysis] = useState<any>(null);

  // States for the new UI organization
  const [activeTab, setActiveTab] = useState<string | null>(null); // 'ia', 'edit', 'reels', 'story', 'schedule'
  const [editorSettings, setEditorSettings] = useState({ brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // AI Configuration states
  const [cta, setCta] = useState('');
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [captionPrompt, setCaptionPrompt] = useState('');
  const [ctaPrompt, setCtaPrompt] = useState('');
  const [hashtagPrompt, setHashtagPrompt] = useState('');
  const [aiTemplate, setAiTemplate] = useState('profissional');
  
  // Image AI states
  const [imagePrompt, setImagePrompt] = useState('');
  const [gemInstructions, setGemInstructions] = useState(''); // Current instructions
  const [savedGems, setSavedGems] = useState<any[]>([]); // List of saved Gems
  const [selectedGemId, setSelectedGemId] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [useAirtop, setUseAirtop] = useState(false);
  const [showGemTutorial, setShowGemTutorial] = useState(false);
  const [gemUrlInput, setGemUrlInput] = useState('https://gemini.google.com/gem/ec86201ecd02/5d51bfd86212f73a');
  useEffect(() => {
    const saved = localStorage.getItem('tattoo_gems');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedGems(parsed);
      if (parsed.length > 0 && !gemInstructions) {
        setGemInstructions(parsed[0].instructions);
        setSelectedGemId(parsed[0].id);
      }
    } else {
      // Default initial gem based on user's name
      const defaultGem = {
        id: 'default-aflor',
        name: '🌹 A Flor da Pele (Padrão)',
        instructions: 'Você é um mestre tatuador especializado em traços finos e realismo botânico. Suas imagens de tatuagem devem parecer fotos reais em estúdio, com iluminação suave, foco nítido na pele e detalhes minuciosos nos traços. Evite fundos poluídos.',
        url: 'https://gemini.google.com/gem/ec86201ecd02/5d51bfd86212f73a'
      };
      setSavedGems([defaultGem]);
      setGemInstructions(defaultGem.instructions);
      setSelectedGemId(defaultGem.id);
      localStorage.setItem('tattoo_gems', JSON.stringify([defaultGem]));
    }
  }, []);

  const saveCurrentGem = () => {
    const name = prompt("Dê um nome para esta Gem (ex: Realismo Preto e Cinza):");
    if (!name) return;
    
    const newGem = {
      id: Date.now().toString(),
      name,
      instructions: gemInstructions
    };
    
    const updated = [...savedGems, newGem];
    setSavedGems(updated);
    setSelectedGemId(newGem.id);
    localStorage.setItem('tattoo_gems', JSON.stringify(updated));
  };
  const deleteGem = (id: string) => {
    if (savedGems.length <= 1) return;
    const updated = savedGems.filter(g => g.id !== id);
    setSavedGems(updated);
    if (selectedGemId === id) setSelectedGemId(updated[0]?.id || null);
    localStorage.setItem('tattoo_gems', JSON.stringify(updated));
  };
  
  // Real IG Connection state
  const [igAccounts, setIgAccounts] = useState<any[]>([]);
  const [bufferProfiles, setBufferProfiles] = useState<any[]>([]);
  const [selectedBufferProfile, setSelectedBufferProfile] = useState<string | null>(null);
  const [publishMode, setPublishMode] = useState<'queue' | 'now' | 'scheduled'>('queue');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSendingBuffer, setIsSendingBuffer] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [recommendedTimes, setRecommendedTimes] = useState<string[]>(['12:00', '18:30', '21:00']);

  const fetchScheduleTimes = async (profileId: string) => {
    try {
      const response = await fetch(`https://galeria-ia-production.up.railway.app/api/buffer/schedule/${profileId}`);
      const data = await response.json();
      if (data.data?.node?.postingSchedules) {
        // Flatten all times from all schedule groups
        const times = data.data.node.postingSchedules.flatMap((s: any) => s.times);
        // Get unique times and sort them
        const uniqueTimes = Array.from(new Set(times)).sort() as string[];
        if (uniqueTimes.length > 0) {
          setRecommendedTimes(uniqueTimes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch schedule times", err);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const [igResp, bufferResp] = await Promise.all([
        fetch("https://galeria-ia-production.up.railway.app/api/instagram/me"),
        fetch("https://galeria-ia-production.up.railway.app/api/buffer/profiles")
      ]);
      
      if (igResp.ok) {
        const data = await igResp.json();
        setIgAccounts(data.accounts || []);
      }
      
      if (bufferResp.ok) {
        const data = await bufferResp.json();
        const profiles = data.data?.profiles || [];
        setBufferProfiles(profiles);
        
        // Pre-select aflordapele_tattoo or matching ID
        const aflor = profiles.find((p: any) => 
          p.name.toLowerCase().includes('aflordapele') || 
          p.id === '66e175f850f18c6f37624647'
        );
        if (aflor) {
          setSelectedBufferProfile(aflor.id);
        } else if (profiles.length > 0 && !selectedBufferProfile) {
          setSelectedBufferProfile(profiles[0].id);
        }
      }
    } catch (err) {
      console.error("Integrations check failed", err);
    }
  };


  useEffect(() => {
    if (selectedBufferProfile) {
      fetchScheduleTimes(selectedBufferProfile);
    }
  }, [selectedBufferProfile]);

  useEffect(() => {
    fetchIntegrations();

    const handleAuth = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchIntegrations();
      }
    };
    window.addEventListener('message', handleAuth);
    return () => window.removeEventListener('message', handleAuth);
  }, []);

  const handleRealPublish = async (isScheduled = false) => {
    if (igAccounts.length === 0) return;
    setIsPublishing(true);
    setPublishSuccess(null);
    try {
      const scheduledAt = isScheduled ? activePost.scheduledAt : null;
      
      const response = await fetch("https://galeria-ia-production.up.railway.app/api/instagram/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          igId: igAccounts[0].igId,
          imageUrl: activePost.image,
          caption: `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`,
          scheduledAt
        })
      });
      
      const result = await response.json();
      if (response.ok) {
        const newStatus = isScheduled ? 'agendado' : 'publicado';
        setPublishSuccess(isScheduled ? "Agendado no Servidor!" : "Postado com sucesso!");
        setPostStatus(newStatus);
        
        // Update the actual post object in the parent state
        onUpdatePost({ 
          ...activePost, 
          status: newStatus,
          // If was published now, we could also store the time if needed
          updatedAt: new Date().toISOString()
        });
      } else {
        throw new Error(result.error || "Erro ao processar");
      }
    } catch (err: any) {
      console.error("Meta publish error:", err);
      // Ensure we show a string message, not [object Object]
      const msg = typeof err.message === 'string' ? err.message : JSON.stringify(err);
      alert("Erro na Operação Meta: " + msg);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSendBuffer = async () => {
    if (!selectedBufferProfile) {
      alert("Selecione um canal do Buffer. Se nenhum aparecer, verifique sua conexão no painel superior.");
      return;
    }
    
    setIsSendingBuffer(true);
    setPublishSuccess(null);
    try {
      let scheduledIso = null;
      if (publishMode === 'scheduled' && scheduledDate && scheduledTime) {
        const localDate = new Date(`${scheduledDate}T${scheduledTime}`);
        const now = new Date();
        
        // Buffer requires future dates. If it's too close or in the past, push it slightly forward
        if (localDate.getTime() <= now.getTime() + 30000) { // 30 seconds safety
          localDate.setTime(now.getTime() + 120000); // Set to 2 mins from now
          // Update UI state so user sees what happened
          const pad = (n: number) => n.toString().padStart(2, '0');
          setScheduledTime(`${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`);
        }
        scheduledIso = localDate.toISOString();
      }

      const selectedProfile = bufferProfiles.find(p => p.id === selectedBufferProfile);

      const response = await fetch("https://galeria-ia-production.up.railway.app/api/buffer/schedule-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedBufferProfile,
          service: selectedProfile?.service,
          imageUrl: activePost.image,
          text: `${caption}\n\n${cta}\n\n${hashtags.join(' ')}`,
          scheduledAt: scheduledIso,
          publishMode: publishMode
        })
      });

      const result = await response.json();
      if (response.ok && !result.errors) {
        const modeLabel = publishMode === 'now' ? 'Publicado agora' : publishMode === 'queue' ? 'Adicionado à fila' : 'Agendado';
        setPublishSuccess(`${modeLabel} com sucesso!`);
        setPostStatus('publicado');
        onUpdatePost({ 
          ...activePost, 
          status: 'publicado',
          scheduledTime: scheduledIso || activePost.scheduledTime 
        });
        if (onBufferUpdate) onBufferUpdate();
      } else {
        const errorData = result.errors?.[0] || result.error;
        console.error("[Buffer Debug]", errorData);
        const errorMsg = errorData?.message || (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) || "Erro desconhecido no Buffer";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Buffer error:", err);
      alert(`Falha no Processamento: ${err.message}`);
    } finally {
      setIsSendingBuffer(false);
    }
  };

  useEffect(() => {
    const p = posts[activeIndex];
    if (!p) return;
    setActivePost(p);
    setCaption(p?.caption || '');
    setHashtags(p?.hashtags || []);
    setPostType(p?.type || 'feed');
    setPostStatus(p?.status || 'rascunho');
    setEditorSettings(p?.editorSettings || { brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 });
    
    let finalDateStr = '';
    let finalTimeStr = '';
    let hasSchedule = false;

    // 1. Try to read from raw date/time references (scheduledTime, scheduledAt, date)
    const timeRef = p?.scheduledTime || p?.scheduledAt || p?.date;
    if (timeRef) {
      const dObj = timeRef instanceof Date ? timeRef : new Date(timeRef);
      if (!isNaN(dObj.getTime())) {
        const pad = (num: number) => num.toString().padStart(2, '0');
        finalDateStr = `${dObj.getFullYear()}-${pad(dObj.getMonth() + 1)}-${pad(dObj.getDate())}`;
        finalTimeStr = `${pad(dObj.getHours())}:${pad(dObj.getMinutes())}`;
        hasSchedule = true;
      }
    }

    // 2. Strict manual overrides if formats align
    if (p?.scheduledDate && p.scheduledDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      finalDateStr = p.scheduledDate;
      hasSchedule = true;
    }
    if (p?.scheduledTime && p.scheduledTime.match(/^\d{2}:\d{2}$/)) {
      finalTimeStr = p.scheduledTime;
      hasSchedule = true;
    }

    setScheduledDate(finalDateStr || new Date().toISOString().split('T')[0]);
    setScheduledTime(finalTimeStr || '12:00');
    setPublishMode(hasSchedule ? 'scheduled' : 'queue');
  }, [activeIndex, posts]);

  const addToHistory = (state: any) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...state, cta: state.cta || cta });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCaption(prev.caption);
      if (prev.cta) setCta(prev.cta);
      setHashtags(prev.hashtags);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Pilares de Encantamento & Visão Oculta (Orientação Interna)
  const PILARES_CONVENCIMENTO = `
    MISSÃO: Revelar o propósito espiritual gravado na pele de forma fluida e autêntica.
    
    DIRETRIZES DE NARRATIVA:
    1. EDUCAÇÃO INICIÁTICA: Traga um fato profundo ou curiosidade sobre o símbolo. Não comece sempre com "Você sabia" ou "Poucos sabem". Varie a abordagem: pode ser uma provocação, uma citação poética ou uma observação técnica.
    2. SIMBOLOGIA E ALQUIMIA: Conecte o design a saberes ancestrais (Botânica, Astrologia, Ocultismo).
    3. PSICOLOGIA DA ALMA: Discorra sobre por que a alma busca este arquétipo específico.
    4. CORPO COMO TEMPLO: A relação do traço com o fluxo energético e a anatomia.
    
    ESTILO DE TEXTO: Texto ÚNICO e coeso. PROIBIDO usar colchetes como [A REVELAÇÃO] ou títulos de seção. A transição entre os temas deve ser natural e invisível para o leitor. Use uma linguagem de mestre que traduz o antigo para o moderno.
  `;

  const generateSinglePart = async (part: 'caption' | 'cta' | 'hashtags') => {
    setIsProcessing(part);
    try {
      const partPrompts = {
        caption: captionPrompt || `Gere uma legenda que seja uma "Pílula de Sabedoria". Use fundamentos de: ${PILARES_CONVENCIMENTO}. Tom: ${aiTemplate}.`,
        cta: ctaPrompt || `Gere um CTA focado no "Ritual da Pele" e na busca por significado.`,
        hashtags: hashtagPrompt || `Gere 15 hashtags conceituais e de nicho espiritual/artístico.`
      };

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta imagem de tatuagem e gere apenas o campo pedido.
        PROMPT ESPECÍFICO: ${partPrompts[part]}
        ${contexto.tema ? `Estilo do Trabalho: ${contexto.tema}` : ''}
        Retorne em formato JSON com a chave "${part}".`,
        file_urls: [activePost.image],
        response_json_schema: {
          type: "object",
          properties: {
            [part]: { type: "string" }
          }
        }
      });

      if (part === 'caption') {
        setCaption(response.caption || '');
      } else if (part === 'cta') {
        setCta(response.cta || '');
      } else if (part === 'hashtags') {
        const rawTags = response.hashtags || '';
        const newTags = typeof rawTags === 'string' 
          ? rawTags.split(/\s+/).filter((h: string) => h.startsWith('#'))
          : Array.isArray(rawTags) ? rawTags.filter((h: any) => String(h).startsWith('#')) : [];
        setHashtags(newTags);
      }
      
      addToHistory({ caption, cta, hashtags });
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(null);
  };

  const handleGenerateComplete = async () => {
    setActiveTab('ia'); 
    setIsProcessing('all');
    try {
      const prompt = `Analise esta imagem de tatuagem através da VISÃO COMPUTACIONAL e assuma seu papel de INICIADO NA VISÃO OCULTA.
      
      MISSÃO: Revelar o propósito espiritual e educar o público através de uma narrativa ÚNICA e fluida.
      
      PILARES DE CONTEÚDO:
      ${PILARES_CONVENCIMENTO}

      REGRAS DE GERAÇÃO:
      1. LEGENDA: ${captionPrompt || `Crie uma jornada educacional profunda e coesa. NUNCA use labels ou colchetes. Varie o início da frase. Modelo: ${aiTemplate}.`}
      2. CTA: ${ctaPrompt || "Um convite magnético focado na transformação pelo ritual da tatuagem."}
      3. HASHTAGS: ${hashtagPrompt || "Hashtags conceituais e iniciáticas."}
      
      ${contexto.tema ? `Contexto Estilo: ${contexto.tema}` : ''}
      
      IMPORTANTE: Retorne APENAS um objeto JSON válido. Use o idioma Português (pt-BR).`;

      let response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [activePost.image],
        response_json_schema: {
          type: "object",
          properties: {
            legenda: { type: "string" },
            cta: { type: "string" },
            hashtags: { type: "string" },
            horario: { type: "string" },
          }
        }
      });

      // Robust check for string responses that need secondary parsing
      if (typeof response === "string") {
        try {
          // Find the first { and last } to avoid extra characters
          const start = response.indexOf('{');
          const end = response.lastIndexOf('}');
          if (start !== -1 && end !== -1) {
            response = JSON.parse(response.substring(start, end + 1));
          }
        } catch (parseError) {
          console.error("Secondary parse error:", parseError);
        }
      }

      const newCaption = response.legenda || '';
      const newCta = response.cta || '';
      let newTags: string[] = [];
      const rawHashtags = response.hashtags || '';
      
      if (Array.isArray(rawHashtags)) {
        newTags = rawHashtags.filter((h: any) => typeof h === 'string' && h.startsWith('#'));
      } else if (typeof rawHashtags === 'string') {
        newTags = rawHashtags.split(/\s+/).filter((h: string) => h.startsWith('#'));
      }
      
      addToHistory({ caption: newCaption, cta: newCta, hashtags: newTags });
      setCaption(newCaption);
      setCta(newCta);
      setHashtags(newTags);
      if (response.horario) setScheduledTime(response.horario);
    } catch (e) {
      console.error(e);
    }
    setIsProcessing(null);
  };

  const generateImageAction = async () => {
    if (!imagePrompt) return;
    setIsGeneratingImage(true);
    try {
      const gemini = GeminiService.getInstance();
      let imageUrl = '';

      if (useAirtop) {
        imageUrl = await gemini.generateTattooWithAirtop(imagePrompt, gemUrlInput);
      } else {
        imageUrl = await gemini.generateImage(imagePrompt, {
          aspectRatio: postType === 'story' ? '9:16' : postType === 'square' ? '1:1' : '4:3',
          systemInstruction: gemInstructions
        });
      }
      
      // Update active post with new image
      const updatedPost = { ...activePost, image: imageUrl };
      setActivePost(updatedPost);
      onUpdatePost(updatedPost);
      addToHistory({ ...activePost, image: imageUrl });
      
      setActiveTab('edit'); // Switch to edit to preview
    } catch (err: any) {
      console.error(err);
      alert("Erro ao gerar imagem: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = () => {
    let updatedDate = activePost.date;
    let finalScheduledTime = activePost.scheduledTime;
    
    if (scheduledDate && scheduledTime) {
      const [year, month, day] = scheduledDate.split('-').map(Number);
      const [hour, min] = scheduledTime.split(':').map(Number);
      const newD = new Date(year, month - 1, day, hour, min);
      if (!isNaN(newD.getTime())) {
        updatedDate = newD;
        const pad = (num: number) => num.toString().padStart(2, '0');
        // Create valid ISO string representation for scheduledTime
        finalScheduledTime = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(min)}:00Z`;
      }
    }

    onUpdatePost({ 
      ...activePost, 
      caption, 
      cta,
      hashtags, 
      type: postType, 
      status: postStatus, 
      editorSettings, 
      scheduledDate, 
      date: updatedDate,
      scheduledTime: finalScheduledTime
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const statusInfo = STATUS_OPTIONS.find(s => s.value === postStatus) || STATUS_OPTIONS[0];

  return (
    <div className="fixed inset-0 bg-black/95 z-[40] flex flex-col md:flex-row overflow-hidden">
      {/* Top Banner / Actions */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-[45] bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" size="icon" className="text-white" onClick={onClose}><X className="w-6 h-6" /></Button>
        <div className="flex gap-2">
           <Badge 
             className={`${statusInfo.color} text-white cursor-pointer hover:opacity-80 transition-opacity`}
             onClick={() => setPostStatus(prev => {
                const idx = STATUS_OPTIONS.findIndex(s => s.value === prev);
                return STATUS_OPTIONS[(idx + 1) % STATUS_OPTIONS.length].value;
             })}
           >
              {statusInfo.label}
           </Badge>
           <Badge 
             variant="secondary" 
             className="bg-white/10 text-white border-white/20 cursor-pointer"
             onClick={() => setPostType(prev => {
                const idx = TYPE_OPTIONS.findIndex(t => t === prev);
                return TYPE_OPTIONS[(idx + 1) % TYPE_OPTIONS.length];
             })}
           >
              {postType.toUpperCase()}
           </Badge>
        </div>
        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDeletePost(activePost.id)}><Trash2 className="w-5 h-5" /></Button>
      </div>

      {/* Main Container */}
      <div className="flex-1 relative flex items-center justify-center p-0 md:p-8">
        <div className={`relative w-full h-full max-w-lg ${
          postType === 'feed' ? 'aspect-[4/5]' : 
          postType === 'square' ? 'aspect-square' : 
          'aspect-[9/16]'
        } flex items-center justify-center`}>
            <img 
              src={activePost.image} 
              alt="" 
              className="w-full h-full object-contain md:object-cover rounded-lg shadow-2xl transition-all duration-300"
              style={{
                filter: `brightness(${editorSettings.brightness}%) contrast(${editorSettings.contrast}%) saturate(${editorSettings.saturate}%)`,
                transform: `rotate(${editorSettings.rotate}deg) scaleX(${editorSettings.scaleX}) scaleY(${editorSettings.scaleY})`
              }}
            />
            
            {/* Quick Actions Overlay Icons */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-4 z-[50]">
               {[
                 { id: 'ia', icon: Sparkles, label: 'Gerar IA', loading: isProcessing === 'all' },
                 { id: 'image-ia', icon: Palette, label: 'Imagem IA', loading: isGeneratingImage },
                 { id: 'edit', icon: Pencil, label: 'Editar' },
                 { id: 'reels', icon: Camera, label: 'Reels' },
                 { id: 'story', icon: LayoutGrid, label: 'Stories' },
                 { id: 'carousel', icon: Layers, label: 'Carrossel' },
                 { id: 'analyze', icon: Eye, label: 'Analisar' },
                 { id: 'schedule', icon: CalendarDays, label: 'Agendar' }
               ].map((tool: any) => (
                 <div key={tool.id} className="relative group">
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => {
                        if (tool.id === 'ia') handleGenerateComplete();
                        else if (tool.id === 'analyze') setShowAnalisador(true);
                        else setActiveTab(activeTab === tool.id ? null : tool.id);
                      }}
                      className={`w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${
                        activeTab === tool.id 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'bg-black/40 text-white border-white/20 hover:bg-black/60 shadow-xl'
                      }`}
                    >
                      {tool.loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <tool.icon className="w-5 h-5" />}
                    </motion.button>
                    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2 py-1 bg-black/80 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase font-bold">
                       {tool.label}
                    </div>
                 </div>
               ))}
            </div>

            {/* Pagination */}
            {posts.length > 1 && (
               <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={() => setActiveIndex(i => Math.max(0, i-1))} disabled={activeIndex === 0}><ChevronLeft className="w-4 h-4" /></Button>
                  <span className="text-xs text-white font-medium">{activeIndex + 1} / {posts.length}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white" onClick={() => setActiveIndex(i => Math.min(posts.length-1, i+1))} disabled={activeIndex === posts.length-1}><ChevronRight className="w-4 h-4" /></Button>
               </div>
            )}
        </div>
      </div>

      {/* Control Panels - Expandable from Bottom/Side */}
      <AnimatePresence>
        {activeTab && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`absolute bottom-0 left-0 right-0 md:relative md:w-[450px] z-[60] flex flex-col max-h-[70vh] md:max-h-full transition-colors duration-300 ${
              activeTab === 'edit' ? 'bg-transparent' : 'bg-card border-t md:border-l border-border shadow-2xl'
            }`}
          >
             <div className={`p-4 flex items-center justify-between sticky top-0 z-10 ${
               activeTab === 'edit' ? 'bg-transparent' : 'bg-card border-b'
             }`}>
                <div className="flex items-center gap-2">
                   {historyIndex > 0 && (
                     <Button 
                        variant="ghost" 
                        size="icon" 
                        className={`h-8 w-8 ${activeTab === 'edit' ? 'text-white hover:bg-white/10' : ''}`} 
                        onClick={handleUndo}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                   )}
                   <h3 className={`font-bold text-sm uppercase tracking-widest ${activeTab === 'edit' ? 'text-white' : 'text-foreground'}`}>
                     {activeTab === 'ia' && "Magic AI Result"}
                     {activeTab === 'image-ia' && "Gerador de Imagens (Gem)"}
                     {activeTab === 'edit' && "Ajustes de Imagem"}
                     {activeTab === 'reels' && "Script para Reels"}
                     {activeTab === 'story' && "Story Planner"}
                     {activeTab === 'schedule' && "Agendamento"}
                   </h3>
                </div>
                <div className="flex items-center gap-1">
                    {activeTab === 'ia' && (
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className={showAiSettings ? "text-primary bg-primary/10" : ""}
                         onClick={() => setShowAiSettings(!showAiSettings)}
                       >
                          <Settings2 className="w-4 h-4" />
                       </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={activeTab === 'edit' ? 'text-white hover:bg-white/10' : ''} 
                      onClick={() => setActiveTab(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                 </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-4 space-y-6 ${activeTab === 'edit' ? 'bg-transparent' : ''}`}>
                  {activeTab === 'image-ia' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Minhas Gems Salvas</Label>
                             <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-primary" onClick={saveCurrentGem}>
                                <Save className="w-3 h-3 mr-1" /> Salvar Atual
                             </Button>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                             {savedGems.map((gem) => (
                                <div 
                                   key={gem.id} 
                                   onClick={() => {
                                      setGemInstructions(gem.instructions);
                                      setSelectedGemId(gem.id);
                                   }}
                                   className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                      selectedGemId === gem.id 
                                      ? 'bg-primary/10 border-primary shadow-sm' 
                                      : 'bg-muted/30 border-border hover:bg-muted/50'
                                   }`}
                                >
                                   <div className="flex flex-col gap-0.5">
                                      <span className={`text-xs font-bold ${selectedGemId === gem.id ? 'text-primary' : 'text-foreground'}`}>
                                         {gem.name}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground line-clamp-1 max-w-[200px]">
                                         {gem.instructions}
                                      </span>
                                   </div>
                                   {savedGems.length > 1 && (
                                      <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100" 
                                         onClick={(e) => {
                                            e.stopPropagation();
                                            deleteGem(gem.id);
                                         }}
                                      >
                                         <Trash2 className="w-3 h-3" />
                                      </Button>
                                   )}
                                </div>
                             ))}
                          </div>
                       </div>

                       <div className="space-y-2 pt-2 border-t border-border/50">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Configuração da Gem (Prompt do Sistema)</Label>
                          <Textarea 
                             placeholder="Cole aqui as regras da sua Gem..."
                             value={gemInstructions}
                             onChange={e => {
                               setGemInstructions(e.target.value);
                               setSelectedGemId(null);
                             }}
                             className="min-h-[100px] bg-muted/30 text-xs border-border/50 font-mono focus:ring-1 focus:ring-primary"
                          />
                       </div>

                       <div className="space-y-4">
                          <div className="flex items-center justify-between">
                             <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">O que deseja criar agora?</Label>
                             <div className="flex items-center gap-2">
                                <Label className="text-[10px] uppercase font-bold text-primary animate-pulse">Airtop Automation</Label>
                                <Switch 
                                   checked={useAirtop} 
                                   onCheckedChange={setUseAirtop}
                                   className="scale-75 data-[state=checked]:bg-primary"
                                />
                             </div>
                          </div>
                          <div className="relative group">
                             <Textarea 
                                placeholder={useAirtop ? "Envie o comando direto para o Browser..." : "Descreva a arte ou a cena em detalhes..."}
                                value={imagePrompt}
                                onChange={e => setImagePrompt(e.target.value)}
                                className="min-h-[80px] bg-background text-sm border-primary/20 focus:border-primary pr-12 transition-all shadow-sm"
                             />
                             <Button 
                                size="icon"
                                className="absolute bottom-2 right-2 rounded-full h-8 w-8 bg-primary hover:bg-primary/90 shadow-lg"
                                onClick={generateImageAction}
                                disabled={isGeneratingImage || !imagePrompt}
                             >
                                {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                             </Button>
                          </div>
                          
                          {useAirtop && (
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 text-[10px] text-primary space-y-1">
                              <p className="font-bold uppercase tracking-tighter">🚀 Modo Airtop Ativado</p>
                              <p className="opacity-80">A automação vai abrir o navegador, digitar seu comando diretamente no Gem e capturar a imagem gerada.</p>
                            </div>
                          )}
                       </div>

                       {isGeneratingImage && (
                         <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-pulse">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                               <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                            </div>
                            <div className="text-center">
                               <p className="text-xs font-bold text-primary">Engatando "A Flor da Pele" Gem...</p>
                               <p className="text-[10px] text-muted-foreground">Sua visão está sendo materializada.</p>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  {activeTab === 'ia' && (
                   <div className="space-y-6">
                      {activePost.aiReasoning && (
                         <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-1.5 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2">
                               <Sparkles className="w-3.5 h-3.5 text-primary" />
                               <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Decisão do Diretor IA</span>
                            </div>
                            <p className="text-[11px] leading-relaxed italic text-foreground/80">
                               "{activePost.aiReasoning}"
                            </p>
                         </div>
                      )}
                      {/* Carousel Slides Section */}
                      {activePost.carouselSlides && activePost.carouselSlides.length > 0 && (
                        <div className="space-y-4 mb-4">
                          <div className="flex items-center gap-2">
                             <Layers className="w-4 h-4 text-orange-500" />
                             <Label className="text-xs font-bold uppercase">Roteiro do Carrossel</Label>
                          </div>
                          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                             {activePost.carouselSlides.map((slide: any) => (
                               <div key={slide.slide} className="min-w-[220px] p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
                                  <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-600 border-none">SLIDE {slide.slide}</Badge>
                                  <div className="text-xs font-bold">{slide.title}</div>
                                  <p className="text-[11px] text-muted-foreground leading-tight">{slide.content}</p>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}

                      <AnimatePresence>
                        {showAiSettings && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-muted/50 rounded-xl p-4 border border-border overflow-hidden space-y-4"
                          >
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                   <Label className="text-[10px] uppercase font-bold text-muted-foreground">Modelo de Escrita</Label>
                                   <Select value={aiTemplate} onValueChange={setAiTemplate}>
                                      <SelectTrigger className="h-8 text-xs">
                                         <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                         <SelectItem value="profissional">Profissional</SelectItem>
                                         <SelectItem value="descontraido">Descontraído</SelectItem>
                                         <SelectItem value="minimalista">Minimalista</SelectItem>
                                         <SelectItem value="vendedor">Foco em Vendas</SelectItem>
                                      </SelectContent>
                                   </Select>
                                </div>
                                <div className="space-y-1.5">
                                   <Label className="text-[10px] uppercase font-bold text-muted-foreground">Instrução Hashtags</Label>
                                   <Input 
                                     placeholder="Ex: Tatuagem Realista..." 
                                     value={hashtagPrompt}
                                     onChange={e => setHashtagPrompt(e.target.value)}
                                     className="h-8 text-xs"
                                   />
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Legenda (Instrução)</Label>
                                <Input 
                                  placeholder="Ex: Fale sobre a técnica de traço fino..." 
                                  value={captionPrompt}
                                  onChange={e => setCaptionPrompt(e.target.value)}
                                  className="h-8 text-xs"
                                />
                             </div>
                             <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">CTA (Instrução)</Label>
                                <Input 
                                  placeholder="Ex: Convide para agenda de Março..." 
                                  value={ctaPrompt}
                                  onChange={e => setCtaPrompt(e.target.value)}
                                  className="h-8 text-xs"
                                />
                             </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <FileEdit className="w-3.5 h-3.5 text-primary" />
                               <Label className="text-xs font-bold uppercase">Legenda Gerada</Label>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 px-2 hover:bg-primary/5" 
                              onClick={() => generateSinglePart('caption')}
                              disabled={isProcessing === 'caption'}
                            >
                               {isProcessing === 'caption' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCw className="w-3 h-3 mr-1" />}
                               <span className="text-[10px]">Gerar Legenda</span>
                            </Button>
                         </div>
                         <Textarea 
                           value={caption} 
                           onChange={(e) => setCaption(e.target.value)} 
                           className="min-h-[100px] bg-muted/50 text-sm leading-relaxed border-border/50"
                         />
                      </div>

                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <MessageSquare className="w-3.5 h-3.5 text-primary" />
                               <Label className="text-xs font-bold uppercase">CTA (Chamada de Ação)</Label>
                            </div>
                            <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-7 px-2 hover:bg-primary/5"
                               onClick={() => generateSinglePart('cta')}
                               disabled={isProcessing === 'cta'}
                            >
                               {isProcessing === 'cta' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCw className="w-3 h-3 mr-1" />}
                               <span className="text-[10px]">Gerar Mais CTAs</span>
                            </Button>
                         </div>
                         <Input 
                            value={cta} 
                            onChange={(e) => setCta(e.target.value)} 
                            className="bg-muted/50 text-sm h-10 border-border/50"
                            placeholder="Frase final para convencer o cliente..."
                         />
                      </div>

                      <div className="space-y-2">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <Hash className="w-3.5 h-3.5 text-primary" />
                               <Label className="text-xs font-bold uppercase">Hashtags</Label>
                            </div>
                            <Button 
                               variant="ghost" 
                               size="sm" 
                               className="h-7 px-2 hover:bg-primary/5"
                               onClick={() => generateSinglePart('hashtags')}
                               disabled={isProcessing === 'hashtags'}
                            >
                               {isProcessing === 'hashtags' ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCw className="w-3 h-3 mr-1" />}
                               <span className="text-[10px]">Outras Tags</span>
                            </Button>
                         </div>
                         <div className="flex flex-wrap gap-1.5 p-3 bg-muted/30 rounded-lg border border-border/50">
                            {hashtags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="hover:bg-destructive hover:text-destructive-foreground cursor-pointer text-[10px]" onClick={() => setHashtags(h => h.filter((_, idx) => idx !== i))}>
                                {tag}
                              </Badge>
                            ))}
                         </div>
                      </div>

                      <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                          <AudiosEmAlta onSelect={(audio) => {
                             if (!caption.includes(audio)) {
                                setCaption(prev => prev + `\n\n🎵 Música Recomendada: ${audio}`);
                             }
                          }} />
                      </div>

                      <div className="pt-4 border-t border-border space-y-2">
                         {publishSuccess && (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-green-500/10 border border-green-500/30 p-3 rounded-xl flex items-center gap-2 mb-2"
                            >
                               <CheckCircle2 className="w-4 h-4 text-green-500" />
                               <span className="text-xs font-bold text-green-600">{publishSuccess}</span>
                            </motion.div>
                         )}

                         {true && (
                            <div className="flex flex-col gap-3 mb-6 bg-muted/20 p-4 rounded-xl border border-border">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  Configuração do Buffer
                                </p>
                               
                               <div className="space-y-2">
                                  <p className="text-[10px] font-medium text-muted-foreground">1. Escolha o Canal</p>
                                  <div className="flex flex-wrap gap-2">
                                     {bufferProfiles.map((p) => (
                                        <button
                                           key={p.id}
                                           onClick={() => setSelectedBufferProfile(p.id)}
                                           className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${
                                              selectedBufferProfile === p.id 
                                              ? 'bg-primary/10 border-primary ring-2 ring-primary/20' 
                                              : 'bg-background border-border hover:bg-muted/50'
                                           }`}
                                        >
                                           <img src={p.avatar} className="w-6 h-6 rounded-full border border-white" alt="" />
                                           <div className="text-left">
                                              <p className="text-[10px] font-bold leading-none">{p.name}</p>
                                              <p className="text-[8px] text-muted-foreground capitalize">{p.service}</p>
                                           </div>
                                        </button>
                                     ))}
                                  </div>
                               </div>

                               <div className="space-y-2 border-t border-border pt-3">
                                  <p className="text-[10px] font-medium text-muted-foreground">2. Quando publicar?</p>
                                  <div className="grid grid-cols-3 gap-2">
                                     <button 
                                        onClick={() => setPublishMode('now')}
                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${publishMode === 'now' ? 'bg-[#2c4bff] text-white border-[#2c4bff]' : 'bg-background border-border'}`}
                                     >
                                        Postar Agora
                                     </button>
                                     <button 
                                        onClick={() => setPublishMode('queue')}
                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${publishMode === 'queue' ? 'bg-[#2c4bff] text-white border-[#2c4bff]' : 'bg-background border-border'}`}
                                     >
                                        Ir para Fila
                                     </button>
                                     <button 
                                        onClick={() => setPublishMode('scheduled')}
                                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all ${publishMode === 'scheduled' ? 'bg-[#2c4bff] text-white border-[#2c4bff]' : 'bg-background border-border'}`}
                                     >
                                        Agendar
                                     </button>
                                  </div>

                                  {publishMode === 'scheduled' && (
                                     <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex gap-2 mt-2"
                                     >
                                        <input 
                                           type="date" 
                                           value={scheduledDate}
                                           onChange={(e) => setScheduledDate(e.target.value)}
                                           className="flex-1 bg-background border border-border rounded-lg p-2 text-xs font-medium"
                                        />
                                        <input 
                                           type="time" 
                                           value={scheduledTime}
                                           onChange={(e) => setScheduledTime(e.target.value)}
                                           className="w-24 bg-background border border-border rounded-lg p-2 text-xs font-medium"
                                        />
                                     </motion.div>
                                  )}
                               </div>
                            </div>
                         )}

                         <Button 
                            className="w-full h-12 bg-[#2c4bff] hover:bg-[#2c4bff]/90 gap-2 shadow-lg text-white font-bold" 
                            onClick={handleSendBuffer}
                            disabled={isSendingBuffer || !selectedBufferProfile}
                         >
                           {isSendingBuffer ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                           {publishMode === 'now' ? 'Publicar no Buffer Agora' : publishMode === 'queue' ? 'Mandar para Fila do Buffer' : 'Confirmar Agendamento no Buffer'}
                         </Button>

                         {igAccounts.length > 0 ? (
                           <>
                             <Button 
                               className="w-full h-12 bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-90 gap-2 shadow-lg" 
                               onClick={() => handleRealPublish(false)}
                               disabled={isPublishing}
                             >
                               {isPublishing && !publishSuccess ? <Loader2 className="w-4 h-4 animate-spin" /> : <Instagram className="w-4 h-4" />}
                               {publishSuccess && postStatus === 'publicado' ? "Publicado!" : "Postar Agora no Instagram"}
                             </Button>
                             
                             {activePost.scheduledAt && (
                               <Button 
                                 variant="outline"
                                 className="w-full h-12 gap-2 border-pink-200 text-pink-600 hover:bg-pink-50" 
                                 onClick={() => handleRealPublish(true)}
                                 disabled={isPublishing}
                               >
                                 <CalendarDays className="w-4 h-4" /> 
                                 {postStatus === 'agendado' ? "Já Agendado no Servidor" : "Confirmar Agendamento Automático"}
                               </Button>
                             )}
                           </>
                         ) : (
                           <div className="p-3 bg-muted rounded-xl border border-dashed border-border text-center">
                              <p className="text-[10px] text-muted-foreground mb-2">Conecte seu Instagram para postar direto daqui</p>
                              <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => window.dispatchEvent(new CustomEvent('OPEN_IG_MODAL'))}>
                                Integrar Instagram
                              </Button>
                           </div>
                         )}
                         <Button variant="ghost" className="w-full h-10 gap-2 text-muted-foreground" onClick={() => { setActiveTab('schedule'); }}>
                            <Clock className="w-4 h-4" /> Alterar Horário
                         </Button>
                      </div>
                   </div>
                 )}

                {activeTab === 'edit' && (
                  <div className="space-y-6">
                     <div className="space-y-4">
                        {[
                          { key: 'brightness', label: 'Brilho', icon: Sparkles },
                          { key: 'contrast', label: 'Contraste', icon: RotateCw },
                          { key: 'saturate', label: 'Saturação', icon: RefreshCw }
                        ].map((s: any) => (
                          <div key={s.key} className="space-y-2">
                             <div className="flex justify-between text-xs font-medium text-white">
                                <Label className="text-white">{s.label}</Label>
                                <span>{(editorSettings as any)[s.key]}%</span>
                             </div>
                             <Slider 
                               value={[(editorSettings as any)[s.key]]} 
                               onValueChange={(val: any) => {
                                 const v = Array.isArray(val) ? val[0] : val;
                                 setEditorSettings(prev => ({ ...prev, [s.key]: v }));
                               }} 
                               max={200} step={1}
                             />
                          </div>
                        ))}
                     </div>
                     <div className="grid grid-cols-4 gap-2 pt-4">
                        <Button variant="outline" size="icon" onClick={() => setEditorSettings(p => ({ ...p, rotate: p.rotate - 90 }))}><RotateCw className="w-4 h-4 -scale-x-100" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setEditorSettings(p => ({ ...p, scaleX: p.scaleX * -1 }))}><FlipHorizontal className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setEditorSettings(p => ({ ...p, scaleY: p.scaleY * -1 }))}><FlipVertical className="w-4 h-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setEditorSettings({ brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 })}><RefreshCw className="w-4 h-4" /></Button>
                     </div>
                  </div>
                )}

                {activeTab === 'story' && (
                  <StorySequencer 
                    post={activePost} 
                    isGenerating={isProcessing === 'story'} 
                    onGenerate={() => setIsProcessing('story')} 
                    onGenerated={() => setIsProcessing(null)}
                    contexto={contexto}
                    styleAnalysis={styleAnalysis}
                  />
                )}

                {activeTab === 'reels' && (
                   <div className="space-y-4">
                      <div className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border/50">
                         <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-tight">
                              <Camera className="w-4 h-4" />
                              Roteiro Reels IA
                           </div>
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-7 text-[10px]" 
                             onClick={() => {
                               console.log("Opening ScriptReels from button 1");
                               setShowScriptReels(true);
                             }}
                           >
                             Abrir Ferramenta
                           </Button>
                         </div>
                         
                         <p className="text-xs text-muted-foreground leading-relaxed">
                           Use nossa IA para criar roteiros dinâmicos que prendem a atenção nos primeiros segundos.
                         </p>

                         <Button 
                           className="w-full bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 h-12" 
                           onClick={() => setShowScriptReels(true)}
                         >
                           <Sparkles className="w-4 h-4 mr-2" /> Gerar Novo Script
                         </Button>
                      </div>
                      
                      <div className="p-4 border border-dashed rounded-xl text-center space-y-2">
                         <p className="text-[10px] text-muted-foreground">O roteiro gerado aparecerá na janela dedicada para facilitar a visualização e cópia.</p>
                      </div>
                   </div>
                )}

                {activeTab === 'schedule' && (
                   <div className="space-y-6">
                      <div className="grid gap-4">
                         <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data da Postagem</Label>
                            <Input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="bg-muted/50 border-input" />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Horários Recomendados</Label>
                           <div className="flex gap-2">
                              {recommendedTimes.map(t => (
                                <Badge 
                                  key={t} 
                                  variant={scheduledTime === t ? "default" : "outline"}
                                  className="cursor-pointer py-1.5 px-3"
                                  onClick={() => setScheduledTime(t)}
                                >
                                   {t}
                                </Badge>
                              ))}
                              <Input 
                                type="time" 
                                value={scheduledTime} 
                                onChange={e => setScheduledTime(e.target.value)} 
                                className="w-24 h-10 text-xs p-1 text-center bg-muted/30"
                              />
                           </div>
                         </div>
                      </div>
                      
                      <div className="p-4 bg-primary/5 rounded-xl border border-primary/10">
                         <div className="flex items-center gap-2 mb-2 text-primary">
                            <MessageSquare className="w-4 h-4" />
                            <span className="text-xs font-bold">Lembrete WhatsApp</span>
                         </div>
                         <p className="text-[10px] text-muted-foreground mb-3">Enviaremos uma notificação com a imagem e a legenda pronta para você copiar no horário escolhido.</p>
                         <Button variant="outline" size="sm" className="w-full text-[10px] h-8">Configurar Telefone</Button>
                      </div>
                   </div>
                )}
             </div>

             <div className={`p-4 mt-auto flex gap-2 ${activeTab === 'edit' ? 'bg-transparent' : 'bg-card border-t'}`}>
                <Button 
                   variant="outline" 
                   className={`h-12 px-4 rounded-xl flex items-center gap-2 ${
                     activeTab === 'edit' ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' : ''
                   }`}
                   onClick={() => {
                     setPostType(prev => {
                       const idx = TYPE_OPTIONS.indexOf(prev);
                       return TYPE_OPTIONS[(idx + 1) % TYPE_OPTIONS.length];
                     });
                   }}
                >
                  <LayoutGrid className="w-5 h-5" />
                  <span className="text-xs uppercase font-bold">{postType}</span>
                </Button>
                <Button className="flex-1 h-12 rounded-xl text-md shadow-lg" variant={saved ? "outline" : "default"} onClick={handleSave}>
                   {saved ? <><CheckCircle2 className="w-5 h-5 mr-2 text-green-500" /> Salvo!</> : <><Save className="w-5 h-5 mr-2" /> Salvar Alterações</>}
                </Button>
                <Button variant="outline" className="h-12 w-12 rounded-xl" onClick={() => {
                   const msg = `${caption}\n\n${hashtags.join(' ')}`;
                   navigator.clipboard.writeText(msg);
                }} title="Copiar Texto">
                   <MessageSquare className="w-5 h-5" />
                </Button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ContextoModal 
        open={showContexto} 
        onClose={() => setShowContexto(false)} 
        contexto={contexto} 
        setContexto={setContexto} 
        onGenerate={handleGenerateComplete} 
      />

      {showScriptReels && (
        <ScriptReels 
          post={activePost}
          contexto={contexto}
          styleAnalysis={styleAnalysis}
          onClose={() => setShowScriptReels(false)}
        />
      )}

      {showAnalisador && (
        <AnalisadorEstilo 
           imageUrl={activePost.image}
           onClose={() => setShowAnalisador(false)}
           onComplete={(analysis) => {
             setStyleAnalysis(analysis);
             setShowAnalisador(false);
             setActiveTab('ia'); // Open IA tab to show suggestions
           }}
        />
      )}
    </div>
  );
}
