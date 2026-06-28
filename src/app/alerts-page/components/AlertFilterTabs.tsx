'use client';

import React from 'react';

export type AlertFilter = 'all' | 'active' | 'critical' | 'acknowledged';

interface AlertFilterTabsProps {
  activeFilter: AlertFilter;
  onFilterChange: (filter: AlertFilter) => void;
  counts: Record<AlertFilter, number>;
}

const TABS: { id: AlertFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'critical', label: 'Critical' },
  { id: 'acknowledged', label: 'Done' },
];

export default function AlertFilterTabs({
  activeFilter,
  onFilterChange,
  counts,
}: AlertFilterTabsProps) {
  return (
    <div
      className="flex gap-1 p-1 rounded-xl bg-secondary mx-4"
      role="tablist"
      aria-label="Alert filters"
    >
      {TABS.map((tab) => {
        const isActive = activeFilter === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={`filter-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onFilterChange(tab.id)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold
              transition-all duration-150 active:scale-95
              ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            <span>{tab.label}</span>

            {count > 0 && (
              <span
                className={`
                  inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold
                  ${
                    tab.id === 'critical'
                      ? 'bg-status-critical/20 text-status-critical'
                      : tab.id === 'active'
                        ? 'bg-status-warning/20 text-status-warning'
                        : isActive
                          ? 'bg-secondary text-muted-foreground'
                          : 'bg-secondary/80 text-muted-foreground'
                  }
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}