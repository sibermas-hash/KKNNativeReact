import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { clsx } from 'clsx';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

interface RegistrationHeaderProps {
  readyToRegister: boolean;
}

export const RegistrationHeader: React.FC<RegistrationHeaderProps> = ({ readyToRegister }) => {
  return (
    <motion.section
      variants={itemVariants}
      className="relative rounded-[4rem] bg-emerald-50 border border-emerald-100 p-12 lg:p-20 text-bg-emerald-100 shadow-lg group"
    >
      <div className="absolute top-0 right-0 h-full w-1/2 bg-emerald-600 opacity-5 -skew-x-12 translate-x-1/4 pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-64 w-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-16">
        <div className="space-y-8 max-w-3xl">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 rounded-3xl bg-emerald-600 flex items-center justify-center text-white shadow-2xl shadow-emerald-500/20">
              <Zap size={30} strokeWidth={2.5} />
            </div>
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">
                Pendaftaran KKN
              </h4>
              <p className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                Mulai <span className="text-emerald-500">Pendaftaran.</span>
              </p>
            </div>
          </div>
          <p className="text-base font-bold text-gray-400 leading-relaxed uppercase tracking-[0.05em] opacity-80 max-w-xl">
            Pilih skema KKN dan lengkapi prasyarat operasional. Database akan memproses
            penempatan berdasarkan kualifikasi akademik dan domisili terverifikasi.
          </p>
        </div>

        <div className="flex flex-col gap-4 min-w-[320px]">
          <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 space-y-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
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
                <span className="text-[10px] font-black text-white uppercase">
                  {readyToRegister ? 'SIAP DAFTAR' : 'BELUM LENGKAP'}
                </span>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide leading-relaxed px-2">
              Sistem hanya menerima aplikasi dari mahasiswa yang telah memenuhi syarat SKS,
              BTA-PPI, dan kesehatan dokumen.
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
