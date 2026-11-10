import type { Options } from 'modern-screenshot'

/**
 * modern-screenshot 只在用户点击截图时使用。
 * SSR 构建通过 `import.meta.env.SSR` 分支裁掉动态 import，避免把截图库带进
 * Worker bundle；浏览器侧仍按需拆成独立 chunk。
 */
async function loadScreenshot() {
  if (import.meta.env.SSR)
    throw new Error('截图仅在浏览器可用')
  return import('modern-screenshot')
}

export async function capturePng(node: HTMLElement, options: Options) {
  const { domToPng } = await loadScreenshot()
  return domToPng(node, options)
}

export async function captureJpeg(node: HTMLElement, options: Options) {
  const { domToJpeg } = await loadScreenshot()
  return domToJpeg(node, options)
}
