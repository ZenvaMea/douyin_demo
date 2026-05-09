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
          <div className="type-caption font-semibold text-text-2">{label}</div>
          <div className="type-caption tabular-nums text-text-3">{Math.round(progress)}%</div>
        </div>
      )}
      <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-system-blue rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
        />
      </div>
    </div>
  );
}
