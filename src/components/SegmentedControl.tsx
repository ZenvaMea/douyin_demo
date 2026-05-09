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
  /** 用于 layoutId 区分多个 SegmentedControl 实例 */
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
        'inline-flex p-1 rounded-[10px] bg-gray-200/60 relative',
        fullWidth && 'flex w-full',
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 px-4 h-8 rounded-[7px] flex items-center justify-center gap-1.5',
            'type-callout font-semibold transition-colors',
            fullWidth && 'flex-1',
            value === opt.value ? 'text-text' : 'text-text-2 hover:text-text',
          )}
        >
          {value === opt.value && (
            <motion.div
              layoutId={layoutId}
              className="absolute inset-0 bg-surface rounded-[7px] shadow-apple-xs"
              transition={{ type: 'spring', stiffness: 380, damping: 32, mass: 0.8 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-1.5">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
