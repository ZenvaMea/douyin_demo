'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';

interface CredibilityRingProps {
  score: number; // 0-100
  size?: number;
  showLabel?: boolean;
}

export function CredibilityRing({ score, size = 200, showLabel = true }: CredibilityRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;

  // 根据评分选色（暗色背景下更鲜亮）
  const config =
    score >= 70
      ? { color: '#3FCF8E', glow: 'rgba(63, 207, 142, 0.5)', label: '内容可信', textColor: '#5BE9A9' }
      : score >= 40
        ? { color: '#FFB224', glow: 'rgba(255, 178, 36, 0.5)', label: '部分存疑', textColor: '#FFC85C' }
        : { color: '#FF5C5C', glow: 'rgba(255, 92, 92, 0.5)', label: '高风险', textColor: '#FF8585' };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        {/* 外发光 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${config.glow} 0%, transparent 70%)`,
            filter: 'blur(20px)',
            opacity: 0.6,
          }}
        />

        <svg width={size} height={size} className="-rotate-90 relative">
          <defs>
            <linearGradient id={`grad-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.color} stopOpacity="0.7" />
              <stop offset="100%" stopColor={config.color} stopOpacity="1" />
            </linearGradient>
            <filter id={`glow-${score}`}>
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 背景圈 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
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
            filter={`url(#glow-${score})`}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dash} ${circumference}` }}
            transition={{ duration: 1.0, ease: [0.32, 0.72, 0, 1] }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 380, damping: 32 }}
            className={cn('font-semibold tabular-nums tracking-[-0.04em]')}
            style={{
              fontSize: size * 0.32,
              lineHeight: 1,
              color: config.textColor,
            }}
          >
            {Math.round(score)}
          </motion.div>
          <div className="text-[11px] font-mono text-text-3 mt-2 tracking-[0.1em]">
            / 100
          </div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-1"
        >
          <div className="text-[18px] font-semibold tracking-tight" style={{ color: config.textColor }}>
            {config.label}
          </div>
          <div className="text-[11px] text-text-3 uppercase tracking-[0.12em]">可信度评分</div>
        </motion.div>
      )}
    </div>
  );
}
