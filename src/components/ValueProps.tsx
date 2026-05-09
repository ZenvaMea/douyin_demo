'use client';

import { motion } from 'framer-motion';

/**
 * 4 个核心价值点
 * 回答用户最关心的问题：「凭什么用你？」
 * 每条都是「不是 X，是 Y」的差异化对比
 */
const PROPS = [
  {
    emoji: '🎯',
    title: '抓重点',
    desc: '不是给你个流水账摘要，AI 提炼 3 条核心观点 + 关键数据 + 行动启示，30 秒抓住精华。',
  },
  {
    emoji: '🛠️',
    title: '做工具',
    desc: '看完不再「想起看过」——AI 把视频变成食谱卡 / 训练计划 / SOP / 清单，一键复制即用。',
  },
  {
    emoji: '🔍',
    title: '辨真假',
    desc: '逐句拆解每条声明，引用权威信源（卫健委 / 营养学会 / 医学期刊），不是 AI 自说自话。',
  },
  {
    emoji: '⚡',
    title: '快又免费',
    desc: '不用注册不用下载。粘贴链接，AI 自动转写视频音频，30 秒给完整报告。',
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
