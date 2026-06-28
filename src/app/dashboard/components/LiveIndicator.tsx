'use client';

import React, { useMemo } from 'react';
import { Radio } from 'lucide-react';

interface LiveIndicatorProps {
  lastReadingTime: string;
  readingCount: number;
}

function formatTime(lastReadingTime: string) {
  if (!lastReadingTime) return '';

  const date = new Date(lastReadingTime);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export default function LiveIndicator({
  lastReadingTime,
  readingCount,
}: LiveIndicatorProps) {
  const displayTime = useMemo(
    () => formatTime(lastReadingTime),
    [lastReadingTime]
  );

  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <Radio
          size={13}
          className="text-primary live-pulse"
          aria-hidden="true"
        />

        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          Live
        </span>

        <span className="text-xs text-muted-foreground">
          · Updates every 5s
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-muted-foreground">
          #{readingCount} readings
        </span>

        {displayTime && (
          <span className="text-[11px] font-mono text-muted-foreground">
            {displayTime}
          </span>
        )}
      </div>
    </div>
  );
}