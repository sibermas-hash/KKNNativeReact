import { useQuery } from '@tanstack/react-query';
import type { ApiResponse } from '@sibermas/shared-types';
import { adminApi, rawApi } from '@/lib/api';
import type { FacultyOption, PaginatedUsersResponse, User } from '../lib/user-types';

type UseAdminUsersParams = {
  deferredSearch: string;
  roleFilter: string;
  statusFilter: string;
  facultyFilter: string;
  page: number;
  perPage: number;
  enabled: boolean;
};

export function useAdminUsers(params: UseAdminUsersParams) {
  const { deferredSearch, roleFilter, statusFilter, facultyFilter, page, perPage, enabled } = params;

  const usersQuery = useQuery<PaginatedUsersResponse>({
    queryKey: ['admin', 'users', { search: deferredSearch, roleFilter, statusFilter, facultyFilter, page, perPage }],
    queryFn: async () => {
      const response = await rawApi.get<ApiResponse<User[]>>('/admin/pengguna', {
        params: {
          search: deferredSearch || undefined,
          role: roleFilter || undefined,
          is_active: statusFilter === '' ? undefined : statusFilter === 'active',
          fakultas_id: facultyFilter || undefined,
          page,
          per_page: perPage,
        },
      });

      return {
        data: response.data.data ?? [],
        meta: response.data.meta,
      };
    },
    enabled,
    placeholderData: (previousData) => previousData,
  });

  const facultiesQuery = useQuery<FacultyOption[]>({
    queryKey: ['admin', 'fakultas', 'user-filters'],
    queryFn: async () => {
      const res = await adminApi.master.faculties.index({});
      return res as unknown as FacultyOption[];
    },
    enabled,
  });

  return { usersQuery, facultiesQuery };
}
