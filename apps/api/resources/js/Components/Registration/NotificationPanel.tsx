import { motion, AnimatePresence } from 'framer-motion';
import { Activity, MapPin } from 'lucide-react';
import { WarningMessage } from '@/Pages/Student/Register/Components/WarningMessage';
import type { ProfileSummary, DomicileSummary } from '@/Pages/Student/Register/types';

interface NotificationPanelProps {
  biodata_profile?: ProfileSummary | null;
  domicile_profile?: DomicileSummary | null;
}

export const NotificationPanel = ({
  biodata_profile,
  domicile_profile,
}: NotificationPanelProps) => {
  return (
    <AnimatePresence>
      {(biodata_profile && !biodata_profile.is_complete) ||
      (domicile_profile && !domicile_profile.is_complete) ? (
        <div className="space-y-6">
          {biodata_profile && !biodata_profile.is_complete && (
            <WarningMessage
              title="Biodata Belum Lengkap"
              description={`Data biodata profil wajib dilengkapi: ${biodata_profile.missing_fields.map((f) => f.label).join(', ')}.`}
              actionHref={biodata_profile.profile_url}
              actionLabel="Lengkapi Biodata"
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
