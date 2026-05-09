'use client';

import { motion } from 'framer-motion';

const STEPS = [
  {
    n: '1',
    emoji: '🔗',
    title: '粘贴链接',
    desc: '抖音「分享 → 复制链接」',
  },
  {
    n: '2',
    emoji: '🤖',
    title: 'AI 拆解',
    desc: '逐句声明 · 联网核查',
  },
  {
    n: '3',
    emoji: '📋',
    title: '看真相',
    desc: '三色证据 · 真相版本',
  },
];

/**
 * 3 步流程示意图
 * 降低使用门槛的标志组件
 * 用箭头连接，强调"傻瓜操作"
 */
export function ThreeStepFlow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-3 sm:gap-2">
      {STEPS.map((s, i) => (
        <motion.div
          key={s.n}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 * i, type: 'spring', stiffness: 380, damping: 32 }}
          className="contents"
        >
          {/* 卡片 */}
          <div className="duo-card p-4 flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="text-3xl">{s.emoji}</div>
              <div className="absolute -top-1 -right-1.5 w-5 h-5 rounded-full bg-duo text-white flex items-center justify-center text-[11px] font-black">
                {s.n}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[14px] font-extrabold text-text leading-tight">{s.title}</div>
              <div className="text-[11px] font-bold text-text-3 mt-0.5 leading-tight">{s.desc}</div>
            </div>
          </div>

          {/* 箭头（最后一个不显示） */}
          {i < STEPS.length - 1 && (
            <div className="flex justify-center text-text-3 sm:rotate-0 rotate-90">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h14M13 5l7 7-7 7"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
