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

const VERDICT_LABEL: Record<'SUPPORTED' | 'NEI' | 'REFUTED', { emoji: string; label: string; color: string }> = {
  SUPPORTED: { emoji: '✅', label: '已验证', color: 'var(--color-supported-text)' },
  NEI:       { emoji: '🤔', label: '存疑',  color: 'var(--color-nei-text)' },
  REFUTED:   { emoji: '❌', label: '误导',  color: 'var(--color-refuted-text)' },
};

/**
 * 转发分享卡片
 * 弹出一个精美的卡片让用户截图分享给家人朋友圈
 */
export function ShareCard({ title, author, score, counts, topClaim, onClose }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const config =
    score >= 70
      ? { emoji: '🎉', label: '内容可信', color: 'var(--color-supported-text)' }
      : score >= 40
        ? { emoji: '🤔', label: '部分存疑', color: 'var(--color-nei-text)' }
        : { emoji: '🚨', label: '高风险', color: 'var(--color-refuted-text)' };

  const handleCopyText = async () => {
    const text = `🦉 打假搭子 · 核查报告

📺 视频：${title}
👤 作者：@${author}

🎯 可信度：${score}/100  ${config.emoji} ${config.label}

✅ 已验证 ${counts.SUPPORTED} 条
🤔 存疑 ${counts.NEI} 条
❌ 误导 ${counts.REFUTED} 条
${topClaim ? `\n${VERDICT_LABEL[topClaim.verdict].emoji} 关键提醒：\n「${topClaim.claim_text}」\n→ ${topClaim.truth_rewrite}\n` : ''}
🔗 自己核一下：fact-buddy 打假搭子
不下结论 · 只摆证据`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-[420px] bg-white rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)]"
        >
          {/* === 卡片本体（用户截图分享这部分） === */}
          <div
            id="share-card-content"
            className="p-6 relative"
            style={{
              background:
                'linear-gradient(180deg, var(--color-duo-bg) 0%, white 50%)',
            }}
          >
            {/* Logo + 品牌 */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-2xl">🦉</span>
              <div className="leading-none">
                <div className="text-[14px] font-black text-text">打假搭子</div>
                <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider mt-0.5">
                  Fact Buddy · 核查报告
                </div>
              </div>
            </div>

            {/* 视频信息 */}
            <div className="mb-5">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-text-3 mb-1.5">
                📺 视频
              </div>
              <div className="text-[15px] font-extrabold text-text leading-snug mb-1.5">
                {title}
              </div>
              <div className="text-[12px] font-bold text-duo">@{author}</div>
            </div>

            {/* 可信度评分 */}
            <div className="bg-white rounded-[14px] p-4 border-2 border-[var(--color-border)] mb-4">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3">
                  🎯 可信度评分
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: config.color }}>
                  {config.emoji} {config.label}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-[44px] font-black tabular-nums tracking-tight leading-none" style={{ color: config.color }}>
                  {Math.round(score)}
                </div>
                <div className="text-[14px] font-extrabold text-text-3">/ 100</div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center bg-[var(--color-supported-bg)] rounded-[10px] p-2">
                  <div className="text-base">✅</div>
                  <div className="text-[14px] font-black text-[var(--color-supported-text)]">{counts.SUPPORTED}</div>
                  <div className="text-[9px] font-extrabold text-text-3 uppercase tracking-wide">已验证</div>
                </div>
                <div className="text-center bg-[var(--color-nei-bg)] rounded-[10px] p-2">
                  <div className="text-base">🤔</div>
                  <div className="text-[14px] font-black text-[var(--color-nei-text)]">{counts.NEI}</div>
                  <div className="text-[9px] font-extrabold text-text-3 uppercase tracking-wide">存疑</div>
                </div>
                <div className="text-center bg-[var(--color-refuted-bg)] rounded-[10px] p-2">
                  <div className="text-base">❌</div>
                  <div className="text-[14px] font-black text-[var(--color-refuted-text)]">{counts.REFUTED}</div>
                  <div className="text-[9px] font-extrabold text-text-3 uppercase tracking-wide">误导</div>
                </div>
              </div>
            </div>

            {/* 关键提醒 */}
            {topClaim && (
              <div className="bg-white rounded-[14px] p-3.5 border-2 border-[var(--color-border)] mb-4">
                <div className="text-[10px] font-extrabold uppercase tracking-wider mb-1.5" style={{ color: VERDICT_LABEL[topClaim.verdict].color }}>
                  {VERDICT_LABEL[topClaim.verdict].emoji} 关键提醒
                </div>
                <div className="text-[12px] font-extrabold text-text mb-1.5 leading-snug">
                  「{topClaim.claim_text}」
                </div>
                <div className="text-[11px] font-bold text-text-2 leading-relaxed">
                  → {topClaim.truth_rewrite}
                </div>
              </div>
            )}

            {/* 底部 */}
            <div className="text-center pt-2 border-t-2 border-dashed border-[var(--color-border)]">
              <div className="text-[11px] font-extrabold text-text-3 mb-0.5">
                🔗 fact-buddy · 打假搭子
              </div>
              <div className="text-[10px] font-bold text-text-3">
                不下结论 · 只摆证据
              </div>
            </div>
          </div>

          {/* === 操作按钮（不在截图内） === */}
          <div className="p-4 bg-bg-soft border-t-2 border-[var(--color-border)] space-y-2.5">
            <div className="text-[11px] font-extrabold text-text-3 text-center uppercase tracking-wider">
              📸 截图保存 → 转发家人群
            </div>
            <div className="flex gap-2">
              <AppleButton
                variant="primary"
                size="md"
                fullWidth
                onClick={handleCopyText}
              >
                {copied ? '✓ 已复制文案' : '📋 复制文字版'}
              </AppleButton>
              <AppleButton variant="secondary" size="md" onClick={onClose}>
                关闭
              </AppleButton>
            </div>
            <div className="text-[10px] text-center text-text-3 font-bold">
              💡 微信里长按或截图卡片 → 发到家人群让大家少被骗
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
