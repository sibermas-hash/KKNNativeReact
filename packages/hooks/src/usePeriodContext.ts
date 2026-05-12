import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { periodContextEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';
import { useMemo } from 'react';

export function usePeriodContext(client: AxiosInstance) {
  const endpoints = useMemo(() => periodContextEndpoints(client), [client]);

  return useQuery({
    queryKey: QUERY_KEYS.periodContext.all,
    queryFn: async () => {
      const data = await endpoints.get();
      return data;
    },
    staleTime: 60_000,
  });
}
