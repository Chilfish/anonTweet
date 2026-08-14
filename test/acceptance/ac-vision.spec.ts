import path from 'node:path'
/**
 * test/acceptance/ac-vision.spec.ts
 *
 * L3 AC 语义层 — Vision 截图/持久化/可见性 source scan（自 verify/modules/vision.verifier.ts
 * 静态 AC 迁移，Phase E）：
 * - AC-VISION-008：截图路由渲染 vision 块（PlainTweet → AIVisionBlock + waitForRenderReady）
 * - AC-VISION-009：save/generate → updateTweetVisionInfo（DB 字段级合并 + localCache）
 * - AC-VISION-010：可见性门控 source scan 部分（纯函数行为已在 test/unit/vision.spec.ts）
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

const PLAIN_TWEET_REL = path.join('app', 'components', 'tweet', 'PlainTweet.tsx')
const VISION_BLOCK_REL = path.join('app', 'components', 'tweet', 'AIVisionBlock.tsx')
const VISION_ROUTE_REL = path.join('app', 'routes', 'api', 'ai', 'vision.ts')
const GET_TWEET_SERVER_REL = path.join('app', 'lib', 'service', 'getTweet.server.ts')
const APPCONFIG_REL = path.join('app', 'lib', 'stores', 'appConfig.ts')
const SETTINGS_REL = path.join('app', 'components', 'settings', 'AIVisionSettings.tsx')
const TWEET_NODE_REL = path.join('app', 'components', 'tweet', 'TweetNode.tsx')

describe('AC-VISION source scan checks', () => {
  it('AC-VISION-008: screenshot route renders vision block', () => {
    const plainTweet = readProjectFile(PLAIN_TWEET_REL) ?? ''
    const visionBlock = readProjectFile(VISION_BLOCK_REL) ?? ''

    expect(plainTweet).toContain('AIVisionBlock')
    expect(visionBlock).toContain('waitForRenderReady')
  })

  it('AC-VISION-009: save/generate persist via updateTweetVisionInfo (DB + localCache)', () => {
    const visionRoute = readProjectFile(VISION_ROUTE_REL) ?? ''
    const getTweetServer = readProjectFile(GET_TWEET_SERVER_REL) ?? ''

    // 1. 路由的 save / generate 都走 updateTweetVisionInfo（不再裸 setLocalCache 丢 DB）
    expect(visionRoute).toContain('updateTweetVisionInfo')
    expect(visionRoute.split('async function handleSave')[1]!).toContain('updateTweetVisionInfo')
    expect(visionRoute.split('async function handleGenerate')[1]!).toContain('updateTweetVisionInfo')

    // 2. helper 双层持久化：DB（db.update）+ localCache（setLocalCache）
    expect(getTweetServer).toContain('export async function updateTweetVisionInfo')
    expect(getTweetServer.split('export async function updateTweetVisionInfo')[1]!).toContain('db.update')
    expect(getTweetServer.split('export async function updateTweetVisionInfo')[1]!).toContain('setLocalCache')
  })

  it('AC-VISION-010: visibility gating wired through components + settings', () => {
    const visionBlock = readProjectFile(VISION_BLOCK_REL) ?? ''
    const appConfig = readProjectFile(APPCONFIG_REL) ?? ''
    const settings = readProjectFile(SETTINGS_REL) ?? ''
    const tweetNode = readProjectFile(TWEET_NODE_REL) ?? ''

    // AIVisionBlock 走 resolveVisionBlockState，含「隐藏」入口与折叠条；弹窗常驻挂载
    expect(visionBlock).toContain('resolveVisionBlockState')
    expect(visionBlock).toContain('隐藏')
    expect(visionBlock).toContain('collapsed')
    expect(visionBlock).toContain('<AIVisionEditorDialog editor={editor} />')
    expect(visionBlock).not.toContain('if (state === \'hidden\')')

    // 入口受设置门控：appConfig showVisionEntry（默认 false）+ 设置开关 + TweetNode 渲染
    expect(appConfig).toContain('showVisionEntry: boolean')
    expect(appConfig).toContain('showVisionEntry: false')
    expect(settings).toContain('showVisionEntry')
    expect(settings).toContain('显示添加入口')
    expect(tweetNode).toContain('setVisionVisibility')
    expect(tweetNode).toContain('initializeEditor')
    expect(tweetNode).toContain('showVisionEntry')
  })
})
