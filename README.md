---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 304402203680103d0aef50fb16565ecf5c7c0ffd60f92ea56aeed2ccaf29d2a75c5e0d2d02203e58219974f5cda86f5a47e2b090256dcadbaf1299a062f35f02a61ebadf05bb
    ReservedCode2: 30450220703c7d77d0dfba9652d14f645650bcc64393d932f8521ce25b506dc837e1d4eb022100ae44116e15d8bc98ab8e75a3e8c7aadd6e2cac560007c60cd7ba4c4f55231eb5
---

# 生活日志 (Life Journal)

一个功能完整的个人生活日志与社交互动平台，支持与好友分享生活点滴、实时聊天互动。

## ✨ 功能特色

### 🔐 用户系统
- 用户注册/登录
- 密码找回功能
- 个人资料管理
- 头像上传

### 📝 生活记录
- 文字+图片发布（最多9张）
- 地理位置标记
- 发表时间显示
- 隐私设置（仅好友可见）

### 👥 社交功能
- 好友搜索和管理
- 实时聊天系统
- 帖子评论和点赞
- 好友动态查看

### 📊 个性化功能
- 心情记录器
- 用户统计数据
- 每日格言
- 天气和时间显示

### 🎨 用户体验
- 现代温暖极简设计
- 完全中文化界面
- 响应式设计
- 优雅的动画效果

## 🛠️ 技术栈

### 前端
- **React 18** + TypeScript
- **Vite** 构建工具
- **Tailwind CSS** 样式框架
- **React Router** 路由管理

### 后端
- **Supabase** Backend-as-a-Service
- **PostgreSQL** 数据库
- **Supabase Auth** 用户认证
- **Supabase Storage** 文件存储
- **Supabase Realtime** 实时功能

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 环境配置
1. 复制环境变量文件：
```bash
cp .env.example .env.local
```

2. 配置Supabase环境变量：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 本地开发
```bash
npm run dev
```

### 构建部署
```bash
npm run build
```

## 📦 部署

### Vercel部署（推荐）
1. 连接GitHub仓库到Vercel
2. 设置环境变量
3. 自动部署完成

### 环境变量设置
在Vercel项目设置中添加以下环境变量：
```
VITE_SUPABASE_URL=https://srbhrbkwwmlkkrivbvby.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyYmhyYmt3d21sa2tyaXZidmJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5NDIwOTUsImV4cCI6MjA4MzUxODA5NX0.w5f-U3pzNpuuq-35ElllfgVl1Ogq8n7Ttct0ESxZ-vI
```

### 自定义域名绑定
1. 在Vercel项目设置中添加域名 `www.fuxk.indevs.in`
2. 配置DNS CNAME记录指向Vercel
3. SSL证书自动配置

## 📁 项目结构

```
src/
├── components/     # 公共组件
├── pages/         # 页面组件
├── hooks/         # 自定义Hook
├── utils/         # 工具函数
├── lib/           # 第三方库配置
├── types/         # TypeScript类型
└── styles/        # 样式文件
```

## 🔧 配置说明

### Supabase配置
项目使用Supabase作为后端服务，包含完整的数据表结构和RLS策略。

### 环境变量
- `VITE_SUPABASE_URL`: Supabase项目URL
- `VITE_SUPABASE_ANON_KEY`: Supabase匿名密钥

## 📊 数据库设计

### 主要数据表
- `profiles` - 用户资料
- `posts` - 生活记录
- `friendships` - 好友关系
- `comments` - 评论系统
- `messages` - 聊天消息
- `moods` - 心情记录
- `likes` - 点赞记录

## 🎯 功能规划

### 已完成
- ✅ 基础用户系统
- ✅ 生活记录发布
- ✅ 社交互动功能
- ✅ 移动端适配
- ✅ 中文本地化

### 计划功能
- 📅 日历视图
- 📷 图片编辑功能
- 🎵 音频记录
- 📍 地点收藏
- 🔔 推送通知

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

感谢以下开源项目：
- React
- Vite
- Tailwind CSS
- Supabase
- React Router

---

**生活日志** - 记录美好生活，分享精彩时光 🌟
