# AquaCube - 专业的3D鱼缸设计工具

AquaCube 是一款基于 Web 的专业 3D 鱼缸设计工具，支持自定义尺寸、真实物理材质、海量素材库，让用户轻松创建令人惊叹的水族造景。项目采用现代化的技术栈，提供流畅的 3D 交互体验。

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [前置要求](#前置要求)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [项目结构](#项目结构)
- [技术架构](#技术架构)
- [开发指南](#开发指南)
- [API 文档](#api-文档)
- [常见问题](#常见问题)

## 🎯 项目概述

AquaCube 提供以下核心功能：

- 🎨 **3D 鱼缸设计**：支持自定义长宽高，实时预览
- 💎 **超白玻璃材质**：真实的光影效果和透射效果
- 🌊 **可配置水面高度**：精确控制水体体积
- 📦 **海量素材库**：水草、鱼类、沙粒、石头、沉木等
- 🖱️ **拖拽交互**：便捷的素材添加和摆放
- 🔧 **变换控制**：支持缩放、旋转、位置调整
- 💾 **版本管理**：项目快照保存和恢复
- 👤 **用户系统**：支持手机号验证码登录和微信登录
- 🎭 **主题切换**：白天/暗夜模式一键切换

## 🛠 技术栈

### 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.0.10 | React 框架，支持 SSR、API Routes |
| **React** | 19.2.1 | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **Three.js** | 0.182.0 | 3D 渲染引擎 |
| **@react-three/fiber** | 9.5.0 | React 的 Three.js 渲染器 |
| **@react-three/drei** | 10.7.7 | Three.js 辅助组件库 |
| **Tailwind CSS** | 4.x | 样式框架 |
| **jose** | 6.1.3 | JWT token 生成和验证 |

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js API Routes** | 16.0.10 | 服务端 API |
| **PostgreSQL** | - | 关系型数据库 |
| **Drizzle ORM** | 0.45.1 | 数据库 ORM |
| **coze-coding-dev-sdk** | 0.5.0 | 数据库和对象存储集成 |
| **bcryptjs** | 3.0.3 | 密码加密 |
| **AWS SDK for S3** | 3.958.0 | 对象存储操作 |

### 基础设施

| 服务 | 用途 |
|------|------|
| **PostgreSQL** | 持久化数据存储（用户、素材、项目版本等） |
| **S3 兼容对象存储** | 3D 模型文件存储和管理 |

## 📦 前置要求

在开始之前，请确保您的开发环境满足以下要求：

### 必需软件

- **Node.js**: 24.x 或更高版本
  ```bash
  node --version  # 应显示 v24.x.x
  ```

- **pnpm**: 9.x 或更高版本（项目使用的包管理器）
  ```bash
  pnpm --version
  ```

- **Git**: 用于版本控制
  ```bash
  git --version
  ```

### 数据库要求

- **PostgreSQL**: 12.x 或更高版本
  - 支持 Docker 部署
  - 需要创建数据库和用户

### 环境变量

需要配置以下环境变量（详见[环境配置](#环境配置)）：

```bash
# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/aquacube

# JWT 密钥
JWT_SECRET=your-secret-key-change-in-production

# 对象存储配置
COZE_BUCKET_ENDPOINT_URL=https://your-s3-endpoint.com
COZE_BUCKET_NAME=your-bucket-name

# 微信登录（可选）
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
```

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd aquacube
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
# 编辑 .env.local，填入实际的配置
```

### 4. 初始化数据库

运行数据库迁移脚本：

```bash
# 生成数据库迁移文件（如果需要）
pnpm drizzle-kit generate

# 推送数据库 schema 到数据库
pnpm drizzle-kit push

# 或使用 API 初始化（推荐）
curl -X POST http://localhost:5000/api/seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

项目将在 `http://localhost:5000` 启动。

### 6. 访问应用

- **首页**: http://localhost:5000
- **登录页面**: http://localhost:5000/login
- **创作页面**: http://localhost:5000/aquarium
- **素材管理**: http://localhost:5000/materials
- **后台管理**: http://localhost:5000/admin

## ⚙️ 环境配置

### 数据库配置

#### 方法 1: 使用本地 PostgreSQL

1. 安装 PostgreSQL
2. 创建数据库：
```sql
CREATE DATABASE aquacube;
CREATE USER aquacube_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE aquacube TO aquacube_user;
```

3. 配置环境变量：
```bash
DATABASE_URL=postgresql://aquacube_user:your_password@localhost:5432/aquacube
```

#### 方法 2: 使用 Docker

```bash
# 启动 PostgreSQL 容器
docker run --name aquacube-db \
  -e POSTGRES_USER=aquacube_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=aquacube \
  -p 5432:5432 \
  -d postgres:15

# 配置环境变量
DATABASE_URL=postgresql://aquacube_user:your_password@localhost:5432/aquacube
```

### 对象存储配置

项目使用 S3 兼容的对象存储来保存 3D 模型文件。

#### 环境变量

```bash
# S3 端点 URL
COZE_BUCKET_ENDPOINT_URL=https://your-s3-endpoint.com

# 存储桶名称
COZE_BUCKET_NAME=your-bucket-name

# 区域（根据实际配置）
REGION=cn-beijing
```

#### 分块上传

支持大文件分块上传，默认分块大小为 4MB（符合 Vercel 限制）。

上传流程：
1. 前端将文件分割为多个分块
2. 逐个上传分块到服务器临时目录 `/tmp/uploads`
3. 服务器合并所有分块
4. 上传完整的文件到 S3
5. 返回文件 Key 给前端

### JWT 配置

用于用户认证的 JWT 密钥：

```bash
# 生产环境请使用强密码
JWT_SECRET=your-very-secure-secret-key-change-in-production
```

Token 有效期：7 天

### 微信登录配置（可选）

如果需要微信登录功能，配置以下环境变量：

```bash
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
```

## 📁 项目结构

```
aquacube/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── auth/          # 认证相关 API
│   │   │   │   ├── phone-login/
│   │   │   │   ├── send-code/
│   │   │   │   └── wechat-login/
│   │   │   ├── materials/     # 素材管理 API
│   │   │   │   ├── [id]/      # 单个素材操作
│   │   │   │   ├── check-upload/
│   │   │   │   └── route.ts
│   │   │   ├── upload/        # 文件上传 API
│   │   │   │   ├── chunk/     # 分块上传
│   │   │   │   └── route.ts
│   │   │   ├── project-versions/  # 项目版本管理
│   │   │   ├── admin/         # 后台管理 API
│   │   │   └── debug/         # 调试 API
│   │   ├── aquarium/          # 鱼缸创作页面
│   │   ├── login/             # 登录页面
│   │   ├── materials/         # 素材管理页面
│   │   ├── admin/             # 后台管理页面
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页
│   │   └── globals.css        # 全局样式
│   ├── components/            # React 组件
│   │   ├── Aquarium3D.tsx     # 3D 鱼缸组件
│   │   ├── MaterialLibrary.tsx # 素材库组件
│   │   ├── ItemTransformPanel.tsx # 素材变换面板
│   │   ├── PropertiesPanel.tsx  # 属性面板
│   │   ├── MenuBar.tsx        # 菜单栏
│   │   ├── ThemeToggle.tsx    # 主题切换
│   │   └── ...
│   ├── contexts/              # React Context
│   │   ├── AuthContext.tsx    # 认证上下文
│   │   └── ThemeContext.tsx   # 主题上下文
│   ├── db/                    # 数据库相关
│   │   ├── schema.ts          # 数据库表定义
│   │   └── materialManager.ts # 素材管理器
│   └── lib/                   # 工具函数
├── public/                    # 静态资源
├── drizzle.config.ts          # Drizzle ORM 配置
├── next.config.ts             # Next.js 配置
├── tailwind.config.ts         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
├── package.json               # 项目依赖
└── README.md                  # 本文件
```

## 🏗 技术架构

### 前后端分离架构

项目采用 Next.js 16 的 App Router，实现了真正的全栈应用：

```
┌─────────────────────────────────────────┐
│           前端 (React 19)               │
│  - 页面组件                             │
│  - UI 组件                              │
│  - 3D 渲染 (Three.js + R3F)            │
└──────────────┬──────────────────────────┘
               │
               │ fetch API
               │
┌──────────────▼──────────────────────────┐
│        后端 (Next.js API Routes)         │
│  - 认证中间件                           │
│  - 业务逻辑                             │
│  - 数据验证 (Zod)                       │
└──────────────┬──────────────────────────┘
               │
               │ Drizzle ORM
               │
┌──────────────▼──────────────────────────┐
│         数据层                          │
│  - PostgreSQL (用户、素材、项目)        │
│  - S3 对象存储 (3D 模型文件)            │
└─────────────────────────────────────────┘
```

### 核心技术组件

#### 1. 数据库集成 (PostgreSQL + Drizzle ORM)

**数据库 Schema** (`src/db/schema.ts`):

```typescript
// 主要数据表
- users: 用户信息
- admins: 管理员信息
- materials: 素材库
- project_versions: 项目版本
- login_records: 登录记录
- site_config: 站点配置
```

**数据库连接** (使用 `coze-coding-dev-sdk`):

```typescript
import { getDb } from 'coze-coding-dev-sdk';

// 自动从环境变量读取 DATABASE_URL
const db = await getDb();
const materials = await db.select().from(materials);
```

**优势**:
- 自动连接池管理
- 类型安全的查询
- 迁移支持

#### 2. 对象存储集成 (S3 Compatible)

**S3Storage 使用** (使用 `coze-coding-dev-sdk`):

```typescript
import { S3Storage } from 'coze-coding-dev-sdk';

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',  // 内部认证
  secretKey: '',  // 内部认证
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 上传文件
const fileKey = await storage.uploadFile({
  fileContent: buffer,
  fileName: 'models/example.glb',
  contentType: 'application/octet-stream',
});

// 生成签名 URL
const url = await storage.generatePresignedUrl({
  key: fileKey,
  expireTime: 31536000,  // 1年
});
```

**分块上传实现**:

1. 前端分割文件 (4MB/块)
2. 上传分块到服务器 `/tmp/uploads`
3. 合并所有分块
4. 上传到 S3
5. 返回文件 Key

**优势**:
- 支持大文件上传
- 自动签名 URL 生成
- 无需管理 AWS 凭证

#### 3. 3D 渲染架构

**技术栈**: Three.js + React Three Fiber + @react-three/drei

**核心组件** (`src/components/Aquarium3D.tsx`):

```typescript
// 3D 场景组件
<Canvas>
  {/* 环境光 */}
  <ambientLight intensity={0.5} />

  {/* 主光源 */}
  <directionalLight position={[5, 5, 5]} />

  {/* 鱼缸 */}
  <Aquarium width={length} height={height} depth={width} />

  {/* 素材 */}
  {items.map(item => (
    <ModelItem {...item} />
  ))}

  {/* 摄像机控制 */}
  <OrbitControls />
</Canvas>
```

**玻璃材质** (超白高透):

```typescript
const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transmission: 1.0,     // 完全透光
  roughness: 0.02,        // 光滑
  thickness: 0.01,        // 厚度
  ior: 1.52,             // 玻璃折射率
  transparent: true,
  opacity: 0.15,
});
```

#### 4. 用户认证系统

**JWT Token 生成**:

```typescript
import { SignJWT } from 'jose';

async function generateToken(userId: number) {
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
  return token;
}
```

**认证流程**:

1. 用户发送手机号 → 服务器发送验证码
2. 用户输入验证码 → 服务器验证
3. 验证成功 → 生成 JWT Token
4. 返回 Token 和用户信息
5. 前端存储 Token → 后续请求携带 Token

#### 5. 状态管理

**Context API**:

```typescript
// AuthContext - 用户认证
export const AuthContext = createContext<AuthContextType>();

// ThemeContext - 主题管理
export const ThemeContext = createContext<ThemeContextType>();
```

**优势**:
- 无需额外依赖
- 简单易用
- 服务端渲染友好

#### 6. API 路由设计

**RESTful API 结构**:

```
/api
├── auth/
│   ├── phone-login      # 手机号登录
│   ├── send-code        # 发送验证码
│   └── wechat-login     # 微信登录
├── materials/
│   ├── route.ts         # CRUD 操作
│   ├── [id]/            # 单个素材操作
│   └── check-upload     # 检查上传状态
├── upload/
│   ├── route.ts         # 单文件上传
│   └── chunk/           # 分块上传
├── project-versions/    # 项目版本管理
└── admin/               # 后台管理
```

**请求验证** (Zod):

```typescript
import { insertMaterialSchema } from '@/db/schema';

const validated = insertMaterialSchema.parse(body);
```

## 💻 开发指南

### 代码规范

- 使用 TypeScript 进行类型检查
- 遵循 ESLint 规则
- 使用 Tailwind CSS 进行样式开发
- 组件命名使用 PascalCase
- 函数命名使用 camelCase

### 调试

**查看日志**:
```bash
# 开发环境日志
tail -f /app/work/logs/bypass/app.log

# 控制台日志（浏览器 DevTools）
```

**调试 API**:
```bash
# 测试登录
curl -X POST http://localhost:5000/api/auth/phone-login \
  -H 'Content-Type: application/json' \
  -d '{"phone":"13800138000","code":"123456"}'
```

### 数据库操作

**运行迁移**:
```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 推送 schema
pnpm drizzle-kit push

# 打开 Drizzle Studio
pnpm drizzle-kit studio
```

**修改 Schema**:
1. 编辑 `src/db/schema.ts`
2. 运行 `pnpm drizzle-kit generate`
3. 检查生成的 SQL
4. 运行 `pnpm drizzle-kit push`

### 添加新功能

#### 1. 添加新的 API 路由

```typescript
// src/app/api/your-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const data = await yourFunction();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // 处理数据
  return NextResponse.json({ success: true });
}
```

#### 2. 添加新的数据表

```typescript
// src/db/schema.ts
export const yourTable = pgTable('your_table', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  // ... 其他字段
});
```

#### 3. 添加新的 3D 材质

```typescript
// src/components/Aquarium3D.tsx
const yourMaterial = useMemo(() => {
  return new THREE.MeshPhysicalMaterial({
    color: 0xhexcode,
    // ... 材质属性
  });
}, []);
```

## 📚 API 文档

### 认证 API

#### 发送验证码

```
POST /api/auth/send-code
Content-Type: application/json

{
  "phone": "13800138000"
}

Response:
{
  "success": true,
  "message": "验证码已发送"
}
```

#### 手机号登录

```
POST /api/auth/phone-login
Content-Type: application/json

{
  "phone": "13800138000",
  "code": "123456"
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "phone": "13800138000",
      "nickname": "用户8000"
    }
  }
}
```

### 素材 API

#### 获取素材列表

```
GET /api/materials?type=plant&limit=20&skip=0

Response:
[
  {
    "id": 1,
    "name": "绿萝",
    "type": "plant",
    "modelKey": "models/plant1.glb",
    "modelUrl": "https://...",
    "thumbnailUrl": "https://...",
    "description": "绿色水草"
  }
]
```

#### 创建素材

```
POST /api/materials
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "新素材",
  "type": "plant",
  "modelKey": "models/new.glb",
  "description": "新添加的水草"
}

Response:
{
  "id": 10,
  "name": "新素材",
  ...
}
```

### 文件上传 API

#### 分块上传

```
POST /api/upload/chunk
Content-Type: multipart/form-data

- file: <chunk_data>
- chunkIndex: 0
- totalChunks: 5
- fileId: "unique-file-id"
- fileName: "model.glb"

Response (分块上传中):
{
  "status": "partial",
  "chunkIndex": 0,
  "uploadedChunks": 1
}

Response (全部完成):
{
  "status": "complete",
  "key": "models/1234567890_model.glb"
}
```

### 项目版本 API

#### 保存版本

```
POST /api/project-versions
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "版本1",
  "length": 200,
  "width": 100,
  "height": 150,
  "glassThickness": 1,
  "waterLevel": 80,
  "items": [...]
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "版本1",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

## ❓ 常见问题

### 1. 端口 5000 被占用

```bash
# 查找占用端口的进程
lsof -i :5000

# 杀死进程
kill -9 <PID>
```

### 2. 数据库连接失败

**检查**:
- 确认 PostgreSQL 正在运行
- 验证 `DATABASE_URL` 配置
- 检查数据库用户权限

### 3. 对象存储上传失败

**检查**:
- 确认 `COZE_BUCKET_ENDPOINT_URL` 正确
- 验证 `COZE_BUCKET_NAME` 存在
- 检查网络连接

### 4. 3D 场景无法渲染

**检查**:
- 浏览器是否支持 WebGL
- 控制台是否有错误信息
- Three.js 版本是否正确

### 5. 主题切换不生效

**检查**:
- 浏览器是否启用 localStorage
- `ThemeProvider` 是否正确包裹应用
- 控制台是否有主题相关错误

## 📝 许可证

本项目采用私有许可证。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题，请通过以下方式联系：

- 提交 Issue
- 发送邮件

---

**祝您使用愉快！**
