/**
 * 核查记录历史（localStorage）
 *
 * 数据结构：仅保存"展示所需"的字段（不保存原始 transcript 全文，节省空间）
 * 点击历史项可恢复 extraction + verifications，无需重新调用 API
 */

import type { ClaimCardData, Verdict } from '@/components/ClaimCard.tsx';

const STORAGE_KEY = 'fact_buddy_history';
const MAX_RECORDS = 50;

interface ExtractedClaimMin {
  id: string;
  text: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  /** 视频元信息 */
  title: string;
  author: string;
  url?: string;
  /** 来源：链接 / 粘贴 / 内置样例 */
  source: 'link' | 'paste' | 'sample';
  /** 总结 */
  summary: string;
  /** 可信度评分 0-100 */
  score: number;
  /** 三色统计 */
  counts: {
    SUPPORTED: number;
    NEI: number;
    REFUTED: number;
  };
  /** 已剔除的营销话术段数 */
  discardedCount: number;
  /** 拆解的声明（最小化字段） */
  claims: ExtractedClaimMin[];
  /** 完整核查结果（按 claim_id 索引） */
  verifications: Record<string, ClaimCardData>;
  /** 模型信息 */
  meta?: { provider: string; model: string };
}

/** 读取所有历史 */
export function getHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr as HistoryRecord[];
  } catch {
    return [];
  }
}

/** 保存一条新记录（追加到最前） */
export function addHistory(record: Omit<HistoryRecord, 'id' | 'timestamp'>): HistoryRecord {
  const full: HistoryRecord = {
    id: `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...record,
  };
  const list = getHistory();
  const next = [full, ...list].slice(0, MAX_RECORDS);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('factbuddy:history-update', { detail: next.length }));
  }
  return full;
}

/** 删除一条记录 */
export function deleteHistory(id: string): void {
  const list = getHistory().filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('factbuddy:history-update', { detail: list.length }));
  }
}

/** 清空全部 */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('factbuddy:history-update', { detail: 0 }));
}

/** 相对时间格式化 */
export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return '刚刚';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} 天前`;
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`;
}

/** 主导 verdict 标识（用于卡片着色） */
export function getDominantVerdict(counts: HistoryRecord['counts']): Verdict | null {
  const { SUPPORTED, NEI, REFUTED } = counts;
  if (REFUTED > 0) return 'REFUTED';
  if (NEI > 0) return 'NEI';
  if (SUPPORTED > 0) return 'SUPPORTED';
  return null;
}
