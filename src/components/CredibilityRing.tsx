'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';

interface CredibilityRingProps {
  score: number;
  size?: number;
  showLabel?: boolean;
}

export function CredibilityRing({ score, size = 180, showLabel = true }: CredibilityRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  const config =
    score >= 70
      ? { color: 'var(--color-supported)', textColor: 'var(--color-supported-text)', label: '内容可信', emoji: '🎉' }
      : score >= 40
        ? { color: 'var(--color-nei)', textColor: 'var(--color-nei-text)', label: '部分存疑', emoji: '🤔' }
        : { color: 'var(--color-refuted)', textColor: 'var(--color-refuted-text)', label: '高风险', emoji: '🚨' };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* 背景圈 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            stroke="var(--color-bg-soft)"
          />

          {/* 进度圈 */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            stroke={config.color}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 1.0, ease: [0.32, 0.72, 0, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl mb-1.5">{config.emoji}</div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 380, damping: 32 }}
            className={cn('font-black tabular-nums tracking-[-0.04em]')}
            style={{
              fontSize: size * 0.3,
              lineHeight: 1,
              color: config.textColor,
            }}
          >
            {Math.round(score)}
          </motion.div>
          <div className="text-[11px] font-extrabold text-text-3 mt-1.5 tracking-wider">/ 100</div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="text-[18px] font-black tracking-tight" style={{ color: config.textColor }}>
            {config.label}
          </div>
          <div className="text-[11px] font-extrabold text-text-3 uppercase tracking-[0.12em]">
            可信度评分
          </div>
        </motion.div>
      )}
    </div>
  );
}
