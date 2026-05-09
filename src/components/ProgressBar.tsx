'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-extrabold text-[var(--color-duo-eel)]">{label}</div>
          <div className="text-xs font-black text-[var(--color-duo-green)]">{Math.round(progress)}%</div>
        </div>
      )}
      <div className="h-4 w-full bg-[var(--color-duo-swan)] rounded-full overflow-hidden relative">
        <motion.div
          className="h-full bg-[var(--color-duo-green)] rounded-full relative"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <div className="absolute inset-0 top-0.5 bg-[var(--color-duo-green-shadow)] rounded-full opacity-0" />
          <div className="absolute inset-x-0 top-0.5 h-1 bg-white/40 rounded-full mx-1" />
        </motion.div>
      </div>
    </div>
  );
}
