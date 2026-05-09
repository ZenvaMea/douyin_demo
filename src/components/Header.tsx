'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';
import { UserLevelBadge } from './UserLevelBadge.tsx';

export function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 h-[64px] bg-white transition-shadow duration-200',
        scrolled && 'shadow-[0_1px_0_var(--color-border)]',
      )}
    >
      <div className="max-w-[1080px] mx-auto h-full px-6 flex items-center justify-between">
        {/* === Logo: 大猫头鹰 === */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="text-3xl group-hover:animate-wiggle">🦉</span>
          <div className="flex flex-col leading-none">
            <span className="text-[16px] font-black text-text tracking-tight">打假搭子</span>
            <span className="text-[10px] font-bold text-text-3 mt-0.5 tracking-wider uppercase">
              Fact Buddy
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* === 防骗等级徽章 === */}
          <UserLevelBadge />

          {/* === GitHub === */}
          <a
            href="https://github.com/ZenvaMea/douyin_demo"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-[10px] bg-bg-soft hover:bg-[var(--color-border)] transition-colors text-[12px] font-bold text-text-2"
            aria-label="GitHub"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}
