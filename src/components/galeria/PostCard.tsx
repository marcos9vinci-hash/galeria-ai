import React, { memo } from 'react';
import { Clock } from 'lucide-react';

export const PostCard = memo(({ dayPosts, onDragStart, onClick, getPostTimeFormatted, statusOptions }) => {
  const post = dayPosts[0];
  const timeFormatted = getPostTimeFormatted(post);
  const statusColor = statusOptions.find(s => s.value === post.status)?.color || 'bg-gray-400';

  return (
    <div 
      draggable 
      onDragStart={(e) => onDragStart(e, post.id)}
      onClick={onClick}
      className="absolute inset-0 cursor-pointer"
    >
      <img src={post.image} alt="" className="w-full h-full object-cover animate-in fade-in zoom-in-95 duration-150" />
      <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${statusColor}`} />
      {dayPosts.length > 1 && (
        <div className="absolute top-1 left-1 bg-black/75 backdrop-blur-xs text-white text-[8px] font-bold px-1 rounded-sm">
          +{dayPosts.length - 1}
        </div>
      )}
      {timeFormatted && (
        <div className="absolute inset-x-0 bottom-0 bg-black/75 backdrop-blur-[1px] text-white py-0.5 px-1 flex items-center justify-between text-[8px] font-bold">
          <span className="flex items-center gap-0.5 text-amber-300">
            <Clock className="w-2 h-2 text-amber-300" />
            {timeFormatted}
          </span>
          <span className="capitalize text-[7px] text-gray-300 truncate max-w-[30px]">
            {post.type}
          </span>
        </div>
      )}
    </div>
  );
});
