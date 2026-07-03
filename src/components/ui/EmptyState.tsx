import React from 'react';

export const EmptyState = ({ title, description }: { title: string, description: string }) => (
  <div className="flex flex-col items-center justify-center p-8 text-center">
    <h3 className="text-lg font-bold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);
