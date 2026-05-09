'use client';

import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  label?: string;
}

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-[12px] font-extrabold text-text-2">{label}</div>
          <div className="text-[12px] tabular-nums font-extrabold text-duo">
            {Math.round(progress)}%
          </div>
        </div>
      )}
      <div className="h-2.5 w-full bg-bg-soft rounded-full overflow-hidden border-2 border-[var(--color-border)]">
        <motion.div
          className="h-full rounded-full bg-duo"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </div>
  );
}
