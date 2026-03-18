/**
 * CryptoQuant V3.0 - 订阅管理 Hook
 *
 * 提供用户订阅状态的实时查询和管理
 */

'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/types';
import type { SubscriptionPlan } from '@/lib/permissions';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type UserSubscription = Database['public']['Tables']['user_subscriptions']['Row'];
type SubscriptionPlan = Database['public']['Tables']['subscription_plans']['Row'];
type UserUsageStats = Database['public']['Tables']['user_usage_stats']['Row'];

export interface SubscriptionData {
  user: UserProfile | null;
  subscription: UserSubscription | null;
  plan: SubscriptionPlan | null;
  usage: UserUsageStats | null;
  isLoading: boolean;
  error: string | null;
}

export interface SubscriptionActions {
  refresh: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
  checkQuota: (type: 'api_calls_per_minute' | 'max_exchanges' | 'max_strategies') => {
    withinLimit: boolean;
    current: number;
    limit: number;
    remaining: number;
  };
}

/**
 * 订阅管理 Hook
 *
 * @example
 * const { subscription, plan, isLoading } = useSubscription();
 */
export function useSubscription(): SubscriptionData & SubscriptionActions {
  const supabase = createClientComponentClient<Database>();

  const [data, setData] = useState<SubscriptionData>({
    user: null,
    subscription: null,
    plan: null,
    usage: null,
    isLoading: true,
    error: null,
  });

  /**
   * 加载用户订阅数据
   */
  const loadSubscription = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      // 1. 获取当前用户
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setData(prev => ({
          ...prev,
          isLoading: false,
          user: null,
          subscription: null,
          plan: null,
          usage: null,
        }));
        return;
      }

      // 2. 获取用户资料
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('auth_id', authUser.id)
        .single();

      // 3. 获取用户订阅
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', profile?.id)
        .single();

      // 4. 获取使用统计
      const { data: usage } = await supabase
        .from('user_usage_stats')
        .select('*')
        .eq('user_id', profile?.id)
        .single();

      setData({
        user: profile,
        subscription,
        plan: subscription?.subscription_plans || null,
        usage,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load subscription',
      }));
    }
  };

  /**
   * 检查是否有某个权限
   */
  const checkPermission = (permission: string): boolean => {
    if (!data.plan) return false;

    const permissions = data.plan.permissions as any;
    if (!permissions) return false;

    // 支持嵌套权限检查，如 'arbitrage.triangular'
    const keys = permission.split('.');
    let result = permissions;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return false;
      }
    }

    return Boolean(result);
  };

  /**
   * 检查配额限制
   */
  const checkQuota = (
    type: 'api_calls_per_minute' | 'max_exchanges' | 'max_strategies'
  ) => {
    const limits = data.plan?.permissions as any?.limits || {};
    const currentUsage = data.usage || {};

    const limit = limits[type] ?? 0;
    const current = currentUsage[type === 'api_calls_per_minute' ? 'api_calls_current_minute' : `active_${type.replace('max_', '')}`] || 0;

    // -1 表示无限制
    const withinLimit = limit === -1 || current < limit;
    const remaining = limit === -1 ? -1 : Math.max(0, limit - current);

    return {
      withinLimit,
      current,
      limit,
      remaining,
    };
  };

  /**
   * 刷新订阅数据
   */
  const refresh = async () => {
    await loadSubscription();
  };

  // 初始加载
  useEffect(() => {
    loadSubscription();
  }, []);

  // 实时订阅订阅变更
  useEffect(() => {
    const channel = supabase
      .channel('subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_subscriptions',
        },
        () => {
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    ...data,
    refresh,
    checkPermission,
    checkQuota,
  };
}

/**
 * 获取用户当前计划名称
 */
export function useCurrentPlan(): SubscriptionPlan | null {
  const { plan } = useSubscription();
  return plan?.name as SubscriptionPlan | null;
}

/**
 * 检查是否为 Pro 或 Ultra 用户
 */
export function useIsProUser(): boolean {
  const plan = useCurrentPlan();
  return plan === 'pro' || plan === 'ultra';
}

/**
 * 检查是否为 Ultra 用户
 */
export function useIsUltraUser(): boolean {
  const plan = useCurrentPlan();
  return plan === 'ultra';
}
