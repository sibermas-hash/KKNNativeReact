import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import type { UserDetailPayload } from '../lib/user-types';

export function useUserDetail(editingId: number | null, enabled: boolean) {
  return useQuery<UserDetailPayload | null>({
    queryKey: ['admin', 'users', 'detail', editingId],
    queryFn: async () => {
      if (editingId === null) return null;
      return await adminApi.users.show(editingId) as unknown as UserDetailPayload;
    },
    enabled: editingId !== null && enabled,
  });
}
