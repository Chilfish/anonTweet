# DeepSeek Provider：官方规范与仓库实现

> 对齐时间：2026-11-18
> 官方文档：<https://api-docs.deepseek.com/>（Models & Pricing / Thinking Mode）
> AI SDK：<https://ai-sdk.dev/providers/ai-sdk-providers/deepseek>（`@ai-sdk/deepseek` v3.x / AI SDK v7）

## 1. 官方模型现状

| 模型              | 实际版本            | 上下文 | 最大输出 | 图片输入 | 思考模式         |
| ----------------- | ------------------- | ------ | -------- | -------- | ---------------- |
| `deepseek-flash`  | DeepSeek-V4.1-Flash | 1M     | 384K     | ✅       | 默认开启，可关闭 |
| `deepseek-v4-pro` | DeepSeek-V4-Pro     | 1M     | 384K     | ❌       | 默认开启，可关闭 |

- 模型名使用 `deepseek-flash`。`deepseek-v4-flash`、`deepseek-v4-flash-vision-exp` 仍被接受，但对应模型已退役，请求由 V4.1-Flash 承接并按 Flash 计费。
- `deepseek-chat` / `deepseek-reasoner` 已于 2026-07-24 退役，不再使用。
- Base URL（OpenAI 格式）：`https://api.deepseek.com`；Anthropic 格式：`https://api.deepseek.com/anthropic`。
- 能力：JSON Output、Tool Calls、Responses API、Anthropic API、Vision（仅 flash）。

## 2. 本仓库实现（`app/lib/providers/deepseek.ts`）

**不使用** `@ai-sdk/deepseek`，而是用 `@ai-sdk/openai-compatible` 的
`createOpenAICompatible({ name: 'deepseek', baseURL, apiKey })`：

- DeepSeek 官方 API 与 OpenCode Zen/Go 等第三方中转均为 OpenAI 兼容协议；
- openai-compatible 只发送标准 `reasoning_effort`，兼容面更广；
- 「关闭思考」与「采样参数」通过 `transformRequestBody` 在请求体层收口。

`transformRequestBody` 的三条规则：

1. **关闭思考**：未显式设置 `thinking` 且没有 `reasoning_effort` 时，补发
   `thinking: { type: 'disabled' }`（OpenAI 兼容协议没有标准 off 开关）。
2. **思考开启时省略采样参数**：官方语义下 `temperature` / `top_p` 不生效
   （`@ai-sdk/deepseek` 也会直接省略），这里主动移除，避免把无效参数当成生效配置。
3. **不覆盖显式配置**：调用方显式给出 `thinking: { type: 'enabled' | 'disabled' }` 时原样透传。

思考强度映射（与官方 `reasoning_effort` 对齐）：

| `ThinkingLevel`           | 请求体                                                      |
| ------------------------- | ----------------------------------------------------------- |
| `minimal`                 | `thinking: { type: 'disabled' }`（不发送 reasoning_effort） |
| `low` / `medium` / `high` | `thinking` 默认即可，发送 `reasoning_effort: 'high'`        |
| `max`                     | `reasoning_effort: 'max'`                                   |

> 官方仅接受 `high` / `max`；`low` / `medium` 由服务端映射为 `high`，`xhigh` 映射为 `max`。

## 3. 参数可配置性审计

### Provider 级设置（`createOpenAICompatible`）

| 参数                        | 是否暴露给用户 | 当前处理                                                   |
| --------------------------- | -------------- | ---------------------------------------------------------- |
| `apiKey`                    | ✅ 已暴露      | 设置面板「API Key」                                        |
| `baseURL`                   | ✅ 已暴露      | 设置面板「Base URL」；留空回退 `https://api.deepseek.com`  |
| `name`                      | ❌ 内部        | 固定 `'deepseek'`，决定 providerOptions 的键与转发命名空间 |
| `headers`                   | ❌ 硬编码      | 默认无（代理 / 自定义认证扩展用，暂无需求）                |
| `fetch`                     | ❌ 硬编码      | 默认全局 fetch（测试 / 中间件用）                          |
| `queryParams`               | ❌ 硬编码      | 默认无（附加 query string）                                |
| `includeUsage`              | ❌ 硬编码      | 默认 false（流式 usage 开销）                              |
| `supportsStructuredOutputs` | ❌ 硬编码      | 默认 false → 结构化输出退化为 `json_object`                |
| `transformRequestBody`      | ❌ 内部        | 关闭思考兜底 + 思考开启时移除 `temperature` / `top_p`      |

