'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';
import { AppleButton } from './AppleButton.tsx';

const MYTHS = [
  {
    id: 1,
    text: '海鲜和维 C 一起吃，等于砒霜 ☠️',
    truth: '日常剂量产生不了砒霜，需要超大剂量才有理论可能',
  },
  {
    id: 2,
    text: '西瓜和桃子一起吃会中毒',
    truth: '完全谣言，无任何医学证据',
  },
  {
    id: 3,
    text: '隔夜茶 / 隔夜菜致癌',
    truth: '冷藏后亚硝酸盐增加有限，正常吃不致癌',
  },
  {
    id: 4,
    text: '酸碱体质决定健康，要多吃碱性食物',
    truth: '酸碱体质论已被国际医学界判定为伪科学',
  },
  {
    id: 5,
    text: '微波炉加热的食物有辐射、致癌',
    truth: '微波是非电离辐射，不改变食物分子结构',
  },
];

const RESULTS: Record<number, { emoji: string; title: string; subtitle: string }> = {
  0: { emoji: '🦉', title: '你是个清醒的人！', subtitle: '不过…还有更多营销号在等着你呢' },
  1: { emoji: '🤔', title: '只信过 1 条', subtitle: '已经很厉害了，但下次刷视频还是核一下' },
  2: { emoji: '😅', title: '中招 2 条', subtitle: '别担心，大多数人都至少信过这些' },
  3: { emoji: '😳', title: '居然信了 3 条', subtitle: '看来营销号的话术真的很会包装' },
  4: { emoji: '🚨', title: '你被骗了 4 条！', subtitle: '强烈建议从今天起，刷之前先核一下' },
  5: { emoji: '💀', title: '5 条全中…', subtitle: '没事，正是你需要打假搭子的时候' },
};

export function MythQuiz() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const toggle = (id: number) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelected(new Set());
    setSubmitted(false);
  };

  const score = selected.size;
  const result = RESULTS[score]!;

  return (
    <div className="duo-card p-5 sm:p-6">
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">🎯</div>
        <h3 className="type-title-1 text-text mb-1.5">
          这 5 条「常识」，你信过<span className="text-duo">几条</span>？
        </h3>
        <p className="text-[13px] font-bold text-text-3">
          勾选你曾经相信过的，看看自己被骗过几次 👀
        </p>
      </div>

      <div className="space-y-2.5 mb-5">
        {MYTHS.map((m) => {
          const isSelected = selected.has(m.id);
          return (
            <motion.button
              key={m.id}
              type="button"
              onClick={() => toggle(m.id)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full text-left p-3.5 rounded-[14px] transition-all border-2 flex items-start gap-3',
                isSelected
                  ? 'border-[var(--color-duo)] bg-[var(--color-duo-bg)]'
                  : 'border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]',
                submitted && 'cursor-default',
              )}
              disabled={submitted}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-md flex-shrink-0 flex items-center justify-center transition-all',
                  isSelected
                    ? 'bg-[var(--color-duo)] text-white'
                    : 'bg-bg-soft border-2 border-[var(--color-border-strong)]',
                )}
              >
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-extrabold text-text leading-snug">{m.text}</p>
                <AnimatePresence>
                  {submitted && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <p className="text-[12px] font-bold text-[var(--color-refuted-text)] mt-1.5 flex items-start gap-1.5">
                        <span>❌</span>
                        <span>谣言！{m.truth}</span>
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </div>

      {!submitted ? (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-[12px] font-bold text-text-3">
            已选 <span className="text-duo">{score}</span> 条
          </div>
          <AppleButton
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={false}
          >
            看我中了几条 →
          </AppleButton>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-[16px] p-5 text-center"
          style={{
            background: 'linear-gradient(180deg, var(--color-duo-bg) 0%, white 100%)',
            border: '2px solid var(--color-duo)',
          }}
        >
          <motion.div
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
            className="text-5xl mb-3"
          >
            {result.emoji}
          </motion.div>
          <div className="type-title-1 text-text mb-1">{result.title}</div>
          <p className="text-[14px] font-bold text-text-2 mb-4">{result.subtitle}</p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <AppleButton
              variant="primary"
              size="lg"
              onClick={() => {
                document.querySelector('input[type="url"]')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                });
                setTimeout(() => {
                  (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus();
                }, 600);
              }}
            >
              立刻试试打假搭子 →
            </AppleButton>
            <AppleButton variant="ghost" size="md" onClick={handleReset}>
              再做一次
            </AppleButton>
          </div>
        </motion.div>
      )}
    </div>
  );
}
