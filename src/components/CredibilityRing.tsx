'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';

interface CredibilityRingProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
}

export function CredibilityRing({ score, size = 180, showLabel = true }: CredibilityRingProps) {
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  // Apple Health 风：基于评分动态定色（不是 conic gradient，因为评分是单值）
  const colorVar =
    score >= 70
      ? 'var(--color-system-green)'
      : score >= 40
        ? 'var(--color-system-orange)'
        : 'var(--color-system-red)';

  const textColorClass =
    score >= 70
      ? 'text-[var(--color-supported-text)]'
      : score >= 40
        ? 'text-[var(--color-nei-text)]'
        : 'text-[var(--color-refuted-text)]';

  const label = score >= 70 ? '内容可信' : score >= 40 ? '部分存疑' : '高风险';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id={`grad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorVar} stopOpacity="0.85" />
              <stop offset="100%" stopColor={colorVar} stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* 背景圈 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            className="stroke-gray-200"
          />

          {/* 进度圈 */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            stroke={`url(#grad-${score})`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 380, damping: 32 }}
            className={cn('font-semibold tabular-nums tracking-tight', textColorClass)}
            style={{ fontSize: size * 0.28, lineHeight: 1, letterSpacing: '-0.04em' }}
          >
            {Math.round(score)}
          </motion.div>
          <div className="type-caption text-text-3 mt-1.5">/ 100</div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col items-center gap-0.5"
        >
          <div className={cn('type-headline font-semibold', textColorClass)}>{label}</div>
          <div className="type-caption text-text-3">可信度评分</div>
        </motion.div>
      )}
    </div>
  );
}
