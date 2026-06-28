'use client';

import React from 'react';
import type { TimeFilter } from './MonitoringClient';

interface TimeFilterTabsProps {
  activeFilter: TimeFilter;
  onFilterChange: (filter: TimeFilter) => void;
}

const FILTERS: { id: TimeFilter; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 Days' },
  { id: '30d', label: '30 Days' },
];

export default function TimeFilterTabs({
  activeFilter,
  onFilterChange,
}: TimeFilterTabsProps) {
  return (
    <div
      className="flex rounded-xl p-1 gap-1"
      style={{ backgroundColor: 'var(--secondary)' }}
      role="tablist"
      aria-label="Time range filter"
    >
      {FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(filter.id)}
            className={`
              flex-1 py-2 px-2 rounded-lg text-xs font-semibold transition-all duration-200
              ${
                isActive
                  ? 'text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
            style={
              isActive
                ? {
                    backgroundColor: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                  }
                : undefined
            }
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}