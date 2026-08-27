# Environment / Secrets Inventory

> 盘点日期：2026-08-27
>
> 只记录变量名、来源和用途，不记录真实值。公开前端配置与服务端密钥分开管理。

## Web 构建与开发

| 变量 | 类型 | 当前来源 | 用途 |
| --- | --- | --- | --- |
| `SUPABASE_URL` | 公开配置 | 当前 `web/src/supabase.ts` 静态值；`.env.example` 仅作模板 | Supabase 项目 URL。Phase 5 可改为 Vite 注入。 |
| `SUPABASE_ANON_KEY` | 公开配置 | 当前 `web/src/supabase.ts` 静态值；`.env.example` 仅作模板 | Supabase 浏览器 anon/publishable key，受 RLS 保护。 |
| `R2_WORKER_URL` | 公开配置 | 当前 `web/src/supabase.ts` 静态值；`.env.example` 仅作模板 | 图片上传 Worker 公共 URL。 |
| `DISABLE_HMR` | 本地配置 | Vite 进程环境 | AI Studio 等环境中关闭 HMR 和文件监听。 |

## 部署平台

| 变量/Secret | 类型 | 来源 | 用途 |
| --- | --- | --- | --- |
| `VERCEL_TOKEN` | Secret | Vercel/GitHub Actions Secret | 部署或预览授权，尚未在新仓配置。 |
| `VERCEL_ORG_ID` | 配置 | Vercel 项目设置 | Vercel 项目归属，尚未在新仓配置。 |
| `VERCEL_PROJECT_ID` | 配置 | Vercel 项目设置 | Camp Memories 部署项目，尚未在新仓配置。 |
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare/GitHub Actions Secret | Wrangler 部署授权，尚未在新仓配置。 |
| `CLOUDFLARE_ACCOUNT_ID` | 配置 | Cloudflare 项目设置 | Worker 账户标识，尚未在新仓配置。 |

## 数据服务

Supabase URL、anon key 与 R2 Worker URL 属于浏览器可见配置；Supabase service role、数据库连接
串、R2 Access Key/Secret 和任何管理员凭据不应出现在本仓库或前端构建产物中。旧共享 Worker 的
运行时变量会在独立部署配置阶段重新盘点，当前不从 ThinkPad 或 Memorae 仓库继承。

`legacy/supabase-schema.sql` 还依赖旧 ThinkPad schema 中的两个触发器函数。它们不是环境变量，
但会阻止 Camp 从空 Supabase 项目独立初始化，已列入 `DEVELOPMENT.md` 的部署阶段阻塞项。

## 注入规则

- 本地开发：`web/.env.local`，只提交脱敏的 `web/.env.example`。
- CI/部署：使用 Vercel Environment Variables 或 GitHub/Cloudflare Secret，不写入 Git。
- 任何环境变量改名或从静态值迁出都要同步更新本文件和部署验证记录。
