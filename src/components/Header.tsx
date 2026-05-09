'use client';

import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b-2 border-[var(--color-duo-swan)] bg-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="text-3xl group-hover:scale-110 transition-transform">🛡️</div>
          <div>
            <div className="text-lg font-black text-[var(--color-duo-green)] leading-none">
              打假搭子
            </div>
            <div className="text-[10px] font-bold text-[var(--color-duo-wolf)] tracking-widest uppercase mt-0.5">
              Fact Buddy
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-duo-green-bg)] border border-[var(--color-duo-green-light)]">
            <span className="text-base">🦉</span>
            <span className="text-xs font-extrabold text-[var(--color-duo-green-shadow)]">
              刷之前先核一下
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
