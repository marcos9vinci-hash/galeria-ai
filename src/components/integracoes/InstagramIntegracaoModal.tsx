import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Instagram, CheckCircle2, Info, Facebook, MessageSquare, ChevronRight, Tablet, Globe, Smartphone, HelpCircle, Palette, Sparkles, Loader2, RefreshCw, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "motion/react";
import BufferScheduleManager from "../galeria/BufferScheduleManager";

export const InstagramStatusBadge = ({ connected, profile, hasPublishPerm, onClick }: any) => (
  <Badge 
    variant={connected ? "default" : "outline"} 
    className={`cursor-pointer gap-1.5 py-1 px-1.5 pr-3 ${connected ? 'bg-gradient-to-tr from-purple-500 to-pink-500 border-none' : ''}`}
    onClick={onClick}
  >
    {connected && profile?.profile_picture_url ? (
      <img 
        src={profile.profile_picture_url} 
        alt={profile.username} 
        className="w-5 h-5 rounded-full object-cover ring-1 ring-white/50"
        referrerPolicy="no-referrer"
      />
    ) : (
      <Instagram className="w-3.5 h-3.5" />
    )}
    <span className="text-[10px] font-bold">
      {connected ? (profile?.username ? `@${profile.username}` : "Conectado") : "Conectar Canais Meta"}
    </span>
    {connected && !hasPublishPerm && (
      <div className="w-2 h-2 rounded-full bg-white ml-1 animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
    )}
  </Badge>
);

