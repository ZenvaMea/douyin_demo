'use client';

/**
 * 核查报告打印视图
 * 专为 window.print() 设计的页面，结合 globals.css 的 @media print 规则
 *
 * 用法：
 *   const [printing, setPrinting] = useState<HistoryRecord[] | null>(null);
 *   <ReportView records={printing} onClose={() => setPrinting(null)} />
 *
 * 流程：
 *   1. setPrinting([records...]) 触发渲染
 *   2. 100ms 后自动调 window.print()
 *   3. 用户在系统对话框选「另存为 PDF」
 */

import { useEffect } from 'react';
import type { HistoryRecord } from '@/lib/utils/history.ts';

const VERDICT_META = {
  SUPPORTED: { label: '已验证', emoji: '✅', color: '#3D8B00' },
  NEI: { label: '存疑', emoji: '🤔', color: '#B58900' },
  REFUTED: { label: '误导', emoji: '❌', color: '#C71E1E' },
};

const SOURCE_META: Record<HistoryRecord['source'], string> = {
  link: '抖音链接',
  paste: '粘贴文案',
  sample: '内置样例',
};

const RELATION_META = {
  supports: '支持',
  refutes: '反驳',
  partially_supports: '部分支持',
  context_dependent: '视情况',
} as const;

interface ReportViewProps {
  records: HistoryRecord[] | null;
  onClose: () => void;
}

