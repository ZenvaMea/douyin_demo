'use client';

import { motion } from 'framer-motion';

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
}

/**
 * 样本卡片：白底 + 大 emoji + 友好文案
 * 不再用艳丽彩色边框，统一用主绿色 hover 状态
 */
export function SampleCard({ sample, onClick, index }: SampleCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.08, type: 'spring', stiffness: 380, damping: 32 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(sample)}
      className="duo-card text-left p-5 hover:border-[var(--color-duo)] hover:shadow-[0_4px_0_var(--color-duo)] transition-all"
    >
      <div className="text-4xl mb-3">{sample.emoji}</div>
      <div className="text-[14px] font-extrabold text-text mb-1.5">{sample.label}</div>
      <div className="text-[12px] font-bold text-text-3 line-clamp-2 leading-snug">
        {sample.title}
      </div>
    </motion.button>
  );
}
