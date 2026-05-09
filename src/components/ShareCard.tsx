'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppleButton } from './AppleButton.tsx';

interface ShareCardProps {
  title: string;
  author: string;
  score: number;
  counts: { SUPPORTED: number; NEI: number; REFUTED: number };
  topClaim?: { claim_text: string; verdict: 'SUPPORTED' | 'NEI' | 'REFUTED'; truth_rewrite: string };
  onClose: () => void;
}

/**
 * 极简分享卡片 - 一眼就懂
 * 设计原则：
 * 1. 评分超大（60px+）
 * 2. 三色一行清晰
 * 3. 只一条最该警惕的（短）
 * 4. 不要大段推理 / 完整真相
 * 5. 一屏看完
 */
export function ShareCard({ title, author, score, counts, topClaim, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const config =
    score >= 70
      ? { emoji: '✅', label: '可信', color: '#3D8B00', bg: '#F0FAE3' }
      : score >= 40
        ? { emoji: '⚠️', label: '存疑', color: '#B58900', bg: '#FFF8DB' }
        : { emoji: '🚨', label: '高风险', color: '#C71E1E', bg: '#FFECEC' };

  // 截短真相到 30 字以内
  const shortTruth = topClaim?.truth_rewrite
    ? topClaim.truth_rewrite.split(/[。.！!？?]/)[0]?.trim().slice(0, 50)
    : '';

  const handleCopyText = async () => {
    const lines = [
      `🦉 打假搭子核查`,
      ``,
      `📺 ${title}`,
      `@${author}`,
      ``,
      `🎯 ${score}/100  ${config.emoji} ${config.label}`,
      `✅${counts.SUPPORTED} 🤔${counts.NEI} ❌${counts.REFUTED}`,
    ];
    if (topClaim) {
      lines.push('', `🚨 最该警惕：`, `「${topClaim.claim_text}」`, `→ ${shortTruth}`);
    }
    lines.push('', `🔗 自己核一下 · fact-buddy`);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[360px] bg-white rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          {/* === 卡片本体（截图用这部分） === */}
          <div
            className="p-6"
            style={{ background: `linear-gradient(180deg, ${config.bg} 0%, white 50%)` }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🦉</span>
              <div>
                <div className="text-[14px] font-black text-text leading-none">打假搭子</div>
                <div className="text-[10px] font-extrabold text-text-3 mt-0.5 tracking-wider uppercase">
                  Fact Buddy 核查
                </div>
              </div>
            </div>

            {/* 视频标题（一眼） */}
            <div className="mb-5">
              <div className="text-[15px] font-extrabold text-text leading-snug mb-1 line-clamp-2">
                📺 {title}
              </div>
              <div className="text-[12px] font-bold text-text-3">@{author}</div>
            </div>

            {/* 巨大评分 */}
            <div className="flex flex-col items-center mb-5 py-3 rounded-[16px] bg-white border-2 border-[var(--color-border)]">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-black tabular-nums tracking-[-0.04em] leading-none"
                  style={{ fontSize: 64, color: config.color }}
                >
                  {score}
                </span>
                <span className="text-[14px] font-extrabold text-text-3">/100</span>
              </div>
              <div
                className="mt-1.5 px-3 py-1 rounded-full text-[12px] font-extrabold"
                style={{ background: config.bg, color: config.color }}
              >
                {config.emoji} {config.label}
              </div>
            </div>

            {/* 三色一行（极简） */}
            <div className="grid grid-cols-3 gap-1.5 mb-5">
              <div className="rounded-[12px] py-2 text-center" style={{ background: '#F0FAE3' }}>
                <div className="text-[18px]">✅</div>
                <div className="text-[18px] font-black tabular-nums" style={{ color: '#3D8B00' }}>
                  {counts.SUPPORTED}
                </div>
              </div>
              <div className="rounded-[12px] py-2 text-center" style={{ background: '#FFF8DB' }}>
                <div className="text-[18px]">🤔</div>
                <div className="text-[18px] font-black tabular-nums" style={{ color: '#B58900' }}>
                  {counts.NEI}
                </div>
              </div>
              <div className="rounded-[12px] py-2 text-center" style={{ background: '#FFECEC' }}>
                <div className="text-[18px]">❌</div>
                <div className="text-[18px] font-black tabular-nums" style={{ color: '#C71E1E' }}>
                  {counts.REFUTED}
                </div>
              </div>
            </div>

            {/* 最该警惕（短句版） */}
            {topClaim && (
              <div
                className="rounded-[14px] p-3.5 mb-4"
                style={{ background: '#FFECEC', border: '2px solid #FFCDCD' }}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5 flex items-center gap-1" style={{ color: '#C71E1E' }}>
                  <span>🚨</span>
                  <span>最该警惕</span>
                </div>
                <div className="text-[13px] font-extrabold text-text leading-snug mb-1.5">
                  「{topClaim.claim_text}」
                </div>
                {shortTruth && (
                  <div className="text-[12px] font-bold leading-snug flex items-start gap-1.5" style={{ color: '#3D8B00' }}>
                    <span>✅</span>
                    <span>{shortTruth}</span>
                  </div>
                )}
              </div>
            )}

            {/* 底部水印 */}
            <div className="text-center pt-3 border-t-2 border-dashed border-[var(--color-border)]">
              <div className="text-[10px] font-extrabold text-text-3 tracking-wider">
                🔗 fact-buddy · 不下结论 · 只摆证据
              </div>
            </div>
          </div>

          {/* === 操作区（不截图） === */}
          <div className="p-3 bg-bg-soft border-t-2 border-[var(--color-border)]">
            <div className="text-[11px] font-extrabold text-text-3 text-center mb-2.5 uppercase tracking-wider">
              📸 长按截图 → 转发家人群
            </div>
            <div className="flex gap-2">
              <AppleButton variant="primary" size="md" fullWidth onClick={handleCopyText}>
                {copied ? '✓ 已复制' : '📋 复制文字版'}
              </AppleButton>
              <AppleButton variant="secondary" size="md" onClick={onClose}>
                关闭
              </AppleButton>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
