/**
 * 服务端 AI 调用超时（review P1-2 / AC-DECOUPLE-002）。
 *
 * LLM 调用无超时会在 Serverless 上无限叠加超时与计费；max 档思考预算
 * （project-architecture.md「budget 32768」）耗时可达分钟级，默认 120s。
 * 默认值可通过环境变量 `AI_TRANSLATION_TIMEOUT_MS`（毫秒）覆盖。
 *
 * 浏览器直连模式（`aiRequestMode = 'browser'`）复用同一份翻译管线，因此本模块
 * 必须同构：浏览器里没有 `process.env`，回退默认 120s（AbortSignal.timeout 浏览器可用）。
 */
const DEFAULT_AI_TIMEOUT_MS = 120_000

function resolveTimeoutMs(): number {
  if (typeof process === 'undefined' || !process.env)
    return DEFAULT_AI_TIMEOUT_MS
  return Number(process.env.AI_TRANSLATION_TIMEOUT_MS) || DEFAULT_AI_TIMEOUT_MS
}

export const AI_TRANSLATION_TIMEOUT_MS = resolveTimeoutMs()

/** 为单次 LLM 调用创建带超时的 abort signal（每次调用独立计时，重试重新起算）。 */
export function createAITranslationAbortSignal(timeoutMs: number = AI_TRANSLATION_TIMEOUT_MS): AbortSignal {
  return AbortSignal.timeout(timeoutMs)
}
