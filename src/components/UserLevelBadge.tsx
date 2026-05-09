'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getCheckCount, getUserLevel, type UserLevel } from '@/lib/utils/userLevel.ts';

/**
 * 防骗等级徽章（Header 右侧）
 * 点击展开详情卡片
 * 监听 factbuddy:count-update 事件实时更新
 */
export function UserLevelBadge() {
  const [level, setLevel] = useState<UserLevel | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setLevel(getUserLevel(getCheckCount()));
    const onUpdate = (e: Event) => {
      const custom = e as CustomEvent<number>;
      setLevel(getUserLevel(custom.detail));
    };
    window.addEventListener('factbuddy:count-update', onUpdate);
    return () => window.removeEventListener('factbuddy:count-update', onUpdate);
  }, []);

  // SSR 期间不渲染
  if (!level) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-[10px] bg-[var(--color-duo-bg)] border-2 border-[var(--color-duo-light)] hover:border-[var(--color-duo)] transition-colors"
      >
        <span className="text-base">{level.emoji}</span>
        <span className="text-[12px] font-extrabold text-[var(--color-supported-text)]">
          Lv.{level.level}
        </span>
        {level.count > 0 && (
          <span className="text-[10px] font-extrabold text-text-3">· {level.count}次</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* 遮罩，点击关闭 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* 详情卡片 */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="absolute right-0 top-full mt-2 w-[260px] z-50 duo-card p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
            >
              <div className="text-center mb-3">
                <div className="text-4xl mb-1">{level.emoji}</div>
                <div className="text-[16px] font-black text-text">{level.title}</div>
                <div className="text-[11px] font-bold text-text-3 uppercase tracking-wider mt-0.5">
                  Level {level.level}
                </div>
              </div>

              {/* 数据 */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-bg-soft rounded-[10px] p-2.5 text-center">
                  <div className="text-[18px] font-black text-duo tabular-nums">
                    {level.count}
                  </div>
                  <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider">
                    已识破
                  </div>
                </div>
                <div className="bg-bg-soft rounded-[10px] p-2.5 text-center">
                  <div className="text-[18px] font-black text-duo tabular-nums">
                    {level.maxed ? '∞' : level.toNext}
                  </div>
                  <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider">
                    {level.maxed ? '已满级' : '距下一级'}
                  </div>
                </div>
              </div>

              {/* 进度条 */}
              {!level.maxed && (
                <>
                  <div className="h-2 bg-bg-soft rounded-full overflow-hidden mb-2 border-2 border-[var(--color-border)]">
                    <motion.div
                      className="h-full bg-duo rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${level.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-[11px] font-bold text-text-3 text-center">
                    再核查 <span className="text-duo font-black">{level.toNext}</span> 条升级
                  </div>
                </>
              )}

              {level.maxed && (
                <div className="text-center text-[12px] font-extrabold text-duo">
                  🎉 你已经是防骗大师了！
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
