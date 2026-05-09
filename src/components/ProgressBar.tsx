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
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-[12px] font-medium text-text-2">{label}</div>
          <div className="text-[12px] tabular-nums text-text-3 font-mono">
            {Math.round(progress)}%
          </div>
        </div>
      )}
      <div className="h-1 w-full bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative"
          style={{
            background: 'linear-gradient(90deg, #7C5CFF 0%, #4A6FFF 100%)',
            boxShadow: '0 0 12px rgba(124, 92, 255, 0.6)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </div>
  );
}
