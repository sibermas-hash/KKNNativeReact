import type { NavItem } from './types'

export type PhaseState = {
  currentPhase?: string
  disabledReason?: string
}

export function usePhaseDisabled(item: Pick<NavItem, 'phase' | 'disabled'>, state: PhaseState = {}) {
  if (item.disabled) return { disabled: true, reason: 'Belum tersedia.' }
  if (!item.phase) return { disabled: false, reason: undefined }

  // Placeholder: sambungkan ke phase KKN dari backend/dashboard saat kontrak final.
  const disabled = Boolean(state.currentPhase && state.currentPhase !== item.phase)
  return { disabled, reason: disabled ? state.disabledReason ?? `Aktif saat fase ${item.phase}.` : undefined }
}
