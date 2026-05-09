/**
 * 离线冒烟测试：仅校验所有 Provider 能正确实例化
 * 不发起任何 API 请求
 */

import { AnthropicProvider } from './anthropic.ts';
import { DoubaoProvider } from './doubao.ts';
import { DeepSeekProvider } from './deepseek.ts';
import { QwenProvider } from './qwen.ts';
import { KimiProvider } from './kimi.ts';

const FAKE_KEY = 'sk-test-fake-key';

const providers = [
  new AnthropicProvider({ apiKey: FAKE_KEY, model: 'claude-sonnet-4-6' }),
  new DoubaoProvider({ apiKey: FAKE_KEY }),
  new DeepSeekProvider({ apiKey: FAKE_KEY }),
  new QwenProvider({ apiKey: FAKE_KEY }),
  new KimiProvider({ apiKey: FAKE_KEY }),
];

console.log('🧪 LLM Provider 抽象层冒烟测试\n');
console.log('━'.repeat(70));
console.log(
  ['Provider', 'Model', 'tools', 'json', 'web', 'stream'].map((s) => s.padEnd(12)).join(''),
);
console.log('━'.repeat(70));

for (const p of providers) {
  const c = p.capabilities;
  console.log(
    [
      p.name,
      p.model.slice(0, 11),
      c.toolUse ? '✓' : '✗',
      c.jsonSchema ? '✓' : '✗',
      c.webSearchNative ? '✓' : '✗',
      c.streaming ? '✓' : '✗',
    ]
      .map((s) => String(s).padEnd(12))
      .join(''),
  );
}

console.log('━'.repeat(70));
console.log('\n✅ 所有 Provider 实例化成功，抽象层就位！');
console.log('💡 下一步：在 .env 中填入任意一家 API Key，运行 npm run demo:health');
