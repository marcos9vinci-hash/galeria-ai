import React from 'react';

export const CalendarView = ({ children }: { children: React.ReactNode }) => {
  return <div className="grid gap-6 md:grid-cols-[1fr,minmax(300px,400px)]">{children}</div>;
};
