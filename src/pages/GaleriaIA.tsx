import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
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
import { postService } from "@/services/postService";
import { ensureAnonymousAuth } from "@/lib/auth";
import { postRepository } from "@/repositories/postRepository";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc, setDoc } from "firebase/firestore";

import { SkeletonEditor, SkeletonList } from "@/components/ui/Skeletons";

// Auxiliary Components
const PostEditor = lazy(() => import("@/components/galeria/PostEditor"));
const PostList = lazy(() => import("@/components/galeria/PostList").then(module => ({ default: module.PostList })));
const CalendarView = lazy(() => import("@/components/galeria/CalendarView").then(module => ({ default: module.CalendarView })));
import CalendarioAgendamentos from "@/components/galeria/CalendarioAgendamentos";
import NotificacoesAgendamento, { NotificacoesBell } from "@/components/galeria/NotificacoesAgendamento";
import InstagramIntegracaoModal, { InstagramStatusBadge } from "@/components/integracoes/InstagramIntegracaoModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { Sidebar } from "@/components/layout/Sidebar";
import { Notifications } from "@/components/layout/Notifications";
import { usePosts } from "@/hooks/usePosts";
import { useNotifications } from "@/hooks/useNotifications";
import { useInstagram } from "@/hooks/useInstagram";
import { usePostEditor } from "@/hooks/usePostEditor";
import { useSyncStatus } from "@/hooks/useSyncStatus";
import SugerirEspacos from "@/components/galeria/SugerirEspacos";
import PlanoSemanal from "@/components/galeria/PlanoSemanal";
import PlanejamentoTrimestral from "@/components/galeria/PlanejamentoTrimestral";
import ConfigWhatsApp from "@/components/galeria/ConfigWhatsApp";
import EstudioIAWorkflow from "@/components/galeria/EstudioIAWorkflow";
import InstagramInsights from "@/components/galeria/InstagramInsights";
import NicheConfig from "@/components/galeria/NicheConfig";

const STATUS_OPTIONS_LOCAL = [
  { value: "rascunho", label: "Rascunho", color: "bg-yellow-500" },
  { value: "pronto", label: "Pronto", color: "bg-blue-500" },
  { value: "agendado", label: "Agendado", color: "bg-indigo-600 animate-pulse" },
  { value: "publicado", label: "Publicado", color: "bg-green-500" },
];

