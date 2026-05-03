import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useWorkPrograms(client: AxiosInstance) {
  const endpoints = studentEndpoints(client);

  return useQuery({
    queryKey: QUERY_KEYS.student.workPrograms,
    queryFn: async () => {
      const res = await endpoints.workPrograms.index();
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useWorkProgram(client: AxiosInstance, id: number) {
  const endpoints = studentEndpoints(client);

  return useQuery({
    queryKey: QUERY_KEYS.student.workProgram(id),
    queryFn: async () => {
      const res = await endpoints.workPrograms.show(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkProgram(client: AxiosInstance) {
  const endpoints = studentEndpoints(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await endpoints.workPrograms.store(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.workPrograms });
    },
  });
}
