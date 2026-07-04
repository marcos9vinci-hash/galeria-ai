import React from 'react';

interface CalendarViewProps {
  posts: any[];
  onUpdatePost: (updated: any) => void;
  children?: React.ReactNode;
}

export const CalendarView = ({ posts, onUpdatePost, children }: CalendarViewProps) => {
  return <div className="grid gap-6 md:grid-cols-[1fr,minmax(300px,400px)]">{children}</div>;
};