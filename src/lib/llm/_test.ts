/**
 * Provider 抽象层冒烟测试（仅校验配置 + 一次最小调用）
 */

import 'dotenv/config';
import { createProvider } from './index.ts';

async function main() {
  const provider = createProvider();
  console.log(`✅ Provider 实例化成功: ${provider.name} / ${provider.model}`);
  console.log(`   能力: ${JSON.stringify(provider.capabilities, null, 2)}`);

  console.log('\n🚀 发送一个最小测试请求...\n');
  const resp = await provider.chat({
    system: '你是一个简洁的助手。',
    messages: [{ role: 'user', content: '一句话回复：你好' }],
    maxTokens: 50,
  });
  console.log('回复:', resp.content);
  console.log('用量:', resp.usage);
}

main().catch((err) => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});
