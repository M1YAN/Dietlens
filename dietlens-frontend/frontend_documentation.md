# DietLens 前端文档

## 项目概述

DietLens是一个智能食物识别与营养管理平台，帮助用户通过上传食物图片获取营养信息，追踪每日营养摄入，设定健康目标，并在社区中与其他用户和营养专家交流。本文档详细介绍DietLens前端的架构设计、技术选型、功能模块和部署说明。

## 技术栈

- **框架**: Next.js 15.1.8 (React框架)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: 自定义BentoGrid组件
- **状态管理**: React Context API + SWR
- **HTTP客户端**: Axios
- **表单处理**: React Hook Form + Zod
- **图表**: Recharts
- **图标**: Lucide React

## 项目结构

```
frontend/
├── public/                 # 静态资源
├── src/
│   ├── app/                # 应用页面
│   │   ├── (auth)/         # 认证相关页面
│   │   ├── community/      # 社区相关页面
│   │   ├── dashboard/      # 用户仪表盘
│   │   ├── food-recognition/ # 食物识别功能
│   │   ├── food-search/    # 食物搜索功能
│   │   ├── nutrition/      # 营养管理功能
│   │   ├── profile/        # 用户资料页面
│   │   ├── layout.tsx      # 全局布局
│   │   └── page.tsx        # 首页
│   ├── components/         # 可复用组件
│   │   ├── auth/           # 认证相关组件
│   │   ├── bento/          # BentoGrid组件
│   │   ├── community/      # 社区相关组件
│   │   ├── food/           # 食物相关组件
│   │   ├── layout/         # 布局组件
│   │   ├── nutrition/      # 营养相关组件
│   │   └── ui/             # 通用UI组件
│   ├── lib/                # 工具库
│   │   ├── api/            # API服务
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── types/          # TypeScript类型定义
│   │   └── utils.ts        # 工具函数
│   └── styles/             # 全局样式
└── package.json            # 项目依赖
```

## 核心功能模块

### 1. 用户认证系统

用户认证系统包括登录和注册功能，使用JWT令牌进行身份验证。

**主要文件**:
- `src/app/auth/login/page.tsx`: 登录页面
- `src/app/auth/register/page.tsx`: 注册页面
- `src/lib/api/authService.ts`: 认证API服务
- `src/lib/hooks/useAuth.tsx`: 认证状态管理Hook

**功能特点**:
- JWT令牌认证
- 登录状态持久化
- 路由保护
- 表单验证

### 2. 仪表盘

仪表盘是用户登录后的主页，展示用户的概览信息、营养摄入、识别记录等。

**主要文件**:
- `src/app/dashboard/page.tsx`: 仪表盘页面
- `src/components/bento/BentoGrid.tsx`: BentoGrid布局组件

**功能特点**:
- BentoGrid风格布局
- 营养摄入进度展示
- 最近识别记录
- 推荐食物
- 社区热门帖子

### 3. 智能食物识别

食物识别功能允许用户上传食物图片，系统自动识别食物并提供营养信息。

**主要文件**:
- `src/app/food-recognition/upload/page.tsx`: 上传页面
- `src/app/food-recognition/[id]/page.tsx`: 识别结果页面
- `src/app/food-recognition/history/page.tsx`: 历史记录页面
- `src/lib/api/foodRecognitionService.ts`: 食物识别API服务

**功能特点**:
- 图片上传(支持拖放)
- 食物自动识别
- 识别结果展示
- 历史记录查询

### 4. 食物搜索与浏览

食物搜索功能允许用户浏览食物分类、搜索特定食物，并查看详细营养信息。

**主要文件**:
- `src/app/food-search/categories/page.tsx`: 分类浏览页面
- `src/app/food-search/categories/[id]/page.tsx`: 分类详情页面
- `src/app/food-search/[id]/page.tsx`: 食物详情页面
- `src/app/food-search/search/page.tsx`: 搜索结果页面
- `src/lib/api/foodSearchService.ts`: 食物搜索API服务

**功能特点**:
- 分类浏览
- 食物搜索
- 详细营养信息
- 收藏功能
- 添加到每日记录

### 5. 社区功能

社区功能允许用户浏览帖子、发表帖子、评论互动，与其他用户和营养专家交流。

**主要文件**:
- `src/app/community/posts/page.tsx`: 帖子列表页面
- `src/app/community/[id]/page.tsx`: 帖子详情页面
- `src/app/community/create/page.tsx`: 发布帖子页面
- `src/lib/api/communityService.ts`: 社区API服务

**功能特点**:
- 帖子列表与筛选
- 帖子详情展示
- 评论功能
- 点赞功能
- 专家标识

### 6. 营养目标管理

