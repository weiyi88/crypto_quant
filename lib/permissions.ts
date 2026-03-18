/**
 * CryptoQuant V3.0 - 权限控制系统
 *
 * 三级权限架构：
 * 1. 前端 UI 守卫 (PermissionGuard 组件)
 * 2. API Middleware 检查 (middleware.ts)
 * 3. 数据库 RLS 策略 (Supabase 自动应用)
 *
 * @see CLAUDE.md 第五章：用户模块与订阅系统
 */

// ============================================
// 1. 订阅计划类型定义
// ============================================

export type SubscriptionPlan = 'free' | 'pro' | 'ultra';

export interface SubscriptionPermissions {
  // 套利策略权限
  arbitrage: {
    funding_rate: boolean;      // 资金费率套利
    triangular: boolean;         // 三角套利
    cross_exchange: boolean;     // 跨所搬砖
    futures_spot: boolean;       // 期现套利
  };

  // 量化交易权限
  quant: {
    strategies: boolean;         // 策略管理
    backtesting: boolean;        // 回测系统
    paper_trading: boolean;      // 模拟盘
    live_trading: boolean;       // 实盘交易
  };

  // 配额限制
  limits: {
    api_calls_per_minute: number;
    max_exchanges: number;       // -1 表示无限制
    max_strategies: number;      // -1 表示无限制
  };
}

// ============================================
// 2. 权限常量定义
// ============================================

export const PERMISSIONS: Record<SubscriptionPlan, SubscriptionPermissions> = {
  free: {
    arbitrage: {
      funding_rate: true,
      triangular: false,
      cross_exchange: false,
      futures_spot: false,
    },
    quant: {
      strategies: false,
      backtesting: false,
      paper_trading: false,
      live_trading: false,
    },
    limits: {
      api_calls_per_minute: 20,
      max_exchanges: 2,
      max_strategies: 1,
    },
  },

  pro: {
    arbitrage: {
      funding_rate: true,
      triangular: true,
      cross_exchange: true,
      futures_spot: true,
    },
    quant: {
      strategies: true,
      backtesting: true,
      paper_trading: false,
      live_trading: false,
    },
    limits: {
      api_calls_per_minute: 100,
      max_exchanges: 5,
      max_strategies: 3,
    },
  },

  ultra: {
    arbitrage: {
      funding_rate: true,
      triangular: true,
      cross_exchange: true,
      futures_spot: true,
    },
    quant: {
      strategies: true,
      backtesting: true,
      paper_trading: true,
      live_trading: true,
    },
    limits: {
      api_calls_per_minute: 300,
      max_exchanges: -1,  // 无限制
      max_strategies: -1, // 无限制
    },
  },
};

// ============================================
// 3. 权限字符串常量（用于 PermissionGuard）
// ============================================

export const PERMISSION_KEYS = {
  // 套利策略
  ARBITRAGE_FUNDING_RATE: 'arbitrage:funding_rate',
  ARBITRAGE_TRIANGULAR: 'arbitrage:triangular',
  ARBITRAGE_CROSS_EXCHANGE: 'arbitrage:cross_exchange',
  ARBITRAGE_FUTURES_SPOT: 'arbitrage:futures_spot',

  // 量化交易
  QUANT_STRATEGIES: 'quant:strategies',
  QUANT_BACKTESTING: 'quant:backtesting',
  QUANT_PAPER_TRADING: 'quant:paper_trading',
  QUANT_LIVE_TRADING: 'quant:live_trading',

  // 功能模块
  DASHBOARD_OVERVIEW: 'dashboard:overview',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  DASHBOARD_PORTFOLIO: 'dashboard:portfolio',
  DASHBOARD_HISTORY: 'dashboard:history',
  DASHBOARD_ALERTS: 'dashboard:alerts',
  DASHBOARD_SETTINGS: 'dashboard:settings',
} as const;

export type PermissionKey = typeof PERMISSION_KEYS[keyof typeof PERMISSION_KEYS];

// ============================================
// 4. 权限映射表（Plan → Permissions）
// ============================================

export const PLAN_PERMISSIONS: Record<SubscriptionPlan, PermissionKey[]> = {
  free: [
    PERMISSION_KEYS.ARBITRAGE_FUNDING_RATE,
    PERMISSION_KEYS.DASHBOARD_OVERVIEW,
    PERMISSION_KEYS.DASHBOARD_SETTINGS,
  ],

  pro: [
    PERMISSION_KEYS.ARBITRAGE_FUNDING_RATE,
    PERMISSION_KEYS.ARBITRAGE_TRIANGULAR,
    PERMISSION_KEYS.ARBITRAGE_CROSS_EXCHANGE,
    PERMISSION_KEYS.ARBITRAGE_FUTURES_SPOT,
    PERMISSION_KEYS.QUANT_STRATEGIES,
    PERMISSION_KEYS.QUANT_BACKTESTING,
    PERMISSION_KEYS.DASHBOARD_OVERVIEW,
    PERMISSION_KEYS.DASHBOARD_ANALYTICS,
    PERMISSION_KEYS.DASHBOARD_PORTFOLIO,
    PERMISSION_KEYS.DASHBOARD_HISTORY,
    PERMISSION_KEYS.DASHBOARD_ALERTS,
    PERMISSION_KEYS.DASHBOARD_SETTINGS,
  ],

  ultra: [
    // Ultra 拥有所有权限
    ...Object.values(PERMISSION_KEYS),
  ],
};

