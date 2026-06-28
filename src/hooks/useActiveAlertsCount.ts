'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useActiveAlertsCount() {
  const [count, setCount] = useState(0);

  const fetchCount = useCallback(async () => {
    const { count, error } = await supabase
      .from('alerts')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .eq('acknowledged', false);

    if (error) {
      console.error('Error fetching active alerts count:', error.message);
      setCount(0);
      return;
    }

    setCount(count ?? 0);
  }, []);

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel('active-alerts-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alerts',
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCount]);

  return count;
}