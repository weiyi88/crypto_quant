# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

CryptoQuant 是一个**订阅制加密货币量化交易套利 SaaS 平台**，使用 Next.js 16 + React 19 + TypeScript 5 + Supabase 构建。项目采用赛博朋克风格设计，支持中英文双语，提供跨交易所套利、网格交易、统计套利、量化策略等功能。

### 核心特性
- **订阅制 SaaS**：三级订阅体系（Free/Pro/Ultra），基于 Supabase RLS 的多租户隔离
- **智能套利**：资金费率套利、三角套利、跨所搬砖、期现套利
- **量化策略**：基于 Freqtrade 的策略开发、回测、模拟盘、实盘交易
- **实时监控**：基于 Supabase Realtime + WebSocket 的实时数据流
- **安全可靠**：AES-256-GCM 加密、三层权限控制、断路器模式

### 技术栈
- **前端框架**: Next.js 16 (App Router)
- **UI**: React 19, TypeScript 5
- **样式**: Tailwind CSS v4 + CSS 变量主题系统
- **组件**: shadcn/ui (Radix UI + New York 风格)
- **数据库**: **Supabase** (PostgreSQL 16 + Auth + RLS + Realtime + Storage)
- **订阅管理**: **Stripe** (Billing + Webhooks)
- **量化引擎**: **Freqtrade** (Python)
- **交易所集成**: ccxt (100+ 交易所)
- **图表**: Recharts, Lightweight Charts
- **表单**: React Hook Form + Zod 验证
- **图标**: Lucide React
- **字体**: Inter (sans), JetBrains Mono (mono)

## 开发命令

```bash
# 开发服务器（Next.js）
npm run dev

# 开发 Freqtrade（需 Docker）
docker-compose up -f docker-compose.dev.yml

# 生产构建
npm run build

# 启动生产服务器
npm run start

# 代码检查
npm run lint

# 类型检查
npm run type-check

# 运行测试
npm run test
```

## 项目架构

### 系统分层架构（六层）

```
┌─────────────────────────────────────┐
│  第一层：用户展示层（前端）          │
│  - Next.js + React + TypeScript     │
│  - UI 渲染、用户交互、数据可视化     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第二层：API 网关层                  │
│  - Next.js API Routes + Middleware  │
│  - 认证鉴权、权限检查、限流控制      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第三层：业务逻辑层                  │
│  - 套利引擎、量化策略、实时数据       │
│  - 订阅管理、通知服务                │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第四层：数据访问层                  │
│  - Supabase Client（自动应用 RLS）  │
│  - Service Role Key（管理员操作）    │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第五层：数据存储层                  │
│  - Supabase (PostgreSQL + Auth)     │
│  - Realtime（实时订阅）              │
│  - Storage（文件存储）               │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  第六层：外部服务层                  │
│  - Stripe（支付订阅）                │
│  - Freqtrade（量化引擎）             │
│  - ccxt（交易所 API）                │
│  - Telegram/Email（通知）            │
└─────────────────────────────────────┘
```

### 目录结构

