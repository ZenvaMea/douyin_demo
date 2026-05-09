'use client';

import { cn } from '@/lib/utils/cn.ts';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface DuoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function DuoButton({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  ...rest
}: DuoButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'duo-btn',
        variant === 'primary' && 'duo-btn-primary',
        variant === 'secondary' && 'duo-btn-secondary',
        variant === 'ghost' && 'duo-btn-ghost',
        size === 'sm' && 'text-xs px-4 py-2',
        size === 'md' && 'text-sm px-6 py-3',
        size === 'lg' && 'text-base px-8 py-4',
        fullWidth && 'w-full',
        className,
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}
