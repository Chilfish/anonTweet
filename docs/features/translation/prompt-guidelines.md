# AI 提示词维护指南（结构化翻译）

> 更新：2026-11-18
> 适用：`AITranslation.ts`（推文实体）、`article/translate.ts`（按块）、`translateIGCaption.ts`（IG）、`vision/prompts.ts`（识图 / OCR）
> 目的：模型升级（DeepSeek V4、Gemini 3、GPT-5.x、Claude 5.x）后，提示词不要停留在旧模型的“防呆”写法上，减少空 JSON、编造字段、占位符漂移等重复问题。

## 1. 调研得到的共识

| 来源                                      | 对当前的直接影响                                                                                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DeepSeek《JSON Output》                   | JSON 模式只是“尽量合法”：无法识别时会把非 JSON 内容替换成空格，可能返回空 `content`；必须处理空输出并重试                                                        |
| DeepSeek《Thinking Mode》                 | 思考模式默认开启；`temperature` / `frequency_penalty` 在思考模式下无效；翻译、格式化、分类这类任务建议显式关闭思考                                               |
| DeepSeek 提示词实践指南                   | 推荐「角色 → 任务 → 上下文 → 约束 → 输出格式 → 示例」；长上下文后要再次复述任务（task sandwich）；JSON 模式应包含字面量 “json”、示例 schema、合理的 `max_tokens` |
| OpenAI GPT-5.2 Prompting Guide            | 结构化抽取要给出真实 schema、明确区分必填/可选字段；缺失字段用 `null` 或直接省略，不要猜；输出前自检一遍                                                         |
| Anthropic Claude Prompting Best Practices | 清楚、直接、给例子；用“应该怎么做”替代纯否定；新一代模型对过度的 “CRITICAL/MUST” 更敏感，旧提示词需要降噪                                                        |
| 结构化输出实战（AiCredits 等）            | 顶层用对象不要用裸数组；只输出 schema 里的键；校验失败时把错误回灌给模型做有界重试；检查 `finish_reason` 是否 `length`                                           |

关键结论：**只靠“不要多做”不够，可选字段必须写清楚“什么情况下必须省略”，并在输入末尾再提醒一次。**

## 2. 本仓库采用的提示词原则

1. **Schema-first**：输出形状写在系统提示里，并和 `Output.object` 的 zod schema 保持一致；顶层永远是单个对象。
2. **可选字段显式化**：`entityText` 只在 Entity Reference 真的出现 HASHTAG/SYMBOL 占位符时才有意义；没有就整段省略；key 必须逐字复制，禁止自造或使用 `#tag` / `@user` 字面量。
3. **输入末尾复述契约**：user 消息最后再给一段 “Final Reminder”（返回单个 JSON、保留占位符、何时省略 entityText），利用模型对末尾内容的更高权重。
4. **正反例**：对曾经线上出错的形态给出 `Wrong → Right`，比单独一句 “禁止” 更有效。
5. **翻译默认关闭思考**：`deepseekThinkingLevel` 默认 `minimal`；需要更强推理时用户可调到 `high` / `max`。思考关闭后 `temperature` 才真正生效。
6. **容错不阻断**：占位符本体校验失败才重试/报错；`entityText` 这类可选覆盖非法时过滤后继续交付（见 `sanitizeEntityTextOverrides`）。
7. **有界修复循环**：解析失败或校验失败最多重试一次，并把错误原因回灌给模型；仍失败则结构化报出（含 `aiError.type` / `finishReason` / 原始输出）。

## 3. 各链路的契约位置

| 链路           | 系统提示                                    | 末尾复述                                            |
| -------------- | ------------------------------------------- | --------------------------------------------------- |
| 推文实体翻译   | `AITranslation.ts` → `# Output Format`      | user 消息 `# Final Reminder`                        |
| X Article 按块 | `article/translate.ts` → `# Output`         | `Final reminder` 拼在 blocks 输入之后               |
| IG caption     | `translateIGCaption.ts` → `# Output Format` | `Return only the Simplified Chinese translation...` |
| 识图 / OCR     | `vision/prompts.ts` 预设                    | `vision/messages.ts` 最后一条 “只输出 JSON”         |

## 4. 升级模型时的检查清单

1. 先换模型、不改提示词，跑 `bun run test` 与现有 fixture，确认是模型变化还是提示词问题。
2. 若出现空输出 / 解析失败：先看 `aiError.type` 与 `finishReason`；空内容优先怀疑 JSON 模式与 max tokens。
3. 若出现编造字段：检查 schema 是否明确 optional、是否给了反例；优先在末尾复述规则，而不是堆更多全局禁令。
4. 调整思考档位：翻译/OCR 先试 `minimal`；只有质量确实不足再升档。
5. 每次只改一个变量（模型、档位、提示词之一），改完跑单测与线上样本回归。

## 5. 已知失败形态速查

| 症状                                          | 常见原因                                                   | 处理                                                                               |
| --------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NoObjectGeneratedError` + 空 `generatedText` | DeepSeek JSON 模式把非 JSON 输出替换为空格                 | 重试；检查提示词是否含 “json” + 示例；考虑关闭思考                                 |
| `NoObjectGeneratedError` + 有内容             | 字面换行 / 多余花括号 / markdown 围栏                      | 要求转义 `\n`；末尾复述 “单对象、无 markdown”                                      |
| 编造 `entityText` key                         | 可选字段规则不清 / 模型过度补全                            | 明确“无 hashtag/symbol 时整段省略” + 反例；代码侧过滤                              |
| 原文 `#tag` 未被解析成实体                    | 例如 tag 后跟全角空格，X 未切出实体，模型却按 hashtag 补全 | 提示词声明“字面量 `#tag` 只有出现在 Entity Reference 才算实体”；代码侧丢弃非法覆盖 |
| 输出被截断                                    | `finish_reason=length`                                     | 提高输出上限或缩小批大小（文章按块）                                               |
| 占位符缺失/多余                               | 模型重排时改写占位符                                       | 占位符校验 + 一次带错误信息的重试                                                  |

## 6. 参考

- [DeepSeek — JSON Output](https://api-docs.deepseek.com/guides/json_mode/)
- [DeepSeek — Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode/)
- [DeepSeek Prompt Engineering: Patterns, Thinking Mode & JSON](https://deepseekai.guide/tutorials/deepseek-prompt-engineering/)
- [OpenAI — GPT-5.2 Prompting Guide](https://developers.openai.com/cookbook/examples/gpt-5/gpt-5-2_prompting_guide)
- [Anthropic — Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [Structuring DeepSeek API Prompts for Reliable JSON Output](https://aicreditsapi.com/blog/structuring-deepseek-api-prompts-reliable-json-output)
