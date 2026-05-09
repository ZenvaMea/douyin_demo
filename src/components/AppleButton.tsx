'use client';

import { cn } from '@/lib/utils/cn.ts';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface AppleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** filled = 主行动 / tinted = 次行动 / plain = 文本 / gray = 中性 */
  variant?: 'filled' | 'tinted' | 'plain' | 'gray';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function AppleButton({
  variant = 'filled',
  size = 'md',
  icon,
  fullWidth,
  className,
  children,
  ...rest
}: AppleButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'btn-base',
        variant === 'filled' && 'btn-filled',
        variant === 'tinted' && 'btn-tinted',
        variant === 'plain' && 'btn-plain',
        variant === 'gray' && 'btn-gray',
        size === 'sm' && 'btn-sm',
        size === 'md' && 'btn-md',
        size === 'lg' && 'btn-lg',
        size === 'xl' && 'btn-xl',
        fullWidth && 'w-full',
        className,
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
