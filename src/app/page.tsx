'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header.tsx';
import { AppleButton } from '@/components/AppleButton.tsx';
import { SegmentedControl } from '@/components/SegmentedControl.tsx';
import { SampleCard, type SampleData } from '@/components/SampleCard.tsx';
import { ProgressBar } from '@/components/ProgressBar.tsx';
import { CredibilityRing } from '@/components/CredibilityRing.tsx';
import { ClaimCard, type ClaimCardData, type Verdict } from '@/components/ClaimCard.tsx';
import { cn } from '@/lib/utils/cn.ts';

type Phase = 'idle' | 'fetching' | 'extracting' | 'verifying' | 'done' | 'error';
type InputMode = 'link' | 'paste';

interface ExtractedClaim {
  id: string;
  text: string;
  original_quote: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
  search_keywords: string[];
}

interface ExtractionResult {
  summary: string;
  primary_domain: string;
  claims: ExtractedClaim[];
  discarded_segments: { text: string; reason: string }[];
}

interface SampleMap {
  [key: string]: SampleData;
}

const SAMPLE_TINT: Record<string, 'red' | 'orange' | 'green' | 'blue' | 'purple'> = {
  health: 'red',
  finance: 'orange',
  food: 'green',
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [mode, setMode] = useState<InputMode>('link');
  const [linkUrl, setLinkUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [meta, setMeta] = useState<{ provider: string; model: string } | null>(null);
  const [phaseLabel, setPhaseLabel] = useState('');
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [verifications, setVerifications] = useState<Map<string, ClaimCardData>>(new Map());
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');
  const [samples, setSamples] = useState<SampleMap>({});

  const abortRef = useRef<AbortController | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/samples').then((r) => r.json()).then(setSamples).catch(() => undefined);
  }, []);

  const reset = () => {
    abortRef.current?.abort();
    setPhase('idle');
    setMeta(null);
    setExtraction(null);
    setVerifications(new Map());
    setProgress({ done: 0, total: 0 });
    setPhaseLabel('');
    setErrorMsg('');
  };

  const useSample = (s: SampleData) => {
    setMode('paste');
    setTranscript(s.transcript);
    setTitle(s.title);
    setAuthor(s.author);
  };

  const handleExtractAndCheck = async () => {
    if (!linkUrl.trim()) return;
    reset();
    setPhase('fetching');
    setPhaseLabel('正在解析视频 · 抓取信息 · 转写音频…');

    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkUrl }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        const hint = data.hint ? ` ${data.hint}` : '';
        throw new Error(`${data.error ?? '提取失败'}${hint}`);
      }
      const fetched = data.data as {
        title: string;
        author: string;
        transcript: string;
        asrUsed?: boolean;
        asrLength?: number;
        asrError?: string;
      };
      setTitle(fetched.title);
      setAuthor(fetched.author);
      setTranscript(fetched.transcript);
      if (fetched.asrUsed) {
        setPhaseLabel(`已转写 ${fetched.asrLength} 字 · 进入声明拆解…`);
      } else if (fetched.asrError) {
        setPhaseLabel('ASR 失败 · 仅用视频描述核查…');
      }
      await new Promise((r) => setTimeout(r, 400));
      await runCheck(fetched.transcript, fetched.title, fetched.author);
    } catch (err) {
      setErrorMsg((err as Error).message);
      setPhase('error');
    }
  };

  const handleCheck = async () => {
    if (transcript.trim().length < 10) return;
    reset();
    await runCheck(transcript, title, author);
  };

  const runCheck = async (t: string, ti: string, au: string) => {
    setPhase('extracting');
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: t, title: ti, author: au }),
        signal: controller.signal,
      });

      if (!resp.body) throw new Error('No stream');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const ev of events) {
          if (!ev.trim()) continue;
          const lines = ev.split('\n');
          let eventName = 'message';
          let dataStr = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) eventName = line.slice(7).trim();
            else if (line.startsWith('data: ')) dataStr += line.slice(6);
          }
          if (!dataStr) continue;
          let data: unknown;
          try { data = JSON.parse(dataStr); } catch { continue; }

          if (eventName === 'meta') {
            setMeta(data as { provider: string; model: string });
          } else if (eventName === 'phase') {
            const p = data as { phase: string; label: string; total?: number };
            if (p.phase === 'extracting') setPhase('extracting');
            if (p.phase === 'verifying') setPhase('verifying');
            setPhaseLabel(p.label);
            if (typeof p.total === 'number') setProgress({ done: 0, total: p.total });
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
          } else if (eventName === 'extraction') {
            setExtraction(data as ExtractionResult);
          } else if (eventName === 'verification') {
            const v = data as { progress: number; total: number; result: ClaimCardData & { error?: string } };
            setProgress({ done: v.progress, total: v.total });
            if (!('error' in v.result) || !v.result.error) {
              setVerifications((prev) => {
                const next = new Map(prev);
                next.set(v.result.claim_id, v.result);
                return next;
              });
            }
          } else if (eventName === 'done') {
            setPhase('done');
          } else if (eventName === 'error') {
            const e = data as { message: string };
            setErrorMsg(e.message);
            setPhase('error');
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setErrorMsg((err as Error).message);
      setPhase('error');
    }
  };

  const computedScore = (() => {
    const total = verifications.size;
    if (total === 0) return 0;
    let score = 0;
    verifications.forEach((v) => {
      if (v.verdict === 'SUPPORTED') score += 1;
      else if (v.verdict === 'NEI') score += 0.5;
    });
    return Math.round((score / total) * 100);
  })();

  const counts = (() => {
    const c: Record<Verdict, number> = { SUPPORTED: 0, NEI: 0, REFUTED: 0 };
    verifications.forEach((v) => { c[v.verdict] += 1; });
    return c;
  })();

  const verifyProgress = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const showInputArea = phase === 'idle' || phase === 'error';
  const isWorking = phase === 'fetching' || phase === 'extracting' || phase === 'verifying';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-[880px] mx-auto w-full px-6 py-12 sm:py-16">
        {showInputArea && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          >
            {/* Hero */}
            <div className="mb-10 sm:mb-12">
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="type-caption font-semibold text-system-blue uppercase tracking-[0.12em] mb-3"
              >
                Fact Buddy · 抖音内容核查
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="type-display text-text mb-4 max-w-[640px]"
              >
                别让营销号
                <span className="text-system-blue">骗</span>
                走你的判断。
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="type-title-2 text-text-2 font-normal max-w-[560px] leading-relaxed"
              >
                粘贴抖音视频链接或文案，AI 拆解关键声明，逐条核查信源，
                <span className="text-text">不下结论，只摆证据</span>。
              </motion.p>
            </div>

            {/* 输入卡（Liquid Glass） */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 380, damping: 32 }}
              className="glass-thick rounded-[20px] p-5 mb-6 shadow-apple-md"
            >
              {/* Segmented */}
              <div className="flex items-center justify-between mb-4">
                <SegmentedControl
                  options={[
                    { value: 'link', label: <><span>🔗</span><span>抖音链接</span></> },
                    { value: 'paste', label: <><span>📝</span><span>粘贴文案</span></> },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
              </div>

              {/* 输入区切换 */}
              <AnimatePresence mode="wait">
                {mode === 'link' ? (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <input
                      type="url"
                      placeholder="https://v.douyin.com/xxx 或完整视频链接"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && linkUrl.trim()) handleExtractAndCheck();
                      }}
                      className="apple-input"
                      autoComplete="off"
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="type-caption text-text-3 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        从抖音 App 点「分享 → 复制链接」即可
                      </div>
                      <AppleButton
                        variant="filled"
                        size="lg"
                        onClick={handleExtractAndCheck}
                        disabled={!linkUrl.trim()}
                      >
                        开始核查
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </AppleButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="paste"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="视频标题（可选）"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="apple-input"
                      />
                      <input
                        type="text"
                        placeholder="作者（可选）"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="apple-input"
                      />
                    </div>
                    <textarea
                      placeholder="粘贴视频文案到这里…"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={6}
                      className="apple-input"
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="type-caption text-text-3 tabular-nums">
                        {transcript.length} 字 · 至少 10 字
                      </div>
                      <AppleButton
                        variant="filled"
                        size="lg"
                        onClick={handleCheck}
                        disabled={transcript.trim().length < 10}
                      >
                        开始核查
                      </AppleButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* 示例 */}
            <div>
              <div className="type-caption font-semibold uppercase tracking-[0.12em] text-text-3 mb-3">
                试试这些经典翻车样例
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(samples).map(([key, sample], i) => (
                  <SampleCard
                    key={key}
                    sample={sample}
                    onClick={useSample}
                    index={i}
                    tint={SAMPLE_TINT[key] ?? 'blue'}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 apple-card p-4 border-l-[3px] border-system-red"
                style={{ borderLeftColor: '#FF3B30' }}
              >
                <div className="type-callout font-semibold text-[var(--color-refuted-text)] mb-1">
                  提取失败
                </div>
                <div className="type-body text-text-2">{errorMsg}</div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 结果区 */}
        {(isWorking || phase === 'done') && (
          <section ref={resultRef}>
            {/* 状态条 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="apple-card p-4 mb-5"
            >
              <div className="flex items-center gap-3">
                {phase === 'done' ? (
                  <div className="w-9 h-9 rounded-full bg-[var(--color-supported-bg)] flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[var(--color-supported-text)]">
                      <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-full bg-system-blue/10 flex items-center justify-center flex-shrink-0">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-system-blue">
                        <path d="M21 12a9 9 0 11-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="type-callout font-semibold text-text">
                    {phase === 'done' ? '核查完成' : phaseLabel || '准备中…'}
                  </div>
                  {meta && (
                    <div className="type-caption text-text-3 mt-0.5">
                      {meta.provider} · {meta.model}
                    </div>
                  )}
                </div>
                {phase === 'done' && (
                  <AppleButton variant="gray" size="sm" onClick={reset}>
                    再核一条
                  </AppleButton>
                )}
              </div>
              {phase === 'verifying' && progress.total > 0 && (
                <div className="mt-4">
                  <ProgressBar
                    progress={verifyProgress}
                    label={`已核查 ${progress.done} / ${progress.total} 条声明`}
                  />
                </div>
              )}
            </motion.div>

            {/* 视频元信息 + 评分 */}
            {extraction && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="apple-card-elevated p-6 mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {phase === 'done' && verifications.size > 0 && (
                    <div className="flex-shrink-0">
                      <CredibilityRing score={computedScore} size={170} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="type-caption text-text-3 uppercase tracking-[0.12em] mb-2">
                      视频内容
                    </div>
                    {title && (
                      <div className="type-title-2 text-text mb-1.5 leading-tight">{title}</div>
                    )}
                    {author && <div className="type-callout text-system-blue mb-3">{author}</div>}
                    <div className="type-body text-text-2 mb-3">{extraction.summary}</div>
                    {phase === 'done' && (
                      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start type-caption font-semibold">
                        <span className="flex items-center gap-1.5 text-[var(--color-supported-text)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-supported-bar)]" />
                          已验证 {counts.SUPPORTED}
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--color-nei-text)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-nei-bar)]" />
                          存疑 {counts.NEI}
                        </span>
                        <span className="flex items-center gap-1.5 text-[var(--color-refuted-text)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-refuted-bar)]" />
                          误导 {counts.REFUTED}
                        </span>
                        <span className="text-text-3">
                          · 已剔除 {extraction.discarded_segments.length} 段营销
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 声明列表 */}
            {extraction && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="type-headline text-text">核查报告</div>
                  <div className="type-caption text-text-3">点击展开查看证据</div>
                </div>
                <div className="space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {extraction.claims.map((claim, idx) => {
                      const v = verifications.get(claim.id);
                      if (v) {
                        return <ClaimCard key={claim.id} data={v} index={idx} />;
                      }
                      return (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="apple-card p-4 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              className="w-4 h-4"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-text-3">
                                <path d="M21 12a9 9 0 11-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                              </svg>
                            </motion.div>
                            <div className="flex-1">
                              <div className="type-caption text-text-3 mb-0.5">
                                {claim.id} · 核查中
                              </div>
                              <div className="type-callout font-medium text-text">{claim.text}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="py-10 border-t border-separator">
        <div className="max-w-[880px] mx-auto px-6 flex items-center justify-between flex-wrap gap-3">
          <div className="type-caption text-text-3">
            打假搭子 · 抖音精选内容核查
          </div>
          <div className="type-caption text-text-3">
            不下结论 · 只摆证据
          </div>
        </div>
      </footer>
    </div>
  );
}