export default function GaleriaIA() {
  console.log("GaleriaIA component is being initialized");
  const { user, isAuthenticated } = useAuth();
  
  const { 
    igConnected, setIgConnected, 
    hasPublishPerm, setHasPublishPerm, 
    profileInfo, setProfileInfo, 
    showIgModal, setShowIgModal, 
    modalInitialTab, setModalInitialTab 
  } = useInstagram();

  // --- Estados: Posts ---
  const { posts, setPosts, savePosts } = usePosts();
  const [bufferPosts, setBufferPosts] = useState<any[]>([]);
  
  // --- Estados: UI / Modais ---
    const [activeTab, setActiveTab] = useState('calendario');
    const { showNotifs, setShowNotifs, dismissedNotifs, setDismissedNotifs } = useNotifications();
    const [showPlanoSemanal, setShowPlanoSemanal] = useState(false);
    const [showConfigWhatsapp, setShowConfigWhatsapp] = useState(false);
    const [showEstudioIA, setShowEstudioIA] = useState(false);
    const [showNicheConfig, setShowNicheConfig] = useState(false);
    const [showSlotManager, setShowSlotManager] = useState(false);
  
  // --- Estados: Editor / Calendário ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const { editorState, setEditorState, draggedPostId, setDraggedPostId } = usePostEditor();
  
  // --- Estados: Carregamento / Sincronização ---
  const { loadingBuffer, setLoadingBuffer, isPlanning, setIsPlanning } = useSyncStatus();

  interface Music {
    N: number;
    note: string;
    velocity: number;
    duration: number;
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

    // --- SLOTS MANAGEMENT HOOKS ---
    const [slotsConfig, setSlotsConfig] = useState(null);
    const [manualSlots, setManualSlots] = useState({
      enabled: false,
      slots: [],
      manualTimes: []
    });

    const saveManualSlots = async (config: any) => {
      if (!user) throw new Error("Erro de autenticação.");
      const response = await fetch("/api/slots/manual-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, ...config })
      });
      if (response.ok) {
        setManualSlots(config);
        return config;
      }
      throw new Error("Falha ao salvar slots manuais");
    };

    const getIgToken = async () => {
      const response = await fetch("/api/instagram/me");
      if (response.ok) {
        const data = await response.json();
        return data.token || data.access_token || "default-token";
      }
      throw new Error("Failed to get Instagram token");
    };

    const loadSlotsAI = async () => {
          if (!profileInfo?.igId) return null;
          try {
            const token = await getIgToken();
            const response = await fetch(`/api/slots/analysis?igId=${profileInfo.igId}`, {
              headers: { "x-access-token": token }
            });
            if (response.ok) {
              return await response.json();
            }
          } catch (error) {
            console.warn("Análise de slots AI falhou:", error);
          }
          return null;
        };

  const saveSlots = async (slots: any[]) => {
    if (!user) throw new Error("Erro de autenticação.");
    localStorage.setItem(`galeria_slots_${user.id}`, JSON.stringify(slots));
    setSlotsConfig(slots);
  };

  const saveManualConfig = async (config: any) => {
    if (!user) throw new Error("Erro de autenticação.");
    const response = await fetch("/api/slots/manual-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, ...config })
    });
    if (response.ok) {
      setManualSlots(config);
      localStorage.setItem(`galeria_manual_config_${user.id}`, JSON.stringify(config));
      return config;
    }
    throw new Error("Falha ao salvar configuração manual de slots");
  };

  const generateDefaultSlots = () => {
    const slots = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const slotDate = addDays(today, i - 1);
      slots.push({
        id: `slot_${i}`,
        hour: i * 2, // Hours: 2, 4, 6, ... 28 (8 slots per day)
        day: slotDate.toISOString().split('T')[0],
        available: true,
        reason: i <= 4 ? "Peak hour - AI optimized" : `Slot ${i} - Auto-scheduled`
      });
    }
    return slots;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setIsPlanning(true);
    try {
      // 1. Upload All Files FIRST (instant processing)
      const uploadedImages = await Promise.all(files.map(async (file) => {
        const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
        return file_url;
      }));

      // 2. Fetch Available Slots immediately (NO AI brain planning)
      if (!user) throw new Error("Erro de autenticação.");
      let availableSlots = await postService.getAvailableSlots(user.id);
      
      // If no slots configured, generate instant default slots
            if (!availableSlots || availableSlots.length === 0) {
              const defaultSlots = generateDefaultSlots();
              await saveSlots(defaultSlots);
              availableSlots = defaultSlots;
            }

      // 3. Get AI analysis ONLY if user wants optimization help (OPTIONAL)
      let aiOptimizedSlots = availableSlots;
      if (profileInfo?.igId) {
        try {
          const token = await getIgToken();
          const response = await fetch(`/api/slots/analysis?igId=${profileInfo.igId}`, {
            headers: { "x-access-token": token }
          });
          if (response.ok) {
            const aiResult = await response.json();
            if (aiResult?.optimizedSlots) {
              aiOptimizedSlots = aiResult.optimizedSlots;
            }
          }
        } catch (error) {
          console.log("AI analysis unavailable, using configured slots:", error);
        }
      }

      // 4. Create posts immediately for each uploaded image
      const newItems = uploadedImages.map((url, i) => {
        const slot = aiOptimizedSlots[i] || availableSlots[i];
        return {
          id: Date.now() + i + Math.random(),
          date: new Date(slot.day).setHours(slot.hour, 0, 0, 0),
          image: url,
          type: 'feed',
          status: 'rascunho',
          caption: "✨ Conteúdo enviado instantaneamente para agendamento",
          hashtags: ["#tattoo", "#art", "#inkdream"],
          cta: 'Agende seu horário pelo link no perfil! 👆',
          scheduledTime: new Date(slot.day).setHours(slot.hour, 0, 0, 0),
          editorSettings: { brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 },
          aiReasoning: slot.reason || "Instant slot allocation"
        };
      });

      // 5. Auto-schedule immediately without further delays
      const scheduledItems = await Promise.all(newItems.map(async (item) => {
        try {
          return await schedulePostIntegrations(item);
        } catch (scheduleError) {
          console.error("Failed to schedule post:", scheduleError);
          return item;
        }
      }));

      // 6. Save posts to database
      savePosts([...posts, ...scheduledItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

    } catch (error: any) {
      console.error("Error in instant upload process:", error);
      alert(error?.message || "Ocorreu um erro durante o upload instantâneo.");
    } finally {
      setIsPlanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          const selectedProfile = profiles[0];
          const text = `${post.caption || ''}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`;
          const scheduledIso = new Date(post.scheduledTime || post.date).toISOString();
          
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
        const scheduledIso = new Date(post.scheduledTime || post.date).toISOString();
        
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

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header with Upload Interface */}
            <header className="px-6 py-4 border-b border-border flex flex-col md:flex-row justify-between md:items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold">IA</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">Galeria IA - Upload Instantâneo</h1>
                  <p className="text-sm text-muted-foreground">Upload, slot selection, e agendamento sem atrasos</p>
                </div>
              </div>
        
              <div className="flex items-center gap-3 flex-wrap">
                {/* Instant Upload Button */}
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPlanning}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-2"
                >
                  {isPlanning ? (
                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Processando...</>
                  ) : (
                    <><Upload className="w-4 h-4 mr-2" />Upload Instantâneo</>
                  )}
                </Button>
          
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
          
                {/* Slot Management Panel Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowSlotManager(!showSlotManager)}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Gerenciar Slots ({manualSlots.enabled ? manualSlots.slots.length : 'Auto'})
                </Button>
          
                {/* AI Slot Analysis Button (Optional) */}
                <Button
                  variant="outline"
                  onClick={() => setShowEstudioIA(!showEstudioIA)}
                  className="border-purple-500 text-purple-600 hover:bg-purple-50"
                >
                  <BarChart2 className="w-4 h-4 mr-2" />
                  Análise IA de Slots
                </Button>
              </div>
            </header>

            {/* Slot Manager Panel - Always visible when open */}
            {showSlotManager && (
              <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-md sticky top-16 z-10 animate-in slide-in-from-top-2">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <LayoutGrid className="w-5 h-5" />
                      Gerenciador de Slots de Postagem
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setShowSlotManager(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
            
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Manual Slot Toggle */}
                    <Card className="p-4 border-blue-200 bg-blue-500/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Slots Manuais</p>
                          <p className="text-sm text-muted-foreground">
                            {manualSlots.enabled 
                              ? `${manualSlots.slots.length} slots configurados`
                              : 'Desativado - usa slots automáticos'}
                          </p>
                        </div>
                        <input
                          type="checkbox"
                          checked={manualSlots.enabled}
                          onChange={(e) => setManualSlots({...manualSlots, enabled: e.target.checked})}
                          className="w-5 h-5 text-blue-500 rounded border-gray-300"
                        />
                      </div>
                    </Card>
              
                    {/* Quick Time Slot Buttons */}
                    <Card className="p-4 md:col-span-2 lg:col-span-2">
                      <p className="font-medium mb-3">Horários Rápidos (clique para adicionar/remover):</p>
                      <div className="flex flex-wrap gap-2">
                        {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'].map(time => {
                          const isSelected = manualSlots.manualTimes.includes(time);
                          return (
                            <Button
                              key={time}
                              variant={isSelected ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                const newTimes = isSelected
                                  ? manualSlots.manualTimes.filter(t => t !== time)
                                  : [...manualSlots.manualTimes, time];
                                setManualSlots({...manualSlots, manualTimes: newTimes});
                              }}
                              className={isSelected ? 'bg-blue-500 text-white' : 'border-blue-500 text-blue-600 hover:bg-blue-50'}
                            >
                              {time}
                            </Button>
                          );
                        })}
                      </div>
                    </Card>
              
                    {/* AI Analysis Trigger */}
                    <Card className="p-4 border-purple-500/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-purple-600">Otimização IA</p>
                          <p className="text-sm text-muted-foreground">
                            Analisa horários de pico do Instagram
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-purple-500 text-purple-600 hover:bg-purple-50"
                          onClick={() => setShowEstudioIA(true)}
                        >
                          <BarChart2 className="w-4 h-4 mr-1" />
                          Analisar
                        </Button>
                      </div>
                    </Card>
              
                    {/* Save Config */}
                    <Card className="p-4">
                      <Button
                        className="w-full bg-green-500 hover:bg-green-600"
                        onClick={async () => {
                          await saveManualConfig({
                            enabled: manualSlots.enabled,
                            slots: manualSlots.slots,
                            manualTimes: manualSlots.manualTimes
                          });
                          alert('Configuração de slots salva!');
                          setShowSlotManager(false);
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Salvar Configuração
                      </Button>
                    </Card>
                  </div>
                </div>
              </div>
            )}

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-7 mx-6 mt-4">
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="notificacoes">Notificações</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="suporte">Suporte</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden px-6 py-4">
            <TabsContent value="calendario" className="h-full overflow-hidden">
              <CalendarView posts={posts} onUpdatePost={(updated) => savePosts(posts.map(p => p.id === updated.id ? updated : p))} />
            </TabsContent>
            
            <TabsContent value="agendamentos" className="h-full overflow-hidden">
              <CalendarioAgendamentos posts={posts} onUpdatePost={(updated) => savePosts(posts.map(p => p.id === updated.id ? updated : p))} />
            </TabsContent>
            
            <TabsContent value="notificacoes" className="h-full overflow-hidden">
              <NotificacoesAgendamento />
            </TabsContent>
            
            <TabsContent value="insights" className="h-full overflow-hidden">
              <InstagramInsights />
            </TabsContent>
            
            <TabsContent value="config" className="h-full overflow-hidden">
                          <ConfigWhatsApp onClose={() => setShowConfigWhatsapp(false)} />
                        </TabsContent>
            
            <TabsContent value="suporte" className="h-full overflow-hidden">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Central de suporte - Em breve
              </div>
            </TabsContent>
            
            <TabsContent value="admin" className="h-full overflow-hidden">
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Painel admin - Em breve
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* AI Slot Analysis Modal */}
            <EstudioIAWorkflow 
              open={showEstudioIA} 
              onClose={() => setShowEstudioIA(false)}
              onPostCreated={(post: any) => {
                savePosts([...posts, post]);
              }}
              igId={profileInfo?.igId}
              profileInfo={profileInfo}
              existingPosts={posts}
            />
    </div>
  );
}