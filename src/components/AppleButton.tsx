'use client';

import { cn } from '@/lib/utils/cn.ts';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface DuoButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

/**
 * 多邻国 3D 按钮（柔和版）
 * primary: 绿色 3D 立体（多邻国标志）
 * secondary: 白底灰边
 * ghost: 透明
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
}: DuoButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'duo-btn',
        variant === 'primary' && 'duo-btn-primary',
        variant === 'secondary' && 'duo-btn-secondary',
        variant === 'ghost' && 'duo-btn-ghost',
        size === 'sm' && 'duo-btn-sm',
        size === 'md' && 'duo-btn-md',
        size === 'lg' && 'duo-btn-lg',
        size === 'xl' && 'duo-btn-xl',
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
