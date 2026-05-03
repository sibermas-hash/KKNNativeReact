import { useQuery } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { periodContextEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function usePeriodContext(client: AxiosInstance) {
  const endpoints = periodContextEndpoints(client);

  return useQuery({
    queryKey: QUERY_KEYS.periodContext.all,
    queryFn: async () => {
      const res = await endpoints.get();
      return res.data;
    },
    staleTime: 60_000,
  });
}
