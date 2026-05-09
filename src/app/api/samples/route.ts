/**
 * 提供 demo 样例（健康/财经/食品）
 */

import { HEALTH_SAMPLE } from '@/samples/health.ts';
import { FINANCE_SAMPLE } from '@/samples/finance.ts';
import { FOOD_SAMPLE } from '@/samples/food.ts';

export const dynamic = 'force-static';

export async function GET() {
  return Response.json({
    health: { ...HEALTH_SAMPLE, emoji: '🩺', label: '健康养生' },
    finance: { ...FINANCE_SAMPLE, emoji: '💰', label: '财经理财' },
    food: { ...FOOD_SAMPLE, emoji: '🥗', label: '食品安全' },
  });
}
