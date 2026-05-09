'use client';

import { cn } from '@/lib/utils/cn.ts';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface DarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'tinted';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

/**
 * 暗色 Linear 风按钮
 * primary: 紫色渐变 + glow
 * secondary: 半透明白底
 * ghost: 透明
 * tinted: 紫色透明
 */
export function AppleButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullWidth,
  className,
  children,
  ...rest
}: DarkButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'btn-base',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'tinted' && 'btn-tinted',
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
      {iconRight && <span className="flex-shrink-0">{iconRight}</span>}
    </button>
  );
}
