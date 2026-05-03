import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useDailyReports(client: AxiosInstance, page = 1) {
  const endpoints = studentEndpoints(client);

  return useQuery({
    queryKey: QUERY_KEYS.student.dailyReports(page),
    queryFn: async () => {
      const res = await endpoints.dailyReports.index(page);
      return res.data;
    },
    staleTime: 10_000,
  });
}

export function useDailyReport(client: AxiosInstance, id: number) {
  const endpoints = studentEndpoints(client);

  return useQuery({
    queryKey: QUERY_KEYS.student.dailyReport(id),
    queryFn: async () => {
      const res = await endpoints.dailyReports.show(id);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateDailyReport(client: AxiosInstance) {
  const endpoints = studentEndpoints(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FormData) => {
      const res = await endpoints.dailyReports.store(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
  });
}

export function useUpdateDailyReport(client: AxiosInstance) {
  const endpoints = studentEndpoints(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const res = await endpoints.dailyReports.update(id, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReport(variables.id) });
    },
  });
}

export function useDeleteDailyReport(client: AxiosInstance) {
  const endpoints = studentEndpoints(client);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await endpoints.dailyReports.destroy(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
  });
}
