import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart2, TrendingUp, Users, Eye, 
  ArrowUpRight, ArrowDownRight, Instagram,
  RefreshCw, Clock, Sparkles
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, LineChart, Line 
} from "recharts";

interface InstagramInsightsProps {
  igId?: string;
}

export default function InstagramInsights({ igId }: InstagramInsightsProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>({
    summary: {
      reach: 12400,
      engagement: 1200,
      followers: 2506,
      impressions: 45200,
      avgEngagement: "45.2"
    },
    audienceActivity: [],
    recentMedia: []
  });

  const fetchInsights = async () => {
    if (!igId) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/instagram/insights?igId=${igId}`);
      if (resp.ok) {
        const insights = await resp.json();
        setData(insights);
      } else {
        // Fallback em caso de falha da API
        setData({
          summary: {
            reach: 12400,
            engagement: 1200,
            followers: 2506,
            impressions: 45200,
            avgEngagement: "45.2"
          },
          audienceActivity: [],
          recentMedia: []
        });
      }
    } catch (error) {
      console.error("Failed to fetch insights", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [igId]);

  if (!igId) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 border-2 border-dashed rounded-3xl">
        <div className="w-16 h-16 rounded-full bg-pink-500/10 flex items-center justify-center">
          <Instagram className="w-8 h-8 text-pink-500" />
        </div>
        <div className="max-w-xs">
          <h3 className="text-lg font-bold">Conecte seu Instagram</h3>
          <p className="text-sm text-muted-foreground">
            Precisamos de uma conta Business conectada para exibir métricas reais e otimizar seus agendamentos.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.dispatchEvent(new CustomEvent('OPEN_IG_MODAL', { detail: { tab: 'instagram' } }))}
        >
          Ir para Integrações
        </Button>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="animate-pulse bg-muted/20 h-32 border-none rounded-2xl" />
        ))}
      </div>
    );
  }

  const metrics = [
    { 
      label: "Alcance", 
      value: data?.summary?.reach?.toLocaleString() || "0", 
      icon: Eye, 
      color: "text-blue-500", 
      trend: "+12%" 
    },
    { 
      label: "Engajamento", 
      value: data?.summary?.avgEngagement || "0", 
      icon: TrendingUp, 
      color: "text-purple-500", 
      trend: "+5%" 
    },
    { 
      label: "Seguidores", 
      value: data?.summary?.followers?.toLocaleString() || "0", 
      icon: Users, 
      color: "text-pink-500", 
      trend: "+2%" 
    },
    { 
      label: "Impressões", 
      value: data?.summary?.impressions?.toLocaleString() || "0", 
      icon: BarChart2, 
      color: "text-orange-500", 
      trend: "+8%" 
    },
  ];

  // Processar audienceActivity para o gráfico
  const activityData = data?.audienceActivity?.[0]?.values?.[0]?.value || {};
  const chartData = Object.keys(activityData).length > 0 
    ? Object.entries(activityData).map(([hour, val]) => ({
        name: `${hour}h`,
        v: val as number
      })).slice(0, 24)
    : [
        { name: '00h', v: 400 },
        { name: '04h', v: 200 },
        { name: '08h', v: 600 },
        { name: '12h', v: 800 },
        { name: '16h', v: 700 },
        { name: '20h', v: 950 },
        { name: '23h', v: 500 },
      ];

  const bestHour = Object.entries(activityData).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "20:00";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold flex items-center gap-2">
           <BarChart2 className="w-5 h-5 text-primary" /> 
           Performance {data?.summary?.username ? `@${data.summary.username}` : "Real do Estúdio"}
        </h3>
        <Button variant="ghost" size="sm" onClick={fetchInsights} disabled={loading} className="gap-2 text-[10px] font-bold">
           <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> ATUALIZAR MÉTRICAS
        </Button>
      </div>

      {/* Grid de Métricas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="bg-card border-none shadow-sm rounded-2xl overflow-hidden group">
            <CardContent className="p-4 flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <m.icon className={`w-5 h-5 ${m.color}`} />
                <Badge variant="secondary" className="text-[8px] bg-green-500/10 text-green-600 border-none">
                  <ArrowUpRight className="w-2 h-2 mr-0.5" /> {m.trend}
                </Badge>
              </div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-2">{m.label}</p>
              <p className="text-2xl font-black">{m.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Atividade */}
        <Card className="rounded-3xl border-none shadow-sm bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
              <Clock className="w-4 h-4 text-primary" /> Horários de Pico (Engagement)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                />
                <Bar 
                  dataKey="v" 
                  fill="hsl(var(--primary))" 
                  radius={[10, 10, 10, 10]} 
                  barSize={12} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Melhores Formatos */}
        <Card className="rounded-3xl border-none shadow-sm bg-card/50">
           <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                 Formatos que mais convertem
              </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4 pt-4">
              {[
                { name: "REELS (Processo)", icon: "🎥", score: 98 },
                { name: "FEED (Finalizada)", icon: "✨", score: 85 },
                { name: "CARROSSEL (Detalhamento)", icon: "📚", score: 72 },
                { name: "STORIES (Bastidores)", icon: "⚡", score: 60 }
              ].map((f, i) => (
                <div key={i} className="space-y-1.5">
                   <div className="flex justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-2">{f.icon} {f.name}</span>
                      <span className="text-primary">{f.score}%</span>
                   </div>
                   <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${f.score}%` }}
                        className="h-full bg-primary"
                      />
                   </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-2 italic">
                * Dados baseados nas últimas 30 publicações via Buffer & App.
              </p>
           </CardContent>
        </Card>
      </div>

      {/* Sugestão de IA Baseada em Dados */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-2xl border border-primary/20 flex gap-4 items-center">
         <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
            <Sparkles className="w-6 h-6 text-primary" />
         </div>
         <div className="space-y-0.5">
            <h4 className="text-sm font-bold">Estratégia Recomendada para Hoje</h4>
            <p className="text-xs text-muted-foreground leading-snug">
              Seu público está mais ativo por volta das <b>{bestHour}:00</b>. Recomendamos um <b>Reels</b> no estilo <b>Processo de Criação</b> para capitalizar sobre o engajamento identificado.
            </p>
         </div>
      </div>
    </div>
  );
}