```
app/                           # Next.js App Router 页面
├── page.tsx                  # 登录页(首页)
├── layout.tsx                # 根布局(含 LanguageProvider)
├── globals.css               # 全局样式和主题变量
├── api/                      # API Routes
│   ├── auth/                 # Supabase Auth 回调
│   ├── webhooks/             # Stripe Webhooks
│   ├── trade/                # 交易 API
│   ├── quant/                # 量化策略 API
│   └── exchanges/            # 交易所 API
├── dashboard/                # 仪表盘子系统
│   ├── layout.tsx            # Dashboard 布局(侧边栏 + 顶栏)
│   ├── page.tsx              # 概览页
│   ├── arbitrage/            # 套利模块
│   ├── strategies/           # 策略管理（Ultra 专用）
│   ├── analytics/            # 数据分析
│   ├── portfolio/            # 投资组合
│   ├── history/              # 交易历史
│   ├── alerts/               # 警报系统
│   ├── settings/             # 设置
│   └── subscription/         # 订阅管理

components/
├── ui/                       # shadcn/ui 基础组件
├── dashboard/                # Dashboard 专用组件
├── auth/                     # 认证相关组件
├── subscription/             # 订阅相关组件
│   ├── pricing-cards.tsx     # 定价卡片
│   ├── feature-list.tsx      # 功能列表
│   └── upgrade-prompt.tsx    # 升级提示
├── permissions/              # 权限控制组件
│   └── permission-guard.tsx  # 权限守卫组件
└── common/                   # 通用组件
    ├── login-form.tsx        # 登录表单
    ├── glitch-logo.tsx       # 故障风 Logo
    ├── particle-background.tsx # 粒子背景
    └── language-switcher.tsx # 语言切换器

lib/
├── supabase/                 # Supabase 客户端
│   ├── client.ts             # 客户端实例
│   ├── server.ts             # 服务端实例
│   ├── admin.ts              # 管理员实例（Service Role）
│   └── types.ts              # 自动生成的类型
├── stripe/                   # Stripe 客户端
│   └── client.ts             # Stripe 实例
├── encryption.ts             # AES-256-GCM 加密工具
├── permissions.ts            # 权限常量和检查函数
├── circuit-breaker.ts        # 断路器模式实现
├── idempotency.ts            # 幂等性工具
├── utils.ts                  # 工具函数
└── language-context.tsx      # i18n 语言上下文

freqtrade/                     # Freqtrade 集成
├── strategies/               # 自定义策略
│   ├── funding_rate_arb.py   # 资金费率套利
│   ├── triangular_arb.py     # 三角套利
│   └── time_based_short.py   # 定时因子做空
├── user_data/                # Freqtrade 数据目录
└── config.json               # Freqtrade 配置

prisma/                       # 数据库 Schema（如果不用 Supabase）
└── schema.prisma             # Prisma Schema

supabase/                      # Supabase 本地开发
├── migrations/               # 数据库迁移
├── functions/                # Edge Functions
└── config.toml               # Supabase CLI 配置
```

### 核心架构模式

#### 1. 双语系统 (i18n)
- **实现**: React Context + localStorage 持久化
- **位置**: `lib/language-context.tsx`
- **使用**: 在组件中调用 `useLanguage()` hook 获取 `t` 对象
- **支持**: English (`en`), 简体中文 (`zh`)
- **翻译结构**: 嵌套对象 (`t.login.title`, `t.dashboard.overview`)

#### 2. 订阅制系统（新增核心）
- **数据库**: Supabase PostgreSQL + RLS
- **认证**: Supabase Auth (Email/Password + OAuth + Magic Links)
- **支付**: Stripe Billing (Recurring + Webhooks)
- **权限控制**: 三层架构
  - **前端层**: `<PermissionGuard>` 组件
  - **API 层**: Middleware 认证和授权检查
  - **数据库层**: Supabase RLS 策略强制隔离
- **使用监控**: `user_usage_stats` 表实时跟踪配额使用

**订阅级别**：
- **Free** ($0/月): 资金费率套利, 20 API/min, 2 交易所, 1 策略
- **Pro** ($29/月): 所有套利, 100 API/min, 5 交易所, 3 策略
- **Ultra** ($99/月): 所有套利 + 量化策略, 300 API/min, 无限制

#### 3. 权限控制架构（新增核心）

**三层权限守卫**：

```typescript
// 第一层：前端 UI 守卫
<PermissionGuard permission="quant:strategies">
  <QuantStrategiesPage />
</PermissionGuard>

// 第二层：API Middleware
export async function middleware(req: NextRequest) {
  // 检查认证
  // 检查订阅状态
  // 检查配额使用
  // 更新计数器
}

// 第三层：数据库 RLS（自动应用）
CREATE POLICY "Users can read own data" ON trades
  FOR SELECT USING (auth.uid() = user_id);
```

