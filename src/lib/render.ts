/**
 * 终端美化输出
 */

import chalk from 'chalk';
import type { ClaimExtractionResult } from './services/claim-extractor.ts';
import type { VerificationResult, Verdict } from './services/verifier.ts';

const VERDICT_COLOR: Record<Verdict, (s: string) => string> = {
  SUPPORTED: chalk.green.bold,
  NEI: chalk.yellow.bold,
  REFUTED: chalk.red.bold,
};

const VERDICT_EMOJI: Record<Verdict, string> = {
  SUPPORTED: '🟢',
  NEI: '🟡',
  REFUTED: '🔴',
};

const VERDICT_LABEL: Record<Verdict, string> = {
  SUPPORTED: '已验证',
  NEI: '存疑',
  REFUTED: '误导',
};

export function renderHeader(title: string, author: string, providerName: string): void {
  console.log('\n' + '═'.repeat(70));
  console.log(chalk.cyan.bold(`📺 视频标题：${title}`));
  console.log(chalk.gray(`   作者：${author}`));
  console.log(chalk.gray(`   核查模型：${providerName}`));
  console.log('═'.repeat(70));
}

export function renderExtraction(result: ClaimExtractionResult): void {
  console.log('\n' + chalk.cyan.bold('━━━ 第一步：声明拆解 ━━━'));
  console.log(chalk.bold(`📌 主题概括：`) + result.summary);
  console.log(chalk.bold(`🏷️  主要领域：`) + result.primary_domain);
  console.log(chalk.bold(`🔍 拆出 ${result.claims.length} 条可核查声明：\n`));
  for (const c of result.claims) {
    const prio =
      c.priority === 'high'
        ? chalk.red(`[${c.priority}]`)
        : c.priority === 'medium'
          ? chalk.yellow(`[${c.priority}]`)
          : chalk.gray(`[${c.priority}]`);
    console.log(`  ${chalk.bold(c.id)} ${prio} ${c.text}`);
    console.log(chalk.gray(`     原文: 「${c.original_quote}」`));
  }

  if (result.discarded_segments.length > 0) {
    console.log('\n' + chalk.gray(`🗑️  已丢弃 ${result.discarded_segments.length} 段(主观/营销/修辞)`));
  }
}

export function renderVerification(
  results: Array<VerificationResult | { error: string; claim_id: string }>,
): void {
  console.log('\n' + chalk.cyan.bold('━━━ 第二步：逐条核查 ━━━\n'));

  for (const r of results) {
    if ('error' in r) {
      console.log(chalk.red(`❌ ${r.claim_id} 核查失败: ${r.error}\n`));
      continue;
    }

    const verdictColor = VERDICT_COLOR[r.verdict];
    const stars = '⭐'.repeat(r.confidence);

    console.log(
      `${VERDICT_EMOJI[r.verdict]} ${chalk.bold(r.claim_id)}  ${verdictColor(VERDICT_LABEL[r.verdict])}  ${chalk.gray(stars)}`,
    );
    console.log(`   ${chalk.bold('声明：')}${r.claim_text}`);
    console.log(`   ${chalk.bold('推理：')}${chalk.gray(r.reasoning)}`);

    if (r.evidence.length > 0) {
      console.log(`   ${chalk.bold('证据：')}`);
      for (const e of r.evidence) {
        const arrow =
          e.claim_relation === 'supports'
            ? chalk.green('→ 支持')
            : e.claim_relation === 'refutes'
              ? chalk.red('→ 反驳')
              : e.claim_relation === 'partially_supports'
                ? chalk.yellow('→ 部分支持')
                : chalk.gray('→ 视情况');
        console.log(`     ${arrow} ${chalk.cyan(e.source_name)} (${e.source_type})`);
        console.log(`        ${chalk.gray(e.summary)}`);
      }
    }

    console.log(`   ${chalk.bold.green('✏️  科普：')}${r.truth_rewrite}`);

    if (r.caveats.length > 0) {
      console.log(`   ${chalk.bold.yellow('⚠️  注意：')}`);
      for (const c of r.caveats) {
        console.log(`     • ${chalk.yellow(c)}`);
      }
    }

    if (r.needs_web_search) {
      console.log(chalk.gray(`   💡 建议进一步联网检索（已记录待办）`));
    }

    console.log();
  }
}

export function renderSummary(
  results: Array<VerificationResult | { error: string; claim_id: string }>,
): void {
  const valid = results.filter((r): r is VerificationResult => !('error' in r));
  const supported = valid.filter((r) => r.verdict === 'SUPPORTED').length;
  const nei = valid.filter((r) => r.verdict === 'NEI').length;
  const refuted = valid.filter((r) => r.verdict === 'REFUTED').length;
  const errors = results.length - valid.length;

  console.log('═'.repeat(70));
  console.log(chalk.bold.cyan('📊 核查报告总览'));
  console.log('═'.repeat(70));
  console.log(`  ${chalk.green.bold('🟢 已验证：')}${supported} 条`);
  console.log(`  ${chalk.yellow.bold('🟡 存疑：  ')}${nei} 条`);
  console.log(`  ${chalk.red.bold('🔴 误导：  ')}${refuted} 条`);
  if (errors > 0) {
    console.log(`  ${chalk.gray(`⚠️  失败：  ${errors} 条`)}`);
  }

  // 风险评分
  const totalScored = supported + nei + refuted;
  if (totalScored > 0) {
    const truthScore = Math.round(((supported + nei * 0.5) / totalScored) * 100);
    const color = truthScore >= 70 ? chalk.green : truthScore >= 40 ? chalk.yellow : chalk.red;
    console.log();
    console.log(`  ${chalk.bold('🎯 内容可信度评分：')}${color.bold(`${truthScore}/100`)}`);
    if (truthScore < 40) {
      console.log(`  ${chalk.red('   ⚠️ 此视频包含大量误导信息，转发请谨慎！')}`);
    } else if (truthScore < 70) {
      console.log(`  ${chalk.yellow('   ⚠️ 此视频部分信息存疑，请理性看待。')}`);
    } else {
      console.log(`  ${chalk.green('   ✅ 此视频整体内容较为可信。')}`);
    }
  }

  console.log('═'.repeat(70) + '\n');
}
