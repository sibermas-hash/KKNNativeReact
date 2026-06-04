import type { UseMutationResult } from '@tanstack/react-query';
import { ConfirmDialog } from '@/components/ui/shared';
import type { User } from '../lib/user-types';

type Props = { user: User | null; onClose: () => void; resetPwMutation: UseMutationResult<unknown, unknown, number> };

export function ResetPasswordConfirm({ user, onClose, resetPwMutation }: Props) {
  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      onConfirm={() => { if (user !== null) resetPwMutation.mutate(user.id); }}
      title="Reset Password"
      description={user ? `Password ${user.name} (${user.username}) akan direset ke default DDMMYYYY berdasarkan tanggal lahir. User wajib mengganti password setelah login.` : ''}
      confirmText="Reset ke DDMMYYYY"
      variant="warning"
    />
  );
}
