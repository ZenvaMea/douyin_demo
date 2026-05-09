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
  bgVar: string;
  textVar: string;
  barVar: string;
}> = {
  SUPPORTED: {
    label: '已验证',
    emoji: '✅',
    bgVar: 'var(--color-supported-bg)',
    textVar: 'var(--color-supported-text)',
    barVar: 'var(--color-supported)',
  },
  NEI: {
    label: '存疑',
    emoji: '🤔',
    bgVar: 'var(--color-nei-bg)',
    textVar: 'var(--color-nei-text)',
    barVar: 'var(--color-nei)',
  },
  REFUTED: {
    label: '误导',
    emoji: '❌',
    bgVar: 'var(--color-refuted-bg)',
    textVar: 'var(--color-refuted-text)',
    barVar: 'var(--color-refuted)',
  },
};

const RELATION_META: Record<Evidence['claim_relation'], { label: string; emoji: string }> = {
  supports: { label: '支持', emoji: '👍' },
  refutes: { label: '反驳', emoji: '👎' },
  partially_supports: { label: '部分支持', emoji: '🤷' },
  context_dependent: { label: '视情况', emoji: '🔄' },
};

export function ClaimCard({ data, index }: { data: ClaimCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[data.verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 380, damping: 32 }}
      className="relative rounded-[16px] overflow-hidden border-2 border-[var(--color-border)] bg-white"
    >
      {/* 左侧 indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[4px] rounded-full"
        style={{ background: meta.barVar }}
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left pl-5 pr-4 py-4"
      >
        <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{meta.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider"
              style={{
                background: meta.bgVar,
                color: meta.textVar,
              }}
            >
              {meta.label}
            </span>
            <span className="text-[11px] font-extrabold text-text-3">{data.claim_id}</span>
            <span className="text-text-3">·</span>
            <span className="text-[11px] font-bold text-text-3">置信 {data.confidence}/5</span>
          </div>
          <p className="text-[15px] font-bold text-text leading-snug">{data.claim_text}</p>
        </div>
        <div
          className={cn(
            'mt-1.5 flex-shrink-0 w-7 h-7 rounded-full bg-bg-soft flex items-center justify-center',
            'text-text-3 transition-transform duration-200',
            open && 'rotate-180',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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
            <div className="px-5 pb-5 pt-4 mt-1 border-t-2 border-dashed border-[var(--color-border)] space-y-4">
              {/* 推理 */}
              <div>
                <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5">
                  <span>🧠</span> 推理过程
                </div>
                <p className="text-[14px] font-semibold text-text-2 leading-relaxed">
                  {data.reasoning}
                </p>
              </div>

              {/* 证据 */}
              {data.evidence.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5">
                    <span>📚</span> 引用证据
                  </div>
                  <div className="space-y-2">
                    {data.evidence.map((e, i) => {
                      const r = RELATION_META[e.claim_relation];
                      return (
                        <div
                          key={i}
                          className="rounded-[12px] p-3 bg-bg-soft border-2 border-[var(--color-separator)]"
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[12px] font-extrabold text-text-2">
                              {r.emoji} {r.label}
                            </span>
                            <span className="text-[13px] font-extrabold text-duo">
                              {e.source_name}
                            </span>
                            <span className="text-[10px] font-bold text-text-3 uppercase tracking-wider">
                              {e.source_type}
                            </span>
                          </div>
                          <p className="text-[13px] font-semibold text-text-2 leading-relaxed">
                            {e.summary}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 真相版本 */}
              <div
                className="rounded-[12px] p-4 border-2"
                style={{
                  background: 'var(--color-supported-bg)',
                  borderColor: 'var(--color-supported)',
                }}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5"
                  style={{ color: 'var(--color-supported-text)' }}
                >
                  <span>✏️</span> 真相版本
                </div>
                <p className="text-[14px] font-bold text-text leading-relaxed">
                  {data.truth_rewrite}
                </p>
              </div>

              {/* 注意事项 */}
              {data.caveats.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1.5">
                    <span>⚠️</span> 需注意
                  </div>
                  <ul className="space-y-1">
                    {data.caveats.map((c, i) => (
                      <li key={i} className="text-[13px] font-semibold text-text-2 flex gap-2 leading-relaxed">
                        <span className="text-text-3 flex-shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.needs_web_search && (
                <div className="text-[11px] font-bold text-text-3 flex items-center gap-1.5">
                  <span>🔍</span> 建议进一步联网检索
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
