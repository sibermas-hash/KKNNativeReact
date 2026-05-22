'use client';

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';

/**
 * IndexedDB persister for React Query.
 * Stores query cache in IndexedDB so data survives page reload
 * and is available offline (PWA). Only persists successful queries
 * with gcTime > 0.
 */
const idbPersister = {
  persistClient: async (client: unknown) => {
    await set('sibermas-query-cache', client);
  },
  restoreClient: async () => {
    return await get('sibermas-query-cache');
  },
  removeClient: async () => {
    await del('sibermas-query-cache');
  },
};

interface QueryPersistProps {
  queryClient: QueryClient;
}

/**
 * Mounts persistence for the QueryClient.
 * Renders nothing — just a side-effect hook.
 * 
 * Usage: <QueryPersist queryClient={queryClient} />
 * Place inside QueryClientProvider.
 */
export function QueryPersist({ queryClient }: QueryPersistProps): null {
  useEffect(() => {
    const [unsubscribe] = persistQueryClient({
      queryClient: queryClient as any,
      persister: idbPersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      buster: '', // cache buster — change to invalidate all persisted data
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // Only persist successful queries that aren't stale-only
          return query.state.status === 'success' && query.gcTime !== 0;
        },
      },
    });
    return unsubscribe;
  }, [queryClient]);

  return null;
}