#### 4. API 密钥加密存储（新增核心）
- **加密算法**: AES-256-GCM（比 AES-256-CBC 更安全）
- **存储方式**: 加密后存储在 `exchange_api_keys` 表
- **解密**: 仅在 Freqtrade 容器内解密（使用 Service Role Key）
- **工具**: `lib/encryption.ts`

```typescript
import { encrypt, decrypt } from '@/lib/encryption';

// 加密存储
const api_key_encrypted = encrypt(user_api_key);

// 解密使用（仅服务端）
const api_key = decrypt(api_key_encrypted);
```

#### 5. 实时数据流（优化）
- **方案**: Supabase Realtime + WebSocket 混合
- **生产者**: Freqtrade 订阅 20+ 交易所 WebSocket
- **消费者**: Next.js 前端通过 Supabase Client 自动订阅
- **权限过滤**: RLS 自动过滤，用户只收到权限内的数据

```typescript
// 前端订阅实时价格
const channel = supabase
  .channel('realtime-prices')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'realtime_prices',
    filter: `user_id=eq.${userId}`, // RLS 自动应用
  }, (payload) => {
    updatePrice(payload.new);
  })
  .subscribe();
```

#### 6. 容错性设计（新增核心）
- **断路器模式**: 防止级联故障（`lib/circuit-breaker.ts`）
- **幂等性设计**: 重复请求安全（`lib/idempotency.ts`）
- **本地订单同步**: 防止僵尸单（每 1 分钟同步一次）
- **降级策略**: 服务不可用时提供降级体验

#### 7. 主题系统
- **实现**: CSS 变量 + Tailwind CSS v4
- **位置**: `app/globals.css`
- **设计语言**: 赛博朋克风格(深黑背景 + 霓虹色高亮)
- **关键颜色**:
  - `--neon-blue`, `--neon-cyan`, `--neon-purple`: 主要强调色
  - `--signal-green`, `--signal-red`, `--signal-amber`: 状态信号色
  - `--obsidian`: 纯黑背景(`#000000`)
  - `--glass-border`: 玻璃拟态边框

#### 8. 组件层次
```
登录页 (app/page.tsx)
├── ParticleBackground (粒子背景)
├── GlitchLogo (故障风 Logo)
└── LoginForm (Supabase Auth 登录)

订阅页 (app/subscription/page.tsx)
├── PricingCards (三个订阅计划卡片)
└── FeatureList (功能对比列表)

Dashboard (app/dashboard/page.tsx)
├── 顶部统计行 (4 个 StatsCard)
├── 主内容网格 (12 列 Grid 布局)
│   ├── PriceChart (8 列)
│   ├── PortfolioChart (4 列)
│   ├── ArbitrageTable (全宽, 权限控制)
│   ├── OrderBook + RecentTrades (各 3 列)
│   ├── PnLChart (6 列)
│   ├── StrategyCards (3 列 × N, 权限控制)
│   └── TerminalLog (全宽)
```

#### 9. Dashboard 布局
- **侧边栏**: 导航菜单(概览/套利/策略/分析/投资组合/历史/警报/设置)
- **顶栏**: 搜索框 + 语言切换器 + 订阅状态 + 用户菜单
- **页面路由**: 每个功能模块对应 `/dashboard/*` 下的独立页面
- **权限守卫**: 部分页面需要特定订阅级别才能访问

## 设计原则

### 视觉设计
1. **高对比度**: 纯黑背景(`#000000`)确保最大可读性
2. **快速交互**: 所有过渡动画 `200ms` (`.fast-transition`)
3. **霓虹色系**: 蓝色(`#3B82F6`)、青色(`#22D3EE`)、紫色(`#A78BFA`)
4. **玻璃拟态**: `glass-card` 类 + `--glass-border` 实现
5. **等宽字体**: 数据展示使用 `font-mono` (JetBrains Mono)