### Chat 模型级选项（providerOptions 传入）

| 选项                       | 请求体字段          | 是否暴露  | 当前值                                                 |
| -------------------------- | ------------------- | --------- | ------------------------------------------------------ |
| `thinking`                 | `thinking.type`     | ✅ 间接   | `minimal` 时显式 `disabled`；其余依赖默认 `enabled`    |
| `reasoningEffort`          | `reasoning_effort`  | ✅ 已暴露 | `high` / `max`                                         |
| `strictJsonSchema`         | 仅 json_schema 模式 | ❌ 硬编码 | 默认 true；因 `supportsStructuredOutputs=false` 不生效 |
| `user`                     | `user`              | ❌ 未用   | —                                                      |
| `textVerbosity`            | `verbosity`         | ❌ 未用   | —                                                      |
| `logprobs` / `topLogprobs` | 同名                | ❌ 未用   | —                                                      |

### AI SDK 标准 callOptions（`generateText` 直传）

| 选项                                   | 请求体字段        | 是否暴露  | 当前值 / 行为                                                                        |
| -------------------------------------- | ----------------- | --------- | ------------------------------------------------------------------------------------ |
| `temperature`                          | `temperature`     | ❌ 硬编码 | 推文 0.5 / IG 0.5（重试 0.6）/ 文章 0.4 / 视觉 0.2 / ai-test 1；**思考开启时被移除** |
| `maxTokens`                            | `max_tokens`      | ❌ 未传   | undefined（走模型默认，最大 384K）                                                   |
| `topP`                                 | `top_p`           | ❌ 未传   | undefined；思考开启时同样不生效                                                      |
| `frequencyPenalty` / `presencePenalty` | 同名              | ❌ 未传   | DeepSeek 已弃用，不发送                                                              |
| `stopSequences`                        | `stop`            | ❌ 未传   | undefined                                                                            |
| `responseFormat`                       | `response_format` | ✅ 自动   | 由 `Output.object` 生成（`json_object`）                                             |
| `seed`                                 | `seed`            | ❌ 未传   | undefined                                                                            |

**结论**：保持暴露 `model` / `apiKey` / `baseURL` / 思考强度即可。翻译场景的
`temperature` 固定值已取得稳定质量，且思考开启时本来就不生效，不新增配置面。

## 4. 各链路的一致性

- 推文实体翻译（`AITranslation.ts`）、文章按块翻译（`article/translate.ts`）、
  IG caption（`translateIGCaption.ts`）、视觉生成（`vision/describeImages.ts`）、
  OCR 翻译（`vision/translateOCR.ts`）、连通性测试（`ai-test.ts`）都会按模型注册表
  下发 `buildProviderOptions()`，并带 `AbortSignal.timeout`（AC-DECOUPLE-002）。
- 默认引擎与视觉默认均为 DeepSeek Flash；`deepseekThinkingLevel` 默认 `minimal`（关闭思考）——翻译 / OCR 属于短文本结构化任务，官方建议关闭思考，temperature 也才生效。
- 提示词规范（schema-first、可选字段与末尾复述契约）见 [`prompt-guidelines.md`](./prompt-guidelines.md)。
- 截图 SSR 在配置 `DEEPSEEK_API_KEY` 时优先用 `DEEPSEEK_MODEL=deepseek-flash`，未配置时回退 Gemini。
- 浏览器直连模式（`aiRequestMode = 'browser'`）复用同一套管线；DeepSeek 官方端点
  是否允许浏览器跨域（CORS）需以实际部署为准，被拦截时切回服务端中继。

## 5. 参考

- [DeepSeek Models & Pricing](https://api-docs.deepseek.com/quick_start/pricing)
- [DeepSeek Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode)
- [DeepSeek Vision](https://api-docs.deepseek.com/guides/vision)
- [AI SDK DeepSeek Provider](https://ai-sdk.dev/providers/ai-sdk-providers/deepseek)
