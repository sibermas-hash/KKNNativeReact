import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';
import { authEndpoints } from '@sibermas/api-client';
import { QUERY_KEYS } from '@sibermas/constants';

export function useAuth(client: AxiosInstance) {
  const endpoints = authEndpoints(client);
  const queryClient = useQueryClient();

  const useCurrentUser = () =>
    useQuery({
      queryKey: QUERY_KEYS.auth.user,
      queryFn: async () => {
        const res = await endpoints.user();
        return res.data;
      },
      retry: false,
      staleTime: 30_000,
    });

  const useCaptcha = () =>
    useQuery({
      queryKey: QUERY_KEYS.auth.captcha,
      queryFn: async () => {
        const res = await endpoints.captcha();
        return res.data;
      },
      staleTime: 0,
    });

  const useLogin = () =>
    useMutation({
      mutationFn: async (data: { login: string; password: string; captcha_id: string; captcha_answer: string }) => {
        const res = await endpoints.login(data);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auth.user });
      },
    });

  const useLogout = () =>
    useMutation({
      mutationFn: async () => {
        await endpoints.logout();
      },
      onSuccess: () => {
        queryClient.clear();
      },
    });

  const useForgotPassword = () =>
    useMutation({
      mutationFn: async (data: { email: string }) => {
        const res = await endpoints.forgotPassword(data);
        return res.data;
      },
    });

  const useResetPassword = () =>
    useMutation({
      mutationFn: async (data: { token: string; email: string; password: string; password_confirmation: string }) => {
        const res = await endpoints.resetPassword(data);
        return res.data;
      },
    });

  return { useCurrentUser, useCaptcha, useLogin, useLogout, useForgotPassword, useResetPassword };
}
