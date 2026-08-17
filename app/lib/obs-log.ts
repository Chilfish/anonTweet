/**
 * 可观测性结构化日志（阶段二任务 3，AC-OBS-001）。
 *
 * 统一输出 JSON 行（未封装任何运行环境差异）：`{ ts, event, ...fields }`。
 * 为阶段三缓存规模化提供指标来源（翻译耗时 / 缓存命中率 / RettiwtPool 状态）。
 *
 * 卫生约束：**绝不记录** apiKey / Cookie / baseUrl 等敏感字段；键/ID 只记录尾部摘要。
 */

export type ObsEvent
  = | 'ai.translate' // 推文翻译（AITranslation.translateText）：ms / attempts / ok / model / provider
    | 'ai.translate.ig' // IG caption 翻译（translateIGCaption）：ms / ok
    | 'cache.get' // 本地缓存读取：type / keySuffix / hit / adapter
    | 'pool.rotate' // RettiwtPool 冷却轮换：keySuffix / failStreak / cooldownMs / reason
    | 'pool.exhaust' // RettiwtPool 全部 Key 耗尽：attempts / states

export interface ObsFields {
  [key: string]: string | number | boolean | null | undefined
}

export function obsLog(event: ObsEvent, fields: ObsFields = {}): void {
  // 单行 JSON，便于 log 聚合/采集（Vercel/Vercel 函数日志、自托管 JSON 采集器通用）
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...fields,
  }))
}

/** 敏感字段摘要：key/id 只保留尾部，防日志泄露完整令牌/长 ID */
export function suffix(value: string | undefined | null, len = 10): string {
  if (!value)
    return 'none'
  return value.length <= len ? value : `...${value.slice(-len)}`
}