export default function InstagramIntegracaoModal({ open, onClose, initialTab = "instagram" }: any) {
  const [loading, setLoading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(initialTab);

  React.useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
    }
  }, [open, initialTab]);
  const [isSyncingGem, setIsSyncingGem] = React.useState(false);
  const [gemUrlInput, setGemUrlInput] = React.useState('https://gemini.google.com/gem/ec86201ecd02/5d51bfd86212f73a');
  const [showGemTutorial, setShowGemTutorial] = React.useState(false);
  const [connected, setConnected] = React.useState(false);
  const [accounts, setAccounts] = React.useState<any[]>([]);
  const [hasPublishPerm, setHasPublishPerm] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAccounts = async () => {
    try {
      const resp = await fetch("/api/instagram/me");
      if (resp.ok) {
        const data = await resp.json();
        const foundAccounts = data.accounts || [];
        setAccounts(foundAccounts);
        setConnected(foundAccounts.length > 0);
        setHasPublishPerm(data.hasPublishPerm);
      } else {
        setConnected(false);
        setHasPublishPerm(false);
      }
    } catch (err) {
      console.error("Failed to fetch IG accounts", err);
    }
  };

  React.useEffect(() => {
    if (open) {
      fetchAccounts();
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.service === 'facebook') {
        fetchAccounts();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [open]);

  const handleAirtopSync = async () => {
    if (!gemUrlInput) return;
    setIsSyncingGem(true);
    try {
      const { GeminiService } = await import("@/services/geminiService");
      const gemini = GeminiService.getInstance();
      const instructions = await gemini.syncGemWithAirtop(gemUrlInput);
      
      // Save to gems list
      const saved = localStorage.getItem('tattoo_gems');
      let gems = saved ? JSON.parse(saved) : [];
      
      const newGem = {
        id: Date.now().toString(),
        name: `Sync Airtop (${new Date().toLocaleDateString()})`,
        instructions
      };
      
      gems = [...gems, newGem];
      localStorage.setItem('tattoo_gems', JSON.stringify(gems));
      
      alert("Sincronização com Airtop concluída! Instruções extraídas e salvas na sua lista de Gems.");
    } catch (err: any) {
      console.error(err);
      alert("Falha na sincronização Airtop: " + err.message);
    } finally {
      setIsSyncingGem(false);
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/auth/facebook/url");
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Falha ao obter URL de autenticação. Verifique se o FACEBOOK_APP_ID está configurado nas variáveis de ambiente.");
      }
      const { url } = await response.json();

      const width = 600;
      const height = 750;
      const left = window.innerWidth / 2 - width / 2;
      const top = window.innerHeight / 2 - height / 2;

      const authWindow = window.open(
        url,
        'facebook_oauth',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      if (!authWindow) {
        setError("O bloqueador de popups impediu a conexão. Por favor, habilite popups para este site.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setConnected(false);
    setAccounts([]);
  };

  const StepItem = ({ number, title, description }: any) => (
    <div className="flex gap-3 md:gap-4 p-3 md:p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-border transition-all">
       <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] md:text-sm shrink-0">
         {number}
       </div>
       <div className="space-y-0.5 md:space-y-1">
          <h5 className="text-[12px] md:text-sm font-bold leading-snug">{title}</h5>
          <p className="text-[10px] md:text-xs text-muted-foreground leading-relaxed">{description}</p>
       </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full max-h-[90vh] md:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-4 md:p-6 border-b shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3 mb-1 md:mb-2">
            <div className="flex -space-x-1.5 md:-space-x-2">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 ring-background text-[10px] md:text-sm">
                <Facebook className="w-3 md:w-4 h-3 md:h-4" />
              </div>
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white ring-2 ring-background text-[10px] md:text-sm">
                <Instagram className="w-3 md:w-4 h-3 md:h-4" />
              </div>
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-green-500 flex items-center justify-center text-white ring-2 ring-background text-[10px] md:text-sm">
                <MessageSquare className="w-3 md:w-4 h-3 md:h-4" />
              </div>
            </div>
            <DialogTitle className="text-sm md:text-lg">Conectar Canais Meta</DialogTitle>
          </div>
          <DialogDescription className="text-[10px] md:text-sm leading-tight">
            Configure seu estúdio para automação total no Instagram, Facebook e WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Tabs Selector: Horizontal on mobile, vertical sidebar on desktop */}
          <div className="w-full md:w-48 border-b md:border-r bg-muted/20 p-1.5 md:p-2 flex md:flex-col gap-1.5 overflow-x-auto scrollbar-hide shrink-0 z-10">
            <button 
              onClick={() => setActiveTab('instagram')}
              className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${activeTab === 'instagram' ? 'bg-white shadow-sm text-pink-600 border-pink-100 ring-1 ring-pink-50' : 'text-muted-foreground hover:bg-muted/50 border-transparent'}`}
            >
              <Instagram className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>Instagram</span>
            </button>
            <button 
              onClick={() => setActiveTab('facebook')}
              className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${activeTab === 'facebook' ? 'bg-white shadow-sm text-blue-600 border-blue-100 ring-1 ring-blue-50' : 'text-muted-foreground hover:bg-muted/50 border-transparent'}`}
            >
              <Facebook className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>Facebook</span>
            </button>
            <button 
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${activeTab === 'whatsapp' ? 'bg-white shadow-sm text-green-600 border-green-100 ring-1 ring-green-50' : 'text-muted-foreground hover:bg-muted/50 border-transparent'}`}
            >
              <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>WhatsApp</span>
            </button>
            <button                onClick={() => setActiveTab('buffer')}
               className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-4 py-2.5 rounded-xl text-[10px] md:text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${activeTab === 'buffer' ? 'bg-white shadow-sm text-[#2c4bff] border-[#2c4bff]/20 ring-1 ring-[#2c4bff]/10' : 'text-muted-foreground hover:bg-muted/50 border-transparent'}`}
            >
              <Layers className="w-3.5 h-3.5 md:w-4 md:h-4" /> <span>Buffer Schedule</span>
            </button>
            
            <div className="hidden md:flex mt-auto p-2">
               <div className="p-3 bg-blue-500/10 rounded-xl flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase">Suporte</span>
                  </div>
                  <p className="text-[10px] text-blue-700 leading-tight">Precisa de ajuda com a conta Business?</p>
                  <Button variant="link" className="p-0 h-auto text-[10px] text-blue-600 justify-start">Falar com Consultor</Button>
               </div>
            </div>
          </div>

          {/* Content Area - Native Scroll for reliability */}
          <div className="flex-1 overflow-y-auto bg-background">
            <div className="p-4 md:p-8 space-y-8 pb-12 w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'instagram' && (
                <motion.div 
                  key="ig"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-pink-50 dark:bg-pink-900/10 p-4 rounded-2xl border border-pink-100 dark:border-pink-900/30">
                    <div className="flex gap-4">
                      {accounts.length > 0 ? (
                        <img 
                          src={accounts[0].profile_picture_url} 
                          className="w-12 h-12 rounded-xl object-cover ring-2 ring-pink-500/20" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center text-white shrink-0">
                          <Instagram className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-pink-900 dark:text-pink-100">
                          {accounts.length > 0 ? accounts[0].name : "Instagram Profissional"}
                        </h4>
                        <p className="text-xs text-pink-700 dark:text-pink-300">
                          {accounts.length > 0 ? `@${accounts[0].username} • ${accounts[0].followers_count} seguidores` : "Automação de posts, reels e análise de métricas."}
                        </p>
                      </div>
                    </div>
                    {connected && (
                      <div className="flex flex-col items-end gap-1">
                        <CheckCircle2 className={`w-6 h-6 ${hasPublishPerm ? 'text-green-500' : 'text-orange-400'}`} />
                        {!hasPublishPerm && <span className="text-[8px] font-bold text-orange-600 uppercase">Ação necessária</span>}
                      </div>
                    )}
                  </div>

                  {!hasPublishPerm && connected && (
                    <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl space-y-2">
                       <div className="flex items-center gap-2 text-orange-600">
                          <Info className="w-4 h-4" />
                          <h6 className="text-xs font-bold uppercase">Permissão Faltante</h6>
                       </div>
                       <p className="text-[10px] text-orange-700 leading-relaxed font-medium">
                          Você está conectado, mas não liberou a permissão de <b>Publicação Automática</b>. 
                          Clique no botão "Reconectar" abaixo e, na tela do Facebook, certifique-se de autorizar o acesso de publicação.
                       </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Guia Passo a Passo</h5>
                    <div className="space-y-2">
                       <StepItem 
                         number="1" 
                         title="Mude para Conta Profissional" 
                         description="No seu Instagram, vá em Configurações > Tipo de conta > Mudar para conta profissional (Creator ou Business)."
                       />
                       <StepItem 
                         number="2" 
                         title="Vincule ao Facebook" 
                         description="Vá em Editar Perfil > Página > Escolha ou Crie uma Página do Facebook. Isso é OBRIGATÓRIO pela Meta."
                       />
                       <StepItem 
                         number="3" 
                         title="Acesse o Meta Business" 
                         description="Certifique-se de que você é Administrador da página no business.facebook.com."
                       />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-[10px] text-destructive font-medium">
                      {error}
                    </div>
                  )}

                  <Button 
                    className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 shadow-lg shadow-pink-500/20" 
                    onClick={handleConnect} 
                    disabled={loading}
                  >
                    {loading ? "Estabelecendo Conexão..." : connected ? "Reconectar para Atualizar Permissões" : "Conectar via Meta Business Cloud"}
                  </Button>
                </motion.div>
              )}

              {activeTab === 'facebook' && (
                <motion.div 
                  key="fb"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0">
                        <Facebook className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100">Facebook Business</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300">Gerenciamento de páginas e central de permissões.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Instruções Técnicas</h5>
                    <div className="space-y-2">
                       <StepItem 
                         number="1" 
                         title="Crie sua Página" 
                         description="Se não tiver uma, crie uma Fanpage no Facebook com o nome do seu estúdio."
                       />
                       <StepItem 
                         number="2" 
                         title="Configurações de Ativos" 
                         description="No seu Gerenciador de Negócios, adicione o Instagram à sua conta de ativos."
                       />
                       <StepItem 
                         number="3" 
                         title="Permissões de App" 
                         description="Ao clicar em conectar, marque TODAS as permissões solicitadas para que a IA possa postar por você."
                       />
                    </div>
                  </div>

                  <Button className="w-full h-12 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20" onClick={handleConnect}>
                    Configurar Página no Facebook
                  </Button>
                </motion.div>
              )}

              {activeTab === 'whatsapp' && (
                <motion.div 
                  key="wa"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shrink-0">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-green-900 dark:text-green-100">WhatsApp Business API</h4>
                        <p className="text-xs text-green-700 dark:text-green-300">Agendamentos, lembretes e respostas automáticas.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="text-xs font-bold uppercase text-muted-foreground tracking-widest pl-1">Como Ativar</h5>
                    <div className="space-y-2">
                       <StepItem 
                         number="1" 
                         title="App Business" 
                         description="Baixe o WhatsApp Business oficial. Não utilize o WhatsApp comum para automações."
                       />
                       <StepItem 
                         number="2" 
                         title="Vincule ao Facebook" 
                         description="Conecte seu número nas configurações da Página do Facebook que você já criou."
                       />
                       <StepItem 
                         number="3" 
                         title="Validação de Número" 
                         description="Validaremos seu número enviando um código de ativação via SMS/Notificação."
                       />
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-orange-600">
                      <Globe className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase">Cloud API</span>
                    </div>
                    <p className="text-[11px] text-orange-700 leading-tight">
                      <b>Importante:</b> Para automação avançada de mensagens, usamos a <b>Meta Cloud API</b>. Seu número deve estar limpo de outras automações.
                    </p>
                  </div>

                  <Button className="w-full h-12 bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20" onClick={handleConnect}>
                    Vincular WhatsApp Business
                  </Button>
                </motion.div>
              )}

              {activeTab === 'buffer' && (
                <motion.div 
                  key="buffer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <BufferScheduleManager />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 pt-6 border-t pb-6">
              <div className="flex items-start gap-3 text-muted-foreground">
                <Smartphone className="w-5 h-5 mt-1 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-foreground">Ainda está com dúvidas com a conta Business?</p>
                  <p className="text-[11px]">Milhares de tatuadores já automatizaram seus estúdios. O segredo está em ter uma Página do Facebook bem configurada como "âncora" para todos os canais Meta.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

        <div className="p-4 border-t bg-muted/30 flex justify-between items-center px-6">
           <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 text-xs">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <span className="text-muted-foreground">API Meta v18.0</span>
               </div>
               <div className="flex items-center gap-1.5 text-xs">
                 <div className="w-2 h-2 rounded-full bg-green-500"></div>
                 <span className="text-muted-foreground">SSL Seguro</span>
               </div>
           </div>
           <Button variant="ghost" onClick={onClose} className="font-bold">Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

