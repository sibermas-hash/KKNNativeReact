import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { mutationErrorHandler } from '@/lib/utils';
import type { User } from '../lib/user-types';

type UseUserMutationsOptions = {
  resetCreateForm: () => void;
  setShowForm: (value: boolean) => void;
  setEditingUser: (value: User | null) => void;
  setResetConfirmUser: (value: User | null) => void;
  closeEditModal: () => void;
};

export function useUserMutations(options: UseUserMutationsOptions) {
  const queryClient = useQueryClient();
  const { resetCreateForm, setShowForm, setEditingUser, setResetConfirmUser, closeEditModal } = options;
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.users.store(data),
    onSuccess: () => {
      invalidateUsers();
      resetCreateForm();
      setShowForm(false);
      toast.success('Pengguna ditambahkan');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.toggleStatus(id),
    onSuccess: () => { invalidateUsers(); toast.success('Status diubah'); },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => adminApi.users.updateRole(id, { role }),
    onSuccess: () => {
      invalidateUsers();
      setEditingUser(null);
      toast.success('Role berhasil diubah');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const resetPwMutation = useMutation({
    mutationFn: (id: number) => adminApi.users.resetPassword(id),
    onSuccess: (res: unknown) => {
      setResetConfirmUser(null);
      const data = res as { delivery?: string };
      toast.success(
        data?.delivery === 'default_ddmmyyyy'
          ? 'Password direset ke default DDMMYYYY. User wajib ganti password saat login.'
          : 'Password berhasil direset.'
      );
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      adminApi.users.update(id, payload),
    onSuccess: () => {
      invalidateUsers();
      closeEditModal();
      toast.success('Data pengguna berhasil diperbarui.');
    },
    onError: (queryError: unknown) => toast.error(mutationErrorHandler(queryError)),
  });

  return { createMutation, toggleMutation, roleMutation, resetPwMutation, editMutation };
}
