'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header.tsx';
import { HeroBackground } from '@/components/HeroBackground.tsx';
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
    <div className="relative min-h-screen overflow-x-hidden">
      <Header />

      {/* === Hero 区（输入 + 渐变光晕背景） === */}
      {showInputArea && (
        <section className="relative pt-[112px] pb-20 px-6">
          <HeroBackground />

          <div className="relative max-w-[920px] mx-auto">
            {/* === 状态徽章 === */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-3.5 h-8 rounded-full glass-subtle">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#7C5CFF',
                    boxShadow: '0 0 10px #7C5CFF',
                  }}
                />
                <span className="text-[12px] font-medium text-text-2 tracking-tight">
                  AI 实时拆解 · 三色证据核查
                </span>
              </div>
            </motion.div>

            {/* === 巨大标题 === */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="type-display text-center mx-auto max-w-[860px] mb-6"
            >
              <span className="block text-text">别让营销号</span>
              <span
                className="block"
                style={{
                  background: 'linear-gradient(90deg, #B59FFF 0%, #7C5CFF 40%, #4A6FFF 80%, #5AC8FA 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  paddingBottom: '0.1em',
                }}
              >
                偷走你的判断。
              </span>
            </motion.h1>

            {/* === 副标题 === */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-center text-[18px] sm:text-[20px] text-text-2 max-w-[640px] mx-auto mb-12 leading-relaxed font-normal"
            >
              粘贴抖音视频链接，AI 拆解每一句声明，引用权威信源逐条核查。
              <br className="hidden sm:block" />
              <span className="text-text font-medium">不下结论，只摆证据</span>。
            </motion.p>

            {/* === 玻璃输入卡 === */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.32, 0.72, 0, 1] }}
              className="glass-strong rounded-[20px] p-2 mb-6 relative"
            >
              {/* 顶部渐变线 */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(124, 92, 255, 0.6) 50%, transparent 100%)',
                }}
              />

              {/* Tab 切换 */}
              <div className="flex items-center justify-between p-3 pb-1">
                <SegmentedControl
                  options={[
                    {
                      value: 'link',
                      label: (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M10 14a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07L11.5 5.5M14 10a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07L12.5 18.5"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          抖音链接
                        </>
                      ),
                    },
                    {
                      value: 'paste',
                      label: (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                            <path
                              d="M9 3h6a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2v0a2 2 0 012-2zM7 5H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          粘贴文案
                        </>
                      ),
                    },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
                {meta && (
                  <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-text-3 font-mono px-2">
                    <span className="w-1 h-1 rounded-full bg-success" />
                    {meta.provider}
                  </div>
                )}
              </div>

              {/* 输入区切换 */}
              <div className="p-3 pt-2">
                <AnimatePresence mode="wait">
                  {mode === 'link' ? (
                    <motion.div
                      key="link"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="relative">
                        <input
                          type="url"
                          placeholder="https://v.douyin.com/xxx 或完整视频链接"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && linkUrl.trim()) handleExtractAndCheck();
                          }}
                          className="dark-input pr-32"
                          autoComplete="off"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                          <AppleButton
                            variant="primary"
                            size="md"
                            onClick={handleExtractAndCheck}
                            disabled={!linkUrl.trim()}
                            iconRight={
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path
                                  d="M5 12h14M13 5l7 7-7 7"
                                  stroke="currentColor"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            }
                          >
                            开始核查
                          </AppleButton>
                        </div>
                      </div>
                      <div className="text-[12px] text-text-3 flex items-center gap-1.5 px-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
                          <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        从抖音 App 点「分享 → 复制链接」即可，自动转写视频音频
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="paste"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="视频标题（可选）"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="dark-input"
                          style={{ height: 40 }}
                        />
                        <input
                          type="text"
                          placeholder="作者（可选）"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          className="dark-input"
                          style={{ height: 40 }}
                        />
                      </div>
                      <textarea
                        placeholder="粘贴视频文案到这里…"
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        rows={5}
                        className="dark-input"
                      />
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="text-[12px] text-text-3 tabular-nums">
                          {transcript.length} 字 · 至少 10 字
                        </div>
                        <AppleButton
                          variant="primary"
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
              </div>
            </motion.div>

            {/* === 示例样本 === */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3 mb-3 text-center">
                ✦ 经典翻车样例
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(samples).map(([key, sample], i) => (
                  <SampleCard
                    key={key}
                    sample={sample}
                    onClick={useSample}
                    index={i}
                    tint={SAMPLE_TINT[key] ?? 'purple'}
                  />
                ))}
              </div>
            </motion.div>

            {/* === 错误提示 === */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 card p-4 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,92,92,0.10) 0%, rgba(255,255,255,0.03) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,92,92,0.25)',
                }}
              >
                <div className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#FF8585] mb-1">
                  提取失败
                </div>
                <div className="text-[14px] text-text-2">{errorMsg}</div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* === 结果区 === */}
      {(isWorking || phase === 'done') && (
        <section ref={resultRef} className="relative pt-[88px] pb-16 px-6">
          {/* 顶部仍保留弱化的渐变背景，避免突兀 */}
          <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none -z-10">
            <HeroBackground />
          </div>

          <div className="relative max-w-[920px] mx-auto">
            {/* 状态条 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-4 mb-6 glass"
            >
              <div className="flex items-center gap-3">
                {phase === 'done' ? (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(63,207,142,0.15)',
                      boxShadow: 'inset 0 0 0 1px rgba(63,207,142,0.3)',
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#5BE9A9]">
                      <path d="M5 12.5l5 5 9-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(124,92,255,0.15)',
                      boxShadow: 'inset 0 0 0 1px rgba(124,92,255,0.3)',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#B59FFF]">
                        <path d="M21 12a9 9 0 11-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </motion.div>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-text">
                    {phase === 'done' ? '核查完成' : phaseLabel || '准备中…'}
                  </div>
                  {meta && (
                    <div className="text-[11px] text-text-3 mt-0.5 font-mono tracking-tight">
                      {meta.provider} · {meta.model}
                    </div>
                  )}
                </div>
                {phase === 'done' && (
                  <AppleButton variant="secondary" size="sm" onClick={reset}>
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
                className="card-elevated p-7 mb-6 relative overflow-hidden"
              >
                {/* 顶部装饰渐变 */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(124, 92, 255, 0.5) 50%, transparent 100%)',
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-7 items-center">
                  {phase === 'done' && verifications.size > 0 && (
                    <div className="flex-shrink-0">
                      <CredibilityRing score={computedScore} size={180} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-text-3 mb-3">
                      视频内容
                    </div>
                    {title && (
                      <div className="text-[22px] sm:text-[26px] font-semibold text-text mb-2 leading-tight tracking-tight">
                        {title}
                      </div>
                    )}
                    {author && (
                      <div className="text-[14px] text-[#B59FFF] mb-4 font-medium">
                        @{author}
                      </div>
                    )}
                    <div className="text-[14px] text-text-2 mb-4 leading-relaxed">
                      {extraction.summary}
                    </div>
                    {phase === 'done' && (
                      <div className="flex items-center gap-4 flex-wrap justify-center sm:justify-start text-[12px] font-medium">
                        <span className="flex items-center gap-2 text-[#5BE9A9]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#3FCF8E', boxShadow: '0 0 8px #3FCF8E' }}
                          />
                          已验证 {counts.SUPPORTED}
                        </span>
                        <span className="flex items-center gap-2 text-[#FFC85C]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#FFB224', boxShadow: '0 0 8px #FFB224' }}
                          />
                          存疑 {counts.NEI}
                        </span>
                        <span className="flex items-center gap-2 text-[#FF8585]">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: '#FF5C5C', boxShadow: '0 0 8px #FF5C5C' }}
                          />
                          误导 {counts.REFUTED}
                        </span>
                        <span className="text-text-3">
                          已剔除 {extraction.discarded_segments.length} 段营销
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
                <div className="flex items-center justify-between mb-5">
                  <div className="text-[15px] font-semibold text-text">核查报告</div>
                  <div className="text-[11px] text-text-3 uppercase tracking-[0.12em]">
                    点击展开查看证据
                  </div>
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
                          className="card p-4 opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-3">
                                <path d="M21 12a9 9 0 11-9-9" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
                              </svg>
                            </motion.div>
                            <div className="flex-1">
                              <div className="text-[10px] font-mono text-text-3 uppercase tracking-[0.1em] mb-0.5">
                                {claim.id} · 核查中
                              </div>
                              <div className="text-[14px] font-medium text-text">{claim.text}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* === Footer === */}
      <footer className="relative py-10 mt-12">
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
          }}
        />
        <div className="max-w-[920px] mx-auto px-6 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[12px] text-text-3">
            打假搭子 <span className="text-text-3/60">·</span> 抖音精选内容核查
          </div>
          <div className="text-[12px] text-text-3 font-mono">
            built with ◆ Claude Code
          </div>
        </div>
      </footer>
    </div>
  );
}
