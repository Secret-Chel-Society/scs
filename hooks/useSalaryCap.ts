'use client'

import { useState, useEffect } from 'react';
import { getSalaryCap, subscribeToSalaryCap } from '@/lib/team-utils';

export function useSalaryCap() {
  const [salaryCap, setSalaryCap] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initial load of salary cap
  useEffect(() => {
    const loadSalaryCap = async () => {
      try {
        setIsLoading(true);
        const cap = await getSalaryCap();
        setSalaryCap(cap);
      } catch (err) {
        console.error('Error loading salary cap:', err);
        setError(err instanceof Error ? err : new Error('Failed to load salary cap'));
      } finally {
        setIsLoading(false);
      }
    };

    loadSalaryCap();

    // Subscribe to real-time updates
    const unsubscribe = subscribeToSalaryCap((newCap) => {
      setSalaryCap(newCap);
    });

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { salaryCap, isLoading, error };
}
