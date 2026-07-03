import React from 'react';

export const DayColumn = ({ day, posts }: { day: string, posts: any[] }) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-bold text-sm text-center">{day}</div>
      {posts.map((post) => (
        <div key={post.id} className="p-2 border rounded shadow-sm">
          {post.caption}
        </div>
      ))}
    </div>
  );
};