营养目标管理功能允许用户设置和跟踪每日营养目标，查看历史数据。

**主要文件**:
- `src/app/nutrition/goals/page.tsx`: 目标设置页面
- `src/app/nutrition/daily/page.tsx`: 每日记录页面
- `src/app/nutrition/history/page.tsx`: 历史数据页面
- `src/lib/api/nutritionService.ts`: 营养管理API服务

**功能特点**:
- 营养目标设置
- 每日摄入记录
- 营养数据可视化
- 历史数据分析

## API集成

前端通过Axios与后端API进行通信，所有API服务都封装在`src/lib/api`目录下。

### API客户端

`src/lib/api/apiClient.ts`是API请求的核心，负责处理请求配置、认证令牌和错误处理。

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器 - 处理错误
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误 - 清除令牌并重定向到登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API服务

每个功能模块都有对应的API服务，例如`authService.ts`、`foodRecognitionService.ts`等。这些服务封装了与后端API的交互逻辑。

## 状态管理

DietLens前端使用React Context API进行全局状态管理，主要用于用户认证状态。

### 认证Context

`src/lib/hooks/useAuth.tsx`实现了认证状态管理，提供登录、注册、登出等功能。

```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 检查本地存储中的令牌并获取用户信息
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await authService.getCurrentUser();
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    const response = await authService.login(username, password);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await authService.register(username, email, password);
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

## BentoGrid设计

BentoGrid是DietLens前端的核心UI设计元素，提供灵活的卡片布局系统。

### BentoGrid组件

`src/components/bento/BentoGrid.tsx`实现了BentoGrid布局组件，支持不同大小的卡片。

```typescript
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BentoGridProps {
  className?: string;
  children: ReactNode;
}

export function BentoGrid({ className, children }: BentoGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4', className)}>
      {children}
    </div>
  );
}

interface BentoCardProps {
  className?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
  size?: '1x1' | '1x2' | '2x1' | '2x2';
  children: ReactNode;
}

export function BentoCard({
  className,
  title,
  description,
  icon,
  size = '1x1',
  children,
}: BentoCardProps) {
  const sizeClasses = {
    '1x1': 'md:col-span-1 md:row-span-1',
    '1x2': 'md:col-span-1 md:row-span-2',
    '2x1': 'md:col-span-2 md:row-span-1',
    '2x2': 'md:col-span-2 md:row-span-2',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-md overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      {(title || icon) && (
        <div className="p-4 border-b flex items-center justify-between">
          {title && <h3 className="font-medium">{title}</h3>}
          {icon && <div className="text-gray-500">{icon}</div>}
        </div>
      )}
      <div className="p-4">{children}</div>
      {description && (
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      )}
    </div>
  );
}
```

## 响应式设计

DietLens前端采用响应式设计，确保在不同设备上都能提供良好的用户体验。

- 使用Tailwind CSS的响应式类
- 移动优先设计
- 适配不同屏幕尺寸的布局

## 部署说明

### 开发环境

1. 克隆项目仓库
2. 安装依赖
   ```bash
   cd frontend
   npm install
   ```
3. 创建`.env.local`文件，配置环境变量
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
   ```
4. 启动开发服务器
   ```bash
   npm run dev
   ```

### 生产环境

1. 构建项目
   ```bash
   npm run build
   ```
2. 启动生产服务器
   ```bash
   npm start
   ```

### 环境变量

- `NEXT_PUBLIC_API_BASE_URL`: 后端API的基础URL

## 性能优化

DietLens前端采用了多种性能优化策略：

1. **图片优化**：使用Next.js的Image组件进行自动优化
2. **代码分割**：利用Next.js的自动代码分割
3. **懒加载**：对非关键组件和图片进行懒加载
4. **缓存策略**：使用SWR进行数据缓存
5. **预取**：预取可能需要的页面和数据

## 安全考虑

1. **认证**：使用JWT进行安全认证
2. **表单验证**：使用Zod进行严格的表单验证
3. **CSRF保护**：实施CSRF令牌验证
4. **XSS防护**：避免不安全的innerHTML使用
5. **敏感数据处理**：不在客户端存储敏感信息

## 未来改进

1. **离线支持**：添加PWA功能，支持离线使用
2. **多语言支持**：实现国际化
3. **深色模式**：添加深色模式支持
4. **性能监控**：集成性能监控工具
5. **A/B测试**：实现A/B测试框架

## 结论

DietLens前端采用现代化的技术栈和架构设计，提供了流畅的用户体验和丰富的功能。通过与后端API的紧密集成，实现了智能食物识别、营养管理、社区互动等核心功能。响应式设计确保了在各种设备上的良好表现，为用户提供全方位的营养健康管理解决方案。
