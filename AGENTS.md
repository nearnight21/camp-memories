# Camp Memories 产品边界

本目录只承载 Camp Memories Web、历史部署产物和产品专属资料。

## 工作范围

- 默认只修改本目录。
- 根目录 `worker.js` 与 `wrangler.toml` 是 ThinkPad/Camp 共用的历史部署入口；任务明确涉及它们时先读取 `../../docs/REPOSITORY-OWNERSHIP.md`，保持现有生产行为。
- Camp 保持现有 Supabase/R2 数据链路；不得导入 ThinkPad 或 Memorae 源码。
- 路径移动只修复构建、部署、验证和文档路径；保持 `/memories` 公共 URL 和业务行为不变。

## 完成标准

- 运行 Web `npm run lint` 与 `npm run build`。
- 运行部署产物验证脚本。
- 运行仓库根目录 `node scripts/check-product-boundaries.mjs`。
