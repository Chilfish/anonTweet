/**
 * 服务端 AI 调用超时（review P1-2 / AC-DECOUPLE-002）。
 *
 * LLM 调用无超时会在 Serverless 上无限叠加超时与计费；max 档思考预算
 * （project-architecture.md「budget 32768」）耗时可达分钟级，默认 120s。
 * 默认值可通过环境变量 `AI_TRANSLATION_TIMEOUT_MS`（毫秒）覆盖。
 *
 * 仅在服务端调用点使用（AITranslation.translateText / translateIGCaption），
 * 不得被客户端 bundle 引用。
 */
export const AI_TRANSLATION_TIMEOUT_MS = Number(process.env.AI_TRANSLATION_TIMEOUT_MS) || 120_000

/** 为单次 LLM 调用创建带超时的 abort signal（每次调用独立计时，重试重新起算）。 */
export function createAITranslationAbortSignal(timeoutMs: number = AI_TRANSLATION_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs)
}
