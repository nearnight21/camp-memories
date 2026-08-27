# Camp Memories 开发交接

> 最后更新：2026-08-27
>
> 当前阶段：Phase 5「新仓可开发化」。本文件只记录独立 Camp Memories 仓库的状态。

## 当前状态

- 当前迁移暂存分支：`codex/cos-direct-transfer`；创建新 GitHub 远端时切换并固定 `main` 为规范分支。
- 本地过滤仓已完成源码与 Git 历史拆分；当前 `origin` 仍是迁移验证用的只读本地远端。
- 本阶段已建立仓库治理文件、环境变量清单、根忽略规则和同步脚本。
- 新 GitHub 远端、独立 CI、边界检查、Vercel/Worker/Wrangler 配置尚未创建，按后续步骤处理。
- `legacy/supabase-schema.sql` 仍引用旧 ThinkPad schema 提供的 `update_modified_column()` 与
  `set_user_id()`；这是数据库初始化独立性阻塞项，部署阶段需在 Camp 仓内补齐等价定义并验证 RLS。

## 仓库结构

- `web/`：Vite + React Web 源码和公开构建配置。
- `deploy/`：已提交的 `/memories` 静态部署产物。
- `scripts/verify-deploy.py`：部署产物完整性验证。
- `legacy/`：只读追溯用的旧 Supabase schema。
- `docs/ENVIRONMENT-SECRETS.md`：变量名、来源和用途清单，不含真实值。
- `scripts/sync-canonical-worktree.ps1`：跨电脑同步脚本。

## 本地开发与验证

```powershell
npm.cmd ci --prefix web
npm.cmd run lint --prefix web
npm.cmd run build --prefix web
python scripts/verify-deploy.py
git diff --check
```

构建使用 `/memories/` base；更新 `deploy/` 前必须记录构建来源并重新运行部署产物验证。

## 跨电脑同步

工作区干净时运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-canonical-worktree.ps1 `
  -CanonicalBranch codex/cos-direct-transfer
```

脚本默认只允许 `main` 快进到 `origin/main`；切换前可显式传入
`-CanonicalBranch codex/cos-direct-transfer` 做迁移暂存分支验证。本地领先或分叉时停止，
不执行 stash、reset、rebase、cherry-pick 或 push。

## 环境与交接规则

环境变量清单见 [`docs/ENVIRONMENT-SECRETS.md`](docs/ENVIRONMENT-SECRETS.md)。当前源码中的
Supabase 公开配置和 Worker 地址仍是静态公开配置；Phase 5 部署阶段再决定是否改为 Vite 注入，
不得把服务端密钥或 R2 Secret 放入 Web 产物。真实值只通过部署平台变量或 CI Secret 管理。
