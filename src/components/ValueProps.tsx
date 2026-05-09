'use client';

import { motion } from 'framer-motion';

/**
 * 4 个核心价值点（聚焦打假）
 * 回答用户：「凭什么用你？」
 * 每条都是「不是 X，是 Y」的差异化对比
 */
const PROPS = [
  {
    emoji: '🔍',
    title: '逐句拆解',
    desc: '不是简单标个真假分，AI 把视频拆成一条条独立声明，每条单独核查。',
  },
  {
    emoji: '📚',
    title: '权威信源',
    desc: '不是 AI 自说自话，每条结论必须引用具体机构（卫健委 / 营养学会 / 医学期刊）。',
  },
  {
    emoji: '✏️',
    title: '真相版本',
    desc: '不只是骂假新闻，AI 还会基于事实重写一段简短靠谱的科普版本，可以转给家人。',
  },
  {
    emoji: '⚡',
    title: '30 秒搞定',
    desc: '不用注册不用下载，粘贴链接，AI 自动转写视频音频，立刻给你三色核查报告。',
  },
];

export function ValueProps() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      {PROPS.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 380, damping: 32 }}
          className="duo-card p-5 hover:border-[var(--color-duo)] transition-colors"
        >
          <div className="text-3xl mb-3">{p.emoji}</div>
          <div className="text-[16px] font-extrabold text-text mb-1.5">{p.title}</div>
          <div className="text-[13px] font-semibold text-text-2 leading-relaxed">{p.desc}</div>
        </motion.div>
      ))}
    </div>
  );
}
