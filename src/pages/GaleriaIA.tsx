import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, Sparkles, ChevronLeft, ChevronRight, BarChart2, CalendarDays, 
  Plus, MoreVertical, LayoutGrid, Clock, CheckCircle2, X, Settings2, AlertCircle,
  Trash2, Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, 
  getDay, isToday, addDays 
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { base44 } from "@/api/base44Client";

// Auxiliary Components
import CalendarioAgendamentos from "@/components/galeria/CalendarioAgendamentos";
import NotificacoesAgendamento, { NotificacoesBell } from "@/components/galeria/NotificacoesAgendamento";
import InstagramIntegracaoModal, { InstagramStatusBadge } from "@/components/integracoes/InstagramIntegracaoModal";
import PostEditor from "@/components/galeria/PostEditor";
import SugerirEspacos from "@/components/galeria/SugerirEspacos";
import PlanoSemanal from "@/components/galeria/PlanoSemanal";
import ConfigWhatsApp from "@/components/galeria/ConfigWhatsApp";
import EstudioIAWorkflow from "@/components/galeria/EstudioIAWorkflow";
import InstagramInsights from "@/components/galeria/InstagramInsights";
import { BufferStatus } from "@/components/galeria/BufferStatus";
import NicheConfig from "@/components/galeria/NicheConfig";

const STATUS_OPTIONS_LOCAL = [
  { value: "rascunho", label: "Rascunho", color: "bg-yellow-500" },
  { value: "pronto", label: "Pronto", color: "bg-blue-500" },
  { value: "agendado", label: "Agendado", color: "bg-indigo-600 animate-pulse" },
  { value: "publicado", label: "Publicado", color: "bg-green-500" },
];

