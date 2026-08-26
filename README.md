# Camp Memories

Camp Memories 的源码、部署产物和历史资源集中在本目录：

- `web/`：Vite Web 源码。
- `deploy/`：当前提交到仓库的静态部署产物，对外路径仍为 `/memories`。
- `scripts/`：部署产物校验脚本。
- `legacy/`：只用于追溯的旧 Supabase schema。

仓库根目录的 `worker.js`、`wrangler.toml` 和 `vercel.json` 仍包含 ThinkPad 与 Camp Memories 共用的历史生产部署配置，因此第一期不移动它们。

验证：

```powershell
cd projects/camp-memories/web
npm run lint
npm run build

cd ../../..
python projects/camp-memories/scripts/verify-deploy.py
```
