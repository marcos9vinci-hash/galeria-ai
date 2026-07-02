import React, { useState, useRef, useEffect } from "react";
import { format, addMonths, subMonths, addDays } from "date-fns";
import { collection, addDoc, updateDoc, query, where, getDocs, doc } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { postService } from "@/services/postService";
import { ensureAnonymousAuth } from "@/lib/auth";
import { db, auth } from "@/lib/firebase";

// Components extraídos
import GaleriaHeader from "@/components/galeria/GaleriaHeader";
import CalendarGridView from "@/components/galeria/CalendarGridView";
import SidebarCards from "@/components/galeria/SidebarCards";
import NotificationPanel from "@/components/galeria/NotificationPanel";
import CalendarioAgendamentos from "@/components/galeria/CalendarioAgendamentos";
import NotificacoesAgendamento, { NotificacoesBell } from "@/components/galeria/NotificacoesAgendamento";
import InstagramIntegracaoModal from "@/components/integracoes/InstagramIntegracaoModal";
import PostEditor from "@/components/galeria/PostEditor";
import PlanoSemanal from "@/components/galeria/PlanoSemanal";
import PlanejamentoTrimestral from "@/components/galeria/PlanejamentoTrimestral";
import ConfigWhatsApp from "@/components/galeria/ConfigWhatsApp";
import EstudioIAWorkflow from "@/components/galeria/EstudioIAWorkflow";
import InstagramInsights from "@/components/galeria/InstagramInsights";
import NicheConfig from "@/components/galeria/NicheConfig";

