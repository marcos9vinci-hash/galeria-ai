import React from 'react';

export const SkeletonCard = () => <div className="h-64 w-full animate-pulse rounded-lg bg-muted" />;
export const SkeletonEditor = () => <div className="h-96 w-full animate-pulse rounded-lg bg-muted" />;
export const SkeletonList = () => <div className="grid grid-cols-7 gap-4">{Array.from({length: 28}).map((_, i) => <div key={i} className="h-32 rounded bg-muted" />)}</div>;
