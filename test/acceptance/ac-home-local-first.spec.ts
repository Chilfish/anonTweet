/**
 * test/acceptance/ac-home-local-first.spec.ts
 *
 * AC-HOME-006：详情页本地优先读取；截图 / 翻译保存回写本地快照；
 * search / list / timeline 不写本地缓存。
 */
import { describe, expect, it } from 'vitest'
import { readProjectFile } from '../helpers/read-project-file'

function source(rel: string): string {
  const content = readProjectFile(rel)
  expect(content, `${rel} should exist`).not.toBeNull()
  return content!
}

describe('AC-HOME-006: local-first detail cache and write boundary', () => {
  it('reads tweet / article / IG detail pages from snapshots before the API', () => {
    const tweet = source('app/routes/tweet.tsx')
    expect(tweet).toContain('clientLoader')
    expect(tweet).toContain('loadTweetSnapshot')
    expect(tweet).toContain('restoreTweetSnapshot')
    expect(tweet).toContain('usePersistSnapshot')

    const article = source('app/routes/article.tsx')
    expect(article).toContain('clientLoader')
    expect(article).toContain('loadTweetSnapshot')

    const ig = source('app/routes/ins.tsx')
    expect(ig).toContain('loadIgSnapshot')
    expect(ig).toContain('usePersistSnapshot')
  })

  it('keeps search, list and timeline out of the local detail cache', () => {
    for (const rel of [
      'app/routes/search.tsx',
      'app/routes/list.tsx',
    ]) {
      const content = source(rel)
      expect(content).not.toContain('usePersistSnapshot')
      expect(content).not.toContain('putSnapshot')
      expect(content).not.toContain('recordVisited')
    }

    for (const rel of [
      'app/routes/api/tweet/search.ts',
      'app/routes/api/tweet/list.ts',
      'app/routes/api/user/timeline.ts',
    ]) {
      const content = source(rel)
      expect(content).not.toContain('insertToTweetDB')
      expect(content).not.toContain('setLocalCache')
      expect(content).not.toContain('putSnapshot')
      expect(content).not.toContain('recordVisited')
    }
  })

  it('flushes the local snapshot after screenshots and translation saves', () => {
    for (const rel of [
      'app/hooks/use-screenshot-action.ts',
      'app/hooks/use-ig-screenshot-action.ts',
      'app/hooks/use-translation-editor-logic.ts',
      'app/hooks/use-alt-translation-logic.ts',
      'app/hooks/use-auto-translate-article.ts',
    ]) {
      expect(source(rel), `${rel} should flush snapshot`).toContain('flushSnapshot')
    }
  })

  it('does not use a TTL to reject local snapshots', () => {
    const restore = source('app/lib/snapshot-restore.ts')
    expect(restore).not.toContain('isSnapshotFresh')
    expect(restore).not.toContain('SNAPSHOT_TTL')
  })
})