export default function GaleriaIA() {
  // ─── Estado ───────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorState, setEditorState] = useState<any>(null);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('calendario');
  const [dismissedNotifs, setDismissedNotifs] = useState<(number | string)[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showIgModal, setShowIgModal] = useState(false);
  const [igConnected, setIgConnected] = useState(false);
  const [hasPublishPerm, setHasPublishPerm] = useState(false);
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

  // ─── Buffer ───────────────────────────────────────────────
  const fetchBufferQueue = async () => {
    try {
      setLoadingBuffer(true);
      const profilesResp = await fetch("/api/buffer/profiles");
      const profilesData = await profilesResp.json();
      const profiles = profilesData.data?.profiles || [];
      if (profiles.length > 0) {
        const results = await Promise.all(
          profiles.map((p: any) => fetch(`/api/buffer/posts/${p.id}`).then(r => r.json()))
        );
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

  // ─── Conexão Instagram ────────────────────────────────────
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
            setIgConnected(false); setProfileInfo(null); setHasPublishPerm(false);
          }
        } else {
          setIgConnected(false); setProfileInfo(null); setHasPublishPerm(false);
        }
      } catch {
        setIgConnected(false); setProfileInfo(null); setHasPublishPerm(false);
      }
    };
    checkConnection();

    const handleOpenModal = (e: any) => {
      setModalInitialTab(e.detail?.tab || "instagram");
      setShowIgModal(true);
    };
    window.addEventListener('OPEN_IG_MODAL', handleOpenModal as any);

    const handleAuthSuccess = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') checkConnection();
    };
    window.addEventListener('message', handleAuthSuccess);

    return () => {
      window.removeEventListener('OPEN_IG_MODAL', handleOpenModal);
      window.removeEventListener('message', handleAuthSuccess);
    };
  }, []);

  // ─── Sincronização com servidor ───────────────────────────
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
            return { ...p, status: expectedStatus, scheduledAt: match.scheduledAt || p.scheduledAt };
          }
        }
        return p;
      });
      if (changed) savePosts(updated);
    } catch (err) {
      console.warn("[SyncWithServer] Could not sync:", err);
    }
  };

  // ─── Load / Save Posts ────────────────────────────────────
  const savePosts = async (newPosts: any[]) => {
    setPosts(newPosts);
    try {
      const postsToSave = newPosts.map(p => ({
        ...p, date: p.date instanceof Date ? p.date.toISOString() : p.date
      }));
      localStorage.setItem('galeria_posts_v3', JSON.stringify(postsToSave));
      setQuotaWarning(false);
    } catch {
      console.warn("Storage quota full");
      setQuotaWarning(true);
    }
    if (!auth.currentUser) return;
    for (const p of newPosts) {
      try {
        const postData = {
          userId: auth.currentUser.uid,
          image: p.image, caption: p.caption || '',
          date: p.date instanceof Date ? p.date.toISOString() : p.date,
          type: p.type || 'feed', status: p.status || 'rascunho'
        };
        if (p.id && typeof p.id === 'string' && !p.id.startsWith('temp_') && !String(p.id).includes('.')) {
          await updateDoc(doc(db, "posts", p.id), postData);
        } else {
          const docRef = await addDoc(collection(db, "posts"), postData);
          setPosts(prev => prev.map(post =>
            post.image === p.image && (post.id === p.id || !post.id || String(post.id).includes('.'))
              ? { ...post, id: docRef.id } : post
          ));
        }
      } catch (e) { console.error("Error saving post:", e); }
    }
  };

  useEffect(() => {
    const loadPosts = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(collection(db, "posts"), where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        let loadedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id, ...doc.data(), date: new Date(doc.data().date as string)
        }));
        if (loadedPosts.length === 0) {
          const saved = localStorage.getItem('galeria_posts_v3');
          if (saved) {
            const localPosts = JSON.parse(saved).map((p: any) => ({ ...p, date: new Date(p.date), status: p.status || 'rascunho' }));
            if (localPosts.length > 0) { loadedPosts = localPosts; await savePosts(localPosts); }
          }
        }
        setPosts(loadedPosts);
        if (loadedPosts.length > 0) syncWithServerScheduler(loadedPosts);
      } catch (e) {
        console.error("Error loading posts:", e);
        try {
          const saved = localStorage.getItem('galeria_posts_v3');
          if (saved) {
            const localPosts = JSON.parse(saved).map((p: any) => ({ ...p, date: new Date(p.date), status: p.status || 'rascunho' }));
            setPosts(localPosts);
          }
        } catch {}
      }
    };
    try {
      const saved = localStorage.getItem('galeria_posts_v3');
      if (saved) {
        setPosts(JSON.parse(saved).map((p: any) => ({ ...p, date: new Date(p.date), status: p.status || 'rascunho' })));
      }
    } catch {}
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) { setIsAuthenticated(true); loadPosts(); }
      else {
        try { await ensureAnonymousAuth(); } catch { setIsAuthenticated(false); }
      }
    });
    fetchBufferQueue();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (activeTab === 'agendamentos') fetchBufferQueue();
  }, [activeTab]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleClearGallery = () => {
    if (confirm("Deseja limpar todos os rascunhos da galeria?")) {
      setPosts([]);
      localStorage.removeItem('galeria_posts_v3');
      setQuotaWarning(false);
    }
  };

  const schedulePostIntegrations = async (post: any) => {
    try {
      const profilesResp = await fetch("/api/buffer/profiles");
      if (profilesResp.ok) {
        const profilesData = await profilesResp.json();
        const profiles = profilesData.data?.profiles || [];
        if (profiles.length > 0) {
          const selectedProfile = profiles[0];
          const text = `${post.caption || ''}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`;
          const scheduledIso = post.scheduledTime || post.date;
          const response = await fetch("/api/buffer/create-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              profileId: selectedProfile.id, service: selectedProfile.service,
              imageUrl: post.image, text, scheduledAt: scheduledIso, publishMode: 'scheduled'
            })
          });
          if (response.ok) {
            return { ...post, status: 'agendado', scheduledAt: scheduledIso, scheduledTime: scheduledIso };
          }
        }
      }
      if (igConnected && profileInfo?.igId) {
        const text = `${post.caption || ''}\n\n${post.cta || ''}\n\n${(post.hashtags || []).join(' ')}`;
        const scheduledIso = post.scheduledTime || post.date;
        const response = await fetch("/api/instagram/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            igId: profileInfo.igId, imageUrl: post.image, caption: text, scheduledAt: scheduledIso
          })
        });
        if (response.ok) return { ...post, status: 'agendado', scheduledAt: scheduledIso, scheduledTime: scheduledIso };
      }
    } catch (err) { console.error("[AutoSchedule] Error:", err); }
    return post;
  };

  const handleUpload = async (files: FileList) => {
    if (!files.length) return;
    setIsPlanning(true);
    try {
      const now = new Date();
      const uploadedImages = await Promise.all(
        Array.from(files).map(async (file) => {
          const { file_url } = await (base44.integrations.Core as any).UploadFile({ file });
          return file_url;
        })
      );
      let insightsData = null;
      try {
        const resp = await fetch(`/api/instagram/insights?igId=${profileInfo?.igId}`);
        if (resp.ok) insightsData = await resp.json();
      } catch {}
      if (!auth.currentUser) throw new Error("Usuário não autenticado.");
            const availableSlots = await postService.getAvailableSlots(auth.currentUser.uid) as { id: string; scheduledAt: any }[];
      const strategyResp = await fetch("/api/studio/plan-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: uploadedImages, insights: insightsData, profileInfo })
      });
      let aiStrategy = [];
      if (strategyResp.ok) {
        try { aiStrategy = await strategyResp.json(); }
        catch { throw new Error("JSON inválido da API de IA."); }
      } else {
        const errText = await strategyResp.text();
        let parsedErr;
        try { parsedErr = JSON.parse(errText); } catch {}
        throw new Error(parsedErr?.details || parsedErr?.error || `Erro (Status ${strategyResp.status})`);
      }
      const newItems = uploadedImages.map((url, i) => {
              const slot = availableSlots[i];
              const plan = aiStrategy[i] || {
                type: 'feed', date: addDays(new Date(), i).toISOString(),
                caption: "✨ Trabalho finalizado no estúdio @aflor da pele!\n\n#tattoo #tatuagem #ink",
                hashtags: ["#tattoo", "#art"]
              };
              return {
                id: Date.now() + i + Math.random(),
                date: slot ? slot.scheduledAt.toDate() : new Date(plan.date),
                image: url, type: plan.type, status: 'rascunho',
                caption: plan.caption, hashtags: plan.hashtags,
                cta: 'Agende seu horário pelo link no perfil! 👆',
                scheduledTime: plan.date,
                editorSettings: { brightness: 100, contrast: 100, saturate: 100, rotate: 0, scaleX: 1, scaleY: 1 },
                aiReasoning: plan.reasoning
              };
            });
      const scheduledItems = await Promise.all(newItems.map(item => schedulePostIntegrations(item)));
      savePosts([...posts, ...scheduledItems].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (error: any) {
      console.error("Critical error in AI planning:", error);
      alert(error?.message || "Erro ao planejar estratégia.");
    } finally {
      setIsPlanning(false);
    }
  };

  const handleUpdatePost = (updated: any) => savePosts(posts.map(p => p.id === updated.id ? updated : p));
  const handleDeletePost = (id: number) => {
    if (confirm('Apagar este post?')) { savePosts(posts.filter(p => p.id !== id)); setEditorState(null); }
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

  // ─── Computed ─────────────────────────────────────────────
  const postsByDay = posts.reduce((acc: any, post) => {
    const day = format(new Date(post.date), 'yyyy-MM-dd');
    if (!acc[day]) acc[day] = [];
    acc[day].push(post);
    return acc;
  }, {});

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      <input
        type="file" multiple ref={fileInputRef} onChange={(e) => { if (e.target.files) handleUpload(e.target.files); e.target.value = ''; }}
        className="hidden" accept="image/*"
      />
      <GaleriaHeader
        igConnected={igConnected}
        profileInfo={profileInfo}
        hasPublishPerm={hasPublishPerm}
        isPlanning={isPlanning}
        onOpenIgModal={() => { setModalInitialTab("instagram"); setShowIgModal(true); }}
        onOpenWhatsApp={() => setShowConfigWhatsapp(true)}
        onUploadClick={() => fileInputRef.current?.click()}
      />

      <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24">
        {/* Notification Panel */}
        <NotificationPanel
          show={showNotifs}
          posts={posts}
          bufferPosts={bufferPosts}
          dismissedNotifs={dismissedNotifs}
          onClose={() => setShowNotifs(false)}
          onPostClick={(p: any) => {
            const dayStr = format(new Date(p.date), 'yyyy-MM-dd');
            const dayPosts = posts.filter(pp => format(new Date(pp.date), 'yyyy-MM-dd') === dayStr);
            setEditorState({ posts: dayPosts.length ? dayPosts : [p], index: dayPosts.findIndex(pp => pp.id === p.id) || 0 });
          }}
          onDismiss={(id, source) => {
            setDismissedNotifs(prev => [...prev, id]);
            if (source === 'buffer') setBufferPosts(prev => prev.filter(p => p.id !== id));
          }}
        />

        {/* Auth Gate */}
        {isAuthenticated === null ? (
          <div className="flex h-screen items-center justify-center text-muted-foreground">Carregando autenticação...</div>
        ) : isAuthenticated === false ? (
          <div className="flex h-screen items-center justify-center text-destructive">Usuário não autenticado. Habilite auth anônima no Firebase.</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full max-w-sm grid grid-cols-4 mx-auto bg-muted/40 p-1 rounded-full border border-border/50">
              <TabsTrigger value="calendario" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Galeria</TabsTrigger>
              <TabsTrigger value="agendamentos" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Agenda</TabsTrigger>
              <TabsTrigger value="insights" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Insights</TabsTrigger>
              <TabsTrigger value="trimestre" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm">Trimestral</TabsTrigger>
            </TabsList>

            {/* Tab: Calendário */}
            <TabsContent value="calendario" className="mt-0">
              <div className="grid gap-6 md:grid-cols-[1fr,minmax(300px,400px)]">
                <Card className="border-none shadow-none bg-transparent">
                  <CardContent className="p-0">
                    <CalendarGridView
                      currentDate={currentDate}
                      postsByDay={postsByDay}
                      draggedPostId={draggedPostId}
                      onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
                      onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
                      onClearGallery={handleClearGallery}
                      onDayClick={(dayPosts) => setEditorState({ posts: dayPosts, index: 0 })}
                      onDragStart={handleDragStart}
                      onDrop={handleDrop}
                    />
                  </CardContent>
                </Card>

                <SidebarCards
                  posts={posts}
                  profileInfo={profileInfo}
                  onOpenEstudioIA={() => setShowEstudioIA(true)}
                  onOpenPlanoSemanal={() => setShowPlanoSemanal(true)}
                  onOpenNicheConfig={() => setShowNicheConfig(true)}
                  onSugestaoClick={(s) => setCurrentDate(s.date)}
                />
              </div>
            </TabsContent>

            {/* Tab: Agendamentos */}
            <TabsContent value="agendamentos">
              <div className="max-w-2xl mx-auto">
                <CalendarioAgendamentos
                  posts={posts}
                  bufferPosts={bufferPosts}
                  loadingBuffer={loadingBuffer}
                  onPostClick={(p: any) => {
                    const dayPosts = posts.filter(pp =>
                      format(new Date(pp.date), 'yyyy-MM-dd') === format(new Date(p.date), 'yyyy-MM-dd')
                    );
                    setEditorState({ posts: dayPosts.length ? dayPosts : [p], index: dayPosts.findIndex(pp => pp.id === p.id) || 0 });
                  }}
                />
              </div>
            </TabsContent>

            {/* Tab: Insights */}
            <TabsContent value="insights">
              {activeTab === "insights" && <InstagramInsights igId={profileInfo?.igId} />}
            </TabsContent>

            {/* Tab: Trimestral */}
            <TabsContent value="trimestre">
              <PlanejamentoTrimestral />
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* FAB Mobile */}
      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl md:hidden z-30"
        onClick={() => fileInputRef.current?.click()}
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Modals */}
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
        <PlanoSemanal posts={posts} onClose={() => setShowPlanoSemanal(false)} />
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
            const updated = [...posts, scheduledPost];
            await savePosts(updated);
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
