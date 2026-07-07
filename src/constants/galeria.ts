export const STATUS_OPTIONS = [
  { value: "rascunho", label: "Rascunho", color: "bg-yellow-500" },
  { value: "pronto", label: "Pronto", color: "bg-blue-500" },
  { value: "agendado", label: "Agendado", color: "bg-indigo-600 animate-pulse" },
  { value: "publicado", label: "Publicado", color: "bg-green-500" },
] as const;

export type PostStatus = (typeof STATUS_OPTIONS)[number]["value"];

export const TAB_OPTIONS = [
  { id: "calendario", label: "Agenda", icon: "CalendarDays" },
  { id: "edicao", label: "Editor", icon: "LayoutGrid" },
  { id: "galeria", label: "Galeria", icon: "LayoutGrid" },
  { id: "insights", label: "Insights", icon: "BarChart2" },
  { id: "agendamentos", label: "Fila", icon: "Clock" },
  { id: "estudio", label: "Estúdio IA", icon: "Sparkles" },
] as const;