export function ReportView({ records, onClose }: ReportViewProps) {
  useEffect(() => {
    if (!records || records.length === 0) return;

    // 等 DOM 渲染完成后触发打印
    const timer = setTimeout(() => {
      window.print();
      // 打印对话框关闭后清理
      const onAfterPrint = () => {
        onClose();
        window.removeEventListener('afterprint', onAfterPrint);
      };
      window.addEventListener('afterprint', onAfterPrint);
    }, 200);

    return () => clearTimeout(timer);
  }, [records, onClose]);

  if (!records || records.length === 0) return null;

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="report-print-root">
      {records.map((r, idx) => {
        const claims = r.claims;
        return (
          <article key={r.id} className="report-page" data-page-index={idx + 1}>
            {/* 报告头 */}
            <header className="report-header">
              <div className="report-brand">
                <span className="report-logo">🦉</span>
                <div>
                  <h1>打假搭子 · 核查报告</h1>
                  <div className="report-brand-sub">Fact Buddy · 不下结论 · 只摆证据</div>
                </div>
              </div>
              {records.length > 1 && (
                <div className="report-page-num">
                  第 {idx + 1} / {records.length} 份
                </div>
              )}
            </header>

            {/* 视频信息 */}
            <section className="report-section">
              <h2 className="report-h2">📺 视频信息</h2>
              <div className="report-meta-grid">
                <div className="report-meta-row">
                  <span className="report-meta-key">标题</span>
                  <span className="report-meta-val">{r.title || '（无标题）'}</span>
                </div>
                <div className="report-meta-row">
                  <span className="report-meta-key">作者</span>
                  <span className="report-meta-val">@{r.author || '未知'}</span>
                </div>
                <div className="report-meta-row">
                  <span className="report-meta-key">来源</span>
                  <span className="report-meta-val">{SOURCE_META[r.source]}</span>
                </div>
                {r.url && (
                  <div className="report-meta-row">
                    <span className="report-meta-key">链接</span>
                    <span className="report-meta-val report-meta-url">{r.url}</span>
                  </div>
                )}
                <div className="report-meta-row">
                  <span className="report-meta-key">核查时间</span>
                  <span className="report-meta-val">{formatDate(r.timestamp)}</span>
                </div>
                {r.meta && (
                  <div className="report-meta-row">
                    <span className="report-meta-key">使用模型</span>
                    <span className="report-meta-val">{r.meta.provider} · {r.meta.model}</span>
                  </div>
                )}
              </div>
            </section>

            {/* 总体评分 */}
            <section className="report-section">
              <h2 className="report-h2">🎯 总体评分</h2>
              <div className="report-score-block">
                <div
                  className="report-score-num"
                  style={{
                    color:
                      r.score >= 70 ? '#3D8B00' : r.score >= 40 ? '#B58900' : '#C71E1E',
                  }}
                >
                  {r.score}
                </div>
                <div className="report-score-meta">
                  <div className="report-score-of">/ 100</div>
                  <div
                    className="report-score-label"
                    style={{
                      color:
                        r.score >= 70 ? '#3D8B00' : r.score >= 40 ? '#B58900' : '#C71E1E',
                    }}
                  >
                    {r.score >= 70 ? '✅ 内容可信' : r.score >= 40 ? '⚠️ 部分存疑' : '🚨 高风险'}
                  </div>
                </div>
                <div className="report-counts">
                  <div className="report-count-item" style={{ background: '#F0FAE3', borderColor: '#3D8B00' }}>
                    <div className="report-count-num" style={{ color: '#3D8B00' }}>✅ {r.counts.SUPPORTED}</div>
                    <div className="report-count-label">已验证</div>
                  </div>
                  <div className="report-count-item" style={{ background: '#FFF8DB', borderColor: '#B58900' }}>
                    <div className="report-count-num" style={{ color: '#B58900' }}>🤔 {r.counts.NEI}</div>
                    <div className="report-count-label">存疑</div>
                  </div>
                  <div className="report-count-item" style={{ background: '#FFECEC', borderColor: '#C71E1E' }}>
                    <div className="report-count-num" style={{ color: '#C71E1E' }}>❌ {r.counts.REFUTED}</div>
                    <div className="report-count-label">误导</div>
                  </div>
                </div>
              </div>
              <p className="report-summary">📌 {r.summary}</p>
              {r.discardedCount > 0 && (
                <p className="report-discarded">🗑️ 已剔除营销话术 / 修辞段落：{r.discardedCount} 段</p>
              )}
            </section>

            {/* 逐条核查 */}
            <section className="report-section report-claims">
              <h2 className="report-h2">🔍 逐条核查报告</h2>
              {claims.map((c) => {
                const v = r.verifications[c.id];
                if (!v) return null;
                const meta = VERDICT_META[v.verdict];
                return (
                  <div
                    key={c.id}
                    className="report-claim"
                    style={{
                      borderLeft: `4px solid ${meta.color}`,
                    }}
                  >
                    <div className="report-claim-head">
                      <span
                        className="report-claim-badge"
                        style={{ background: meta.color, color: 'white' }}
                      >
                        {meta.emoji} {meta.label}
                      </span>
                      <span className="report-claim-id">{c.id}</span>
                      <span className="report-claim-conf">置信 {v.confidence}/5</span>
                    </div>
                    <p className="report-claim-text">{v.claim_text}</p>

                    <div className="report-claim-row">
                      <span className="report-claim-key">推理</span>
                      <span className="report-claim-val">{v.reasoning}</span>
                    </div>

                    {v.evidence.length > 0 && (
                      <div className="report-claim-row">
                        <span className="report-claim-key">证据</span>
                        <div className="report-claim-val">
                          {v.evidence.map((e, i) => (
                            <div key={i} className="report-evidence">
                              <strong>{e.source_name}</strong>（{RELATION_META[e.claim_relation]}）：{e.summary}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="report-claim-row report-claim-truth">
                      <span className="report-claim-key" style={{ color: '#3D8B00' }}>真相</span>
                      <span className="report-claim-val">{v.truth_rewrite}</span>
                    </div>

                    {v.caveats.length > 0 && (
                      <div className="report-claim-row">
                        <span className="report-claim-key">注意</span>
                        <ul className="report-claim-caveats">
                          {v.caveats.map((c2, i) => (
                            <li key={i}>{c2}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </section>

            {/* 报告尾 */}
            <footer className="report-footer">
              <div>本报告由 打假搭子 · Fact Buddy 自动生成</div>
              <div>不下结论 · 只摆证据 · 把判断权还给你</div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
