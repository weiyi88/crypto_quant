/**
 * CryptoQuant V3.0 - API Middleware
 *
 * 第二层权限控制：API 路由保护
 *
 * 功能：
 * 1. 验证用户认证状态
 * 2. 检查订阅状态
 * 3. 检查配额限制
 * 4. 更新使用统计
 */

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 不需要认证的路由
 */
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/auth/callback',
  '/subscription',
  '/api/auth',
  '/api/webhooks',
];

/**
 * 需要 Ultra 订阅的路由
 */
const ULTRA_ROUTES = [
  '/dashboard/strategies',
  '/api/quant',
];

/**
 * 需要 Pro 或 Ultra 订阅的路由
 */
const PRO_ROUTES = [
  '/dashboard/arbitrage',
  '/dashboard/analytics',
  '/api/arbitrage',
];

/**
 * 主中间件函数
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // 1. 检查是否为公开路由
  if (isPublicRoute(pathname)) {
    return res;
  }

  // 2. 初始化 Supabase 客户端
  const supabase = createMiddlewareClient({ req, res });

  // 3. 检查用户认证状态
  const {
    data: { session },
    error: authError,
  } = await supabase.auth.getSession();

  if (authError || !session) {
    // 未登录，重定向到登录页
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // 4. 获取用户订阅信息
  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', session.user.id)
    .single();

  // 检查订阅状态
  if (!subscription || subscription.status !== 'active') {
    // 订阅未激活，重定向到订阅页
    if (!pathname.startsWith('/subscription')) {
      const redirectUrl = new URL('/subscription', req.url);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 5. 检查路由权限要求
  const planName = subscription?.subscription_plans?.name || 'free';

  // Ultra 路由检查
  if (ULTRA_ROUTES.some(route => pathname.startsWith(route))) {
    if (planName !== 'ultra') {
      return NextResponse.json(
        { error: 'This feature requires Ultra plan', code: 'UPGRADE_REQUIRED' },
        { status: 403 }
      );
    }
  }

  // Pro 路由检查
  if (PRO_ROUTES.some(route => pathname.startsWith(route))) {
    if (planName === 'free') {
      return NextResponse.json(
        { error: 'This feature requires Pro plan or higher', code: 'UPGRADE_REQUIRED' },
        { status: 403 }
      );
    }
  }

  // 6. API 路由配额检查
  if (pathname.startsWith('/api/')) {
    const quotaCheck = await checkApiQuota(supabase, session.user.id, planName);

    if (!quotaCheck.withinLimit) {
      return NextResponse.json(
        {
          error: 'API rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          limit: quotaCheck.limit,
          resetAt: quotaCheck.resetAt,
        },
        { status: 429 }
      );
    }
  }

  // 7. 添加 CORS 头（如果需要）
  res.headers.set('X-User-Plan', planName);
  res.headers.set('X-User-Id', session.user.id);

  return res;
}

/**
 * 检查是否为公开路由
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 检查 API 配额
 */
async function checkApiQuota(
  supabase: any,
  userId: string,
  planName: string
): Promise<{ withinLimit: boolean; limit: number; resetAt: string | null }> {
  // 根据计划获取限制
  const limits: Record<string, number> = {
    free: 20,
    pro: 100,
    ultra: 300,
  };

  const limit = limits[planName] || 20;
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), 0, 0);

  // 查询当前分钟的使用次数
  const { data: usage } = await supabase
    .from('user_usage_stats')
    .select('api_calls_current_minute, api_calls_window_start')
    .eq('user_id', userId)
    .single();

  let currentCount = 0;
  let windowStart = windowStart.toISOString();

  if (usage) {
    // 检查窗口是否过期
    if (new Date(usage.api_calls_window_start) < windowStart) {
      // 新窗口，重置计数
      currentCount = 0;
      windowStart = windowStart.toISOString();
    } else {
      currentCount = usage.api_calls_current_minute || 0;
      windowStart = usage.api_calls_window_start;
    }
  }

  // 检查是否超限
  const withinLimit = currentCount < limit;

  // 如果未超限，增加计数
  if (withinLimit) {
    await supabase
      .from('user_usage_stats')
      .upsert({
        user_id: userId,
        api_calls_current_minute: currentCount + 1,
        api_calls_window_start: windowStart,
      });
  }

  // 计算重置时间（下一分钟）
  const resetAt = new Date(windowStart);
  resetAt.setMinutes(resetAt.getMinutes() + 1);

  return {
    withinLimit,
    limit,
    resetAt: resetAt.toISOString(),
  };
}

/**
 * Middleware 配置
 */
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (favicon 文件)
     * - public folder (公共文件)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
