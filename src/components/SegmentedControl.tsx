'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn.ts';
import type { ReactNode } from 'react';

export interface SegmentOption<T extends string> {
  value: T;
  label: ReactNode;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  fullWidth?: boolean;
  layoutId?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  fullWidth,
  layoutId = 'segmented-indicator',
}: SegmentedControlProps<T>) {
  return (
    <div className={cn('duo-segment', fullWidth && 'flex w-full')}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 px-5 h-10 rounded-[10px] flex items-center justify-center gap-1.5',
            'text-[13px] font-extrabold transition-colors',
            fullWidth && 'flex-1',
            value === opt.value ? 'text-text' : 'text-text-3 hover:text-text-2',
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-white rounded-[10px] shadow-[0_2px_0_var(--color-border-strong)] border-2 border-[var(--color-border-strong)]"
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
