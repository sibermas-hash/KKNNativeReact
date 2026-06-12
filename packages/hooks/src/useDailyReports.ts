import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import { studentEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useDailyReports(client: AxiosInstance, page = 1) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);

  return useQuery({
    queryKey: QUERY_KEYS.student.dailyReports(page),
    queryFn: () => endpoints.dailyReports.index(page),
    staleTime: 10_000,
  });
}

export function useDailyReport(client: AxiosInstance, id: number | undefined) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);

  return useQuery({
    queryKey: QUERY_KEYS.student.dailyReport(id!),
    queryFn: () => endpoints.dailyReports.show(id!),
    enabled: !!id,
  });
}

export function useCreateDailyReport(client: AxiosInstance) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FormData) => endpoints.dailyReports.store(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
  });
}

export function useUpdateDailyReport(client: AxiosInstance) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) => endpoints.dailyReports.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReport(variables.id) });
    },
  });
}

export function useDeleteDailyReport(client: AxiosInstance) {
  const endpoints = useMemo(() => studentEndpoints(client), [client]);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => endpoints.dailyReports.destroy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dailyReports() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.student.dashboard });
    },
  });
}
