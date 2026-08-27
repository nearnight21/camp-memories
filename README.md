# Camp Memories

这是 Camp Memories 的独立仓库：

- `web/`：Vite Web 源码。
- `deploy/`：当前提交到仓库的静态部署产物，对外路径仍为 `/memories`。
- `scripts/`：部署产物验证和仓库级同步脚本。
- `legacy/`：只用于追溯的旧 Supabase schema。
- `docs/`：开发交接和环境变量清单。

规范分支为 `main`，远端为 `https://github.com/nearnight21/camp-memories`。独立 Vercel、Worker
和 Wrangler 配置将在 Phase 5 的部署阶段重建。

验证：

```powershell
cd web
npm run lint
npm run build

python scripts/verify-deploy.py
```

跨电脑交接前运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-canonical-worktree.ps1
```
