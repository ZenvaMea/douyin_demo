'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils/cn.ts';
import type { ClaimCardData, Verdict } from './ClaimCard.tsx';

interface ExtractedClaim {
  id: string;
  text: string;
  original_quote: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
}

interface AnnotatedTranscriptProps {
  transcript: string;
  claims: ExtractedClaim[];
  verifications: Map<string, ClaimCardData>;
}

interface Segment {
  type: 'text' | 'mark';
  text: string;
  claim?: ExtractedClaim;
  verdict?: Verdict;
  verification?: ClaimCardData;
}

const VERDICT_STYLE: Record<Verdict, {
  emoji: string;
  label: string;
  bgClass: string;
  border: string;
  text: string;
  underline: string;
}> = {
  REFUTED: {
    emoji: '❌',
    label: '错的',
    bgClass: 'bg-[var(--color-refuted-bg)]',
    border: 'var(--color-refuted)',
    text: 'var(--color-refuted-text)',
    underline: '#FF4B4B',
  },
  NEI: {
    emoji: '🤔',
    label: '存疑',
    bgClass: 'bg-[var(--color-nei-bg)]',
    border: 'var(--color-nei)',
    text: 'var(--color-nei-text)',
    underline: '#FFC800',
  },
  SUPPORTED: {
    emoji: '✅',
    label: '靠谱',
    bgClass: 'bg-[var(--color-supported-bg)]',
    border: 'var(--color-supported)',
    text: 'var(--color-supported-text)',
    underline: '#58CC02',
  },
};

/**
 * 原文标注组件
 * 在视频原文上把对应的声明用三色高亮，点击展开真相对比
 */
