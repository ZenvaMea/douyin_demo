'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { AppleButton } from './AppleButton.tsx';

interface ClaimSummary {
  claim_text: string;
  verdict: 'SUPPORTED' | 'NEI' | 'REFUTED';
  truth_rewrite: string;
  source_name?: string;
}

interface ShareCardProps {
  title: string;
  author: string;
  summary: string;
  score: number;
  counts: { SUPPORTED: number; NEI: number; REFUTED: number };
  discardedCount: number;
  topClaims: ClaimSummary[];
  sources: string[];
  onClose: () => void;
}

const VERDICT_CONFIG: Record<ClaimSummary['verdict'], { emoji: string; color: string; bg: string; border: string }> = {
  REFUTED:   { emoji: '❌', color: '#C71E1E', bg: '#FFECEC', border: '#FFCDCD' },
  NEI:       { emoji: '🤔', color: '#B58900', bg: '#FFF8DB', border: '#FFE5B0' },
  SUPPORTED: { emoji: '✅', color: '#3D8B00', bg: '#F0FAE3', border: '#C6E89A' },
};

/**
 * 转发分享卡片 - 信息丰富但视觉清晰
 *
 * 内容（自上而下）：
 * 1. 顶部品牌
 * 2. 风险横幅（基于评分）
 * 3. 视频标题 + 作者 + 主题概括
 * 4. 巨大评分 + 进度条 + 三色统计
 * 5. 多条警示（最多 3 条）
 * 6. 引用源 + 时间
 *
 * 设计原则：
 * - 每条文字都短（30 字内）
 * - 视觉层次清晰
 * - 一屏可读
 */
