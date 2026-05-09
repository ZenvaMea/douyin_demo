/**
 * 抖音精选权威科普账号数据库
 * 按领域分类，当用户核查的视频被识别为虚假科普时
 * 推荐对应领域的真正权威账号作为「正规对照」
 *
 * 设计原则：
 * - 优先国家级 / 行业协会 / 三甲医院 / 主流学术
 * - 标注权威等级（official > expert > pro_media > pro_creator）
 * - 提供抖音搜索链接（用户一键跳转）
 */

export type SourceCategory = 'health' | 'food' | 'finance' | 'lifestyle' | 'science' | 'other';
export type SourceTier = 'official' | 'expert' | 'pro_media' | 'pro_creator';

export interface AuthoritativeSource {
  id: string;
  category: SourceCategory;
  tier: SourceTier;
  account: string;          // 账号名（带 @）
  emoji: string;            // 头像 emoji
  shortDesc: string;        // 短描述（10 字内）
  fullDesc: string;         // 完整介绍
  douyinSearchUrl: string;  // 抖音搜索链接
}

const TIER_LABEL: Record<SourceTier, { label: string; color: string }> = {
  official:    { label: '🏛️ 国家级', color: '#3D8B00' },
  expert:      { label: '🎓 专家级', color: '#1CB0F6' },
  pro_media:   { label: '📰 主流媒体', color: '#7C5CFF' },
  pro_creator: { label: '✓ 专业认证', color: '#B58900' },
};

export function getTierMeta(tier: SourceTier) {
  return TIER_LABEL[tier];
}

const dySearch = (q: string) => `https://www.douyin.com/search/${encodeURIComponent(q)}`;