### 代码风格
1. **组件组织**: 按功能拆分(Dashboard 组件集中在 `components/dashboard/`)
2. **类型安全**: 所有组件使用 TypeScript 严格模式
3. **客户端交互**: Dashboard 页面使用 `"use client"` 指令
4. **路径别名**: `@/` 映射到项目根目录
5. **环境变量**: 敏感信息使用 `.env.local` 存储（不要提交到 Git）

### 安全性原则（新增核心）
1. **最小权限原则**: API 密钥只授予必要权限
2. **纵深防御**: 三层权限控制（UI + API + Database）
3. **加密存储**: 所有敏感数据使用 AES-256-GCM 加密
4. **定期轮换**: API 密钥每 90 天提醒轮换
5. **审计日志**: 记录所有敏感操作
6. **多租户隔离**: RLS 确保用户数据完全隔离

### UI 组件使用
- **基础组件**: 优先使用 `components/ui/*` 中的 shadcn/ui 组件
- **定制组件**: Dashboard 专用组件放在 `components/dashboard/*`
- **权限组件**: 使用 `<PermissionGuard>` 控制功能访问
- **订阅组件**: 使用 `<UpgradePrompt>` 提示用户升级
- **图标**: 使用 `lucide-react` 导入图标组件
- **表单**: 使用 React Hook Form + Zod schema 验证

## 开发指南

### Supabase 集成指南（新增）

#### 1. 环境配置

在 `.env.local` 中添加：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key # 仅服务端使用

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# 加密
ENCRYPTION_KEY=a_32_character_random_string # 用于 AES-256-GCM
```

#### 2. 客户端使用

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// 推荐方式：使用 Auth Helpers（自动处理 Session）
'use client';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MyComponent() {
  const supabase = createClientComponentClient();

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return <button onClick={signIn}>Sign In with Google</button>;
}
```

#### 3. 服务端使用

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function ServerComponent() {
  const supabase = createServerComponentClient({ cookies });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please sign in</div>;
  }

  // RLS 自动应用，用户只能访问自己的数据
  const { data: trades } = await supabase
    .from('trades')
    .select('*');

  return <div>Welcome {user.email}</div>;
}
```

#### 4. RLS 策略示例

```sql
-- 启用 RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- 用户只能读取自己的交易
CREATE POLICY "Users can read own trades" ON trades
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能插入自己的交易
CREATE POLICY "Users can insert own trades" ON trades
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Stripe 订阅集成指南（新增）

#### 1. 创建 Stripe 产品和价格

```bash
# 在 Stripe Dashboard 创建：
# - Product: CryptoQuant Pro
#   - Price: $29/month (recurring)
# - Product: CryptoQuant Ultra
#   - Price: $99/month (recurring)
```

#### 2. Checkout 页面实现

```typescript
// app/subscription/checkout/page.tsx
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { priceId: string };
}) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 创建 Stripe Checkout Session
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: searchParams.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/subscription/cancel`,
    customer_email: user.email,
    metadata: {
      user_id: user.id,
    },
  });

  redirect(session.url);
}
```

#### 3. Webhook 处理

```typescript
// app/api/webhooks/stripe/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 处理订阅事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    await supabase.from('user_subscriptions').insert({
      user_id: session.metadata?.user_id,
      stripe_subscription_id: session.subscription,
      status: 'active',
    });
  }

  return NextResponse.json({ received: true });
}
```

### Freqtrade 集成指南（新增）

#### 1. Freqtrade 配置

```json
// freqtrade/config.json
{
  "api_server": {
    "enabled": true,
    "listen_ip_address": "0.0.0.0",
    "listen_port": 8080,
    "verbosity": "error",
    "enable_openapi": false,
    "jwt_secret_key": "your-secret-key",
    "CORS_origins": ["http://localhost:3000"],
    "username": "freqtrader",
    "password": "your-password",
    "ws_token": "your-ws-token"
  },
  "external_message_consumer": {
    "enabled": true,
    "producers": [
      {
        "name": "default",
        "host": "127.0.0.1",
        "port": 8080,
        "ws_token": "your-ws-token"
      }
    ]
  }
}
```

#### 2. 自定义策略

```python
# freqtrade/strategies/funding_rate_arb.py
from freqtrade.strategy import IStrategy
from pandas import DataFrame