export function AnnotatedTranscript({ transcript, claims, verifications }: AnnotatedTranscriptProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 算法：把 transcript 切分成 text / mark 段
  const segments = useMemo(() => {
    if (!transcript) return [] as Segment[];

    interface Match {
      start: number;
      end: number;
      claim: ExtractedClaim;
      verification: ClaimCardData;
    }

    // 1. 找每个 claim 的 quote 在 transcript 里的位置
    const matches: Match[] = [];
    for (const claim of claims) {
      const v = verifications.get(claim.id);
      if (!v) continue;
      // 处理「【视频内容】xxx 【视频描述】yyy」这种结构 - 从 quote 中清掉
      const quote = (claim.original_quote ?? '').trim();
      if (!quote) continue;
      const idx = transcript.indexOf(quote);
      if (idx >= 0) {
        matches.push({
          start: idx,
          end: idx + quote.length,
          claim,
          verification: v,
        });
      }
    }

    // 2. 按 start 排序 + 去重重叠（保留先出现的）
    matches.sort((a, b) => a.start - b.start);
    const filtered: Match[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        filtered.push(m);
        lastEnd = m.end;
      }
    }

    // 3. 切分 transcript
    const segs: Segment[] = [];
    let cursor = 0;
    for (const m of filtered) {
      if (cursor < m.start) {
        segs.push({ type: 'text', text: transcript.slice(cursor, m.start) });
      }
      segs.push({
        type: 'mark',
        text: transcript.slice(m.start, m.end),
        claim: m.claim,
        verdict: m.verification.verdict,
        verification: m.verification,
      });
      cursor = m.end;
    }
    if (cursor < transcript.length) {
      segs.push({ type: 'text', text: transcript.slice(cursor) });
    }
    return segs;
  }, [transcript, claims, verifications]);

  // 截短真相到一句话
  const shortTruth = (s: string) => s.split(/[。.！!？?]/)[0]?.trim().slice(0, 80) ?? '';

  // 统计高亮数量
  const markCount = segments.filter((s) => s.type === 'mark').length;

  if (segments.length === 0) return null;

  return (
    <div className="duo-card p-5 sm:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <h3 className="text-[18px] font-extrabold text-text">原文标注</h3>
          <span className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider">
            一眼看出哪里有问题
          </span>
        </div>
        {markCount > 0 && (
          <div className="text-[11px] font-extrabold text-text-3">
            👆 点击彩色文字看真相
          </div>
        )}
      </div>

      {/* 原文展示区 */}
      <div className="rounded-[14px] bg-bg-soft p-4 sm:p-5 leading-loose">
        <p className="text-[15px] text-text font-semibold whitespace-pre-wrap break-words">
          {segments.map((seg, i) => {
            if (seg.type === 'text') {
              return <span key={i}>{seg.text}</span>;
            }
            const v = seg.verification!;
            const c = seg.claim!;
            const style = VERDICT_STYLE[seg.verdict!];
            const isActive = activeId === c.id;
            return (
              <span key={i} className="relative inline">
                <button
                  type="button"
                  onClick={() => setActiveId(isActive ? null : c.id)}
                  className={cn(
                    'inline px-1 py-0.5 rounded mx-0.5 font-extrabold transition-all cursor-pointer hover:opacity-80',
                    style.bgClass,
                  )}
                  style={{
                    color: style.text,
                    textDecoration: 'underline',
                    textDecorationColor: style.underline,
                    textDecorationThickness: '2px',
                    textUnderlineOffset: '3px',
                  }}
                >
                  <span className="text-[10px] mr-0.5">{style.emoji}</span>
                  {seg.text}
                </button>
              </span>
            );
          })}
        </p>
      </div>

      {/* 真相对比小卡片（点击 mark 展开在原文下方） */}
      <AnimatePresence mode="wait">
        {activeId &&
          (() => {
            const seg = segments.find((s) => s.type === 'mark' && s.claim?.id === activeId);
            if (!seg || !seg.verification) return null;
            const v = seg.verification;
            const style = VERDICT_STYLE[v.verdict];
            const truth = shortTruth(v.truth_rewrite);
            const evidence = v.evidence[0];
            return (
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div
                  className="mt-4 rounded-[14px] p-4 sm:p-5"
                  style={{
                    background: 'white',
                    border: `2px solid ${style.border}`,
                    boxShadow: `0 4px 0 ${style.border}`,
                  }}
                >
                  {/* 头部 */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider"
                      style={{ background: style.border, color: 'white' }}
                    >
                      {style.emoji} {style.label}
                    </span>
                    <span className="text-[10px] font-extrabold text-text-3">
                      {v.claim_id}
                    </span>
                    <span className="text-[10px] font-bold text-text-3">
                      置信 {v.confidence}/5
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveId(null)}
                      className="ml-auto w-7 h-7 rounded-md bg-bg-soft hover:bg-[var(--color-border)] flex items-center justify-center text-text-3"
                      aria-label="关闭"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>

                  {/* 错误原文 → 真相 对比 */}
                  <div className="space-y-3">
                    {/* 错误原文 */}
                    <div className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0 mt-0.5">{style.emoji}</span>
                      <div className="flex-1">
                        <div
                          className="text-[10px] font-extrabold uppercase tracking-wider mb-1"
                          style={{ color: style.text }}
                        >
                          原文这句
                        </div>
                        <p
                          className="text-[14px] font-extrabold leading-snug"
                          style={{
                            color: style.text,
                            textDecoration: v.verdict === 'REFUTED' ? 'line-through' : 'none',
                            textDecorationThickness: '2px',
                          }}
                        >
                          「{seg.text}」
                        </p>
                      </div>
                    </div>

                    {/* 箭头 */}
                    <div className="flex justify-center">
                      <div className="text-text-3">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M19 12l-7 7-7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>

                    {/* 真相 */}
                    <div className="flex items-start gap-2.5">
                      <span className="text-base flex-shrink-0 mt-0.5">✅</span>
                      <div className="flex-1">
                        <div
                          className="text-[10px] font-extrabold uppercase tracking-wider mb-1"
                          style={{ color: 'var(--color-supported-text)' }}
                        >
                          真相
                        </div>
                        <p className="text-[14px] font-extrabold text-text leading-snug">
                          {truth || v.truth_rewrite}
                        </p>
                      </div>
                    </div>

                    {/* 引用源 */}
                    {evidence && (
                      <div className="flex items-start gap-2.5 pt-3 border-t-2 border-dashed border-[var(--color-border)]">
                        <span className="text-base flex-shrink-0 mt-0.5">📚</span>
                        <div className="flex-1">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1 text-text-3">
                            引用
                          </div>
                          <p className="text-[12px] font-bold text-text-2 leading-snug">
                            <span className="text-duo">{evidence.source_name}</span>：
                            {evidence.summary}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}
      </AnimatePresence>

      {/* 图例 */}
      <div className="flex items-center gap-3 mt-4 flex-wrap text-[11px] font-extrabold">
        <span className="text-text-3">图例：</span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ background: 'var(--color-refuted-bg)', borderBottom: '2px solid #FF4B4B' }}
          />
          <span style={{ color: 'var(--color-refuted-text)' }}>❌ 错的</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ background: 'var(--color-nei-bg)', borderBottom: '2px solid #FFC800' }}
          />
          <span style={{ color: 'var(--color-nei-text)' }}>🤔 存疑</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span
            className="inline-block w-3 h-3 rounded"
            style={{ background: 'var(--color-supported-bg)', borderBottom: '2px solid #58CC02' }}
          />
          <span style={{ color: 'var(--color-supported-text)' }}>✅ 靠谱</span>
        </span>
      </div>
    </div>
  );
}
