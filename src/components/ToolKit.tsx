'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import type { ToolkitData, ToolkitType } from '@/lib/services/insights-extractor.ts';

const TYPE_META: Record<ToolkitType, { emoji: string; label: string; stepLabel: string; checklistLabel: string }> = {
  cooking:    { emoji: '🍳', label: '食谱卡',     stepLabel: '步骤',   checklistLabel: '购物清单' },
  fitness:    { emoji: '💪', label: '训练计划',   stepLabel: '动作',   checklistLabel: '装备 / 准备' },
  workplace:  { emoji: '💼', label: 'SOP 模板',   stepLabel: '流程',   checklistLabel: '准备项' },
  learning:   { emoji: '📚', label: '行动步骤',   stepLabel: '步骤',   checklistLabel: '所需材料' },
  finance:    { emoji: '💰', label: '决策清单',   stepLabel: '决策步骤', checklistLabel: '要查的项' },
  travel:     { emoji: '🧳', label: '行程清单',   stepLabel: '行程',   checklistLabel: '必带物品' },
  lifestyle:  { emoji: '☀️', label: '习惯清单',   stepLabel: '步骤',   checklistLabel: '准备项' },
  other:      { emoji: '📋', label: '行动清单',   stepLabel: '步骤',   checklistLabel: '准备项' },
};

interface ToolKitProps {
  type: ToolkitType;
  title: string;
  toolkit: ToolkitData;
}

/**
 * 可用工具包卡片（赛题方向三：使用）
 * 把视频内容转成可执行物：步骤 / 物料清单 / 提醒
 * 支持一键复制 markdown
 */
export function ToolKit({ type, title, toolkit }: ToolKitProps) {
  const [copied, setCopied] = useState(false);
  const meta = TYPE_META[type];

  const hasSteps = toolkit.steps && toolkit.steps.length > 0;
  const hasChecklist = toolkit.checklist && toolkit.checklist.length > 0;
  const hasReminders = toolkit.reminders && toolkit.reminders.length > 0;

  if (!hasSteps && !hasChecklist && !hasReminders) {
    return null;
  }

  const handleCopy = async () => {
    let md = `# ${meta.emoji} ${title}\n\n`;
    if (hasSteps) {
      md += `## ${meta.stepLabel}\n`;
      toolkit.steps!.forEach((s) => {
        md += `${s.order}. **${s.title}**${s.meta ? ` _(${s.meta})_` : ''}\n`;
        if (s.detail) md += `   ${s.detail}\n`;
      });
      md += '\n';
    }
    if (hasChecklist) {
      md += `## ${meta.checklistLabel}\n`;
      toolkit.checklist!.forEach((c) => {
        md += `- [ ] ${c.item}${c.qty ? ` × ${c.qty}` : ''}${c.note ? `（${c.note}）` : ''}\n`;
      });
      md += '\n';
    }
    if (hasReminders) {
      md += `## ⚠️ 注意\n`;
      toolkit.reminders!.forEach((r) => (md += `- ${r}\n`));
    }
    try {
      await navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
      className="duo-card p-5 sm:p-6 border-[var(--color-duo)]"
      style={{ background: 'linear-gradient(180deg, var(--color-duo-bg) 0%, white 60%)' }}
    >
      <div className="flex items-start justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="text-3xl">{meta.emoji}</span>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider"
                style={{ background: 'var(--color-duo)', color: 'white' }}
              >
                可立即使用
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-text-3">
                {meta.label}
              </span>
            </div>
            <h3 className="text-[18px] font-extrabold text-text leading-tight">{title}</h3>
          </div>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-[10px] bg-white border-2 border-[var(--color-border-strong)] text-[12px] font-extrabold text-text hover:bg-bg-soft transition-colors"
        >
          {copied ? (
            <>
              <span>✓</span>
              <span className="text-duo">已复制</span>
            </>
          ) : (
            <>
              <span>📋</span>
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* 步骤 */}
      {hasSteps && (
        <div className="mb-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2.5">
            {meta.stepLabel}
          </div>
          <ol className="space-y-2.5">
            {toolkit.steps!.map((s, i) => (
              <motion.li
                key={s.order}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-start gap-3 p-3 rounded-[12px] bg-white border-2 border-[var(--color-border)]"
              >
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-duo text-white flex items-center justify-center text-[12px] font-black">
                  {s.order}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-extrabold text-text">{s.title}</span>
                    {s.meta && (
                      <span className="text-[11px] font-extrabold text-duo px-1.5 py-0.5 rounded bg-[var(--color-duo-bg)]">
                        {s.meta}
                      </span>
                    )}
                  </div>
                  {s.detail && (
                    <p className="text-[13px] font-semibold text-text-2 mt-1 leading-snug">{s.detail}</p>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      )}

      {/* 物料清单 */}
      {hasChecklist && (
        <div className="mb-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2.5 flex items-center gap-1.5">
            <span>🛒</span> {meta.checklistLabel}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {toolkit.checklist!.map((c, i) => (
              <motion.label
                key={i}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + i * 0.04 }}
                className="flex items-start gap-2.5 p-2.5 rounded-[10px] bg-white border-2 border-[var(--color-border)] cursor-pointer hover:border-[var(--color-duo)] transition-colors"
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 accent-[var(--color-duo)] cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-[14px] font-extrabold text-text">{c.item}</span>
                    {c.qty && (
                      <span className="text-[12px] font-bold text-text-2">× {c.qty}</span>
                    )}
                  </div>
                  {c.note && (
                    <div className="text-[11px] font-bold text-text-3 mt-0.5">{c.note}</div>
                  )}
                </div>
              </motion.label>
            ))}
          </div>
        </div>
      )}

      {/* 提醒 */}
      {hasReminders && (
        <div>
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-text-3 mb-2 flex items-center gap-1.5">
            <span>⚠️</span> 注意事项
          </div>
          <ul className="space-y-1.5">
            {toolkit.reminders!.map((r, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.04 }}
                className="flex items-start gap-2 text-[13px] font-bold text-text-2 leading-relaxed"
              >
                <span className="text-[var(--color-nei)] flex-shrink-0">•</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
