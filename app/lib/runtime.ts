/**
 * 运行环境判定。Workers 的 navigator.userAgent 固定为 `Cloudflare-Workers`，
 * 以此区分 workerd 与 Node / Bun（两者也都提供 navigator）。
 */
export const isCloudflareWorker = typeof navigator !== 'undefined'
  && navigator.userAgent === 'Cloudflare-Workers'
