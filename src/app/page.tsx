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
import { UrgencyBanner } from '@/components/UrgencyBanner.tsx';
import { ThreeStepFlow } from '@/components/ThreeStepFlow.tsx';
import { ValueProps } from '@/components/ValueProps.tsx';
import { PainPoints } from '@/components/PainPoints.tsx';
import { MythQuiz } from '@/components/MythQuiz.tsx';
import { TickerStats } from '@/components/TickerStats.tsx';
import { RumorMuseum } from '@/components/RumorMuseum.tsx';
import { ShareCard } from '@/components/ShareCard.tsx';
import { incrementCheckCount } from '@/lib/utils/userLevel.ts';
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
  const [showShareCard, setShowShareCard] = useState(false);
  const levelIncremented = useRef(false);

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
    setShowShareCard(false);
    levelIncremented.current = false;
  };

  const useSample = (s: SampleData) => {
    // 点击样例 = 一键体验：填数据 + 立刻触发核查
    // 用户视野会随 resultRef 自动滚到结果区
    setMode('paste');
    setTranscript(s.transcript);
    setTitle(s.title);
    setAuthor(s.author);
    reset();
    runCheck(s.transcript, s.title, s.author);
  };

  const handleExtractAndCheck = async () => {
    if (!linkUrl.trim()) return;
    reset();
    setPhase('fetching');
    setPhaseLabel('🦉 正在解析视频 · 抓取信息 · 转写音频…');

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
        setPhaseLabel(`✨ 已转写 ${fetched.asrLength} 字 · 进入声明核查…`);
      } else if (fetched.asrError) {
        setPhaseLabel('⚠️ 视频音频提取失败，仅用 desc 核查...');
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
            // 防骗等级 +1（每次核查只算一次）
            if (!levelIncremented.current) {
              incrementCheckCount();
              levelIncremented.current = true;
            }
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
    <div className="min-h-screen flex flex-col bg-white">
      {showInputArea && <UrgencyBanner />}
      <Header />

      <main className="flex-1 max-w-[920px] mx-auto w-full px-6 py-10 sm:py-14">
        {showInputArea && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32 }}
          >
            {/* === Hero === */}
            <div className="text-center mb-10">
              {/* 大猫头鹰吉祥物 */}
              <motion.div
                initial={{ scale: 0.6, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.05, stiffness: 380 }}
                className="text-[80px] sm:text-[100px] inline-block animate-float leading-none mb-2"
              >
                🦉
              </motion.div>

              {/* 状态徽章 */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-1.5 mb-5 px-3.5 h-7 rounded-full bg-[var(--color-duo-bg)] border-2 border-[var(--color-duo-light)]"
              >
                <span className="text-[14px]">⚡</span>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--color-supported-text)]">
                  AI 30 秒帮你拆穿营销号
                </span>
              </motion.div>

              {/* 主标题：场景化痛点 */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
                className="type-display text-text mb-5"
              >
                老妈群里的「养生谣言」，
                <br />
                <span className="text-duo">30 秒</span>
                帮你<span className="text-duo">拆穿</span>。
              </motion.h1>

              {/* 副标题：差异化承诺 */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="text-[16px] sm:text-[18px] font-bold text-text-2 max-w-[620px] mx-auto leading-relaxed"
              >
                不是简单标个真假 —— AI 给你
                <span className="text-text"> 每句话的证据 </span>+
                <span className="text-text"> 信源出处 </span>+
                <span className="text-text"> 真相版本</span>。
                <br className="hidden sm:block" />
                <span className="text-text-3 text-[14px] sm:text-[16px]">
                  把判断权还给你自己 ✓
                </span>
              </motion.p>
            </div>

            {/* === 输入卡片 === */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 380, damping: 32 }}
              className="duo-card p-3 sm:p-4 mb-8"
            >
              {/* Tab */}
              <div className="flex items-center justify-center mb-3">
                <SegmentedControl
                  options={[
                    { value: 'link', label: <><span>🔗</span><span>抖音链接</span></> },
                    { value: 'paste', label: <><span>📝</span><span>粘贴文案</span></> },
                  ]}
                  value={mode}
                  onChange={setMode}
                />
              </div>

              <AnimatePresence mode="wait">
                {mode === 'link' ? (
                  <motion.div
                    key="link"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <input
                      type="url"
                      placeholder="https://v.douyin.com/xxx 或完整视频链接"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && linkUrl.trim()) handleExtractAndCheck();
                      }}
                      className="duo-input"
                      autoComplete="off"
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-[12px] font-bold text-text-3 flex items-center gap-1.5">
                        <span>💡</span>
                        从抖音 App「分享 → 复制链接」即可
                      </div>
                      <AppleButton
                        variant="primary"
                        size="lg"
                        onClick={handleExtractAndCheck}
                        disabled={!linkUrl.trim()}
                      >
                        开始解析
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
                        className="duo-input"
                        style={{ height: 48 }}
                      />
                      <input
                        type="text"
                        placeholder="作者（可选）"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="duo-input"
                        style={{ height: 48 }}
                      />
                    </div>
                    <textarea
                      placeholder="粘贴视频文案到这里…"
                      value={transcript}
                      onChange={(e) => setTranscript(e.target.value)}
                      rows={5}
                      className="duo-input"
                    />
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-[12px] font-bold text-text-3 tabular-nums">
                        {transcript.length} 字 · 至少 10 字
                      </div>
                      <AppleButton
                        variant="primary"
                        size="lg"
                        onClick={handleCheck}
                        disabled={transcript.trim().length < 10}
                      >
                        开始解析
                      </AppleButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* === 3 步流程（降低使用门槛） === */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45 }}
              className="mb-10"
            >
              <div className="text-center mb-4">
                <div className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-text-3">
                  💡 就这么简单
                </div>
              </div>
              <ThreeStepFlow />
            </motion.div>

            {/* === 实时数据钩子（数字爬升）=== */}
            <section className="mb-14">
              <TickerStats />
            </section>

            {/* === 痛点共鸣区 === */}
            <section className="mb-14">
              <div className="text-center mb-6">
                <h2 className="type-title-1 text-text mb-2">
                  你是不是<span className="text-duo">经常</span>遇到？
                </h2>
                <p className="text-[14px] font-bold text-text-3">
                  我们都被骗过，但下次可以不再被骗 👀
                </p>
              </div>
              <PainPoints />
            </section>

            {/* === 互动 quiz 钩子（高转化）=== */}
            <section className="mb-14">
              <MythQuiz />
            </section>

            {/* === 4 个价值点 === */}
            <section className="mb-14">
              <div className="text-center mb-6">
                <h2 className="type-title-1 text-text mb-2">
                  凭什么用<span className="text-duo">打假搭子</span>？
                </h2>
                <p className="text-[14px] font-bold text-text-3">
                  和市面上的科普 / 辟谣账号有什么不同 🤔
                </p>
              </div>
              <ValueProps />
            </section>

            {/* === 谣言博物馆 === */}
            <section className="mb-14">
              <RumorMuseum />
            </section>

            {/* === 二次 CTA === */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className="duo-card p-6 sm:p-8 mb-8 text-center bg-[var(--color-duo-bg)] border-[var(--color-duo)]"
            >
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="type-title-1 text-text mb-2">现在就核一条试试？</h3>
              <p className="text-[14px] font-bold text-text-2 mb-5 max-w-[440px] mx-auto">
                把你最近刷到、最想吐槽的那条抖音粘贴进来，AI 立即拆给你看。
              </p>
              <AppleButton
                variant="primary"
                size="xl"
                onClick={() => {
                  document.querySelector('input[type="url"]')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                  setTimeout(() => {
                    (document.querySelector('input[type="url"]') as HTMLInputElement | null)?.focus();
                  }, 600);
                }}
              >
                立即拆穿一条 →
              </AppleButton>
              <div className="text-[11px] font-bold text-text-3 mt-4">
                免费 · 不用注册 · 30 秒出结果
              </div>
            </motion.div>

            {/* === 经典翻车样例（移到底部，作为补充）=== */}
            <section className="mb-8">
              <div className="text-center mb-5">
                <h2 className="type-title-2 text-text mb-1.5">
                  懒得复制链接？<span className="text-duo">点这里直接看效果</span>
                </h2>
                <p className="text-[12px] font-bold text-text-3">
                  ✨ 三个经典翻车样例，一键体验 ✨
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(samples).map(([key, sample], i) => (
                  <SampleCard key={key} sample={sample} onClick={useSample} index={i} />
                ))}
              </div>
            </section>

            {/* === 错误提示 === */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 duo-card p-4 border-[var(--color-refuted)]"
                style={{ background: 'var(--color-refuted-bg)' }}
              >
                <div className="text-[12px] font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5"
                  style={{ color: 'var(--color-refuted-text)' }}
                >
                  <span>😮</span> 提取失败
                </div>
                <div className="text-[14px] font-bold text-text">{errorMsg}</div>
              </motion.div>
            )}
          </motion.section>
        )}

        {/* === 结果区 === */}
        {(isWorking || phase === 'done') && (
          <section ref={resultRef}>
            {/* 状态条 */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="duo-card p-4 mb-5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 text-2xl',
                    phase === 'done' ? 'bg-[var(--color-supported-bg)]' : 'bg-[var(--color-duo-bg)]',
                  )}
                >
                  {phase === 'done' ? '🎉' : <span className="animate-pulse-soft">🦉</span>}
                </div>{/* status icon */}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-extrabold text-text">
                    {phase === 'done' ? '核查完成！' : phaseLabel || '准备中…'}
                  </div>
                  {meta && (
                    <div className="text-[11px] font-bold text-text-3 mt-0.5">
                      {meta.provider} · {meta.model}
                    </div>
                  )}
                </div>
                {phase === 'done' && (
                  <div className="flex items-center gap-2">
                    <AppleButton
                      variant="primary"
                      size="sm"
                      onClick={() => setShowShareCard(true)}
                    >
                      📤 转给家人
                    </AppleButton>
                    <AppleButton variant="secondary" size="sm" onClick={reset}>
                      再核一条
                    </AppleButton>
                  </div>
                )}
              </div>
              {phase === 'verifying' && progress.total > 0 && (
                <div className="mt-4">
                  <ProgressBar
                    progress={verifyProgress}
                    label={`已核查 ${progress.done} / ${progress.total} 条`}
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
                className="duo-card p-6 sm:p-7 mb-6"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  {phase === 'done' && verifications.size > 0 && (
                    <div className="flex-shrink-0 animate-pop-in">
                      <CredibilityRing score={computedScore} size={170} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-text-3 mb-2">
                      📺 视频内容
                    </div>
                    {title && (
                      <div className="type-title-1 text-text mb-1.5 leading-tight">{title}</div>
                    )}
                    {author && (
                      <div className="text-[14px] font-extrabold text-duo mb-3">@{author}</div>
                    )}
                    <div className="text-[14px] font-bold text-text-2 mb-4 leading-relaxed">
                      {extraction.summary}
                    </div>
                    {phase === 'done' && (
                      <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-extrabold"
                          style={{ background: 'var(--color-supported-bg)', color: 'var(--color-supported-text)' }}
                        >
                          ✅ {counts.SUPPORTED}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-extrabold"
                          style={{ background: 'var(--color-nei-bg)', color: 'var(--color-nei-text)' }}
                        >
                          🤔 {counts.NEI}
                        </span>
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-extrabold"
                          style={{ background: 'var(--color-refuted-bg)', color: 'var(--color-refuted-text)' }}
                        >
                          ❌ {counts.REFUTED}
                        </span>
                        <span className="text-[12px] font-bold text-text-3">
                          🗑️ 剔除 {extraction.discarded_segments.length} 段营销
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
                  <div className="text-[15px] font-extrabold text-text flex items-center gap-1.5">
                    <span>🔍</span> 真假核查
                  </div>
                  <div className="text-[11px] font-extrabold text-text-3 uppercase tracking-wider">
                    点击展开 ↓
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
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.04 }}
                          className="duo-card p-4 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              className="text-text-3"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 12a9 9 0 11-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                              </svg>
                            </motion.div>
                            <div className="flex-1">
                              <div className="text-[10px] font-extrabold text-text-3 uppercase tracking-wider mb-0.5">
                                {claim.id} · 核查中
                              </div>
                              <div className="text-[14px] font-bold text-text">{claim.text}</div>
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

      {/* === 转发分享卡片 modal === */}
      {showShareCard && extraction && (
        <ShareCard
          title={title || '抖音视频'}
          author={author || '未知作者'}
          score={computedScore}
          counts={counts}
          topClaim={(() => {
            // 优先选 REFUTED，其次 NEI
            const refuted = Array.from(verifications.values()).find((v) => v.verdict === 'REFUTED');
            if (refuted) return { claim_text: refuted.claim_text, verdict: refuted.verdict, truth_rewrite: refuted.truth_rewrite };
            const nei = Array.from(verifications.values()).find((v) => v.verdict === 'NEI');
            if (nei) return { claim_text: nei.claim_text, verdict: nei.verdict, truth_rewrite: nei.truth_rewrite };
            const first = Array.from(verifications.values())[0];
            return first ? { claim_text: first.claim_text, verdict: first.verdict, truth_rewrite: first.truth_rewrite } : undefined;
          })()}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* === Footer === */}
      <footer className="py-8 mt-12 border-t-2 border-[var(--color-separator)]">
        <div className="max-w-[920px] mx-auto px-6 flex items-center justify-between flex-wrap gap-3">
          <div className="text-[12px] font-bold text-text-3 flex items-center gap-1.5">
            <span>🦉</span>
            <span>打假搭子 · 抖音内容核查 AI</span>
          </div>
          <div className="text-[11px] font-extrabold text-text-3 uppercase tracking-wider">
            刷之前先核一下 ✓
          </div>
        </div>
      </footer>
    </div>
  );
}
