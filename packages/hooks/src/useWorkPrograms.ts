import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useWorkPrograms(client: AxiosInstance) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);

  return useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: () => endpoints.workPrograms.index(),
    staleTime: 30_000,
  });
}

export function useWorkProgram(client: AxiosInstance, id: number | undefined) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);

  return useQuery({
    queryKey: QUERY_KEYS.student.workProgram(id!),
    queryFn: () => endpoints.workPrograms.show(id!),
    enabled: !!id,
  });
}

export function useCreateWorkProgram(client: AxiosInstance) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => endpoints.workPrograms.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.workPrograms });
    },
  });
}
