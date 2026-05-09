/**
 * 端到端验证主入口
 *
 * 用法：
 *   npm run demo:health
 *   npm run demo:finance
 *   npm run demo:food
 *   npm run demo:all
 */

import 'dotenv/config';
import { createProvider } from './llm/index.ts';
import { extractClaims } from './services/claim-extractor.ts';
import { verifyClaimsBatch } from './services/verifier.ts';
import { fromTranscript } from './extractors/index.ts';
import { renderHeader, renderExtraction, renderVerification, renderSummary } from './render.ts';
import { HEALTH_SAMPLE } from '../samples/health.ts';
import { FINANCE_SAMPLE } from '../samples/finance.ts';
import { FOOD_SAMPLE } from '../samples/food.ts';

const SAMPLES = {
  health: HEALTH_SAMPLE,
  finance: FINANCE_SAMPLE,
  food: FOOD_SAMPLE,
};

async function runOne(provider: ReturnType<typeof createProvider>, key: keyof typeof SAMPLES) {
  const sample = SAMPLES[key];
  const content = fromTranscript(sample.transcript, {
    title: sample.title,
    author: sample.author,
  });

  renderHeader(sample.title, sample.author, `${provider.name}/${provider.model}`);

  console.log('\n⏳ 正在拆解声明...');
  const extraction = await extractClaims(provider, content.transcript);
  renderExtraction(extraction);

  console.log('\n⏳ 正在并发核查...');
  const verifications = await verifyClaimsBatch(
    provider,
    extraction.claims.map((c) => ({
      id: c.id,
      text: c.text,
      domain: c.domain,
      priority: c.priority,
    })),
    { concurrency: 3 },
  );
  renderVerification(verifications);
  renderSummary(verifications);
}

async function main() {
  const target = process.argv[2] ?? 'health';
  const provider = createProvider();

  console.log(`\n🤖 当前 Provider：${provider.name} / ${provider.model}`);

  if (target === 'all') {
    for (const key of Object.keys(SAMPLES) as Array<keyof typeof SAMPLES>) {
      await runOne(provider, key);
    }
  } else if (target in SAMPLES) {
    await runOne(provider, target as keyof typeof SAMPLES);
  } else {
    console.error(`未知场景：${target}。可选：health | finance | food | all`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ 验证失败：', err);
  process.exit(1);
});
