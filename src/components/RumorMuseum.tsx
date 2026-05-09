'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';

interface Rumor {
  id: number;
  category: 'health' | 'food' | 'finance' | 'lifestyle' | 'tech';
  rumor: string;
  truth: string;
  spread: string; // 传播次数
  severity: 'high' | 'medium' | 'low';
}

const RUMORS: Rumor[] = [
  // 健康类
  { id: 1, category: 'health', rumor: '酸碱体质决定健康，要多吃碱性食物', truth: '伪科学，已被国际医学界判定', spread: '380万+', severity: 'high' },
  { id: 2, category: 'health', rumor: '微波炉加热致癌，会破坏食物营养', truth: '微波是非电离辐射，不致癌', spread: '210万+', severity: 'high' },
  { id: 3, category: 'health', rumor: '排毒养颜需要每天喝 8 杯柠檬水', truth: '人体靠肝肾排毒，柠檬不参与', spread: '150万+', severity: 'medium' },
  // 食品类
  { id: 4, category: 'food', rumor: '海鲜和维 C 一起吃 = 砒霜', truth: '日常剂量产生不了砒霜', spread: '420万+', severity: 'high' },
  { id: 5, category: 'food', rumor: '西瓜和桃子一起吃会中毒', truth: '完全谣言，无医学证据', spread: '290万+', severity: 'high' },
  { id: 6, category: 'food', rumor: '隔夜茶 / 隔夜菜致癌', truth: '冷藏后亚硝酸盐增量有限', spread: '180万+', severity: 'medium' },
  // 财经类
  { id: 7, category: 'finance', rumor: '某基金稳赚不赔，闭眼买都赚', truth: '所有投资都有风险，违规承诺', spread: '95万+', severity: 'high' },
  { id: 8, category: 'finance', rumor: '加密货币是未来，错过这次再无机会', truth: '高波动高风险，监管不明', spread: '76万+', severity: 'high' },
  // 生活类
  { id: 9, category: 'lifestyle', rumor: '空腹喝水比不吃早饭还可怕', truth: '空腹喝水是健康习惯', spread: '110万+', severity: 'medium' },
  { id: 10, category: 'lifestyle', rumor: '晚上吃苹果 = 砒霜，早上吃 = 金子', truth: '苹果什么时候吃都健康', spread: '88万+', severity: 'low' },
  // 科技类
  { id: 11, category: 'tech', rumor: '5G 信号会致癌，影响身体健康', truth: '非电离辐射，远低于安全标准', spread: '150万+', severity: 'high' },
  { id: 12, category: 'tech', rumor: '手机充电时打电话会爆炸', truth: '正规手机+充电器无此风险', spread: '60万+', severity: 'low' },
];

const CATEGORY_META: Record<Rumor['category'], { emoji: string; label: string; color: string }> = {
  health:    { emoji: '🩺', label: '健康',  color: 'rgba(255,75,75,0.10)' },
  food:      { emoji: '🍉', label: '食品',  color: 'rgba(63,207,142,0.10)' },
  finance:   { emoji: '💰', label: '财经',  color: 'rgba(255,200,0,0.12)' },
  lifestyle: { emoji: '☀️', label: '生活',  color: 'rgba(124,92,255,0.08)' },
  tech:      { emoji: '📱', label: '科技',  color: 'rgba(90,200,250,0.10)' },
};

const FILTERS: Array<{ key: 'all' | Rumor['category']; label: string; emoji: string }> = [
  { key: 'all',       emoji: '🌐', label: '全部' },
  { key: 'health',    emoji: '🩺', label: '健康' },
  { key: 'food',      emoji: '🍉', label: '食品' },
  { key: 'finance',   emoji: '💰', label: '财经' },
  { key: 'lifestyle', emoji: '☀️', label: '生活' },
  { key: 'tech',      emoji: '📱', label: '科技' },
];

/**
 * 谣言博物馆
 * 「那些年差点骗过你的话，我们都核完了」
 * 展示已揪出的经典谣言，带分类筛选 + 翻牌交互
 */
export function RumorMuseum() {
  const [filter, setFilter] = useState<'all' | Rumor['category']>('all');
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const list = filter === 'all' ? RUMORS : RUMORS.filter((r) => r.category === filter);

  const toggle = (id: number) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      {/* 标题 */}
      <div className="text-center mb-6">
        <div className="text-3xl mb-1.5">🏛️</div>
        <h2 className="type-title-1 text-text mb-1.5">
          谣言<span className="text-duo">博物馆</span>
        </h2>
        <p className="text-[14px] font-bold text-text-3">
          那些年差点骗过你的话，我们都核完了 👀
        </p>
      </div>

      {/* 分类筛选 */}
      <div className="flex justify-center mb-5">
        <div className="inline-flex flex-wrap justify-center gap-1.5 p-1.5 rounded-[14px] bg-bg-soft border-2 border-[var(--color-border)]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                'h-8 px-3 rounded-[10px] flex items-center gap-1.5 text-[12px] font-extrabold transition-all',
                filter === f.key
                  ? 'bg-white text-text shadow-[0_2px_0_var(--color-border-strong)] border-2 border-[var(--color-border-strong)]'
                  : 'text-text-3 hover:text-text-2',
              )}
            >
              <span>{f.emoji}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 卡片墙 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((r, i) => {
          const meta = CATEGORY_META[r.category];
          const isRevealed = revealed.has(r.id);
          return (
            <motion.button
              key={r.id}
              type="button"
              onClick={() => toggle(r.id)}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: (i % 6) * 0.04, type: 'spring', stiffness: 380, damping: 32 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="duo-card text-left p-4 hover:border-[var(--color-duo)] transition-all relative overflow-hidden"
              style={{ background: meta.color }}
            >
              {/* 顶部分类标签 */}
              <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-text-2">
                  <span>{meta.emoji}</span>
                  <span>{meta.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-text-3">
                  <span>📈</span>
                  <span>传播 {r.spread}</span>
                </span>
              </div>

              {/* 谣言（红色） */}
              <div className="mb-2.5">
                <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1 text-[var(--color-refuted-text)] flex items-center gap-1">
                  <span>❌</span>
                  <span>谣言</span>
                </div>
                <p className="text-[13px] font-extrabold text-text leading-snug">「{r.rumor}」</p>
              </div>

              {/* 真相（点击展开） */}
              <motion.div
                initial={false}
                animate={{
                  height: isRevealed ? 'auto' : 0,
                  opacity: isRevealed ? 1 : 0,
                }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="pt-2 border-t-2 border-dashed border-[var(--color-border)]">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1 text-[var(--color-supported-text)] flex items-center gap-1">
                    <span>✅</span>
                    <span>真相</span>
                  </div>
                  <p className="text-[12px] font-bold text-text-2 leading-snug">{r.truth}</p>
                </div>
              </motion.div>

              {/* 提示文案 */}
              {!isRevealed && (
                <div className="text-[11px] font-extrabold text-text-3 flex items-center gap-1 mt-1">
                  <span>👇</span>
                  <span>点击查看真相</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 底部数据条 */}
      <div className="mt-6 text-center text-[12px] font-bold text-text-3">
        以上仅是冰山一角，AI 还在持续核查更多谣言 ⚡
      </div>
    </div>
  );
}
