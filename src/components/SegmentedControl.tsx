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
    <div
      className={cn(
        'inline-flex p-1 rounded-[10px] bg-white/[0.04] relative',
        'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]',
        fullWidth && 'flex w-full',
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 px-4 h-9 rounded-[8px] flex items-center justify-center gap-1.5',
            'text-[13px] font-medium transition-colors',
            fullWidth && 'flex-1',
            value === opt.value ? 'text-text' : 'text-text-3 hover:text-text-2',
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-white/[0.08] rounded-[8px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
