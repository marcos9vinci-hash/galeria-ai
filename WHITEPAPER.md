# GALERIA-IA — Tattoo Content Studio
## Whitepaper Estratégico v1.0

---

## 1. Resumo Executivo

**Galeria-IA** é uma plataforma web full-stack de gestão de conteúdo para estúdios de tatuagem. Ela funciona como um **CMS de marketing + IA Generativa + Integração Meta/Instagram** — tudo num único lugar.

O app já está **em produção** (https://galeria-ia-production.up.railway.app) com Instagram conectado, Buffer integrado, IA multi-provedor e diversos módulos funcionais. Este documento mapeia o estado atual, uso estratégico e roadmap de evolução.

---

## 2. Arquitetura Atual

```
┌─────────────────────────────────────────────────────┐
│                   GALERIA-IA                         │
│                                                      │
│  Frontend: React 19 + Vite 6 + Tailwind 4            │
│  Backend:  Express + tsx (Node 22)                   │
│  Deploy:   Railway (auto-deploy via GitHub)          │
│  Domínio:  galeria-ia-production.up.railway.app      │
│  GitHub:   marcos9vinci-hash/galeria-ai (privado)    │
│                                                      │
│  Dados:    Firestore (Firebase), LocalStorage         │
│  Cache:    cookies (fb_access_token)                  │
│  Estilos:  shadcn/ui + lucide-react + motion         │
│  Gráficos: recharts                                   │
└─────────────────────────────────────────────────────┘
```

### Stack Técnica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React | 19 |
| Build | Vite | 6 |
| Estilos | Tailwind + shadcn/ui | 4 |
| Backend | Express | 4 |
| Runtime | Node (tsx) | 22 |
| Banco | Firebase Firestore | - |
| IA | OpenRouter / OpenCode / Gemini (fallback) | - |
| Rede Social | Facebook Graph API v21/v25 | - |
| Agendamento | Buffer API (GraphQL) | - |

### Integrações Ativas

| Integração | Status | Detalhe |
|-----------|--------|---------|
| Instagram Business | ✅ Ativo | @aflordapele_tattoo conectado via FACEBOOK_LONG_TOKEN |
| Buffer (agendamento) | ✅ API conectada | Profiles vazio — token precisa refresh |
| Facebook OAuth | ✅ Configurado | Redirect URI sem ponto final |
| Gemini AI | ✅ Ativo | OpenRouter → OpenCode → Gemini fallback |
| Firebase | ✅ Inicializado | Firestore disponível |
| Airtop (browser) | ⚠️ Incompleto | Depende de chave válida |

---

## 3. Inventário Completo de Funcionalidades

### 🟢 FUNCIONANDO

#### 3.1 Instagram Business

| Rota | O que faz |
|------|-----------|
| `GET /api/instagram/me` | Retorna perfil, páginas, Instagram Business ID |
| `POST /api/instagram/login-manual` | Aceita token manual e seta cookie |
| `GET /api/instagram/insights` | Métricas de alcance, engajamento, seguidores |
| `GET /api/instagram/audience-activity` | Atividade do público por hora (com fallback simulado) |
| `GET /api/instagram/hashtag-trends` | Tendências de hashtags (fallback simulado) |
| `GET /api/instagram/media-details` | Detalhes de mídias recentes |
| `GET /api/instagram/scheduled-status` | Status de posts agendados |
| `POST /api/instagram/publish` | Publicar no Instagram (depende de permissão) |

#### 3.2 Buffer (Agendamento)

| Rota | O que faz |
|------|-----------|
| `GET /api/buffer/profiles` | Lista canais conectados (atualmente vazio) |
| `GET /api/buffer/posts/:id` | Lista posts na fila (200 ✅) |
| `GET /api/buffer/schedule/:id` | Horários de postagem (200 ✅) |
| `POST /api/buffer/create-idea` | Criar idea/rascunho |
| `POST /api/buffer/create-update` | Atualizar post existente |

#### 3.3 IA Generativa (Multi-Provedor)

| Rota | Provedores (fallback) |
|------|----------------------|
| `POST /api/ai/generate-image` | OpenRouter → OpenCode → Gemini |
| `POST /api/studio/plan-strategy` | Estratégia de conteúdo via IA |

#### 3.4 Análise de Nicho

| Rota | O que faz |
|------|-----------|
| `GET /api/niche/config` | Configuração de nicho do perfil |
| `POST /api/niche/hashtags` | Gerenciar hashtags |
| `POST /api/niche/profiles` | Gerenciar perfis concorrentes |
| `POST /api/niche/schedule-preferences` | Horários ideais de postagem |
| `POST /api/niche/detect` | Detectar nicho automaticamente |
| `GET /api/niche/analyze` | Análise inteligente de nicho |

#### 3.5 Frontend (Componentes)

| Componente | Função |
|-----------|--------|
| **PostEditor** | Editor completo de post: imagem, legenda, hashtags, agendamento, tipo (feed/story/reels) |
| **CalendarioAgendamentos** | Visão de posts agendados + fila do Buffer |
| **EstudioIAWorkflow** | Workflow de 4 agentes de IA (Insights → Mercado → Estratégia → Narrativa) |
| **InstagramInsights** | Dashboard com gráficos de alcance, engajamento, seguidores |
| **NicheConfig** | Configuração de nicho: hashtags, concorrentes, horários |
| **PlanoSemanal** | Gerador de plano de conteúdo semanal |
| **InstagramIntegracaoModal** | Modal de conexão Instagram/Facebook/WhatsApp/Buffer |
| **BufferScheduleManager** | Gerenciamento de horários de postagem |
| **StorySequencer** | Planejamento de stories |
| **ScriptReels** | Criação de scripts para Reels |
| **NotificacoesAgendamento** | Notificações push de agendamentos |
| **ConfigWhatsApp** | Configuração WhatsApp Business |
| **SugerirEspacos** | Sugestão de espaços no calendário |
| **BufferStatus** | Status dos canais Buffer |
| **AudiosEmAlta** | Áudios em alta para Reels |
| **ContextoModal** | Contexto adicional para edição |

---

### 🟡 PARCIAL / INCOMPLETO

| Funcionalidade | Problema |
|---------------|----------|
| **Buffer profiles vazio** | Token na Railway pode ser diferente do testado. Profiles retorna `[]` |
| **Airtop scraping** | Depende de `AIRTOP_API_KEY` válida — browser automation caro e lento |
| **WhatsApp Business** | Componente frontend existe mas sem backend real integrado |
| **Firebase Firestore** | Inicializado mas sem uso consistente — dados ficam no localStorage |
| **Instagram publish** | Rota existe mas depende de `instagram_content_publish` — permissão precisa ser concedida |
| **Insights reais** | Audience activity e hashtag trends usam **fallback simulado** (dados fabricados) quando API real falha |
| **SugerirEspacos** | UI existe mas backend pode não estar conectado |

---

### 🔴 AUSENTE / NÃO IMPLEMENTADO

| Funcionalidade | Por que é importante |
|---------------|---------------------|
| **Sistema de autenticação** | Qualquer um que acessar a URL vê todo o conteúdo |
| **Multi-perfil Instagram** | Só @aflordapele_tattoo conectado — @marquinhostattoo__ não |
| **Content Library** | Sem repositório de imagens/captions gerados |
| **Template de posts** | Sem templates reutilizáveis para tatuagem |
| **Geração em lote** | Não dá para gerar 1 mês de conteúdo de uma vez |
| **Dashboard executivo** | Não há visão geral de performance do estúdio |
| **Clientes/Projetos** | Sem gestão de clientes de tatuagem |
| **Calendário drag & drop** | Posts não podem ser rearranjados visualmente |
| **Histórico de hashtags** | Sem analytics de quais hashtags performam melhor |
| **Reels automáticos** | Sem geração automática de vídeo/Reels |
| **Watermark automático** | Sem proteção de marca nas imagens |

---

## 4. Casos de Uso Estratégicos

### 🎯 CASO 1: Agendamento Inteligente de Conteúdo

**Problema:** Postar manualmente todo dia no Instagram consome horas do tatuador.

**Solução Galeria-IA:**
1. Editor de post → cria legenda com IA (Estúdio IA)
2. Agenda no Buffer → publicação automática nos horários ideais
3. Insights → mostra quais posts performaram melhor

**Funciona hoje?** Parcial. O editor + schedule do Buffer estão OK, mas falta o ciclo completo: criar → agendar → publicar → analisar.

### 🎯 CASO 2: Estúdio de Conteúdo com IA (Multi-Agente)

**Problema:** Criar conteúdo relevante e profundo de forma consistente.

**Solução Galeria-IA:**
- **Agente 0:** Analisa insights do perfil (o que está funcionando)
- **Agente 1:** Radar de mercado (tendências do nicho)
- **Agente 2:** Planejador estratégico (narrativa do lote)
- **Agente 3:** Narrador visual (cria legenda com visão computacional)

**Funciona hoje?** ✅ O workflow de 4 agentes está implementado e funcional.

### 🎯 CASO 3: Analytics de Performance

**Problema:** Tatuador não sabe se o conteúdo está funcionando.

**Solução Galeria-IA:**
- Alcance, engajamento, crescimento de seguidores
- Atividade do público por hora
- Tendências de hashtags

**Funciona hoje?** 🟡 Parcial. Os dados reais da API do Instagram são limitados. O sistema cai em fallback com dados simulados.

### 🎯 CASO 4: Gestão Multi-Conta

**Problema:** O estúdio tem @aflordapele_tattoo e @marquinhostattoo__ — precisa gerenciar ambos.

**Solução Galeria-IA:** Alternar entre contas, cada uma com seu calendário, agendamento e analytics.

**Funciona hoje?** ❌ Só uma conta por vez.

### 🎯 CASO 5: Pipeline Completo — Da Criação à Publicação

**Problema:** Fluxo de trabalho fragmentado entre várias ferramentas.

**Solução Galeria-IA:**
```
Criação (Estúdio IA) → Edição (PostEditor) → Agendamento (Buffer) → 
Publicação (Instagram) → Análise (Insights) → Otimização
```

**Funciona hoje?** 🔴 O pipeline completo não está fechado. Cada etapa existe mas não estão conectadas.

---

## 5. Roadmap — Fases de Evolução

### FASE 1: Consolidação (Agora — 1 semana)
*"Fechar o que já existe"*

| Tarefa | Impacto |
|--------|---------|
| 🔄 Renovar token Buffer e verificar profiles | Buffer volta a funcionar |
| 🔄 Conceder permissão `instagram_content_publish` | Publicar posts do app direto no Instagram |
| 🔄 Conectar @marquinhostattoo__ como segunda conta | Suporte multi-perfil básico |
| 🔄 Salvar estado no Firestore em vez de localStorage | Dados persistem entre sessões |

### FASE 2: Potencialização (1-2 semanas)
*"Entregar o pipeline completo"*

| Tarefa | Impacto |
|--------|---------|
| **Autenticação** (login com Facebook/email) | App seguro, só o dono acessa |
| **Geração em lote** (1 mês de conteúdo com 1 clique) | Produção em escala |
| **Calendário drag & drop** (organização visual) | UX profissional |
| **Content Library** (histórico de posts gerados) | Reuso de conteúdo |
| **Dashboard executivo** (performance do estúdio) | Tomada de decisão |

### FASE 3: Automação (2-4 semanas)
*"O app trabalha sozinho"*

| Tarefa | Impacto |
|--------|---------|
| **Pipeline automático:** IA gera → PostEditor revisa → Buffer publica → Insights analisa | Zero trabalho manual |
| **Reels automation** (cortar vídeos, adicionar legendas automáticas) | Conteúdo de vídeo em escala |
| **Watermark automático** | Proteção de marca |
| **Hashtag analytics** (quais hashtags realmente trazem engajamento) | Otimização de alcance |

### FASE 4: Expansão (1 mês+)
*"Plataforma de gestão de estúdio"*

| Tarefa | Impacto |
|--------|---------|
| **Módulo Clientes** (briefings, projetos, portfolio por cliente) | Integração com Caminho do Ouro InkDream |
| **Agendamento de clientes** (calendário de sessões de tatuagem) | Gestão do estúdio completa |
| **Relatórios automáticos** (PDF de performance mensal) | Profissionalismo |
| **Integração Paperclip** (projetos de tatuagem → conteúdo automaticamente) | Fim do trabalho manual |

---

## 6. O Que Faz a Galeria-IA Única

Diferente de ferramentas genéricas (Hootsuite, Later, Buffer puro), a Galeria-IA foi **construída para tatuadores**:

1. **Linguagem do nicho:** Os agentes de IA foram treinados com a **Bússola Estratégica InkDream** — não escrevem como "marketeiro genérico", mas como um **sábio da tatuagem** que revela significados ocultos
2. **Workflow de 4 agentes:** Não é um gerador de legenda simples — é uma **equipe de IA** que faz pesquisa de mercado, análise de tendências, planejamento estratégico e copywriting profundo
3. **Integração vertical:** Editor → Agendamento → Analytics → Otimização — tudo na mesma tela
4. **Multi-provedor de IA:** Se um modelo cair, o próximo assume. Zero downtime
5. **Parte do ecossistema InkDream:** Conecta com o Caminho do Ouro (criação de tatuagem) → Marketing (publicação)

---

## 7. Conclusão

A Galeria-IA **já é um app funcional e impressionante** para gestão de conteúdo de tatuagem. O que falta não é reescrever — é **conectar as pontas** e preencher lacunas estratégicas.

### Prioridades Imediatas (top 3)

1. **Token Buffer** → renovar para profiles voltarem a funcionar
2. **Permissão `instagram_content_publish`** → conseguir publicar de verdade
3. **Segunda conta Instagram** → @marquinhostattoo__

Com esses 3 ajustes, o app entrega o ciclo completo de valor para o estúdio.

---

*Documento gerado em 25/06/2026*  
*Galeria-IA v0.1 — InkDream Tattoo Ecosystem*
