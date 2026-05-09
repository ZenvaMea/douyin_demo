'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn.ts';
import {
  getRecommendationsByDomain,
  getTierMeta,
  type AuthoritativeSource,
} from '@/lib/data/authoritative.ts';

interface AuthoritativeSourcesProps {
  /** 视频主领域：health / food / finance / lifestyle / science / other */
  primaryDomain: string;
  /** 是否含错误（用于个性化标题） */
  hasIssue: boolean;
}

/**
 * 抖音精选权威源推荐
 * 根据当前视频的 domain，推荐对应领域的真正权威账号
 *
 * 设计理念：
 * - 不止打假，还要告诉用户「真的应该看哪些」
 * - 体现赛题：让分散的优质内容被找到、用上
 * - 形成闭环：错误内容 → 推荐正规对照
 */
export function AuthoritativeSources({ primaryDomain, hasIssue }: AuthoritativeSourcesProps) {
  const recommendations = useMemo(
    () => getRecommendationsByDomain(primaryDomain, 4),
    [primaryDomain],
  );

  if (recommendations.length === 0) return null;

  const titleConfig = hasIssue
    ? { emoji: '📚', title: '别再信营销号', highlight: '看这些才靠谱' }
    : { emoji: '✨', title: '想了解更多？', highlight: '这些权威账号也不错' };

  const subtitleConfig = hasIssue
    ? '都是抖音上真正的权威科普 · 一键去看正版'
    : '同主题的权威博主推荐 · 一键去抖音搜';

  return (
    <div className="duo-card p-5 sm:p-6">
      {/* 标题 */}
      <div className="text-center mb-5">
        <div className="text-3xl mb-2">{titleConfig.emoji}</div>
        <h3 className="type-title-2 text-text mb-1.5">
          {titleConfig.title}，<span className="text-duo">{titleConfig.highlight}</span>
        </h3>
        <p className="text-[12px] font-bold text-text-3">{subtitleConfig}</p>
      </div>

      {/* 推荐卡片墙 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((src, i) => (
          <SourceCard key={src.id} source={src} index={i} />
        ))}
      </div>

      {/* 底部说明 */}
      <div className="mt-4 pt-4 border-t-2 border-dashed border-[var(--color-border)] text-center">
        <p className="text-[11px] font-bold text-text-3">
          💡 这些是经过验证的国家级 / 行业级权威账号
        </p>
      </div>
    </div>
  );
}

function SourceCard({ source, index }: { source: AuthoritativeSource; index: number }) {
  const tierMeta = getTierMeta(source.tier);

  const handleClick = () => {
    window.open(source.douyinSearchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.06, type: 'spring', stiffness: 380, damping: 32 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'duo-card text-left p-4 hover:border-[var(--color-duo)] transition-all',
        'hover:shadow-[0_4px_0_var(--color-duo)]',
        'group relative overflow-hidden',
      )}
    >
      {/* 顶部：tier 徽章 */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold mb-2.5"
        style={{ background: `${tierMeta.color}15`, color: tierMeta.color }}
      >
        {tierMeta.label}
      </div>

      {/* 头像 + 账号 */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: `${tierMeta.color}15` }}
        >
          {source.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-extrabold text-text truncate">
            {source.account}
          </div>
          <div className="text-[11px] font-bold text-text-3 truncate mt-0.5">
            {source.shortDesc}
          </div>
        </div>
      </div>

      {/* 完整描述 */}
      <p className="text-[12px] font-semibold text-text-2 leading-snug line-clamp-2 mb-3">
        {source.fullDesc}
      </p>

      {/* CTA */}
      <div className="flex items-center justify-between pt-2.5 border-t-2 border-dashed border-[var(--color-border)]">
        <span className="text-[11px] font-extrabold text-text-3">🔗 抖音搜索</span>
        <span className="text-[12px] font-extrabold text-duo flex items-center gap-1 group-hover:gap-2 transition-all">
          去看正版
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </motion.button>
  );
}