class FundingRateArb(IStrategy):
    """
    资金费率套利策略
    - 当资金费率 > 阈值时开仓
    - K 线趋势保护：15分钟涨幅 >5% 不开仓
    """

    # 策略参数
    minimal_roi = {
        "0": 0.01  # 1% 止盈
    }

    stoploss = -0.05  # 5% 止损

    # 策略变量
    minimal_funding_rate = 0.0001  # 0.01% 最小资金费率

    def bot_loop_start(self, **kwargs) -> None:
        """Bot 启动时初始化"""
        self.dp.add_onetime_callback(
            self.whitelist,
            self.process_funding_rate,
            timeframe=self.timeframe
        )

    def process_funding_rate(self, dataframe, pair):
        """处理资金费率数据"""
        latest = dataframe.iloc[-1]

        # K 线趋势保护
        if self.check_trend_filter(dataframe):
            return

        # 检查资金费率
        if latest['funding_rate'] > self.minimal_funding_rate:
            # 发送信号到 Supabase Realtime
            self.send_signal_to_supabase(pair, latest)

    def check_trend_filter(self, dataframe: DataFrame) -> bool:
        """K 线趋势过滤"""
        # 计算 15 分钟涨幅
        recent = dataframe.tail(3)  # 假设 5 分钟 K 线
        change = (recent.iloc[-1]['close'] - recent.iloc[0]['close']) / recent.iloc[0]['close']

        return change > 0.05  # 涨幅 >5% 过滤

    def send_signal_to_supabase(self, pair: str, latest: DataFrame):
        """发送信号到 Supabase Realtime"""
        # 使用 Supabase Python 客户端
        from supabase import create_client

        supabase = create_client(
            self.dp.supabase_url,
            self.dp.supabase_key
        )

        supabase.table('arbitrage_signals').insert({
            'pair': pair,
            'type': 'funding_rate',
            'funding_rate': latest['funding_rate'],
            'timestamp': latest['date'],
        }).execute()
```

#### 3. Next.js 调用 Freqtrade API

```typescript
// lib/freqtrade.ts
export class FreqtradeClient {
  private baseUrl: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseUrl = process.env.FREQTRADE_API_URL || 'http://localhost:8080';
    this.username = process.env.FREQTRADE_USERNAME || 'freqtrader';
    this.password = process.env.FREQTRADE_PASSWORD || '';
  }

  private async fetch(endpoint: string, options?: RequestInit) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const auth = btoa(`${this.username}:${this.password}`);

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Freqtrade API error: ${response.statusText}`);
    }

    return response.json();
  }

  // 获取 Bot 状态
  getStatus() {
    return this.fetch('/status');
  }

  // 启动策略
  startStrategy(strategy: string) {
    return this.fetch('/start', {
      method: 'POST',
      body: JSON.stringify({ strategy }),
    });
  }

  // 停止策略
  stopStrategy() {
    return this.fetch('/stop', {
      method: 'POST',
    });
  }

  // 获取交易历史
  getTrades() {
    return this.fetch('/trades');
  }
}
```

### 权限控制实现指南（新增）

#### 1. 前端权限守卫

```typescript
// components/permissions/permission-guard.tsx
import { useSubscription } from '@/hooks/use-subscription';
import { PERMISSIONS } from '@/lib/permissions';
import { UpgradePrompt } from './upgrade-prompt';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission: string;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  fallback,
}: PermissionGuardProps) {
  const { subscription, isLoading } = useSubscription();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const plan = subscription?.plan?.name || 'free';
  const hasPermission = PERMISSIONS[plan].includes(permission);

  if (!hasPermission) {
    return <>{fallback}</> || <UpgradePrompt requiredPermission={permission} />;
  }

  return <>{children}</>;
}
```

