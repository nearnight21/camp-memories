# Camp Memories 仓库工作约束

本仓库只承载 Camp Memories Web、历史部署产物和产品专属资料，已经脱离旧 Monorepo。

## 工作范围

- 先阅读仓库根目录 `DEVELOPMENT.md` 和 `docs/ENVIRONMENT-SECRETS.md`。
- 修改文件前按 `DEVELOPMENT.md` 记录的当前分支运行 `scripts/sync-canonical-worktree.ps1`，
  确认工作区干净且与 `origin` 同步。
- 默认只修改本仓库；不要执行历史过滤、重写历史或在归档仓上开发。
- Camp 保持现有 Supabase/R2 数据链路；不得导入 ThinkPad 或 Memorae 源码。
- 路径移动只修复构建、部署、验证和文档路径；保持 `/memories` 公共 URL 和业务行为不变。

## 完成标准

- 运行 Web `npm run lint` 与 `npm run build`。
- 运行部署产物验证脚本。
- 运行 `git diff --check`，并在 CI 与边界脚本落地后运行仓库根目录的边界检查。
- 环境变量只从本地忽略文件、部署机密钥管理或 CI Secret 注入，绝不提交真实值。
