'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Activity,
  Bell,
  Settings,
  Users,
} from 'lucide-react';

import type { UserProfile } from '@/types';
import { supabase } from '@/lib/supabaseClient';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

export default function BottomNav() {
  const pathname = usePathname();

  const [userRole, setUserRole] = useState<'admin' | 'operator' | null>(null);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  const fetchActiveAlertCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('alerts')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('acknowledged', false);

    if (error) {
      console.error('Error fetching active alert count:', error.message);
      setActiveAlertCount(0);
      return;
    }

    setActiveAlertCount(count ?? 0);
  }, []);

  useEffect(() => {
    try {
      const stored =
        sessionStorage.getItem('sbr_user') || localStorage.getItem('sbr_user');

      if (stored) {
        const user: UserProfile = JSON.parse(stored);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error('Error reading stored user:', error);
      setUserRole(null);
    }
  }, []);

  useEffect(() => {
    fetchActiveAlertCount();

    const channel = supabase
      .channel('bottom-nav-alert-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchActiveAlertCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchActiveAlertCount]);

  const navItems: NavItem[] = useMemo(() => {
    const items: NavItem[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'nav-monitoring',
        label: 'Monitoring',
        href: '/monitoring',
        icon: Activity,
      },
      {
        id: 'nav-alerts',
        label: 'Alerts',
        href: '/alerts-page',
        icon: Bell,
        badge: activeAlertCount,
      },
    ];

    if (userRole === 'admin') {
      items.push({
        id: 'nav-users',
        label: 'Users',
        href: '/admin',
        icon: Users,
      });
    }

    items.push({
      id: 'nav-settings',
      label: 'Settings',
      href: '/settings',
      icon: Settings,
    });

    return items;
  }, [userRole, activeAlertCount]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const NavIcon = item.icon;

          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);

          const badgeCount = item.badge ?? 0;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1 relative
                transition-all duration-150 active:scale-95
                ${
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}

              <span className="relative">
                <NavIcon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  aria-hidden="true"
                />

                {badgeCount > 0 && (
                  <span
                    className="
                      absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1
                      rounded-full bg-status-critical text-white text-[10px]
                      font-bold flex items-center justify-center
                    "
                    aria-label={`${badgeCount} active alerts`}
                  >
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </span>

              <span className="text-[10px] font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}