export default function GaleriaIA() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorState, setEditorState] = useState<any>(null);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('calendario');
  const [dismissedNotifs, setDismissedNotifs] = useState<(number | string)[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showIgModal, setShowIgModal] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [hasPublishPerm, setHasPublishPerm] = useState(false);
  const [showSugerirEspacos, setShowSugerirEspacos] = useState(false);
  const [showPlanoSemanal, setShowPlanoSemanal] = useState(false);
  const [showConfigWhatsapp, setShowConfigWhatsapp] = useState(false);
  const [showEstudioIA, setShowEstudioIA] = useState(false);
  const [showNicheConfig, setShowNicheConfig] = useState(false);
  const [quotaWarning, setQuotaWarning] = useState(false);
  const [profileInfo, setProfileInfo] = useState<any>(null);
  const [modalInitialTab, setModalInitialTab] = useState("instagram");
  const [bufferPosts, setBufferPosts] = useState<any[]>([]);
  const [loadingBuffer, setLoadingBuffer] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);

  const fetchBufferQueue = async () => {
    // We need to find the connected buffer profile first
    try {
      setLoadingBuffer(true);
      const profilesResp = await fetch("/api/buffer/profiles");
      const profilesData = await profilesResp.json();
      const profiles = profilesData.data?.profiles || [];
      
      if (profiles.length > 0) {
        // Fetch queue for each profile (or just the first one for now)
        const postsPromises = profiles.map((p: any) => 
          fetch(`/api/buffer/posts/${p.id}`).then(res => res.json())
        );
        const results = await Promise.all(postsPromises);
        const allBufferPosts = results.flatMap(r => r.data?.node?.posts?.nodes || []);
        setBufferPosts(allBufferPosts.sort((a, b) => {
          const dateA = new Date(a.scheduledAt || a.dueAt || 0).getTime();
          const dateB = new Date(b.scheduledAt || b.dueAt || 0).getTime();
          return dateA - dateB;
        }));
      }
    } catch (err) {
      console.error("Failed to fetch Buffer queue", err);
    } finally {
      setLoadingBuffer(false);
    }
  };

  // Poll for connection status
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const resp = await fetch("/api/instagram/me");
        if (resp.ok) {
          const data = await resp.json();
          if (data.accounts?.length > 0) {
            setIgConnected(true);
            setProfileInfo(data.accounts[0]);
            setHasPublishPerm(data.hasPublishPerm);
          } else {
            setIgConnected(false);
            setProfileInfo(null);
            setHasPublishPerm(false);
          }
        } else {
          setIgConnected(false);
          setProfileInfo(null);
          setHasPublishPerm(false);
        }
      } catch (e) {
        setIgConnected(false);
        setProfileInfo(null);
        setHasPublishPerm(false);
      }
    };
    checkConnection();

    const handleOpenModal = (e: any) => {
      setModalInitialTab(e.detail?.tab || "instagram");
      setShowIgModal(true);
    };
    window.addEventListener('OPEN_IG_MODAL', handleOpenModal as any);
    
    // Listen for success messages from OAuth window
    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkConnection();
      }
    };
    window.addEventListener('message', handleAuthSuccess);

    return () => {
      window.removeEventListener('OPEN_IG_MODAL', handleOpenModal);
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  const syncWithServerScheduler = async (currentPosts: any[]) => {
    try {
      const resp = await fetch("/api/instagram/scheduled-status");
      if (!resp.ok) return;
      const data = await resp.json();
      const serverPosts = data.posts || [];
      if (serverPosts.length === 0) return;

      let changed = false;
      const updated = currentPosts.map(p => {
        const match = serverPosts.find((s: any) => s.imageUrl === p.image);
        if (match) {
          const expectedStatus = match.published ? 'publicado' : 'agendado';
          if (p.status !== expectedStatus) {
            changed = true;
            return {
              ...p,
              status: expectedStatus,
              scheduledAt: match.scheduledAt || p.scheduledAt
            };
          }
        }
        return p;
      });

      if (changed) {
        savePosts(updated);
      }
    } catch (err) {
      console.warn("[SyncWithServer] Could not sync scheduled status with server:", err);
    }
  };

  // Load posts
  useEffect(() => {
    let loadedPosts: any[] = [];
    try {
      const saved = localStorage.getItem('galeria_posts_v3');
      if (saved) {
        loadedPosts = JSON.parse(saved).map((p: any) => ({
          ...p,
          date: new Date(p.date),
          status: p.status || 'rascunho',
        }));
        setPosts(loadedPosts);
      }
    } catch {
      setPosts([]);
    }
    fetchBufferQueue();
    if (loadedPosts.length > 0) {
      syncWithServerScheduler(loadedPosts);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'agendamentos') {
      fetchBufferQueue();
    }
  }, [activeTab]);

  const savePosts = (newPosts: any[]) => {
    setPosts(newPosts);
    // Deep clone to avoid image data URL bloating if needed, but for preview we want images
    const postsToSave = newPosts.map(p => ({
      ...p,
      date: p.date instanceof Date ? p.date.toISOString() : p.date
    }));
    try {
      localStorage.setItem('galeria_posts_v3', JSON.stringify(postsToSave));
      setQuotaWarning(false);
    } catch (e) {
      console.warn("Storage quota full, might not persist everything.");
      setQuotaWarning(true);
    }
  };

  const handleClearGallery = () => {
    if (confirm("Deseja limpar todos os rascunhos da galeria? Isso libera espaço na memória do navegador.")) {
      setPosts([]);
      localStorage.removeItem('galeria_posts_v3');
      setQuotaWarning(false);
    }
  };

  const schedulePostIntegrations = async (post: any) => {
    try {
      // 1. Tenta agendar no Buffer primeiro se houver canais ativos
      const profilesResp = await fetch("/api/buffer/profiles");
      if (profilesResp.ok) {
        const profilesData = await profilesResp.json();
        const profiles = profilesData.data?.profiles || [];
        if (profiles.length > 0) {
          const selectedProfile = profiles[0]; // Usa o primeiro canal configurado por padrão
          
          const text = `${post.caption || ''}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`;
          const scheduledIso = post.scheduledTime || post.date;
          
          const response = await fetch("/api/buffer/create-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: selectedProfile.id,
              service: selectedProfile.service,
              imageUrl: post.image,
              text: text,
              scheduledAt: scheduledIso,
              publishMode: 'scheduled'
            })
          });

          if (response.ok) {
            console.log(`[AutoSchedule] Post agendado com sucesso no Buffer para ${selectedProfile.name}`);
            return {
              ...post,
              status: 'agendado',
              scheduledAt: scheduledIso,
              scheduledTime: scheduledIso
            };
          }
        }
      }

      // 2. Senão, se o Instagram direto estiver conectado, agenda na fila direta do servidor
      if (igConnected && profileInfo?.igId) {
        const text = `${post.caption || ''}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`;
        const scheduledIso = post.scheduledTime || post.date;
        
        const response = await fetch("/api/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            igId: profileInfo.igId,
            imageUrl: post.image,
            caption: text,
            scheduledAt: scheduledIso
          })
        });

        if (response.ok) {
          console.log(`[AutoSchedule] Post agendado com sucesso no servidor do Instagram`);
          return {
            ...post,
            status: 'agendado',
            scheduledAt: scheduledIso,
            scheduledTime: scheduledIso
          };
        }
      }
    } catch (err) {
      console.error("[AutoSchedule] Erro ao tentar agendar posts automaticamente:", err);
    }
    return post;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsPlanning(true);
    try {
      const now = new Date();

      // 1. Upload All Files first
      const uploadedImages = await Promise.all(files.map(async (file) => {
        const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
        return file_url;
      }));

      // 2. Fetch Fresh Insights for the AI
      let insightsData = null;
      try {
        const resp = await fetch(`/api/instagram/insights?igId=${profileInfo?.igId}`);
        if (resp.ok) insightsData = await resp.json();
      } catch (e) {
        console.warn("Could not fetch insights for strategy, using defaults.");
      }

      // 3. Call AI Strategy Orchestrator
      const strategyResp = await fetch("/api/studio/plan-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: uploadedImages,
          insights: insightsData,
          profileInfo: profileInfo
        })
      });

      let aiStrategy = [];
      if (strategyResp.ok) {
        try {
          aiStrategy = await strategyResp.json();
        } catch (jsonErr) {
          console.error("Failed to parse JSON response from plan-strategy API:", jsonErr);
          throw new Error("A resposta do servidor de IA não está em formato JSON válido.");
        }
      } else {
        const errText = await strategyResp.text();
        console.error("API Error Response Status:", strategyResp.status, errText);
        let parsedErr;
        try { parsedErr = JSON.parse(errText); } catch (e) {}
        throw new Error(parsedErr?.details || parsedErr?.error || `Erro de rede (Status ${strategyResp.status})`);
      }
      
      let currentPosts = [...posts];
      
      // 4. Map AI results to Post structures
      const newItems = uploadedImages.map((url, i) => {
        const plan = aiStrategy[i] || { 
          type: 'feed', 
          date: addDays(new Date(), i + 1).toISOString(),
          caption: "✨ Trabalho finalizado no estúdio @aflor da pele!\n\n#tattoo #tatuagem #ink",
          hashtags: ["#tattoo", "#art"]
        };

        return {
          id: Date.now() + i + Math.random(),
          date: new Date(plan.date),
          image: url,
          type: plan.type,
          status: 'rascunho',
          caption: plan.caption,
          hashtags: plan.hashtags,
          cta: 'Agende seu horário pelo link no perfil! 👆',
          scheduledTime: plan.date,
          editorSettings: { brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 },
          aiReasoning: plan.reasoning
        };
      });

      // Auto-schedule each post based on active integration channels
      const scheduledItems = await Promise.all(newItems.map(item => schedulePostIntegrations(item)));

      savePosts([...currentPosts, ...scheduledItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error: any) {
      console.error("Critical error in AI planning:", error);
      alert(error?.message || "Ocorreu um erro ao planejar sua estratégia. Verifique sua conexão.");
    } finally {
      setIsPlanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleUpdatePost = (updated: any) => savePosts(posts.map(p => p.id === updated.id ? updated : p));
  const handleDeletePost = (id: number) => {
    if (confirm('Apagar este post?')) {
      savePosts(posts.filter(p => p.id !== id));
      setEditorState(null);
    }
  };

  const handleDragStart = (e: React.DragEvent, postId: number) => {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    if (draggedPostId === null) return;
    savePosts(posts.map(p => p.id === draggedPostId ? { ...p, date: targetDay, scheduledDate: format(targetDay, 'yyyy-MM-dd') } : p));
    setDraggedPostId(null);
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDay = (getDay(monthStart) === 0) ? 6 : getDay(monthStart) - 1;

  const postsByDay = posts.reduce((acc: any, post) => {
    const day = format(new Date(post.date), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(post);
    return acc;
  }, {});

  const getPostTimeFormatted = (post: any) => {
    if (!post) return "";
    const timeRef = post.scheduledTime || post.scheduledAt || post.date;
    if (!timeRef) return "";
    const dObj = timeRef instanceof Date ? timeRef : new Date(timeRef);
    if (isNaN(dObj.getTime())) {
      if (typeof timeRef === 'string' && timeRef.includes('T')) {
        const parts = timeRef.split('T');
        if (parts[1]) return parts[1].substring(0, 5);
      }
      return "";
    }
    const pad = (num: number) => num.toString().padStart(2, '0');
    return `${pad(dObj.getHours())}:${pad(dObj.getMinutes())}`;
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent italic">Galeria IA</h1>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1">Estúdio Criativo de Tatuagem</p>
        </div>
        <div className="flex items-center gap-3">
          <InstagramStatusBadge 
            connected={igConnected} 
            profile={profileInfo} 
            hasPublishPerm={hasPublishPerm}
            onClick={() => {
              setModalInitialTab("instagram");
              setShowIgModal(true);
            }} 
          />
          <Badge 
            variant="outline" 
            className="hidden md:flex cursor-pointer gap-1.5 py-1 px-1.5 pr-3 text-[10px] font-bold border-primary/20 hover:bg-primary/5 bg-card"
            onClick={() => {
              setModalInitialTab("airtop");
              setShowIgModal(true);
            }}
          >
             <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
             </div>
             <span>Airtop Gemini</span>
          </Badge>
          <NotificacoesBell 
            posts={posts.filter(p => !dismissedNotifs.includes(p.id))} 
            bufferPosts={bufferPosts.filter(p => !dismissedNotifs.includes(p.id))}
            onClick={() => setShowNotifs(v => !v)} 
          />
          {quotaWarning && (
            <Button variant="ghost" size="icon" className="rounded-full text-destructive animate-bounce" onClick={handleClearGallery} title="Memória Cheia! Clique para limpar.">
               <AlertCircle className="w-5 h-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowConfigWhatsapp(true)}>
             <Settings2 className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="hidden md:block">
            <BufferStatus />
          </div>
          <Button 
            size="sm" 
            className={`rounded-full px-4 ${isPlanning ? 'bg-primary/50 cursor-not-allowed' : ''}`} 
            onClick={() => !isPlanning && fileInputRef.current?.click()}
            disabled={isPlanning}
          >
            {isPlanning ? (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                <span>O Cérebro planeja...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>Carregar</span>
              </div>
            )}
          </Button>
        </div>
        <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        <AnimatePresence>
          {showNotifs && (
            <motion.div 
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="fixed top-20 right-6 z-[100] w-full max-w-sm"
            >
              <Card className="shadow-2xl border-primary/20 overflow-hidden">
                <div className="bg-primary/5 p-3 border-b flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-tighter">Alertas de Agendamento</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowNotifs(false)}><X className="w-3 h-3" /></Button>
                </div>
                <CardContent className="p-4 max-h-[400px] overflow-y-auto">
                  <NotificacoesAgendamento
                    posts={posts.filter(p => !dismissedNotifs.includes(p.id))}
                    bufferPosts={bufferPosts.filter(p => !dismissedNotifs.includes(p.id))}
                    onPostClick={(p: any) => {
                      const dayStr = format(new Date(p.date), 'yyyy-MM-dd');
                      const dayPosts = posts.filter(pp => format(new Date(pp.date), 'yyyy-MM-dd') === dayStr);
                      setEditorState({ posts: dayPosts.length ? dayPosts : [p], index: dayPosts.findIndex(pp => pp.id === p.id) || 0 });
                      setShowNotifs(false);
                    }}
                    onDismiss={(id: string | number, source: 'local' | 'buffer') => {
                      setDismissedNotifs(prev => [...prev, id]);
                      if (source === 'buffer') {
                        setBufferPosts(prev => prev.filter(p => p.id !== id));
                      }
                    }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full max-w-sm grid grid-cols-3 mx-auto bg-muted/40 p-1 rounded-full border border-border/50">
            <TabsTrigger value="calendario" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Galeria</TabsTrigger>
            <TabsTrigger value="agendamentos" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Agenda</TabsTrigger>
            <TabsTrigger value="insights" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario" className="mt-0">
            <div className="grid gap-6 md:grid-cols-[1fr,300px]">
              <Card className="border-none shadow-none bg-transparent">
                <CardContent className="p-0 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2 rounded-2xl border border-border/40">
                    <div className="flex items-center gap-3">
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-4 h-4" /></Button>
                       <h2 className="text-sm font-bold capitalize w-32 text-center">{format(currentDate, 'MMMM yyyy', { locale: ptBR })}</h2>
                       <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="h-8 text-[10px] font-bold text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5"
                         onClick={handleClearGallery}
                       >
                         <Trash2 className="w-3.5 h-3.5" /> LIMPAR GALERIA
                       </Button>
                       <Button 
                         size="sm" 
                         className="h-8 text-[10px] font-bold bg-primary text-white gap-1.5 shadow-md shadow-primary/20"
                         onClick={() => setShowEstudioIA(true)}
                       >
                         <Sparkles className="w-3.5 h-3.5" /> ESTÚDIO IA
                       </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 md:gap-3">
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => (
                      <div key={d} className="text-[10px] font-bold text-center uppercase text-muted-foreground py-2">{d}</div>
                    ))}
                    {Array.from({ length: startingDay }).map((_, i) => (
                      <div key={`e-${i}`} className="aspect-square rounded-2xl bg-muted/10 border border-border/10 border-dashed" />
                    ))}
                    {daysInMonth.map(day => {
                      const dayStr = format(day, 'yyyy-MM-dd');
                      const dayPosts = postsByDay[dayStr] || [];
                      const today = isToday(day);

                      return (
                        <div
                          key={dayStr}
                          className={`aspect-square relative rounded-2xl flex flex-col p-2 transition-all group border-2
                            ${today ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)]' : 'bg-card border-border/40'}
                            ${draggedPostId !== null ? 'hover:scale-105 hover:border-primary hover:shadow-xl' : ''}
                            ${dayPosts.length > 0 ? 'ring-offset-2 ring-primary/20' : ''}
                          `}
                          onClick={() => { if (dayPosts.length > 0) setEditorState({ posts: dayPosts, index: 0 }); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDrop(e, day)}
                        >
                          <span className={`text-[10px] font-bold ${today ? 'text-primary' : 'text-muted-foreground'}`}>{format(day, 'd')}</span>
                          
                          {dayPosts.length > 0 && (
                            <div 
                              draggable 
                              onDragStart={(e) => handleDragStart(e, dayPosts[0].id)}
                              className="mt-auto relative w-full h-[65%] rounded-xl overflow-hidden shadow-sm ring-1 ring-white/20 group/img cursor-pointer"
                            >
                              <img src={dayPosts[0].image} alt="" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-150" />
                              <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${STATUS_OPTIONS_LOCAL.find(s => s.value === dayPosts[0].status)?.color || 'bg-gray-400'}`} />
                              {dayPosts.length > 1 && (
                                <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1 rounded-sm">
                                  +{dayPosts.length - 1}
                                </div>
                              )}
                              {/* Visual overlay with scheduled hour and post type */}
                              {getPostTimeFormatted(dayPosts[0]) && (
                                <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-[1px] text-white py-0.5 px-1 flex items-center justify-between text-[8px] font-bold">
                                  <span className="flex items-center gap-0.5 text-amber-300">
                                    <Clock className="w-2 h-2 text-amber-300" />
                                    {getPostTimeFormatted(dayPosts[0])}
                                  </span>
                                  <span className="capitalize text-[7px] text-gray-300 truncate max-w-[30px]">
                                    {dayPosts[0].type}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {dayPosts.length === 0 && (
                            <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <Plus className="w-4 h-4 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Sidebar Helpers */}
              <div className="space-y-6">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button 
                    variant="outline"
                    className="w-full h-14 bg-card shadow-sm gap-2 text-xs font-bold border-primary/20 hover:border-primary/50"
                    onClick={() => setShowPlanoSemanal(true)}
                  >
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Planejamento Semanal
                  </Button>
                </motion.div>

                {profileInfo && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      variant="outline"
                      className="w-full h-14 bg-card shadow-sm gap-2 text-xs font-bold border-primary/20 hover:border-primary/50"
                      onClick={() => setShowNicheConfig(true)}
                    >
                      <Target className="w-5 h-5 text-primary animate-pulse" />
                      Estratégia de Nicho
                    </Button>
                  </motion.div>
                )}

                <SugerirEspacos 
                   posts={posts} 
                   onSelect={(s: any) => {
                      setCurrentDate(s.date);
                      // In a real app we'd open a creator modal here
                   }} 
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="agendamentos">
            <div className="max-w-2xl mx-auto">
               <CalendarioAgendamentos 
                 posts={posts} 
                 bufferPosts={bufferPosts}
                 loadingBuffer={loadingBuffer}
                 onPostClick={(p: any) => {
                    const dayPosts = posts.filter(pp => format(new Date(pp.date), 'yyyy-MM-dd') === format(new Date(p.date), 'yyyy-MM-dd'));
                    setEditorState({ posts: dayPosts.length ? dayPosts : [p], index: dayPosts.findIndex(pp => pp.id === p.id) || 0 });
                 }} 
               />
            </div>
          </TabsContent>

          <TabsContent value="insights">
            {activeTab === "insights" && <InstagramInsights igId={profileInfo?.igId} />}
          </TabsContent>
        </Tabs>
      </main>

      {/* Floating Action Button for Mobile */}
      <Button 
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl md:hidden z-30" 
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="w-6 h-6" />
      </Button>

      <InstagramIntegracaoModal 
        open={showIgModal} 
        initialTab={modalInitialTab}
        onClose={() => {
          setShowIgModal(false);
          setIgConnected(!!localStorage.getItem('instagram_access_token'));
        }} 
      />

      {editorState && (
        <PostEditor
          posts={editorState.posts}
          initialIndex={editorState.index}
          onClose={() => setEditorState(null)}
          onDeletePost={handleDeletePost}
          onUpdatePost={handleUpdatePost}
          allPosts={posts}
          onBufferUpdate={fetchBufferQueue}
        />
      )}

      {showPlanoSemanal && (
        <PlanoSemanal 
          posts={posts} 
          onClose={() => setShowPlanoSemanal(false)} 
        />
      )}

      {showConfigWhatsapp && (
        <ConfigWhatsApp onClose={() => setShowConfigWhatsapp(false)} />
      )}

      {showEstudioIA && (
        <EstudioIAWorkflow 
          open={showEstudioIA}
          onClose={() => setShowEstudioIA(false)}
          igId={profileInfo?.igId}
          profileInfo={profileInfo}
          existingPosts={posts}
          onPostCreated={async (newPost) => {
            const scheduledPost = await schedulePostIntegrations(newPost);
            setPosts(prev => {
              const updated = [...prev, scheduledPost];
              const postsToSave = updated.map(p => ({
                ...p,
                date: p.date instanceof Date ? p.date.toISOString() : p.date
              }));
              localStorage.setItem('galeria_posts_v3', JSON.stringify(postsToSave));
              return updated;
            });
            fetchBufferQueue();
          }}
        />
      )}

      {showNicheConfig && profileInfo && (
        <NicheConfig 
          igUsername={profileInfo.username} 
          igId={profileInfo.igId} 
          onClose={() => setShowNicheConfig(false)} 
        />
      )}
    </div>
  );
}
