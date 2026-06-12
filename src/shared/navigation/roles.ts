import { hasAnyRole } from '../auth/auth'
import type { AppRole, UserLike } from './types'

export const STUDENT_ROLES: AppRole[] = ['student', 'mahasiswa']
export const DOSEN_ROLES: AppRole[] = ['dosen', 'dpl']
export const ADMIN_ROLES: AppRole[] = ['admin', 'faculty_admin', 'superadmin']
export const EXTERNAL_ROLES: AppRole[] = ['external_lppm_admin']

export function canSee(user: UserLike, roles?: AppRole[]) {
  if (!roles?.length) return true
  return hasAnyRole(user, roles)
}
