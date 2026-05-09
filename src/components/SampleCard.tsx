'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';

export interface SampleData {
  emoji: string;
  label: string;
  title: string;
  author: string;
  transcript: string;
}

interface SampleCardProps {
  sample: SampleData;
  onClick: (sample: SampleData) => void;
  index: number;
  tint: 'red' | 'orange' | 'green' | 'blue' | 'purple';
}

const TINT_STYLE: Record<SampleCardProps['tint'], { bg: string; ring: string; glow: string }> = {
  red:    { bg: 'rgba(255,92,92,0.10)',  ring: 'rgba(255,92,92,0.25)',  glow: 'rgba(255,92,92,0.4)' },
  orange: { bg: 'rgba(255,178,36,0.10)', ring: 'rgba(255,178,36,0.25)', glow: 'rgba(255,178,36,0.4)' },
  green:  { bg: 'rgba(63,207,142,0.10)', ring: 'rgba(63,207,142,0.25)', glow: 'rgba(63,207,142,0.4)' },
  blue:   { bg: 'rgba(90,200,250,0.10)', ring: 'rgba(90,200,250,0.25)', glow: 'rgba(90,200,250,0.4)' },
  purple: { bg: 'rgba(124,92,255,0.10)', ring: 'rgba(124,92,255,0.25)', glow: 'rgba(124,92,255,0.4)' },
};

export function SampleCard({ sample, onClick, index, tint }: SampleCardProps) {
  const t = TINT_STYLE[tint];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 380, damping: 32 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(sample)}
      className={cn(
        'group relative text-left p-4 rounded-[14px] overflow-hidden',
        'bg-white/[0.03] hover:bg-white/[0.05] transition-all',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        'hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]',
      )}
    >
      {/* hover 时的彩色光晕 */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${t.glow} 0%, transparent 70%)`,
        }}
      />

      <div className="relative flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-xl"
          style={{
            background: t.bg,
            boxShadow: `inset 0 0 0 1px ${t.ring}`,
          }}
        >
          {sample.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-text mb-0.5">{sample.label}</div>
          <div className="text-[12px] text-text-3 line-clamp-2 leading-snug">
            {sample.title}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
