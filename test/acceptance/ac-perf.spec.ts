import type { EnrichedTweet } from '~/types'
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MyPlainTweet } from '~/components/tweet/PlainTweet'
import { loadFixture } from '../helpers/load-fixture'

const SCRIPT_SRC_RE = /<script[^>]*src=/

/**
 * test/acceptance/ac-perf.spec.ts
 *
 * AC-PERF-001（阶段二任务 2，review P1-2/P5 性能预算）：截图渲染性能基线 × 回归阈值。
 *
 * 「截图渲染」的服务端可测部分 = plain 渲染路径的 SSR 耗时 + 输出结构；截图等待环节
 * （waitForRenderReady）只等待视口内图片，因此媒体/头像必须懒加载，长链不并发拉取全量图。
 *
 * 基线（2026-08-17 实测，Win 开发机）：15 条长链线程 renderToString 中位 ~20ms（HTML 130KB）、
 * 单推 ~1ms。本 spec 用自校准中位数（5 次）与记录基线做回归对照：绝对兜底 + 基线 × 5 两种阈值。
 * 结构断言与时间无关，为确定性门禁；时间断言为「跑飞回归」检测（非紧预算）。
 */

// 记录基线（AC-screenshot.md AC-PERF-001 同步维护）
const BASELINE_THREAD_MS = 25
const BASELINE_SINGLE_MS = 2
const REGRESSION_RATIO = 5
// 绝对兜底（慢机/CI 冷 JIT 容忍；若想收紧，改这里与 AC 文档同步）
const HARD_CAP_THREAD_MS = 500
const HARD_CAP_SINGLE_MS = 150

// 结构预算
const MAX_THREAD_HTML_CHARS = 1_000_000

const base = loadFixture<EnrichedTweet>('tweets/with-quoted-ja.json')

function cloneWithId(id: string, extraMedia: number): EnrichedTweet {
  const t = JSON.parse(JSON.stringify(base)) as EnrichedTweet
  t.id_str = id
  t.text = `${t.text} (${id})`
  if (extraMedia > 0) {
    t.mediaDetails = Array.from({ length: extraMedia }, (_, i) => ({
      index: i,
      media_url_https: `https://pbs.twimg.com/media/fake-${id}-${i}.jpg`,
      type: 'photo',
      original_info: { width: 1200, height: 800 },
      ext_alt_text: `alt ${i}`,
    })) as EnrichedTweet['mediaDetails']
  }
  return t
}

/** 合成长链线程（15 条，含多图/引推），对齐 AC 文档语义 */
function buildThread(): EnrichedTweet[] {
  return Array.from({ length: 15 }, (_, i) => cloneWithId(`perf-${i}`, i % 3 === 0 ? 4 : 1))
}

function medianMs(fn: () => string): number {
  const runs: number[] = []
  for (let i = 0; i < 5; i++) {
    const t0 = performance.now()
    fn()
    runs.push(performance.now() - t0)
  }
  runs.sort((a, b) => a - b)
  return runs[2]!
}

const thread = buildThread()
const single = cloneWithId('perf-single', 4)

describe('AC-PERF-001: screenshot render baseline x regression threshold (offline)', () => {
  it('long-thread plain render output is structurally bounded and lazy-loads media', () => {
    const html = renderToString(createElement(MyPlainTweet, {
      tweets: thread,
      mainTweetId: 'perf-0',
      enableTranslation: false,
    }))

    // 结构预算：15 条线程 HTML 有界（实测 ~130KB，1MB 兜底）
    expect(html.length).toBeLessThanOrEqual(MAX_THREAD_HTML_CHARS)

    // media 图全部懒加载：所有 <img> 均带 loading="lazy"
    const imgTags = html.match(/<img[^>]*>/g) ?? []
    expect(imgTags.length).toBeGreaterThanOrEqual(15)
    const lazyImgs = imgTags.filter(tag => tag.includes('loading="lazy"'))
    expect(lazyImgs.length).toBe(imgTags.length)

    // 无脚本注入（screenshot 页面只渲染内容，不引入运行时脚本）
    expect(html).not.toMatch(SCRIPT_SRC_RE)
  })

  it('long-thread render time stays within baseline x regression ratio', () => {
    const median = medianMs(() => renderToString(createElement(MyPlainTweet, {
      tweets: thread,
      mainTweetId: 'perf-0',
      enableTranslation: false,
    })))
    const cap = Math.max(HARD_CAP_THREAD_MS, BASELINE_THREAD_MS * REGRESSION_RATIO)
    expect(median).toBeLessThanOrEqual(cap)
  })

  it('single-tweet render time stays within baseline x regression ratio', () => {
    const median = medianMs(() => renderToString(createElement(MyPlainTweet, {
      tweets: [single],
      mainTweetId: 'perf-single',
      enableTranslation: false,
    })))
    const cap = Math.max(HARD_CAP_SINGLE_MS, BASELINE_SINGLE_MS * REGRESSION_RATIO)
    expect(median).toBeLessThanOrEqual(cap)
  })

  it('avatar and media components carry lazy loading attributes (source scan)', () => {
    const mediaSrc = readFile('app/lib/react-tweet/twitter-theme/tweet-media.tsx')
    expect(mediaSrc).toContain('loading="lazy"')
    expect(mediaSrc).toContain('decoding="async"')

    const headerSrc = readFile('app/lib/react-tweet/twitter-theme/tweet-header.tsx')
    expect(headerSrc).toContain('loading="lazy"')
  })
})

function readFile(rel: string): string {
  return fs.readFileSync(path.resolve(import.meta.dirname, '..', '..', rel), 'utf8')
}
