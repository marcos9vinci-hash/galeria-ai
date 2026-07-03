import React, { memo } from 'react';
import { Plus } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { PostCard } from './PostCard';

export const PostList = memo(({ daysInMonth, startingDay, postsByDay, onDrop, setEditorState, draggedPostId, getPostTimeFormatted, statusOptions, onDragStart }) => {
  return (
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
            className={`aspect-square relative rounded-2xl flex flex-col transition-all group border-2 overflow-hidden
              ${today ? 'bg-primary/5 border-primary shadow-[0_0_15px_-5px_rgba(var(--primary),0.3)]' : 'bg-card border-border/40'}
              ${draggedPostId !== null ? 'hover:scale-105 hover:border-primary hover:shadow-xl' : ''}
              ${dayPosts.length > 0 ? 'ring-offset-2 ring-primary/20' : ''}
            `}
            onClick={() => { if (dayPosts.length > 0) setEditorState({ posts: dayPosts, index: 0 }); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, day)}
          >
            {dayPosts.length > 0 && (
              <PostCard 
                dayPosts={dayPosts} 
                onDragStart={onDragStart}
                onClick={() => { if (dayPosts.length > 0) setEditorState({ posts: dayPosts, index: 0 }); }}
                getPostTimeFormatted={getPostTimeFormatted}
                statusOptions={statusOptions}
              />
            )}
            
            {/* Day Number */}
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
      })}
    </div>
  );
});
