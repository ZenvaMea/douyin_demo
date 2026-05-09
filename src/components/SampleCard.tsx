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
  themeClass: string;
}

export function SampleCard({ sample, onClick, index, themeClass }: SampleCardProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + index * 0.08, type: 'spring' }}
      whileHover={{ y: -3 }}
      whileTap={{ y: 0 }}
      onClick={() => onClick(sample)}
      className={cn('duo-card text-left transition-all hover:shadow-lg', themeClass)}
    >
      <div className="text-3xl mb-2">{sample.emoji}</div>
      <div className="text-sm font-black text-[var(--color-duo-eel)] mb-1">{sample.label}</div>
      <div className="text-xs font-bold text-[var(--color-duo-wolf)] line-clamp-2 leading-snug">
        {sample.title}
      </div>
    </motion.button>
  );
}
