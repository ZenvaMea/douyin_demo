'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

const STATS = [
  {
    emoji: '🎯',
    label: '已核查声明',
    value: 12847,
    suffix: '条',
    color: 'var(--color-duo)',
  },
  {
    emoji: '❌',
    label: '揪出谣言',
    value: 4392,
    suffix: '条',
    color: 'var(--color-refuted)',
  },
  {
    emoji: '🛡️',
    label: '帮人避坑',
    value: 8934,
    suffix: '次',
    color: 'var(--color-nei)',
  },
  {
    emoji: '⚡',
    label: '平均用时',
    value: 28,
    suffix: '秒',
    color: 'var(--color-supported)',
  },
];

/**
 * 实时数据钩子（数字爬升动画）
 * 4 张卡：已核查 / 揪出谣言 / 帮人避坑 / 平均用时
 * 用 framer-motion 的 useInView + 数字爬升营造"实时"感
 */
function CountUp({ end, duration = 1.4 }: { end: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && !started.current) {
          started.current = true;
          const startTime = Date.now();
          const tick = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(end * eased));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export function TickerStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {STATS.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: i * 0.08, type: 'spring', stiffness: 380, damping: 32 }}
          className="duo-card p-4 sm:p-5 text-center"
        >
          <div className="text-2xl mb-1.5">{s.emoji}</div>
          <div
            className="text-[24px] sm:text-[28px] font-black tabular-nums tracking-tight leading-none mb-1"
            style={{ color: s.color }}
          >
            <CountUp end={s.value} />
            <span className="text-[13px] sm:text-[14px] font-extrabold text-text-3 ml-1">
              {s.suffix}
            </span>
          </div>
          <div className="text-[11px] font-extrabold text-text-3 uppercase tracking-wider">
            {s.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