export function ShareCard({
  title,
  author,
  summary,
  score,
  counts,
  discardedCount,
  topClaims,
  sources,
  onClose,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const config =
    score >= 70
      ? { emoji: '✅', label: '内容可信', color: '#3D8B00', bg: '#F0FAE3', borderColor: '#C6E89A', bannerText: '本视频整体可信，可放心参考' }
      : score >= 40
        ? { emoji: '⚠️', label: '部分存疑', color: '#B58900', bg: '#FFF8DB', borderColor: '#FFE5B0', bannerText: '部分内容存疑，请谨慎参考' }
        : { emoji: '🚨', label: '高风险', color: '#C71E1E', bg: '#FFECEC', borderColor: '#FFCDCD', bannerText: '该视频含较多误导信息！' };

  // 截短真相到一句
  const shortTruth = (s: string) => {
    const first = s.split(/[。.！!？?]/)[0]?.trim() ?? '';
    return first.length > 60 ? first.slice(0, 60) + '...' : first;
  };

  const shortClaim = (s: string) => (s.length > 30 ? s.slice(0, 30) + '...' : s);

  const handleCopyText = async () => {
    const lines = [
      `🦉 打假搭子核查`,
      ``,
      `📺 ${title}`,
      `@${author}`,
      ``,
      `📌 ${summary}`,
      ``,
      `🎯 ${score}/100  ${config.emoji} ${config.label}`,
      `✅${counts.SUPPORTED} 🤔${counts.NEI} ❌${counts.REFUTED}`,
    ];
    if (topClaims.length > 0) {
      lines.push('', `🚨 这些话有问题：`);
      topClaims.forEach((c) => {
        const cfg = VERDICT_CONFIG[c.verdict];
        lines.push(`${cfg.emoji} 「${shortClaim(c.claim_text)}」`);
        lines.push(`  ✅ ${shortTruth(c.truth_rewrite)}`);
      });
    }
    if (sources.length > 0) {
      lines.push('', `📚 引用：${sources.slice(0, 3).join(' · ')}`);
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
          className="w-full max-w-[400px] bg-white rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.3)] my-4"
        >
          {/* === 卡片主体 === */}
          <div className="bg-white">
            {/* === 顶部品牌（紧凑） === */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b-2 border-[var(--color-separator)]">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦉</span>
                <div className="leading-none">
                  <div className="text-[14px] font-black text-text">打假搭子</div>
                  <div className="text-[9px] font-extrabold text-text-3 mt-0.5 tracking-[0.14em] uppercase">
                    Fact Buddy · 核查报告
                  </div>
                </div>
              </div>
              <div className="text-[10px] font-extrabold text-text-3 tracking-wider">
                #{Date.now().toString().slice(-6)}
              </div>
            </div>

            {/* === 风险横幅（最显眼） === */}
            <div
              className="px-5 py-3 flex items-center gap-2.5"
              style={{
                background: config.bg,
                borderBottom: `2px solid ${config.borderColor}`,
              }}
            >
              <span className="text-2xl flex-shrink-0">{config.emoji}</span>
              <div className="flex-1">
                <div
                  className="text-[10px] font-extrabold uppercase tracking-[0.14em]"
                  style={{ color: config.color }}
                >
                  风险评级
                </div>
                <div className="text-[14px] font-black mt-0.5" style={{ color: config.color }}>
                  {config.bannerText}
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* === 视频信息 === */}
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-3 mb-1">
                  📺 视频
                </div>
                <div className="text-[15px] font-extrabold text-text leading-snug mb-1 line-clamp-2">
                  {title}
                </div>
                <div className="text-[12px] font-bold text-duo mb-2">@{author}</div>
                {summary && (
                  <div className="text-[12px] font-bold text-text-2 leading-relaxed bg-bg-soft rounded-[10px] px-3 py-2 border-2 border-[var(--color-separator)]">
                    📌 {summary}
                  </div>
                )}
              </div>

              {/* === 评分 + 进度条 === */}
              <div
                className="rounded-[16px] p-4"
                style={{
                  background: `linear-gradient(135deg, ${config.bg} 0%, white 100%)`,
                  border: `2px solid ${config.borderColor}`,
                }}
              >
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div
                      className="text-[10px] font-extrabold uppercase tracking-[0.14em] mb-0.5"
                      style={{ color: config.color }}
                    >
                      可信度
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="font-black tabular-nums tracking-[-0.04em] leading-none"
                        style={{ fontSize: 56, color: config.color }}
                      >
                        {score}
                      </span>
                      <span className="text-[14px] font-extrabold text-text-3">/100</span>
                    </div>
                  </div>
                  <div
                    className="px-2.5 py-1 rounded-full text-[12px] font-black"
                    style={{ background: config.color, color: 'white' }}
                  >
                    {config.label}
                  </div>
                </div>

                {/* 进度条 */}
                <div className="h-2 bg-white rounded-full overflow-hidden border-2 border-[var(--color-border)]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="h-full rounded-full"
                    style={{ background: config.color }}
                  />
                </div>
              </div>

              {/* === 三色统计 === */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-[12px] py-2.5 text-center" style={{ background: '#F0FAE3' }}>
                  <div className="text-[18px] leading-none mb-1">✅</div>
                  <div className="text-[20px] font-black tabular-nums leading-none" style={{ color: '#3D8B00' }}>
                    {counts.SUPPORTED}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1" style={{ color: '#3D8B00' }}>
                    已验证
                  </div>
                </div>
                <div className="rounded-[12px] py-2.5 text-center" style={{ background: '#FFF8DB' }}>
                  <div className="text-[18px] leading-none mb-1">🤔</div>
                  <div className="text-[20px] font-black tabular-nums leading-none" style={{ color: '#B58900' }}>
                    {counts.NEI}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1" style={{ color: '#B58900' }}>
                    存疑
                  </div>
                </div>
                <div className="rounded-[12px] py-2.5 text-center" style={{ background: '#FFECEC' }}>
                  <div className="text-[18px] leading-none mb-1">❌</div>
                  <div className="text-[20px] font-black tabular-nums leading-none" style={{ color: '#C71E1E' }}>
                    {counts.REFUTED}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase tracking-wider mt-1" style={{ color: '#C71E1E' }}>
                    误导
                  </div>
                </div>
              </div>

              {/* === 这些话有问题（多条） === */}
              {topClaims.length > 0 && (
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-text-3 mb-2 flex items-center gap-1.5">
                    <span>🚨</span>
                    <span>这些话有问题</span>
                  </div>
                  <div className="space-y-2">
                    {topClaims.map((c, i) => {
                      const cfg = VERDICT_CONFIG[c.verdict];
                      return (
                        <div
                          key={i}
                          className="rounded-[12px] p-3"
                          style={{ background: cfg.bg, border: `2px solid ${cfg.border}` }}
                        >
                          <div className="flex items-start gap-2 mb-1.5">
                            <span className="text-base flex-shrink-0">{cfg.emoji}</span>
                            <div
                              className="text-[13px] font-extrabold leading-snug"
                              style={{
                                color: cfg.color,
                                textDecoration: c.verdict === 'REFUTED' ? 'line-through' : 'none',
                                textDecorationThickness: '2px',
                              }}
                            >
                              「{shortClaim(c.claim_text)}」
                            </div>
                          </div>
                          {shortTruth(c.truth_rewrite) && (
                            <div className="flex items-start gap-2 pl-6">
                              <span className="text-[10px] flex-shrink-0 mt-0.5">→</span>
                              <div className="text-[12px] font-bold text-text leading-snug">
                                <span className="text-[#3D8B00] mr-1">✅</span>
                                {shortTruth(c.truth_rewrite)}
                              </div>
                            </div>
                          )}
                          {c.source_name && (
                            <div className="text-[10px] font-extrabold mt-1.5 pl-6" style={{ color: cfg.color, opacity: 0.7 }}>
                              📚 {c.source_name}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* === 信源 + 数据点 === */}
              <div className="bg-bg-soft rounded-[12px] p-3 border-2 border-[var(--color-separator)] space-y-1.5">
                {sources.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-3 flex-shrink-0 pt-0.5">
                      📚 引用
                    </span>
                    <div className="text-[11px] font-bold text-text-2 leading-snug">
                      {sources.slice(0, 3).join(' · ')}
                      {sources.length > 3 && ` 等 ${sources.length} 个权威源`}
                    </div>
                  </div>
                )}
                {discardedCount > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-3 flex-shrink-0 pt-0.5">
                      🗑️ 剔除
                    </span>
                    <div className="text-[11px] font-bold text-text-2 leading-snug">
                      已剔除 {discardedCount} 段营销话术 / 修辞
                    </div>
                  </div>
                )}
              </div>

              {/* 底部水印 */}
              <div className="text-center pt-1">
                <div className="text-[10px] font-extrabold text-text-3 tracking-wider">
                  🔗 fact-buddy · 不下结论 · 只摆证据
                </div>
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
