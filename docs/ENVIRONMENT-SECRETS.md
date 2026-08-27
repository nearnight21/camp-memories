# Camp Memories Environment / Secrets Inventory

> 盘点日期：2026-08-27
>
> 范围：本仓当前 `main` 的 Web、静态部署产物与已提交部署配置。
>
> 本文件只记录变量名、来源和用途，不记录真实值。

## 结论

- Camp 当前没有生效的应用 `.env` 契约。
- Supabase URL、Supabase 浏览器 publishable/anon key 与 R2 上传 Worker URL 直接写在 `web/src/supabase.ts`，`web/.env.example` 中原有的同名变量不会被代码读取。
- 这些浏览器可见值不是服务端 Secret，但其项目归属、权限边界和轮换仍必须由 Camp 独立负责。
- Worker 源码、Wrangler、Vercel 配置与 GitHub Actions workflow 都不在本仓，因此目前无法从本仓完成独立部署或核对 Worker Secret。

[`web/.env.example`](../web/.env.example) 现只作为“当前没有有效 env 输入”的显式标记，避免开发者误以为复制文件后会改变应用配置。后续部署隔离任务必须先建立产品前缀明确的 Vite 变量，再把这里改成真正可执行的模板。

## 当前有效配置

| 配置 | 当前读取方式 | 敏感级别 | Local 来源 | CI 来源 | Production 来源 | 结论 |
| --- | --- | --- | --- | --- | --- | --- |
| Supabase Project URL | `web/src/supabase.ts` 静态常量 | 公开配置 | Git 源码 | 同一源码 | 构建产物内嵌 | 必须迁为 Camp 自己的构建变量。 |
| Supabase publishable/anon key | `web/src/supabase.ts` 静态常量 | 浏览器凭据 | Git 源码 | 同一源码 | 构建产物内嵌 | 可被浏览器看到，但必须只授予受 RLS 保护的最小权限。 |
| R2 upload Worker URL | `web/src/supabase.ts` 静态常量 | 公开配置 | Git 源码 | 同一源码 | 构建产物内嵌 | Worker 不在本仓，是当前部署隔离阻塞项。 |
| `DISABLE_HMR` | `web/vite.config.ts` 的 Node 进程环境 | 本地配置 | 启动 Vite 前设置的 shell 环境 | 不需要 | 不需要 | 只控制开发期 HMR/监听，不进入浏览器业务配置。 |

以下名称曾出现在 `web/.env.example`，但当前源码不读取它们：

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `R2_WORKER_URL`

Vite 客户端变量必须有显式的客户端前缀并由代码读取；在此之前，不应把真实值写入 `.env.local` 并假设已经生效。

## 不允许进入 Web 的 Secret

以下值不得出现在本仓源码、`.env.example`、Vite 环境、静态部署产物或浏览器日志中：

- Supabase service role key、数据库连接串和管理员账号凭据；
- R2 Access Key ID、R2 Secret Access Key、Cloudflare API Token；
- Vercel Token、GitHub token 或任何可写部署凭据；
- 其他产品的数据库、COS、Worker、域名验证或服务端凭据。

## 环境来源规则

| 环境 | 允许来源 | 禁止项 | 当前状态 |
| --- | --- | --- | --- |
| Local | 最终应由 `web/.env.local` 提供 Camp 的浏览器公开配置；`DISABLE_HMR` 由启动进程环境提供 | ThinkPad/Memorae 的 env；服务端 Secret | 应用变量尚未接线，当前仍读静态常量。 |
| CI | 最终使用 GitHub Actions Variables 保存公开构建配置；普通构建不需要生产 Secret | 把 service role、数据库、R2 长期密钥放入前端 build | 本仓没有 workflow。 |
| Production | 最终使用 Camp 自己的 Vercel/静态托管环境变量；Worker Secret 留在 Camp 自己的 Cloudflare Worker | 继承其他产品的 Vercel/Worker/Supabase 配置 | 独立 Vercel、Worker、Wrangler 均未建立。 |

## 部署控制面变量

以下变量不是浏览器运行时输入，只在未来的独立部署 workflow 或平台连接中使用：

| 名称 | 类型 | 目标来源 | 当前状态 |
| --- | --- | --- | --- |
| `VERCEL_TOKEN` | Secret | GitHub Actions Secret 或人工部署会话 | 未配置，且本仓无 workflow。 |
| `VERCEL_ORG_ID` | 配置 | Vercel 项目元数据或 GitHub Variable | 未配置。 |
| `VERCEL_PROJECT_ID` | 配置 | Camp 专属 Vercel 项目元数据或 GitHub Variable | 未配置。 |
| `CLOUDFLARE_API_TOKEN` | Secret | GitHub Actions Secret | 未配置；只能授权 Camp Worker 的最小部署范围。 |
| `CLOUDFLARE_ACCOUNT_ID` | 敏感配置 | GitHub Variable 或 Wrangler 非 Secret 配置 | 未配置。 |

Worker 自己需要哪些 bindings、vars 和 secrets，必须在 Worker 源码及 Wrangler 配置归入本仓后重新盘点；现在不能从外部旧 Worker 反推并固化。

## 已确认的隔离阻塞项

这些是后续“部署隔离”任务的输入，本轮不修改运行逻辑：

1. `web/src/supabase.ts` 内嵌三项服务配置，现有 `.env.example` 不生效。
2. Web 直接调用一个仓外 Worker；本仓没有 Worker 源码、bindings、secrets 清单或 Wrangler 配置。
3. 本仓没有 Vercel 配置和 GitHub Actions workflow。
4. `legacy/supabase-schema.sql` 仍依赖旧 ThinkPad schema 的触发器函数，不能从空项目独立初始化。
5. `web/README.md` 仍描述与 ThinkPad 共用数据库、账号和配置；这是当前事实/历史说明，不是目标部署边界。
6. `deploy/` 是已提交的静态产物，重新构建后必须检查其中只包含本次 Camp 注入的公开端点。

隔离完成的验收标准是：fresh clone 注入 Camp 自己的公开配置即可构建并启动；上传、数据库和托管都只访问 Camp 自己的资源；仓库与产物不读取或引用另外两个产品的文件、变量或服务账号。

## 凭据处理规则

- 浏览器 publishable/anon key 仍要受 RLS、来源限制与独立项目边界保护。
- `.env.example` 只能包含空值或明显无效的示例值，不能复制当前线上值。
- Cloudflare/Vercel/GitHub Secret 只存在于对应平台，不写回 Git。
- 任何密钥轮换只记录变量名、完成时间和责任环境，不记录值。
