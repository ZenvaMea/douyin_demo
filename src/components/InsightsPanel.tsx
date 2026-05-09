'use client';

import { motion } from 'framer-motion';

export interface InsightsData {
  summary_30s: string;
  key_points: string[];
  key_data: { label: string; value: string }[];
  action_takeaways: string[];
}

/**
 * 核心要点面板
 * 让用户 30 秒抓住视频精华
 * 包含：30 秒概要 / 3 条核心观点 / 关键数据 / 行动启示
 */
export function InsightsPanel({ data }: { data: InsightsData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      className="duo-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-2xl">🎯</span>
        <h3 className="text-[18px] font-extrabold text-text">一图看懂</h3>
        <span className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider">
          30 秒抓重点
        </span>
      </div>

      {/* 30 秒概要 */}
      <div className="mb-5 p-3.5 rounded-[12px] bg-[var(--color-duo-bg)] border-2 border-[var(--color-duo-light)]">
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-supported-text)] mb-1.5 flex items-center gap-1.5">
          <span>📌</span> 一句话概括
        </div>
        <p className="text-[15px] font-bold text-text leading-relaxed">{data.summary_30s}</p>
      </div>

      {/* 3 条核心观点 */}
      {data.key_points.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2.5 flex items-center gap-1.5">
            <span>💡</span> 核心观点
          </div>
          <ol className="space-y-2">
            {data.key_points.map((p, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="flex items-start gap-3 p-3 rounded-[12px] bg-bg-soft"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-duo text-white flex items-center justify-center text-[12px] font-black">
                  {i + 1}
                </span>
                <p className="text-[14px] font-bold text-text leading-snug pt-0.5">{p}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* 关键数据 */}
      {data.key_data.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2.5 flex items-center gap-1.5">
            <span>📊</span> 关键数据
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {data.key_data.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="p-3 rounded-[12px] border-2 border-[var(--color-border)] bg-white"
              >
                <div className="text-[12px] font-bold text-text-3 leading-tight">{d.label}</div>
                <div className="text-[18px] font-black text-duo mt-1 tracking-tight">{d.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* 行动启示 */}
      {data.action_takeaways.length > 0 && (
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2.5 flex items-center gap-1.5">
            <span>✨</span> 你可以这样做
          </div>
          <ul className="space-y-1.5">
            {data.action_takeaways.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-start gap-2.5 text-[14px] font-bold text-text-2 leading-snug"
              >
                <span className="text-duo flex-shrink-0 mt-0.5">→</span>
                <span>{a}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
