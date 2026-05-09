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
  bg: string;
  bar: string;
  text: string;
  icon: React.ReactNode;
}> = {
  SUPPORTED: {
    label: '已验证',
    bg: 'bg-[var(--color-supported-bg)]',
    bar: 'bg-[var(--color-supported-bar)]',
    text: 'text-[var(--color-supported-text)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M8 12.5l3 3 5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  NEI: {
    label: '存疑',
    bg: 'bg-[var(--color-nei-bg)]',
    bar: 'bg-[var(--color-nei-bar)]',
    text: 'text-[var(--color-nei-text)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M9 9.5a3 3 0 116 0c0 1.5-1.5 2-2.5 3-.5.5-.5 1-.5 1.5M12 17.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  REFUTED: {
    label: '误导',
    bg: 'bg-[var(--color-refuted-bg)]',
    bar: 'bg-[var(--color-refuted-bar)]',
    text: 'text-[var(--color-refuted-text)]',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
};

const RELATION_META: Record<Evidence['claim_relation'], { label: string; color: string }> = {
  supports: { label: '支持', color: 'text-[var(--color-system-green)]' },
  refutes: { label: '反驳', color: 'text-[var(--color-system-red)]' },
  partially_supports: { label: '部分支持', color: 'text-[var(--color-system-orange)]' },
  context_dependent: { label: '视情况', color: 'text-text-3' },
};

export function ClaimCard({ data, index }: { data: ClaimCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[data.verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 380, damping: 32 }}
      className={cn(
        'relative pl-5 pr-4 py-3.5 rounded-[14px] overflow-hidden',
        'shadow-apple-xs',
        meta.bg,
      )}
    >
      {/* 左侧 indicator bar */}
      <div className={cn('absolute left-0 top-3 bottom-3 w-[3px] rounded-full', meta.bar)} />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={cn('flex items-center gap-1.5 type-caption font-semibold', meta.text)}>
              {meta.icon}
              {meta.label}
            </span>
            <span className="type-caption text-text-3">·</span>
            <span className="type-caption text-text-3">{data.claim_id}</span>
            <span className="type-caption text-text-3">·</span>
            <span className="type-caption text-text-3">置信度 {data.confidence}/5</span>
          </div>
          <p className="type-headline text-text leading-snug">{data.claim_text}</p>
        </div>
        <div
          className={cn(
            'mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
            'text-text-3 transition-transform duration-200',
            open && 'rotate-180 bg-gray-200/60',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 mt-3 border-t border-separator space-y-4">
              {/* 推理 */}
              <div>
                <div className="type-caption font-semibold text-text-3 uppercase tracking-wider mb-1">
                  推理过程
                </div>
                <p className="type-body text-text-2">{data.reasoning}</p>
              </div>

              {/* 证据 */}
              {data.evidence.length > 0 && (
                <div>
                  <div className="type-caption font-semibold text-text-3 uppercase tracking-wider mb-2">
                    引用证据
                  </div>
                  <div className="space-y-2">
                    {data.evidence.map((e, i) => {
                      const r = RELATION_META[e.claim_relation];
                      return (
                        <div
                          key={i}
                          className="bg-surface rounded-[10px] p-3 hairline"
                        >
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={cn('type-caption font-semibold', r.color)}>{r.label}</span>
                            <span className="type-caption text-text-3">·</span>
                            <span className="type-callout font-semibold text-text">{e.source_name}</span>
                            <span className="type-caption text-text-3 uppercase tracking-wider">
                              {e.source_type}
                            </span>
                          </div>
                          <p className="type-body text-text-2">{e.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 真相重写 */}
              <div className="bg-surface rounded-[10px] p-3 hairline">
                <div className="type-caption font-semibold uppercase tracking-wider mb-1 text-[var(--color-supported-text)]">
                  真相版本
                </div>
                <p className="type-body text-text leading-relaxed">{data.truth_rewrite}</p>
              </div>

              {/* 注意事项 */}
              {data.caveats.length > 0 && (
                <div>
                  <div className="type-caption font-semibold text-text-3 uppercase tracking-wider mb-1.5">
                    需注意
                  </div>
                  <ul className="space-y-1">
                    {data.caveats.map((c, i) => (
                      <li key={i} className="type-body text-text-2 flex gap-2">
                        <span className="text-text-3 flex-shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.needs_web_search && (
                <div className="type-caption text-text-3 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                    <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  建议进一步联网检索
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
