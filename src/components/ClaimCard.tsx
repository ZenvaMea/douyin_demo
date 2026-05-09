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
  bar: string;
  bg: string;
  textColor: string;
  glow: string;
  icon: React.ReactNode;
}> = {
  SUPPORTED: {
    label: '已验证',
    bar: '#3FCF8E',
    bg: 'rgba(63, 207, 142, 0.06)',
    textColor: '#5BE9A9',
    glow: 'rgba(63, 207, 142, 0.15)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <path d="M8 12.5l3 3 5-6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  NEI: {
    label: '存疑',
    bar: '#FFB224',
    bg: 'rgba(255, 178, 36, 0.06)',
    textColor: '#FFC85C',
    glow: 'rgba(255, 178, 36, 0.15)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <path d="M9 9.5a3 3 0 116 0c0 1.5-1.5 2-2.5 3-.5.5-.5 1-.5 1.5M12 17.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  REFUTED: {
    label: '误导',
    bar: '#FF5C5C',
    bg: 'rgba(255, 92, 92, 0.06)',
    textColor: '#FF8585',
    glow: 'rgba(255, 92, 92, 0.15)',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
};

const RELATION_META: Record<Evidence['claim_relation'], { label: string; color: string }> = {
  supports: { label: '支持', color: 'text-[#5BE9A9]' },
  refutes: { label: '反驳', color: 'text-[#FF8585]' },
  partially_supports: { label: '部分支持', color: 'text-[#FFC85C]' },
  context_dependent: { label: '视情况', color: 'text-text-3' },
};

export function ClaimCard({ data, index }: { data: ClaimCardData; index: number }) {
  const [open, setOpen] = useState(false);
  const meta = VERDICT_META[data.verdict];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 380, damping: 32 }}
      className="relative rounded-[14px] overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${meta.bg} 0%, rgba(255,255,255,0.03) 100%)`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 0 0 1px ${meta.bg}`,
      }}
    >
      {/* 左侧 indicator */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full"
        style={{
          background: meta.bar,
          boxShadow: `0 0 12px ${meta.glow}`,
        }}
      />

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 text-left pl-5 pr-4 py-4"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span
              className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: meta.textColor }}
            >
              {meta.icon}
              {meta.label}
            </span>
            <span className="text-text-3">·</span>
            <span className="text-[11px] text-text-3 font-mono">{data.claim_id}</span>
            <span className="text-text-3">·</span>
            <span className="text-[11px] text-text-3">置信度 {data.confidence}/5</span>
          </div>
          <p className="text-[15px] font-medium text-text leading-snug">{data.claim_text}</p>
        </div>
        <div
          className={cn(
            'mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center',
            'text-text-3 transition-all duration-200',
            open && 'rotate-180 bg-white/[0.06]',
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
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 mx-5 mb-5 border-t border-white/[0.06] space-y-5 pt-5">
              {/* 推理 */}
              <div>
                <div className="text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em] mb-2">
                  推理过程
                </div>
                <p className="text-[14px] text-text-2 leading-relaxed">{data.reasoning}</p>
              </div>

              {/* 证据 */}
              {data.evidence.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em] mb-2">
                    引用证据
                  </div>
                  <div className="space-y-2">
                    {data.evidence.map((e, i) => {
                      const r = RELATION_META[e.claim_relation];
                      return (
                        <div
                          key={i}
                          className="rounded-[10px] p-3 bg-white/[0.03] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                        >
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={cn('text-[11px] font-semibold', r.color)}>
                              {r.label}
                            </span>
                            <span className="text-text-3">·</span>
                            <span className="text-[13px] font-semibold text-text">{e.source_name}</span>
                            <span className="text-[10px] text-text-3 uppercase tracking-[0.08em]">
                              {e.source_type}
                            </span>
                          </div>
                          <p className="text-[13px] text-text-2 leading-relaxed">{e.summary}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 真相重写 */}
              <div
                className="rounded-[10px] p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(63,207,142,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(63,207,142,0.2)',
                }}
              >
                <div className="text-[10px] font-semibold text-[#5BE9A9] uppercase tracking-[0.12em] mb-2 flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  真相版本
                </div>
                <p className="text-[14px] text-text leading-relaxed">{data.truth_rewrite}</p>
              </div>

              {/* 注意事项 */}
              {data.caveats.length > 0 && (
                <div>
                  <div className="text-[10px] font-semibold text-text-3 uppercase tracking-[0.12em] mb-2">
                    需注意
                  </div>
                  <ul className="space-y-1.5">
                    {data.caveats.map((c, i) => (
                      <li key={i} className="text-[13px] text-text-2 flex gap-2 leading-relaxed">
                        <span className="text-text-3 flex-shrink-0">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.needs_web_search && (
                <div className="text-[11px] text-text-3 flex items-center gap-1.5">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
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
