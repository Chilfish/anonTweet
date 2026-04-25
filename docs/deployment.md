# 部署说明与生产环境准则

本手册旨在指导开发者在不同基础设施环境下稳定交付 `anonTweet`。

## 1. 部署策略 (Deployment Strategies)

### A. Serverless 托管 (Vercel)

针对 Vercel Edge Runtime 优化的默认选型，支持跨地域流量分发。

- **构建预设**: `@vercel/react-router` (由 `VERCEL=1` 环境变量自动触发行内 Preset)。
- **核心配置**: 必须在 Vercel 仪表盘设置 `TWEET_KEYS` 与 `HOSTNAME`。

### B. 自托管容器化/物理机 (Linux/Node/Bun)

适用于需要文件级缓存或特定内网环境的场景。

1. **构建阶段**: `bun run build` (生成 `.react-router/` 产物)。
2. **运行阶段**: `bun run start` (基于 `server/express.js` 的 HTTP 监听层)。
3. **默认端口**: `9080` (可通过 `PORT` 环境变量重定义)。

---

## 2. 存储与缓存层一致性 (Persistence)

- **数据库交互**: 启用 `ENABLE_DB_CACHE` 时，Schema 同步至 PostgreSQL 需执行：
  ```bash
  bun run db:push
  ```
- **文件系统缓存**: 在 Node/Bun 环境下，可启用 `ENABLE_LOCAL_CACHE` 以利用 `cache/` 目录进行物理缓存，但该模式在 Serverless 只读环境下不可行。

---

## 3. 生产环境验收清单 (Smoke Testing)

在正式割接生产流量前，请对以下端点进行逻辑验证：

| 验证维度     | 测试端点                           | 预期行为                                           |
| :----------- | :--------------------------------- | :------------------------------------------------- |
| **基础渲染** | `/tweets/:tweetId`                 | 静态推文卡片与服务端注水 (Hydration) 正常          |
| **无头视图** | `/plain/:tweetId`                  | 渲染最小推文静态片段                               |
| **语义翻译** | `/plain/:tweetId?translation=true` | 返回经过 AI 语义对齐后的 `autoTranslationEntities` |
| **负载均衡** | 日志观察                           | 多 `TWEET_KEYS` 环境下，上游响应分布均匀           |

---

## 4. 故障检测与排查 (Troubleshooting)

### 故障 A: `❌ Invalid environment variables`

- **根本原因**: 环境变量验证器（Zod 或类似实现）拦截了非法的配置注入。
- **对策**: 校验 `DB_URL` 的字符串格式或 `HOSTNAME` 是否包含协议头 (`https://`)。

### 故障 B: 上游速率限制 (429 Too Many Requests)

- **现象**: 推文加载响应延迟或间歇性中断。
- **最佳实践**: 增加 `TWEET_KEYS` 的池化数量；检查 `ENABLE_DB_CACHE` 是否配置，以降低对上游接口的冗余调用。
