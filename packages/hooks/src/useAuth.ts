import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { AxiosInstance } from 'axios';
import { authEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useAuth(client: AxiosInstance) {
  const endpoints = useMemo(() => authEndpoints(client), [client]);
  const queryClient = useQueryClient();

  const useCurrentUser = () =>
    useQuery({
      queryKey: QUERY_KEYS.auth.user,
      queryFn: () => endpoints.user(),
      retry: false,
      staleTime: 30_000,
    });

  const useCaptcha = () =>
    useQuery({
      queryKey: QUERY_KEYS.auth.captcha,
      queryFn: () => endpoints.captcha(),
      staleTime: 0,
    });

  const useLogin = () =>
    useMutation({
      mutationFn: (data: { login: string; password: string; captcha_id: string; captcha_answer: string }) =>
        endpoints.login(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
      },
    });

  const useLogout = () =>
    useMutation({
      mutationFn: () => endpoints.logout(),
      onSuccess: () => {
        queryClient.clear();
      },
    });

  const useForgotPassword = () =>
    useMutation({
      mutationFn: (data: { email: string }) => endpoints.forgotPassword(data),
    });

  const useResetPassword = () =>
    useMutation({
      mutationFn: (data: { token: string; email: string; password: string; password_confirmation: string }) =>
        endpoints.resetPassword(data),
    });

  return { useCurrentUser, useCaptcha, useLogin, useLogout, useForgotPassword, useResetPassword };
}
