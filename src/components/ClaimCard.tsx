'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';

export type Verdict = 'SUPPORTED' | 'NEI' | 'REFUTED';

interface Evidence {
  source_type: string;
  source_name: string;
  claim_relation: 'supports' | 'refutes' | 'partially_supports' | 'context_dependent';
  summary: string;
}

export interface ClaimCardData {
  claim_id: string;
  claim_text: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  evidence: Evidence[];
  truth_rewrite: string;
  caveats: string[];
  needs_web_search: boolean;
}

const VERDICT_META: Record<Verdict, {
  label: string;
  emoji: string;
  cardClass: string;
  badgeClass: string;
}> = {
  SUPPORTED: {
    label: '已验证',
    emoji: '✅',
    cardClass: 'duo-card-green',
    badgeClass: 'duo-badge-green',
  },
  NEI: {
    label: '存疑',
    emoji: '🤔',
    cardClass: 'duo-card-yellow',
    badgeClass: 'duo-badge-yellow',
  },
  REFUTED: {
    label: '误导',
    emoji: '❌',
    cardClass: 'duo-card-red',
    badgeClass: 'duo-badge-red',
  },
};

const RELATION_META = {
  supports: { label: '支持', color: 'text-[var(--color-duo-green)]', emoji: '✓' },
  refutes: { label: '反驳', color: 'text-[var(--color-duo-red)]', emoji: '✗' },
  partially_supports: { label: '部分支持', color: 'text-[var(--color-duo-yellow-shadow)]', emoji: '◐' },
  context_dependent: { label: '视情况', color: 'text-[var(--color-duo-wolf)]', emoji: '○' },
};

export function ClaimCard({ data, index }: { data: ClaimCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[data.verdict];
  const stars = '⭐'.repeat(data.confidence) + '☆'.repeat(5 - data.confidence);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.06, type: 'spring', damping: 18 }}
      className={cn('duo-card', meta.cardClass)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left"
      >
        <div className="text-2xl flex-shrink-0 leading-none mt-1">{meta.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className={cn('duo-badge', meta.badgeClass)}>{meta.label}</span>
            <span className="text-[10px] font-bold text-[var(--color-duo-wolf)]">{data.claim_id}</span>
            <span className="text-xs text-[var(--color-duo-yellow-shadow)] tracking-wider">{stars}</span>
          </div>
          <p className="text-base font-extrabold text-[var(--color-duo-eel)] leading-snug">
            {data.claim_text}
          </p>
        </div>
        <div className={cn('text-xs font-bold text-[var(--color-duo-wolf)] flex-shrink-0 transition-transform', open && 'rotate-180')}>
          ▼
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-4 border-t-2 border-dashed border-[var(--color-duo-swan)] space-y-4">
              {/* 推理 */}
              <div>
                <div className="text-xs font-extrabold tracking-wider text-[var(--color-duo-wolf)] mb-1.5">🧠 推理</div>
                <p className="text-sm text-[var(--color-duo-eel)] leading-relaxed">{data.reasoning}</p>
              </div>

              {/* 证据 */}
              {data.evidence.length > 0 && (
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-[var(--color-duo-wolf)] mb-1.5">📚 证据</div>
                  <div className="space-y-2">
                    {data.evidence.map((e, i) => {
                      const r = RELATION_META[e.claim_relation];
                      return (
                        <div key={i} className="bg-white/70 rounded-xl p-3 border border-[var(--color-duo-swan)]">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={cn('text-sm font-extrabold', r.color)}>
                              {r.emoji} {r.label}
                            </span>
                            <span className="text-[var(--color-duo-blue)] font-extrabold text-sm">
                              {e.source_name}
                            </span>
                            <span className="text-[10px] font-bold text-[var(--color-duo-hare)] uppercase tracking-wide">
                              {e.source_type}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-duo-wolf)] leading-relaxed">{e.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 真相 */}
              <div className="bg-white rounded-xl p-3 border-2 border-[var(--color-duo-green)]">
                <div className="text-xs font-extrabold tracking-wider text-[var(--color-duo-green)] mb-1.5">✏️ 真相版本</div>
                <p className="text-sm text-[var(--color-duo-eel)] leading-relaxed font-semibold">
                  {data.truth_rewrite}
                </p>
              </div>

              {/* 注意事项 */}
              {data.caveats.length > 0 && (
                <div>
                  <div className="text-xs font-extrabold tracking-wider text-[var(--color-duo-yellow-shadow)] mb-1.5">⚠️ 注意</div>
                  <ul className="space-y-1">
                    {data.caveats.map((c, i) => (
                      <li key={i} className="text-xs text-[var(--color-duo-eel)] leading-relaxed flex gap-2">
                        <span className="flex-shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.needs_web_search && (
                <div className="text-[10px] font-bold text-[var(--color-duo-wolf)]">
                  💡 建议进一步联网检索（已记录待办）
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
