'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';

interface CredibilityRingProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
}

export function CredibilityRing({ score, size = 200, showLabel = true }: CredibilityRingProps) {
  const stroke = 16;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  const colorClass =
    score >= 70 ? 'duo-progress-bar-green' : score >= 40 ? 'duo-progress-bar-yellow' : 'duo-progress-bar-red';
  const textColor =
    score >= 70 ? 'text-[var(--color-duo-green)]' : score >= 40 ? 'text-[var(--color-duo-yellow-shadow)]' : 'text-[var(--color-duo-red)]';

  const label = score >= 70 ? '内容可信' : score >= 40 ? '部分存疑' : '高风险!';
  const emoji = score >= 70 ? '✅' : score >= 40 ? '⚠️' : '🚨';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            className="duo-progress-track"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            className={colorClass}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl mb-1">{emoji}</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className={cn('text-5xl font-black', textColor)}
          >
            {Math.round(score)}
          </motion.div>
          <div className="text-xs font-bold text-[var(--color-duo-wolf)] mt-0.5">/ 100</div>
        </div>
      </div>
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={cn('text-lg font-extrabold tracking-tight', textColor)}
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}
