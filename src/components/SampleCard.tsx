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
  /** 主题色（emoji 背景圈） */
  tint: 'red' | 'orange' | 'green' | 'blue' | 'purple';
}

const TINT_BG: Record<SampleCardProps['tint'], string> = {
  red: 'bg-[rgba(255,59,48,0.1)]',
  orange: 'bg-[rgba(255,149,0,0.1)]',
  green: 'bg-[rgba(52,199,89,0.1)]',
  blue: 'bg-[rgba(0,122,255,0.1)]',
  purple: 'bg-[rgba(175,82,222,0.1)]',
};

export function SampleCard({ sample, onClick, index, tint }: SampleCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.06, type: 'spring', stiffness: 380, damping: 32 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(sample)}
      className="apple-card text-left p-4 hover:shadow-apple-sm transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-xl',
            TINT_BG[tint],
          )}
        >
          {sample.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="type-callout font-semibold text-text mb-0.5">{sample.label}</div>
          <div className="type-caption text-text-3 line-clamp-2 leading-snug">{sample.title}</div>
        </div>
      </div>
    </motion.button>
  );
}