#### 2. 使用权限守卫

```typescript
// app/dashboard/strategies/page.tsx
import { PermissionGuard } from '@/components/permissions/permission-guard';

export default function StrategiesPage() {
  return (
    <PermissionGuard permission="quant:strategies">
      <div>
        <h1>量化策略管理</h1>
        {/* Ultra 用户专用内容 */}
      </div>
    </PermissionGuard>
  );
}
```

#### 3. 订阅数据 Hook

```typescript
// hooks/use-subscription.ts
import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/lib/supabase/types';

type Subscription = Database['public']['Tables']['user_subscriptions']['Row'];

export function useSubscription() {
  const supabase = createClientComponentClient();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSubscription() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }

      const { data } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .single();

      setSubscription(data);
      setIsLoading(false);
    }

    loadSubscription();
  }, [supabase]);

  return { subscription, isLoading };
}
```

## 重要注意事项

### 样式约定
- 使用 CSS 变量而非硬编码颜色值(如 `bg-neon-blue` 而非 `bg-[#3B82F6]`)
- 深色背景组件使用 `bg-obsidian` / `bg-charcoal` / `bg-console`
- 文本颜色使用 `text-foreground` / `text-muted-foreground`
- 边框使用 `border-glass-border` 实现半透明效果

### 国际化
- 所有用户可见文本必须使用 `t.*` 翻译
- 新增翻译需在 `lib/language-context.tsx` 的 `Translations` 接口中添加
- 中英文翻译需同步更新

### 响应式设计
- 使用 Tailwind 的断点:`sm`、`md`、`lg`、`xl`、`2xl`
- Dashboard 布局优先级:移动端 → 平板(12 列网格) → 桌面(多列布局)
- 图表容器需设置固定高度确保正确渲染

### 安全性（新增核心）
- **永远不要**将 Service Role Key 暴露到前端代码
- **永远不要**在日志中记录未加密的 API 密钥
- **永远不要**绕过 RLS 策略直接查询数据库
- **必须**使用 Supabase Auth 进行所有认证操作
- **必须**使用 Middleware 检查所有受保护的 API 路由
- **必须**使用 `<PermissionGuard>` 控制前端功能访问

### 环境变量管理
- 创建 `.env.local` 文件（不要提交到 Git）
- 参考 `.env.example` 文件获取所有必需的环境变量
- 使用 `process.env.NEXT_PUBLIC_*` 前缀暴露变量到客户端
- 敏感信息（Service Role Key）不要使用 `NEXT_PUBLIC_` 前缀

### 数据库操作
- **优先使用** Supabase Client 的自动类型生成功能
- **优先使用** RLS 策略而非应用层权限检查
- **永远不要**在前端代码中使用 Service Role Key
- **永远不要**绕过 RLS 直接操作其他用户的数据

## 常见任务

### 添加新的 Dashboard 页面
1. 在 `app/dashboard/*/page.tsx` 创建页面组件
2. 如果需要权限控制，添加 `<PermissionGuard>` 包裹
3. 在 `components/dashboard/sidebar.tsx` 添加导航项
4. 在 `lib/language-context.tsx` 添加对应的翻译键

### 添加权限控制到功能
1. 在 `lib/permissions.ts` 定义权限常量
2. 在组件中使用 `<PermissionGuard permission="your:permission">`
3. 在 API Middleware 中添加权限检查
4. 在数据库 RLS 策略中添加相应规则

### 创建新的图表组件
1. 使用 `recharts` 库(已安装)
2. 在 `components/dashboard/*` 创建组件
3. 设置固定的容器高度(如 `h-[400px]`)
4. 使用 CSS 变量颜色(`var(--chart-1)` 到 `var(--chart-5)`)

### 添加订阅计划
1. 在 Stripe Dashboard 创建产品和价格
2. 在数据库 `subscription_plans` 表插入新计划
3. 在 `lib/permissions.ts` 定义权限
4. 更新订阅页面的 `PricingCards` 组件

