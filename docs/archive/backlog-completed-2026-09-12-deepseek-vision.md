# Backlog 归档：DeepSeek 视觉渠道 + 模型对齐（2026-09-12）

> **状态**：完成
> **来源**：所有者需求「给图片描述功能加个 DeepSeek 渠道；DeepSeek 模型按官方文档更新」
> **依据**：<https://api-docs.deepseek.com/quick_start/pricing>（模型 `deepseek-flash` / `deepseek-v4-pro`；`deepseek-flash` 支持 Vision，`deepseek-v4-pro` 不支持）
> **实施记录**：`docs/development-log/2026-09-12.md`；**AC**：`verify/acceptance-criteria/AC-vision.md` AC-VISION-013

## 交付

- [x] AI 图片描述新增 DeepSeek 渠道：provider 门控 `IMAGE_CAPABLE_PROVIDERS` 放行 `deepseek` + `AIVisionSettings` 接线 provider / Key / BaseURL / 模型
- [x] 模型图片能力标记 `ModelConfig.supportsVision`：`deepseek-flash` 支持图片、`deepseek-v4-pro` 纯文本；视觉模型下拉按此过滤，切换 provider 时回退到首个支持图片的模型
- [x] DeepSeek 模型 slug 对齐官方文档：`deepseek-v4-flash` → `deepseek-flash`、`deepseek v4 pro` → `deepseek-v4-pro`（顺带修 review P1-5 模型名空格）
- [x] persist v6 迁移：旧 slug 自动改写为新 slug，不丢用户设置
- [x] 测试：`test/unit/ai-provider-config.spec.ts`（AC-VISION-013）+ `test/acceptance/ac-vision.spec.ts` source scan；既有 provider 单测字面量同步

## 备注

- `docs/features/translation/deepseek-ai-sdk.md` 的 `deepseek-chat` 示例未改：那是上游 `@ai-sdk/deepseek` SDK 的示例，本仓库不使用该 SDK。
- 真实 API Key 的端到端（`/api/ai-vision` 真跑 DeepSeek）未纳入离线 AC，作为手动验收项。
