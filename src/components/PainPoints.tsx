'use client';

import { motion } from 'framer-motion';

/**
 * 用户痛点共鸣（聚焦打假）
 * 「你是不是经常遇到？」
 * 让用户立刻产生「对，就是我」的代入感
 */
const POINTS = [
  {
    emoji: '👵',
    text: '老妈又在家庭群转「专家说不能吃 XX」',
  },
  {
    emoji: '📱',
    text: '刷到「90% 的人不知道」就忍不住点进去',
  },
  {
    emoji: '💊',
    text: '看到「医生都震惊了」差点真的去买保健品',
  },
  {
    emoji: '💸',
    text: '听信「稳赚不赔」的基金推荐，结果套牢了',
  },
  {
    emoji: '🍉',
    text: '「西瓜+桃子吃了会中毒」每年都看到',
  },
  {
    emoji: '🤔',
    text: '看完五个观点不一致的视频，更迷茫了',
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
