'use client';

import { motion } from 'framer-motion';

/**
 * 用户痛点共鸣区
 * 「你是不是经常这样？」
 *
 * 6 条痛点平衡覆盖：
 * - 3 条「看完忘」（呼应"用起来"主定位）
 * - 3 条「被骗了」（呼应"辨真假"子能力）
 */
const POINTS = [
  // === 看完忘场景（产品主定位） ===
  {
    emoji: '🍳',
    text: '收藏了 50 个菜谱视频，下厨还是不会做',
  },
  {
    emoji: '💪',
    text: '健身博主关注一堆，从来没真的练过一次',
  },
  {
    emoji: '📚',
    text: '看到好观点想记，等需要用时早就忘了',
  },
  // === 被骗了场景（子能力：打假） ===
  {
    emoji: '👵',
    text: '老妈又在家庭群转「专家说不能吃 XX」',
  },
  {
    emoji: '📱',
    text: '刷到「90% 的人不知道」就忍不住点进去',
  },
  {
    emoji: '💸',
    text: '听信「稳赚不赔」推荐，结果套牢了',
  },
];

export function PainPoints() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {POINTS.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-3 rounded-[14px] bg-bg-soft"
        >
          <span className="text-xl flex-shrink-0 mt-0.5">{p.emoji}</span>
          <p className="text-[14px] font-bold text-text-2 leading-snug">{p.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
