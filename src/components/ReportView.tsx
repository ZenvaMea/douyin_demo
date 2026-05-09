'use client';

/**
 * 核查报告 - 杂志风简约设计
 * 配合 globals.css @media print 输出 PDF
 */

import { useEffect } from 'react';
import type { HistoryRecord } from '@/lib/utils/history.ts';

const VERDICT_META = {
  SUPPORTED: { label: '已验证', color: '#1F7A3A' },
  NEI: { label: '存疑', color: '#9C6B00' },
  REFUTED: { label: '误导', color: '#B91C1C' },
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
    const timer = setTimeout(() => {
      window.print();
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
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  return (
    <div className="report-print-root">
      {records.map((r, idx) => {
        const verdict =
          r.score >= 70 ? '内容可信' : r.score >= 40 ? '部分存疑' : '高风险';
        const verdictColor =
          r.score >= 70 ? '#1F7A3A' : r.score >= 40 ? '#9C6B00' : '#B91C1C';
        return (
          <article key={r.id} className="report-page">
            {/* 顶部品牌条 */}
            <header className="report-top">
              <div className="report-top-left">
                <span className="report-top-mark" />
                <div>
                  <div className="report-top-brand">FACT BUDDY</div>
                  <div className="report-top-sub">打假搭子 · 抖音内容核查报告</div>
                </div>
              </div>
              <div className="report-top-right">
                {records.length > 1 && (
                  <div className="report-top-page">
                    {String(idx + 1).padStart(2, '0')} / {String(records.length).padStart(2, '0')}
                  </div>
                )}
                <div className="report-top-date">{formatDate(r.timestamp)}</div>
              </div>
            </header>

            {/* 大标题 */}
            <section className="report-hero">
              <div className="report-hero-meta">
                <span className="report-hero-tag">{SOURCE_META[r.source]}</span>
                <span className="report-hero-author">@{r.author || '未知作者'}</span>
              </div>
              <h1 className="report-hero-title">{r.title || '（无标题）'}</h1>
              <p className="report-hero-summary">{r.summary}</p>
            </section>

            {/* 评分大区块 */}
            <section className="report-score">
              <div className="report-score-left">
                <div className="report-score-label">总体可信度</div>
                <div className="report-score-num" style={{ color: verdictColor }}>
                  {r.score}
                </div>
                <div className="report-score-of">SCORE / 100</div>
                <div className="report-score-verdict" style={{ color: verdictColor }}>
                  {verdict}
                </div>
              </div>
              <div className="report-score-right">
                <div className="report-stat">
                  <div className="report-stat-num" style={{ color: '#1F7A3A' }}>
                    {r.counts.SUPPORTED}
                  </div>
                  <div className="report-stat-label">已验证</div>
                </div>
                <div className="report-stat">
                  <div className="report-stat-num" style={{ color: '#9C6B00' }}>
                    {r.counts.NEI}
                  </div>
                  <div className="report-stat-label">存疑</div>
                </div>
                <div className="report-stat">
                  <div className="report-stat-num" style={{ color: '#B91C1C' }}>
                    {r.counts.REFUTED}
                  </div>
                  <div className="report-stat-label">误导</div>
                </div>
                {r.discardedCount > 0 && (
                  <div className="report-stat">
                    <div className="report-stat-num report-stat-muted">
                      {r.discardedCount}
                    </div>
                    <div className="report-stat-label">营销话术</div>
                  </div>
                )}
              </div>
            </section>

            {/* 核查详情 */}
            <section className="report-details">
              <div className="report-section-title">
                <span className="report-section-num">01</span>
                <span>逐条核查报告</span>
                <span className="report-section-count">共 {r.claims.length} 条声明</span>
              </div>

              {r.claims.map((c) => {
                const v = r.verifications[c.id];
                if (!v) return null;
                const meta = VERDICT_META[v.verdict];
                return (
                  <div key={c.id} className="report-claim">
                    <div className="report-claim-bar" style={{ background: meta.color }} />
                    <div className="report-claim-body">
                      <div className="report-claim-meta">
                        <span
                          className="report-claim-verdict"
                          style={{ color: meta.color }}
                        >
                          {meta.label}
                        </span>
                        <span className="report-claim-id">{c.id}</span>
                        <span className="report-claim-conf">置信度 {v.confidence}/5</span>
                      </div>
                      <p className="report-claim-text">{v.claim_text}</p>

                      <div className="report-claim-block">
                        <div className="report-claim-key">推理</div>
                        <div className="report-claim-val">{v.reasoning}</div>
                      </div>

                      {v.evidence.length > 0 && (
                        <div className="report-claim-block">
                          <div className="report-claim-key">证据</div>
                          <div className="report-claim-val">
                            {v.evidence.map((e, i) => (
                              <div key={i} className="report-evidence">
                                <span className="report-evidence-source">{e.source_name}</span>
                                <span className="report-evidence-rel">
                                  （{RELATION_META[e.claim_relation]}）
                                </span>
                                ：{e.summary}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="report-claim-truth">
                        <div className="report-truth-label">真相</div>
                        <div className="report-truth-val">{v.truth_rewrite}</div>
                      </div>

                      {v.caveats.length > 0 && (
                        <div className="report-claim-block">
                          <div className="report-claim-key">注意</div>
                          <div className="report-claim-val">
                            {v.caveats.map((c2, i) => (
                              <div key={i} className="report-caveat">
                                · {c2}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 报告尾 */}
            <footer className="report-bottom">
              <div className="report-bottom-line" />
              <div className="report-bottom-content">
                <div className="report-bottom-brand">
                  Fact Buddy · 打假搭子
                </div>
                <div className="report-bottom-tag">
                  不下结论 · 只摆证据 · 把判断权还给你
                </div>
                {r.meta && (
                  <div className="report-bottom-tech">
                    Powered by {r.meta.provider} / {r.meta.model}
                  </div>
                )}
              </div>
            </footer>
          </article>
        );
      })}
    </div>
  );
}
