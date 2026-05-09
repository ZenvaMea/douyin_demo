/**
 * 防骗等级系统（localStorage）
 * 用户每完成一次核查 +1 次，6 个等级
 */

const STORAGE_KEY = 'fact_buddy_check_count';

export interface UserLevel {
  level: number;
  title: string;
  emoji: string;
  count: number;
  /** 距离下一级还差多少 */
  toNext: number;
  /** 当前等级进度 0-100 */
  progress: number;
  /** 是否已满级 */
  maxed: boolean;
}

const LEVELS = [
  { lv: 0, name: '小白用户',   emoji: '🐣', threshold: 0 },
  { lv: 1, name: '初级猫头鹰', emoji: '🦉', threshold: 1 },
  { lv: 2, name: '中级核查员', emoji: '🔍', threshold: 3 },
  { lv: 3, name: '高级辟谣师', emoji: '🛡️', threshold: 5 },
  { lv: 4, name: '资深打假人', emoji: '⚔️', threshold: 10 },
  { lv: 5, name: '防骗大师',   emoji: '👑', threshold: 20 },
];

export function getCheckCount(): number {
  if (typeof window === 'undefined') return 0;
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v ? parseInt(v, 10) || 0 : 0;
}

export function incrementCheckCount(): number {
  if (typeof window === 'undefined') return 0;
  const next = getCheckCount() + 1;
  window.localStorage.setItem(STORAGE_KEY, String(next));
  // dispatch 一个事件让 Header 等组件订阅
  window.dispatchEvent(new CustomEvent('factbuddy:count-update', { detail: next }));
  return next;
}

export function getUserLevel(count: number = getCheckCount()): UserLevel {
  let current = LEVELS[0]!;
  for (const lv of LEVELS) {
    if (count >= lv.threshold) current = lv;
  }
  const next = LEVELS[current.lv + 1];
  const toNext = next ? next.threshold - count : 0;
  const progress = next
    ? ((count - current.threshold) / (next.threshold - current.threshold)) * 100
    : 100;
  return {
    level: current.lv,
    title: current.name,
    emoji: current.emoji,
    count,
    toNext,
    progress: Math.max(0, Math.min(100, progress)),
    maxed: !next,
  };
}
