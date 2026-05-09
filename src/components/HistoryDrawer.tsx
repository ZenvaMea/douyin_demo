'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn.ts';
import {
  getHistory,
  deleteHistory,
  clearHistory,
  formatRelativeTime,
  getDominantVerdict,
  type HistoryRecord,
} from '@/lib/utils/history.ts';
import { AppleButton } from './AppleButton.tsx';

type Filter = 'all' | 'refuted' | 'nei' | 'supported';

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (record: HistoryRecord) => void;
}

const FILTERS: Array<{ key: Filter; label: string; emoji: string }> = [
  { key: 'all',       emoji: '📚', label: '全部' },
  { key: 'refuted',   emoji: '❌', label: '含误导' },
  { key: 'nei',       emoji: '🤔', label: '含存疑' },
  { key: 'supported', emoji: '✅', label: '全靠谱' },
];

const SOURCE_META: Record<HistoryRecord['source'], { emoji: string; label: string }> = {
  link:   { emoji: '🔗', label: '链接' },
  paste:  { emoji: '📝', label: '粘贴' },
  sample: { emoji: '✨', label: '样例' },
};

export function HistoryDrawer({ open, onClose, onSelect }: HistoryDrawerProps) {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (open) {
      setRecords(getHistory());
    }
  }, [open]);

  // 监听更新事件
  useEffect(() => {
    const onUpdate = () => setRecords(getHistory());
    window.addEventListener('factbuddy:history-update', onUpdate);
    return () => window.removeEventListener('factbuddy:history-update', onUpdate);
  }, []);

  const filtered = records.filter((r) => {
    if (filter === 'all') return true;
    if (filter === 'refuted') return r.counts.REFUTED > 0;
    if (filter === 'nei') return r.counts.REFUTED === 0 && r.counts.NEI > 0;
    if (filter === 'supported') return r.counts.REFUTED === 0 && r.counts.NEI === 0;
    return true;
  });

  const handleClearAll = () => {
    if (window.confirm('确定清空全部核查记录吗？此操作不可撤销。')) {
      clearHistory();
      setRecords([]);
    }
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteHistory(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/35"
          />

          {/* 抽屉 */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="fixed right-0 top-0 bottom-0 z-[91] w-full sm:w-[440px] bg-white flex flex-col shadow-[-8px_0_32px_rgba(0,0,0,0.12)]"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[var(--color-separator)]">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="text-[16px] font-black text-text">我的核查记录</div>
                  <div className="text-[11px] font-bold text-text-3 mt-0.5">
                    共 <span className="text-duo">{records.length}</span> 条
                    {records.length >= 50 && '（已达上限）'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-[10px] bg-bg-soft hover:bg-[var(--color-border)] flex items-center justify-center transition-colors"
                aria-label="关闭"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* 筛选 */}
            {records.length > 0 && (
              <div className="px-5 py-3 border-b-2 border-[var(--color-separator)] overflow-x-auto">
                <div className="inline-flex gap-1.5 p-1 rounded-[12px] bg-bg-soft border-2 border-[var(--color-border)]">
                  {FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setFilter(f.key)}
                      className={cn(
                        'h-8 px-3 rounded-[8px] flex items-center gap-1.5 text-[12px] font-extrabold transition-all whitespace-nowrap',
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
            )}

            {/* 列表 */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
                  <div className="text-6xl mb-4 animate-float">🦉</div>
                  <h3 className="type-title-2 text-text mb-2">还没有核查记录</h3>
                  <p className="text-[14px] font-bold text-text-3 leading-relaxed mb-6">
                    每核查一条视频，都会保存到这里。
                    <br />
                    随时回看，再也不怕忘 👀
                  </p>
                  <AppleButton variant="primary" size="md" onClick={onClose}>
                    去核查一条 →
                  </AppleButton>
                </div>
              ) : filtered.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="text-[14px] font-bold text-text-3">
                    没有匹配的记录
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((r) => {
                    const dom = getDominantVerdict(r.counts);
                    const accent =
                      dom === 'REFUTED'
                        ? 'var(--color-refuted)'
                        : dom === 'NEI'
                          ? 'var(--color-nei)'
                          : dom === 'SUPPORTED'
                            ? 'var(--color-supported)'
                            : 'var(--color-border)';
                    const scoreColor =
                      r.score >= 70
                        ? 'var(--color-supported-text)'
                        : r.score >= 40
                          ? 'var(--color-nei-text)'
                          : 'var(--color-refuted-text)';
                    return (
                      <motion.button
                        key={r.id}
                        type="button"
                        onClick={() => onSelect(r)}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="duo-card text-left p-4 w-full hover:border-[var(--color-duo)] transition-all relative group"
                        style={{ borderLeftColor: accent, borderLeftWidth: 4 }}
                      >
                        {/* 顶部：时间 + 来源 + 删除 */}
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2 text-[10px] font-extrabold text-text-3 uppercase tracking-wider">
                            <span>{SOURCE_META[r.source].emoji} {SOURCE_META[r.source].label}</span>
                            <span>·</span>
                            <span>{formatRelativeTime(r.timestamp)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, r.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-md hover:bg-bg-soft flex items-center justify-center text-text-3 hover:text-[var(--color-refuted-text)]"
                            aria-label="删除"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                              <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m4 4v6m4-6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>

                        {/* 标题 */}
                        <div className="text-[14px] font-extrabold text-text leading-snug mb-1.5 line-clamp-2">
                          {r.title || '（无标题）'}
                        </div>

                        {/* 作者 */}
                        {r.author && (
                          <div className="text-[12px] font-bold text-duo mb-2.5">
                            @{r.author}
                          </div>
                        )}

                        {/* 评分 + 三色 */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-baseline gap-1">
                            <span
                              className="text-[20px] font-black tabular-nums tracking-tight leading-none"
                              style={{ color: scoreColor }}
                            >
                              {r.score}
                            </span>
                            <span className="text-[10px] font-extrabold text-text-3">/100</span>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-extrabold">
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--color-supported-bg)',
                                color: 'var(--color-supported-text)',
                              }}
                            >
                              ✅{r.counts.SUPPORTED}
                            </span>
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--color-nei-bg)',
                                color: 'var(--color-nei-text)',
                              }}
                            >
                              🤔{r.counts.NEI}
                            </span>
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--color-refuted-bg)',
                                color: 'var(--color-refuted-text)',
                              }}
                            >
                              ❌{r.counts.REFUTED}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 底部 */}
            {records.length > 0 && (
              <div className="px-5 py-3 border-t-2 border-[var(--color-separator)] flex items-center justify-between">
                <div className="text-[11px] font-bold text-text-3">
                  💡 仅保存在你的浏览器，不上传服务器
                </div>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-extrabold text-text-3 hover:text-[var(--color-refuted-text)] transition-colors"
                >
                  清空全部
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
