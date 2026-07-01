import React from "react";
import { motion } from "motion/react";
import { Plus, Clock } from "lucide-react";
import { format, isToday } from "date-fns";

const STATUS_OPTIONS_LOCAL = [
  { value: "rascunho", label: "Rascunho", color: "bg-yellow-500" },
  { value: "pronto", label: "Pronto", color: "bg-blue-500" },
  { value: "agendado", label: "Agendado", color: "bg-indigo-600 animate-pulse" },
  { value: "publicado", label: "Publicado", color: "bg-green-500" },
];

function getPostTimeFormatted(post: any) {
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
}

interface CalendarDayCellProps {
  day: Date;
  dayPosts: any[];
  draggedPostId: number | null;
  onDayClick: (posts: any[]) => void;
  onDragStart: (e: React.DragEvent, postId: number) => void;
  onDrop: (e: React.DragEvent) => void;
  key?: string;
}

export default function CalendarDayCell({
  day,
  dayPosts,
  draggedPostId,
  onDayClick,
  onDragStart,
  onDrop,
}: CalendarDayCellProps) {
  const today = isToday(day);
  const dayStr = format(day, 'yyyy-MM-dd');
  const firstPost = dayPosts[0];
  const statusColor = firstPost
    ? STATUS_OPTIONS_LOCAL.find(s => s.value === firstPost.status)?.color
    : 'bg-gray-400';

  return (
    <div
      key={dayStr}
      className={`aspect-square relative rounded-2xl flex flex-col transition-all group border-2 overflow-hidden
        ${today ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)]' : 'bg-card border-border/40'}
        ${draggedPostId !== null ? 'hover:scale-105 hover:border-primary hover:shadow-xl' : ''}
        ${dayPosts.length > 0 ? 'ring-offset-2 ring-primary/20' : ''}
      `}
      onClick={() => { if (dayPosts.length > 0) onDayClick(dayPosts); }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      {dayPosts.length > 0 && firstPost && (
        <div
          draggable
          onDragStart={(e) => onDragStart(e, firstPost.id)}
          className="absolute inset-0 cursor-pointer"
        >
          <img
            src={firstPost.image}
            alt=""
            className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-150"
          />
          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${statusColor}`} />
          {dayPosts.length > 1 && (
            <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1 rounded-sm">
              +{dayPosts.length - 1}
            </div>
          )}
          {getPostTimeFormatted(firstPost) && (
            <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-[1px] text-white py-0.5 px-1 flex items-center justify-between text-[8px] font-bold">
              <span className="flex items-center gap-0.5 text-amber-300">
                <Clock className="w-2 h-2 text-amber-300" />
                {getPostTimeFormatted(firstPost)}
              </span>
              <span className="capitalize text-[7px] text-gray-300 truncate max-w-[30px]">
                {firstPost.type}
              </span>
            </div>
          )}
        </div>
      )}

      <span className={`absolute top-2 left-2 z-10 text-[10px] font-bold ${today ? 'text-primary' : 'text-muted-foreground'} ${dayPosts.length > 0 ? 'bg-black/50 text-white px-1.5 py-0.5 rounded-full' : ''}`}>
        {format(day, 'd')}
      </span>

      {dayPosts.length === 0 && (
        <div className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-muted-foreground/40" />
        </div>
      )}
    </div>
  );
}

export { getPostTimeFormatted };
