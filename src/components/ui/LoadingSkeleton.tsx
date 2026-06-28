import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-secondary ${className}`}
      aria-hidden="true"
    />
  );
}

export function SensorCardSkeleton() {
  return (
    <div className="rounded-xl p-4 border border-border bg-card">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <Skeleton className="w-14 h-5 rounded-full" />
      </div>
      <Skeleton className="w-20 h-7 mb-1" />
      <Skeleton className="w-16 h-4" />
    </div>
  );
}

export function AlertCardSkeleton() {
  return (
    <div className="rounded-xl p-4 border border-border bg-card">
      <div className="flex items-start justify-between mb-2">
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-16 h-5 rounded-full" />
      </div>
      <Skeleton className="w-full h-3 mb-1" />
      <Skeleton className="w-3/4 h-3 mb-3" />
      <div className="flex items-center justify-between">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-24 h-7 rounded-lg" />
      </div>
    </div>
  );
}