import fs from 'node:fs'
import path from 'node:path'
/**
 * test/acceptance/ac-media.spec.ts
 *
 * L3 AC 语义层 — 媒体管线静态检查（自 verify/modules/media.verifier.ts 静态 AC 迁移，Phase D）：
 * AC-MEDIA-004（幂等守卫 + 无双协议 URL）/ 005（统一代理无硬编码 CDN）/ 006（video_url 处理）。
 * AC-MEDIA-001~003（代理端点）在 test/integration/api.media.spec.ts。
 */
import { describe, expect, it } from 'vitest'
import { projectPath, readProjectFile, walkTsFiles } from '../helpers/read-project-file'

const APPCONFIG_REL = path.join('app', 'lib', 'stores', 'appConfig.ts')
const TWEET_CARD_REL = path.join('app', 'components', 'tweet', 'TweetCard.tsx')
const REACT_TWEET_UTILS_REL = path.join('app', 'lib', 'react-tweet', 'utils', 'index.ts')
const TWEET_MEDIA_RELS = [
  path.join('app', 'lib', 'react-tweet', 'twitter-theme', 'tweet-media.tsx'),
  path.join('app', 'lib', 'react-tweet', 'twitter-theme', 'tweet-media-video.tsx'),
]
const IG_MEDIA_GRID_REL = path.join('app', 'components', 'ins', 'IGMediaGrid.tsx')
const IG_TYPES_REL = path.join('app', 'types', 'ins.ts')

/** Restricted Tweet CDNs — screenshot/media components must not hardcode these. */
const RESTRICTED_CDNS = ['pbs.twimg.com', 'video.twimg.com']

describe('AC-MEDIA media pipeline static checks', () => {
  it('AC-MEDIA-004: no double-proxy URL (idempotent guard + no https://https://)', () => {
    const appConfig = readProjectFile(APPCONFIG_REL) ?? ''
    expect(appConfig).toContain('url.startsWith(mediaProxyUrl)')

    const appFiles = walkTsFiles(projectPath('app')).filter(f => !f.includes(`${path.sep}rettiwt-api${path.sep}`))
    const doubleProtocol = appFiles.filter(f => fs.readFileSync(f, 'utf8').includes('https://https://'))
    expect(doubleProtocol).toEqual([])
  })

  it('AC-MEDIA-005: tweet media uses unified proxy (no hardcoded CDN)', () => {
    const appConfig = readProjectFile(APPCONFIG_REL) ?? ''
    const tweetCard = readProjectFile(TWEET_CARD_REL) ?? ''
    const utils = readProjectFile(REACT_TWEET_UTILS_REL) ?? ''

    expect(appConfig).toContain('export function useProxyMedia')
    expect(tweetCard).toContain('proxyMedia')
    expect(utils).toContain('proxyMedia')

    for (const rel of [...TWEET_MEDIA_RELS, TWEET_CARD_REL, REACT_TWEET_UTILS_REL]) {
      const content = readProjectFile(rel) ?? ''
      for (const cdn of RESTRICTED_CDNS)
        expect(content).not.toContain(cdn)
    }
  })

  it('AC-MEDIA-006: video media URL handled (IGMedia.video_url + grid branch)', () => {
    const igTypes = readProjectFile(IG_TYPES_REL) ?? ''
    const grid = readProjectFile(IG_MEDIA_GRID_REL) ?? ''

    expect(igTypes).toContain('video_url')
    expect(grid).toContain('type === \'video\'')
    expect(grid).toContain('media.video_url')
  })
})
