'use client';

import { motion } from 'framer-motion';

/**
 * 顶部紧迫感 banner
 * 软橙色 + 数据冲击 + 弱跑马灯感
 * 营造"再不警惕就晚了"的情绪共鸣
 */
export function UrgencyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-[var(--color-nei-bg)] border-b-2 border-[var(--color-nei-bg)]"
    >
      <div className="max-w-[1080px] mx-auto px-6 py-2.5 flex items-center justify-center gap-2 flex-wrap text-center">
        <span className="text-base">📊</span>
        <span className="text-[12px] sm:text-[13px] font-extrabold text-[var(--color-nei-text)] tracking-tight">
          抖音用户每天刷 50+ 条视频
        </span>
        <span className="text-[var(--color-nei-text)] opacity-50 hidden sm:inline">·</span>
        <span className="text-[11px] sm:text-[12px] font-bold text-[var(--color-nei-text)] hidden sm:inline">
          但 90% 看完就忘，从未真正用上 🤷
        </span>
      </div>
    </motion.div>
  );
}
