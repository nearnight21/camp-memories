# Camp Memories 🏕️

露营主题数字剪贴簿 —— 沉浸式软木板体验：宝丽来照片卡片、复古冒险地图、时间轴浏览、过去/现在日记对照、篝火环境音。

Camp Memories 是 ThinkPad 仓库的第二个应用（`/memories`），与 ThinkPad（`/app`）共享同一 Supabase 数据库与账号。

## 技术栈

- React 19 + TypeScript + Vite 6
- Tailwind CSS 4（`@tailwindcss/vite`）+ Framer Motion（`motion`）
- Supabase（Auth + PostgreSQL，与 ThinkPad 共用）
- Cloudflare R2（图片上传，经 Worker 代理）

## 本地开发

```bash
npm install
npm run dev        # Vite dev server（--port=3000）
```

构建产物的 `base` 为 `/memories/`，与 Vercel 部署的子路径一致。

## 环境变量

复制 `.env.example` 为 `.env.local`（如已提供可跳过）：

```
# Supabase 公开配置（前端直接使用，受 RLS 保护）
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key

# Cloudflare R2 Worker（图片上传代理）
# R2_WORKER_URL=https://your-worker.workers.dev
```

前端直接读取这些值（见 `src/supabase.ts`），请与 ThinkPad 的 `app.html` 中配置保持一致。

## 构建并同步产物

```bash
npm run build      # 输出到 dist/
```

将 `dist/` 内容覆盖复制到同一产品目录的 `../deploy/`（部署目录使用构建产物）：

```bash
rm -rf ../deploy/assets && cp -r dist/* ../deploy/
```

## 目录结构

```
src/
├── App.tsx                        # 主应用（认证 + 软木板 + 时间轴）
├── components/
│   ├── AddMemoryDialog.tsx        # 新增记忆对话框
│   ├── AdventureMap.tsx           # 复古 SVG 冒险地图
│   ├── CampfireSynthPlayer.tsx    # 篝火环境音播放器
│   ├── MemoryCard.tsx             # 宝丽来照片卡片
│   └── MemoryDetailPanel.tsx      # 记忆详情面板（日记对照/画廊编辑）
├── lib/audioSynth.ts              # Web Audio 合成器（风声/篝火/蟋蟀，零依赖）
├── data.ts                        # 初始演示数据（INITIAL_MEMORIES）
├── supabase.ts                    # Supabase 客户端 + 上传 + 数据映射
└── types.ts                       # Memory 类型定义
```

## 数据库

依赖 `../legacy/supabase-schema.sql`（memories / future_letters 表 + RLS 策略），在 ThinkPad 的 `../../thinkpad/legacy/supabase-schema.sql` 之后执行。
