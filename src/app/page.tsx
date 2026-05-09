'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header.tsx';
import { DuoButton } from '@/components/DuoButton.tsx';
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

const SAMPLE_THEME: Record<string, string> = {
  health: 'duo-card-red',
  finance: 'duo-card-yellow',
  food: 'duo-card-green',
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
    fetch('/api/samples')
      .then((r) => r.json())
      .then(setSamples)
      .catch(() => undefined);
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
    setPhaseLabel('🦉 正在解析抖音链接 → 抓取视频信息 → 下载 → 转写音频...（约 30-60 秒）');

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
      // 显示提取摘要
      if (fetched.asrUsed) {
        setPhaseLabel(`✨ 已提取 + ASR 转写完成（${fetched.asrLength} 字），进入核查...`);
      } else if (fetched.asrError) {
        setPhaseLabel(`⚠️ ASR 失败: ${fetched.asrError}，仅用 desc 核查...`);
      } else {
        setPhaseLabel('✨ 已提取视频文案，进入核查...');
      }
      await new Promise((r) => setTimeout(r, 600));
      // 自动触发核查
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
          try {
            data = JSON.parse(dataStr);
          } catch {
            continue;
          }

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
    verifications.forEach((v) => {
      c[v.verdict] += 1;
    });
    return c;
  })();

  const verifyProgress = progress.total > 0 ? (progress.done / progress.total) * 100 : 0;
  const showInputArea = phase === 'idle';
  const isWorking = phase === 'fetching' || phase === 'extracting' || phase === 'verifying';

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 sm:py-12">
        {(showInputArea || phase === 'error') && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* 大标题 */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="text-7xl mb-4 inline-block"
              >
                🦉
              </motion.div>
              <h1 className="text-4xl sm:text-5xl font-black text-[var(--color-duo-eel)] tracking-tight mb-3">
                别让营销号
                <span className="text-[var(--color-duo-green)]">骗</span>
                你！
              </h1>
              <p className="text-base sm:text-lg font-bold text-[var(--color-duo-wolf)]">
                粘贴抖音视频文案，
                <span className="text-[var(--color-duo-green)] font-black">AI 帮你逐条核查</span>
              </p>
            </div>

            {/* 模式切换 Tab */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex justify-center mb-4"
            >
              <div className="inline-flex bg-[var(--color-duo-snow)] rounded-2xl p-1.5 border-2 border-[var(--color-duo-swan)]">
                <button
                  type="button"
                  onClick={() => setMode('link')}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-extrabold transition-all',
                    mode === 'link'
                      ? 'bg-[var(--color-duo-green)] text-white shadow-md'
                      : 'text-[var(--color-duo-wolf)] hover:text-[var(--color-duo-eel)]',
                  )}
                >
                  🔗 抖音链接
                </button>
                <button
                  type="button"
                  onClick={() => setMode('paste')}
                  className={cn(
                    'px-5 py-2 rounded-xl text-sm font-extrabold transition-all',
                    mode === 'paste'
                      ? 'bg-[var(--color-duo-green)] text-white shadow-md'
                      : 'text-[var(--color-duo-wolf)] hover:text-[var(--color-duo-eel)]',
                  )}
                >
                  ✏️ 粘贴文案
                </button>
              </div>
            </motion.div>

            {/* 输入框 */}
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="duo-card p-2 mb-6"
            >
              {mode === 'link' ? (
                <div className="space-y-3 p-2">
                  <div className="text-xs font-extrabold tracking-wider text-[var(--color-duo-wolf)] uppercase">
                    🦉 粘贴抖音视频链接（短链或完整链接）
                  </div>
                  <input
                    type="url"
                    placeholder="https://v.douyin.com/xxx 或 https://www.douyin.com/video/xxx"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && linkUrl.trim()) handleExtractAndCheck();
                    }}
                    className="duo-input text-base"
                  />
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="text-xs font-bold text-[var(--color-duo-wolf)]">
                      💡 提示：从抖音 App 点「分享 → 复制链接」即可
                    </div>
                    <DuoButton
                      variant="primary"
                      size="lg"
                      onClick={handleExtractAndCheck}
                      disabled={!linkUrl.trim()}
                    >
                      🔍 提取并核查
                    </DuoButton>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="视频标题（可选）"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="duo-input text-sm py-2.5"
                    />
                    <input
                      type="text"
                      placeholder="作者（可选）"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className="duo-input text-sm py-2.5"
                    />
                  </div>
                  <textarea
                    placeholder="粘贴抖音视频文案到这里...&#10;&#10;比如：「家人们，今天教你们一个绝绝子的养生方法！每天早上空腹来一杯柠檬水...」"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={8}
                    className="duo-input text-base"
                  />
                  <div className="flex items-center justify-between mt-3 px-2">
                    <div className="text-xs font-bold text-[var(--color-duo-wolf)]">
                      {transcript.length} 字 · 至少 10 字
                    </div>
                    <DuoButton
                      variant="primary"
                      size="lg"
                      onClick={handleCheck}
                      disabled={transcript.trim().length < 10}
                    >
                      🔍 开始核查
                    </DuoButton>
                  </div>
                </>
              )}
            </motion.div>

            {/* 示例 */}
            <div>
              <div className="text-xs font-extrabold tracking-widest text-[var(--color-duo-wolf)] uppercase mb-3 text-center">
                ✨ 试试这些经典翻车样例
              </div>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(samples).map(([key, sample], i) => (
                  <SampleCard
                    key={key}
                    sample={sample}
                    onClick={useSample}
                    index={i}
                    themeClass={SAMPLE_THEME[key] ?? 'duo-card-blue'}
                  />
                ))}
              </div>
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 duo-card duo-card-red"
              >
                <div className="text-sm font-bold text-[var(--color-duo-red)]">❌ {errorMsg}</div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* 结果区 */}
        {(isWorking || phase === 'done') && (
          <section ref={resultRef}>
            {/* 状态条 */}
            <div className="duo-card mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl">{phase === 'done' ? '🎉' : '🦉'}</div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-[var(--color-duo-eel)]">
                    {phase === 'done' ? '核查完成！' : phaseLabel || '准备中...'}
                  </div>
                  {meta && (
                    <div className="text-[10px] font-bold text-[var(--color-duo-wolf)] mt-0.5">
                      {meta.provider} / {meta.model}
                    </div>
                  )}
                </div>
                {phase === 'done' && (
                  <DuoButton variant="ghost" size="sm" onClick={reset}>
                    再核一条
                  </DuoButton>
                )}
              </div>
              {phase === 'verifying' && progress.total > 0 && (
                <ProgressBar
                  progress={verifyProgress}
                  label={`已核查 ${progress.done} / ${progress.total} 条`}
                />
              )}
            </div>

            {/* 视频元信息 + 评分 */}
            {extraction && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="duo-card mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {phase === 'done' && verifications.size > 0 && (
                    <div className="flex-shrink-0 animate-pop-in">
                      <CredibilityRing score={computedScore} size={180} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="text-xs font-extrabold tracking-widest text-[var(--color-duo-wolf)] uppercase mb-2">
                      📺 视频内容
                    </div>
                    {title && (
                      <div className="text-xl font-black text-[var(--color-duo-eel)] mb-1 leading-tight">
                        {title}
                      </div>
                    )}
                    {author && (
                      <div className="text-sm font-bold text-[var(--color-duo-blue)] mb-3">
                        {author}
                      </div>
                    )}
                    <div className="text-sm font-semibold text-[var(--color-duo-wolf)] mb-3">
                      📌 {extraction.summary}
                    </div>
                    {phase === 'done' && (
                      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        <span className="duo-badge duo-badge-green">
                          ✅ {counts.SUPPORTED}
                        </span>
                        <span className="duo-badge duo-badge-yellow">
                          🤔 {counts.NEI}
                        </span>
                        <span className="duo-badge duo-badge-red">
                          ❌ {counts.REFUTED}
                        </span>
                        <span className="duo-badge duo-badge-gray">
                          🗑️ {extraction.discarded_segments.length} 段营销
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
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-xs font-extrabold tracking-widest text-[var(--color-duo-wolf)] uppercase">
                    🔍 核查报告
                  </div>
                  <div className="flex-1 h-px bg-[var(--color-duo-swan)]" />
                  <div className="text-xs font-bold text-[var(--color-duo-wolf)]">
                    点击展开详情 ▼
                  </div>
                </div>
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {extraction.claims.map((claim, idx) => {
                      const v = verifications.get(claim.id);
                      if (v) {
                        return <ClaimCard key={claim.id} data={v} index={idx} />;
                      }
                      return (
                        <motion.div
                          key={claim.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="duo-card opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 border-3 border-[var(--color-duo-swan)] border-t-[var(--color-duo-blue)] rounded-full animate-spin" />
                            <div className="flex-1">
                              <div className="text-[10px] font-bold text-[var(--color-duo-wolf)] mb-1">
                                {claim.id}
                              </div>
                              <div className="text-sm font-bold text-[var(--color-duo-eel)]">
                                {claim.text}
                              </div>
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

      <footer className="border-t-2 border-[var(--color-duo-swan)] py-6 text-center">
        <div className="text-xs font-bold text-[var(--color-duo-wolf)]">
          🦉 打假搭子 · 抖音精选内容核查 ·{' '}
          <span className="text-[var(--color-duo-green)]">不下结论，只摆证据</span>
        </div>
      </footer>
    </div>
  );
}
