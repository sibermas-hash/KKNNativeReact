import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { clsx } from 'clsx';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

interface RegistrationHeaderProps {
  readyToRegister: boolean;
}

export const RegistrationHeader: React.FC<RegistrationHeaderProps> = ({ readyToRegister }) => {
  return (
    <motion.section
      variants={itemVariants}
      className="relative rounded-[4rem] bg-[#e8f5ee] border border-gray-200 p-12 lg:p-20 text-bg-[#e8f5ee] shadow-lg group"
    >
      <div className="absolute top-0 right-0 h-full w-1/2 bg-[#16a34a] opacity-5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
        <div className="space-y-8 max-w-3xl">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-xl bg-[#16a34a] flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
              <Zap size={30} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-[0.4em] text-[#1a7a4a]">
                Pendaftaran KKN
              </h4>
              <p className="text-4xl md:text-6xl font-bold tracking-tighter uppercase leading-none">
                Mulai <span className="text-[#1a7a4a]">Pendaftaran.</span>
              </p>
            </div>
          </div>
          <p className="text-base font-bold text-gray-900 leading-relaxed uppercase tracking-wider opacity-80 max-w-xl">
            Pilih skema KKN dan lengkapi prasyarat operasional. Database akan memproses
            penempatan berdasarkan kualifikasi akademik dan domisili terverifikasi.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-w-[320px]">
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-xs font-bold text-[#1a7a4a] uppercase tracking-widest">
                Status Syarat
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    'h-2 w-2 rounded-full',
                    readyToRegister
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50'
                      : 'bg-rose-500',
                  )}
                />
                <span className="text-xs font-bold text-white uppercase">
                  {readyToRegister ? 'SIAP DAFTAR' : 'BELUM LENGKAP'}
                </span>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <p className="text-xs font-bold text-gray-900 uppercase tracking-wide leading-relaxed px-2">
              Sistem hanya menerima aplikasi dari mahasiswa yang telah memenuhi syarat SKS,
              BTA-PPI, dan kesehatan dokumen.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
