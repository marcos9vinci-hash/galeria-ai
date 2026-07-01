import React from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import CalendarDayCell from "./CalendarDayCell";

const WEEKDAY_HEADERS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface CalendarGridViewProps {
  currentDate: Date;
  postsByDay: Record<string, any[]>;
  draggedPostId: number | null;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onClearGallery: () => void;
  onDayClick: (posts: any[]) => void;
  onDragStart: (e: React.DragEvent, postId: number) => void;
  onDrop: (e: React.DragEvent, day: Date) => void;
}

export default function CalendarGridView({
  currentDate,
  postsByDay,
  draggedPostId,
  onPrevMonth,
  onNextMonth,
  onClearGallery,
  onDayClick,
  onDragStart,
  onDrop,
}: CalendarGridViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startingDay = (getDay(monthStart) === 0) ? 6 : getDay(monthStart) - 1;

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card/30 p-2 rounded-2xl border border-border/40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onPrevMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-sm font-bold capitalize w-32 text-center">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-[10px] font-bold text-destructive border-destructive/20 hover:bg-destructive/10 gap-1.5"
            onClick={onClearGallery}
          >
            <Trash2 className="w-3.5 h-3.5" /> LIMPAR GALERIA
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1.5 md:gap-3">
        {WEEKDAY_HEADERS.map(d => (
          <div key={d} className="text-[10px] font-bold text-center uppercase text-muted-foreground py-2">{d}</div>
        ))}
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`e-${i}`} className="aspect-square rounded-2xl bg-muted/10 border border-border/10 border-dashed" />
        ))}
        {daysInMonth.map(day => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayPosts = postsByDay[dayStr] || [];

          return (
            <CalendarDayCell
              key={dayStr}
              day={day}
              dayPosts={dayPosts}
              draggedPostId={draggedPostId}
              onDayClick={onDayClick}
              onDragStart={onDragStart}
              onDrop={(e) => onDrop(e, day)}
            />
          );
        })}
      </div>
    </div>
  );
}