### 集成新的 Freqtrade 策略
1. 在 `freqtrade/strategies/` 创建策略文件
2. 实现策略逻辑（继承 `IStrategy`）
3. 在 `freqtrade/config.json` 启用策略
4. 在前端添加策略控制 UI

### 添加新的 UI 组件
```bash
# shadcn/ui 组件添加命令
npx shadcn@latest add [component-name]
```
组件会自动安装到 `components/ui/*` 并配置好样式

### 处理 Stripe Webhooks
1. 在 `app/api/webhooks/stripe/route.ts` 添加事件处理逻辑
2. 验证 Webhook 签名
3. 更新 Supabase 数据库中的订阅状态
4. 发送确认通知给用户

### 样式调试
- 所有 CSS 变量在 `app/globals.css` 的 `:root` 中定义
- 使用 Tailwind 的 `@theme inline` 指令引用变量
- 自定义类名使用语义化前缀(如 `glass-card`, `status-online`)

### 数据库迁移
```bash
# 创建新的迁移
supabase migration new add_new_table

# 应用迁移
supabase db push

# 生成 TypeScript 类型
supabase gen types typescript --local > lib/supabase/types.ts
```

## 开发优先级（新增）

根据技术架构 V2.0，开发优先级如下：

### Phase 0: 用户模块与订阅系统（4 周）← 最高优先级
1. Supabase 项目设置和数据库设计
2. Stripe 订阅集成
3. 权限控制系统（三层守卫）
4. 用户管理界面

### Phase 1: 核心与风控（6 周）
1. 基础设施搭建（Next.js + Docker Compose）
2. 三级账户体系
3. 交易所 API 对接与容错

### Phase 2: 套利策略实装（8 周）
1. 资金费率套利（Free/Pro/Ultra 可用）
2. 三角套利（Pro/Ultra 可用）
3. 跨所搬砖（Pro/Ultra 可用）
4. 数据看板基础版

### Phase 3: 量化闭环（10 周）
1. 策略编辑器与回测（Ultra 可用）
2. 预置策略上线
3. 模拟盘环境
4. 全功能数据看板

## 技术文档参考

- **技术架构 V2.0**: `.chat_history/technical_architecture_v2.md`
- **PRD**: `.chat_history/prd/prd.md`
- **Supabase 文档**: https://supabase.com/docs
- **Stripe 文档**: https://stripe.com/docs
- **Freqtrade 文档**: https://www.freqtrade.io/
- **Next.js 文档**: https://nextjs.org/docs

## 最佳实践

### 代码审查清单
- [ ] 所有 API 密钥都使用 AES-256-GCM 加密存储
- [ ] 所有用户数据访问都使用 Supabase Client（自动应用 RLS）
- [ ] 所有敏感功能都有 `<PermissionGuard>` 保护
- [ ] 所有 API 路由都有 Middleware 权限检查
- [ ] 所有用户可见文本都使用 `t.*` 翻译
- [ ] 所有环境变量都在 `.env.example` 中有说明
- [ ] 所有数据库变更都有迁移文件
- [ ] 所有错误都被适当捕获和处理

### 性能优化清单
- [ ] 图表组件使用 `React.memo` 避免不必要的重渲染
- [ ] 实时数据使用 Supabase Realtime 而非轮询
- [ ] 大列表使用虚拟滚动（react-window）
- [ ] 图片使用 Next.js Image 组件优化
- [ ] API 请求使用 React Query 或 SWR 缓存

### 安全检查清单
- [ ] Service Role Key 仅在服务端使用
- [ ] RLS 策略覆盖所有敏感表
- [ ] API 密钥解密仅在 Freqtrade 容器内进行
- [ ] 所有 Webhook 都验证签名
- [ ] 所有用户输入都经过 Zod 验证
- [ ] CORS 配置正确（不允许任意来源）

---

**文档版本**: v2.0 (Optimized)
**最后更新**: 2026-01-30
**维护者**: CryptoQuant Team