// ============================================
// 5. 权限检查函数
// ============================================

/**
 * 检查指定计划是否拥有某个权限
 */
export function hasPermission(
  plan: SubscriptionPlan,
  permission: PermissionKey
): boolean {
  return PLAN_PERMISSIONS[plan].includes(permission);
}

/**
 * 检查多个权限（AND 逻辑）
 */
export function hasAllPermissions(
  plan: SubscriptionPlan,
  permissions: PermissionKey[]
): boolean {
  return permissions.every(permission => hasPermission(plan, permission));
}

/**
 * 检查多个权限（OR 逻辑）
 */
export function hasAnyPermission(
  plan: SubscriptionPlan,
  permissions: PermissionKey[]
): boolean {
  return permissions.some(permission => hasPermission(plan, permission));
}

/**
 * 获取指定计划的配额限制
 */
export function getPlanLimits(plan: SubscriptionPlan) {
  return PERMISSIONS[plan].limits;
}

/**
 * 检查是否超过配额限制
 */
export function checkQuotaLimit(
  plan: SubscriptionPlan,
  quotaType: 'api_calls_per_minute' | 'max_exchanges' | 'max_strategies',
  currentValue: number
): { withinLimit: boolean; remaining: number } {
  const limits = getPlanLimits(plan);
  const limit = limits[quotaType];

  // -1 表示无限制
  if (limit === -1) {
    return { withinLimit: true, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentValue);
  return {
    withinLimit: currentValue < limit,
    remaining,
  };
}

/**
 * 获取计划显示名称
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const names: Record<SubscriptionPlan, string> = {
    free: 'Free Plan',
    pro: 'Pro Plan',
    ultra: 'Ultra Plan',
  };
  return names[plan];
}

/**
 * 获取计划价格
 */
export function getPlanPrice(plan: SubscriptionPlan, billingCycle: 'monthly' | 'yearly'): number {
  const prices: Record<SubscriptionPlan, { monthly: number; yearly: number }> = {
    free: { monthly: 0, yearly: 0 },
    pro: { monthly: 19.9, yearly: 191 },
    ultra: { monthly: 39.9, yearly: 383 },
  };

  return prices[plan][billingCycle];
}

// ============================================
// 6. 功能需求映射（用于升级提示）
// ============================================

export interface FeatureRequirement {
  feature: string;
  description: string;
  requiredPlan: SubscriptionPlan;
  permission: PermissionKey;
}

export const FEATURE_REQUIREMENTS: FeatureRequirement[] = [
  {
    feature: '三角套利',
    description: '在多个交易对之间寻找套利机会',
    requiredPlan: 'pro',
    permission: PERMISSION_KEYS.ARBITRAGE_TRIANGULAR,
  },
  {
    feature: '跨所搬砖',
    description: '在不同交易所之间进行价格套利',
    requiredPlan: 'pro',
    permission: PERMISSION_KEYS.ARBITRAGE_CROSS_EXCHANGE,
  },
  {
    feature: '期现套利',
    description: '利用现货和期货价差进行套利',
    requiredPlan: 'pro',
    permission: PERMISSION_KEYS.ARBITRAGE_FUTURES_SPOT,
  },
  {
    feature: '量化策略',
    description: '创建和管理自定义量化交易策略',
    requiredPlan: 'pro',
    permission: PERMISSION_KEYS.QUANT_STRATEGIES,
  },
  {
    feature: '回测系统',
    description: '基于历史数据测试策略表现',
    requiredPlan: 'pro',
    permission: PERMISSION_KEYS.QUANT_BACKTESTING,
  },
  {
    feature: '模拟盘交易',
    description: '在虚拟环境中测试策略',
    requiredPlan: 'ultra',
    permission: PERMISSION_KEYS.QUANT_PAPER_TRADING,
  },
  {
    feature: '实盘交易',
    description: '将策略部署到实盘环境',
    requiredPlan: 'ultra',
    permission: PERMISSION_KEYS.QUANT_LIVE_TRADING,
  },
];

/**
 * 根据权限获取所需的最小计划
 */
export function getRequiredPlanForPermission(permission: PermissionKey): SubscriptionPlan {
  for (const [plan, permissions] of Object.entries(PLAN_PERMISSIONS)) {
    if (permissions.includes(permission)) {
      return plan as SubscriptionPlan;
    }
  }

  return 'free'; // 默认返回 free
}

/**
 * 检查是否需要升级才能使用某个功能
 */
export function needsUpgrade(
  currentPlan: SubscriptionPlan,
  requiredPermission: PermissionKey
): { needsUpgrade: boolean; requiredPlan: SubscriptionPlan } {
  const hasAccess = hasPermission(currentPlan, requiredPermission);
  const requiredPlan = getRequiredPlanForPermission(requiredPermission);

  return {
    needsUpgrade: !hasAccess,
    requiredPlan,
  };
}
