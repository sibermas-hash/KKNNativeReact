import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MapPin } from 'lucide-react';
import { WarningMessage } from '@/Pages/Student/Register/Components/WarningMessage';
import type { ProfileSummary, DomicileSummary } from '@/Pages/Student/Register/types';

interface NotificationPanelProps {
  bpjs_profile?: ProfileSummary | null;
  domicile_profile?: DomicileSummary | null;
}

export const NotificationPanel = ({ bpjs_profile, domicile_profile }: NotificationPanelProps) => {
  return (
    <AnimatePresence>
      {(bpjs_profile && !bpjs_profile.is_complete) ||
      (domicile_profile && !domicile_profile.is_complete) ? (
        <div className="space-y-6">
          {bpjs_profile && !bpjs_profile.is_complete && (
            <WarningMessage
              title="Dossier Incomplete"
              description={`Data profil wajib dilengkapi: ${bpjs_profile.missing_fields.map((f) => f.label).join(', ')}.`}
              actionHref={bpjs_profile.profile_url}
              actionLabel="Sync Profile"
              icon={Activity}
            />
          )}
          {domicile_profile && !domicile_profile.is_complete && (
            <WarningMessage
              title="Verification Failed"
              description={`Lengkapi verifikasi domisili untuk plotting: ${domicile_profile.missing_fields.map((f) => f.label).join(', ')}.`}
              actionHref={domicile_profile.profile_url}
              actionLabel="Verify Address"
              icon={MapPin}
            />
          )}
        </div>
      ) : null}
    </AnimatePresence>
  );
};