/** 全部权威账号清单 */
export const AUTHORITATIVE_SOURCES: AuthoritativeSource[] = [
  // === 医学 / 健康 ===
  {
    id: 'h1',
    category: 'health',
    tier: 'pro_creator',
    account: '@丁香医生',
    emoji: '🩺',
    shortDesc: '专业医学科普品牌',
    fullDesc: '中国最大的医学科普平台，三甲医生团队',
    douyinSearchUrl: dySearch('丁香医生'),
  },
  {
    id: 'h2',
    category: 'health',
    tier: 'expert',
    account: '@张文宏医生',
    emoji: '👨‍⚕️',
    shortDesc: '复旦感染科主任',
    fullDesc: '国家传染病医学中心主任，权威传染病专家',
    douyinSearchUrl: dySearch('张文宏'),
  },
  {
    id: 'h3',
    category: 'health',
    tier: 'expert',
    account: '@协和阿宝',
    emoji: '🏥',
    shortDesc: '协和医院医生',
    fullDesc: '北京协和医院专业医生科普',
    douyinSearchUrl: dySearch('协和阿宝'),
  },
  {
    id: 'h4',
    category: 'health',
    tier: 'official',
    account: '@中国医师协会',
    emoji: '⚕️',
    shortDesc: '官方行业协会',
    fullDesc: '中国医师协会官方账号',
    douyinSearchUrl: dySearch('中国医师协会'),
  },
  {
    id: 'h5',
    category: 'health',
    tier: 'official',
    account: '@健康中国',
    emoji: '🏥',
    shortDesc: '国家卫健委官方',
    fullDesc: '国家卫生健康委员会官方账号',
    douyinSearchUrl: dySearch('健康中国'),
  },

  // === 食品 / 营养 ===
  {
    id: 'f1',
    category: 'food',
    tier: 'official',
    account: '@中国营养学会',
    emoji: '🥗',
    shortDesc: '国家营养权威',
    fullDesc: '中国营养学会官方，《膳食指南》制定者',
    douyinSearchUrl: dySearch('中国营养学会'),
  },
  {
    id: 'f2',
    category: 'food',
    tier: 'expert',
    account: '@范志红_原创营养信息',
    emoji: '🌾',
    shortDesc: '中农大营养教授',
    fullDesc: '中国农业大学营养与食品安全教授',
    douyinSearchUrl: dySearch('范志红'),
  },
  {
    id: 'f3',
    category: 'food',
    tier: 'expert',
    account: '@顾中一',
    emoji: '🥦',
    shortDesc: '北大医学硕士',
    fullDesc: '北京大学医学部公共卫生硕士',
    douyinSearchUrl: dySearch('顾中一'),
  },
  {
    id: 'f4',
    category: 'food',
    tier: 'official',
    account: '@中国食品辟谣网',
    emoji: '🔍',
    shortDesc: '国家级辟谣',
    fullDesc: '国家市场监督管理总局指导',
    douyinSearchUrl: dySearch('中国食品辟谣'),
  },
  {
    id: 'f5',
    category: 'food',
    tier: 'pro_creator',
    account: '@科普中国',
    emoji: '🧬',
    shortDesc: '中科协官方科普',
    fullDesc: '中国科协主管的国家级科普品牌',
    douyinSearchUrl: dySearch('科普中国'),
  },

  // === 财经 / 理财 ===
  {
    id: 'fi1',
    category: 'finance',
    tier: 'official',
    account: '@中国证监会',
    emoji: '🏛️',
    shortDesc: '国家监管机构',
    fullDesc: '中国证券监督管理委员会官方',
    douyinSearchUrl: dySearch('中国证监会'),
  },
  {
    id: 'fi2',
    category: 'finance',
    tier: 'pro_media',
    account: '@央视财经',
    emoji: '📺',
    shortDesc: '国家级财经媒体',
    fullDesc: '中央广播电视总台财经频道',
    douyinSearchUrl: dySearch('央视财经'),
  },
  {
    id: 'fi3',
    category: 'finance',
    tier: 'pro_media',
    account: '@第一财经',
    emoji: '📊',
    shortDesc: '主流财经媒体',
    fullDesc: '第一财经新媒体集团',
    douyinSearchUrl: dySearch('第一财经'),
  },
  {
    id: 'fi4',
    category: 'finance',
    tier: 'official',
    account: '@中国人民银行',
    emoji: '🏦',
    shortDesc: '央行官方',
    fullDesc: '国家金融最高监管机构',
    douyinSearchUrl: dySearch('中国人民银行'),
  },

  // === 生活方式 ===
  {
    id: 'l1',
    category: 'lifestyle',
    tier: 'pro_media',
    account: '@人民日报',
    emoji: '📰',
    shortDesc: '党报权威',
    fullDesc: '中共中央机关报',
    douyinSearchUrl: dySearch('人民日报'),
  },
  {
    id: 'l2',
    category: 'lifestyle',
    tier: 'pro_media',
    account: '@央视新闻',
    emoji: '📡',
    shortDesc: '国家级新闻',
    fullDesc: '中央广播电视总台新闻中心',
    douyinSearchUrl: dySearch('央视新闻'),
  },
  {
    id: 'l3',
    category: 'lifestyle',
    tier: 'pro_media',
    account: '@澎湃新闻',
    emoji: '🌊',
    shortDesc: '专业调查媒体',
    fullDesc: '上海报业集团旗下深度调查媒体',
    douyinSearchUrl: dySearch('澎湃新闻'),
  },

  // === 科学 / 通用 ===
  {
    id: 's1',
    category: 'science',
    tier: 'official',
    account: '@中国科学院',
    emoji: '🔬',
    shortDesc: '国家科研机构',
    fullDesc: '中国自然科学最高学术机构',
    douyinSearchUrl: dySearch('中国科学院'),
  },
  {
    id: 's2',
    category: 'science',
    tier: 'pro_creator',
    account: '@果壳',
    emoji: '🌰',
    shortDesc: '专业科普平台',
    fullDesc: '中国知名泛学科科普社区',
    douyinSearchUrl: dySearch('果壳'),
  },
  {
    id: 's3',
    category: 'science',
    tier: 'pro_creator',
    account: '@科普中国',
    emoji: '🧪',
    shortDesc: '中科协官方',
    fullDesc: '中国科协主管国家级科普品牌',
    douyinSearchUrl: dySearch('科普中国'),
  },
];

/**
 * 按领域获取推荐源
 * 找不到对应领域时回退到 lifestyle + science 通用权威源
 */
export function getRecommendationsByDomain(
  domain: string,
  limit: number = 4,
): AuthoritativeSource[] {
  const normalized = domain.toLowerCase();

  // 领域映射
  const categoryMap: Record<string, SourceCategory> = {
    health: 'health',
    medical: 'health',
    food: 'food',
    nutrition: 'food',
    finance: 'finance',
    invest: 'finance',
    lifestyle: 'lifestyle',
    daily: 'lifestyle',
    science: 'science',
    tech: 'science',
  };

  const matchCat = categoryMap[normalized] ?? 'other';

  let results = AUTHORITATIVE_SOURCES.filter((s) => s.category === matchCat);

  // 不够 limit，用通用兜底
  if (results.length < limit) {
    const fallback = AUTHORITATIVE_SOURCES.filter(
      (s) => s.category === 'lifestyle' || s.category === 'science',
    );
    results = [...results, ...fallback];
  }

  // 优先级排序：official > expert > pro_media > pro_creator
  const tierOrder: Record<SourceTier, number> = {
    official: 0,
    expert: 1,
    pro_media: 2,
    pro_creator: 3,
  };
  results.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);

  return results.slice(0, limit);
}
