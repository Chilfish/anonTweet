import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const NAMED_STORY_EXPORT_RE = /export const [A-Z]\w*/
const AXE_TEST_MODE_RE = /test:\s*'(todo|error)'/

/**
 * test/acceptance/ac-ui.spec.ts
 *
 * AC-UI-VISION-001 / AC-UI-A11Y-001（评审 review-2026-08-19 P1-2，阶段二主线）：
 * - AC-UI-VISION-001：每个被使用的组件都有 Storybook story —— 盘点 tweet 目录
 *   评审清单 14 组件逐一核对 story 文件存在且非空（离线静态检查）
 * - AC-UI-A11Y-001：a11y 基线配置 + 已知违规修复 —— addon 注册 / axe 配置 /
 *   Trending 主图 alt 去重 / 头像 alt 空 / 图标按钮可访问名（源码级断言）
 *
 * 说明：story 的视觉/AXE 实测属于视觉基线任务（chromatic 或本地 build-storybook +
 * 截图 diff，review 阶段二 item 4，待 owner 定形态）；本 AC 先落地可离线自动化的部分。
 */

const root = path.resolve(import.meta.dirname, '..', '..')
const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8')
const readdir = (rel: string) => fs.readdirSync(path.join(root, rel))

// 评审清单：tweet 目录 14 个核心组件（review-2026-08-19 §4 阶段二 item 1）
const TWEET_COMPONENTS = [
  'TweetCard',
  'TrendingCard',
  'TweetHeader',
  'TweetTextBody',
  'TweetMediaAlt',
  'TweetOptionsMenu',
  'PlainTweet',
  'TweetNode',
  'SelectableTweetWrapper',
  'TweetInputForm',
  'CommentBranch',
  'ThreadLine',
  'FilterUnrelatedToggle',
  'AIVisionBlock',
] as const

// ins 目录全部组件（index.ts 为 barrel 不算组件；InstagramPostCard 等 6 个由
// InstagramPostCard.stories.tsx 覆盖，其余 8 个由 2026-08-19 新增 stories 补齐）
const INS_COMPONENTS = [
  'InstagramPostCard',
  'IGActionBar',
  'IGCaption',
  'IGCardHeader',
  'IGHeader',
  'IGMediaGrid',
  'IGMusicInfo',
  'IGOptionsMenu',
  'IGPostSkeleton',
  'IGScreenshotButton',
  'IGTranslateDialog',
  'IGTranslateToggle',
  'InsLogo',
  'PlainIGPost',
] as const

// translation 在用目录（AltEditorComponents / EditorComponents 是内部部件，由
// TranslationEditor / AltTranslationEditor story 透出，不单独计）
const TRANSLATION_IN_USE = [
  'AIErrorDetail',
  'AIVisionEditorDialog',
  'AltTranslationEditor',
  'BackButton',
  'DictionaryViewer',
  'DownloadMedia',
  'SaveAsImageButton',
  'ToggleTransButton',
  'TranslationDisplay',
  'TranslationEditor',
] as const

// settings 在用目录（SettingsPanel 等 4 个由 Settings.stories.tsx 覆盖）
const SETTINGS_IN_USE = [
  'AITranslationSettings',
  'AIVisionSettings',
  'GeneralSettings',
  'SettingsPanel',
  'SettingsUI',
  'ThemeSwitcher',
  'SeparatorTemplateManager',
  'TranslationDictionaryManager',
] as const

// ui 在用原语（「被使用即覆盖」口径：app 内被导入使用的组件）
const UI_IN_USE = [
  'alert',
  'avatar',
  'badge',
  'button',
  'card',
  'checkbox',
  'dialog',
  'dropdown-menu',
  'empty',
  'input',
  'label',
  'media',
  'popover',
  'preview-card',
  'scroll-area',
  'select',
  'separator',
  'skeleton',
  'spinner',
  'switch',
  'toggle',
  'tooltip',
] as const

const STORY_FILES_CACHE = {
  names: null as string[] | null,
  content: '' as string,
}

function storyFiles(): { names: string[], content: string } {
  if (!STORY_FILES_CACHE.names) {
    const names = readdir('app/stories').filter(f => f.endsWith('.stories.tsx'))
    const content = names.map(f => read(`app/stories/${f}`)).join('\n')
    STORY_FILES_CACHE.names = names
    STORY_FILES_CACHE.content = content
  }
  return { names: STORY_FILES_CACHE.names, content: STORY_FILES_CACHE.content }
}

function expectCovered(names: readonly string[], scope: string) {
  const issues: string[] = []
  for (const name of names) {
    const fileExists = storyFiles().names.includes(`${name}.stories.tsx`)
    const imported = new RegExp(`import\\s*\\{?[^;{]*\\b${name}\\b`, 'm').test(storyFiles().content)
    if (!fileExists && !imported) {
      issues.push(`${scope}/${name} has no story file and is not rendered by any story`)
    }
  }
  expect(issues, [scope, ...issues].join('\n')).toEqual([])
}

describe('AC-UI-VISION-001: every used component has a story (P1-2)', () => {
  it('tweet directory contains at least the 14 core component files', () => {
    const files = readdir('app/components/tweet')
    for (const name of TWEET_COMPONENTS) {
      expect(files, `missing component file ${name}.tsx`).toContain(`${name}.tsx`)
    }
  })

  it('each of the 14 tweet components has a non-empty story file', () => {
    const stories = new Set(storyFiles().names)
    for (const name of TWEET_COMPONENTS) {
      const storyFile = `${name}.stories.tsx`
      expect(stories, `missing story ${storyFile}`).toContain(storyFile)
      const content = read(`app/stories/${storyFile}`)
      expect(content.trim(), `${storyFile} should not be empty`).not.toBe('')
      // 每个 story 至少 export 一个具名场景
      expect(content, `${storyFile} should export at least one named story`).toMatch(NAMED_STORY_EXPORT_RE)
    }
  })

  it('every ins component is covered by a story (file or rendered in a bundle)', () => {
    expectCovered(INS_COMPONENTS, 'ins')
  })

  it('every in-use translation component is covered by a story', () => {
    expectCovered(TRANSLATION_IN_USE, 'translation')
  })

  it('every in-use settings component is covered by a story', () => {
    expectCovered(SETTINGS_IN_USE, 'settings')
  })

  it('every used ui primitive is covered by a story (bundle ui-primitives)', () => {
    expectCovered(UI_IN_USE, 'ui')
  })

  it('total story files grew from 4 to at least 18', () => {
    const storyFiles = readdir('app/stories').filter(f => f.endsWith('.stories.tsx'))
    expect(storyFiles.length).toBeGreaterThanOrEqual(18)
  })
})

describe('AC-UI-A11Y-001: a11y baseline configured + known violations fixed (P1-2)', () => {
  it('a11y addon is registered in storybook main', () => {
    const main = read('.storybook/main.ts')
    expect(main).toContain('@storybook/addon-a11y')
    expect(main).toContain('stories: [')
  })

  it('preview configures axe checks (test todo or error)', () => {
    const preview = read('.storybook/preview.tsx')
    expect(preview).toContain('a11y:')
    expect(preview).toMatch(AXE_TEST_MODE_RE)
  })

  it('trending main image is decorative (alt empty) so h3 title is the single accessible name', () => {
    const trending = read('app/components/tweet/TrendingCard.tsx')
    expect(trending).toContain('alt=""')
    expect(trending).toContain('line-clamp-3') // h3 标题仍在
  })

  it('avatar images are decorative (alt empty, hidden from screen readers)', () => {
    const trending = read('app/components/tweet/TrendingCard.tsx')
    // 源码层：主图 1 处 + 头像模板 1 处 alt=""（运行时该 map 渲染 3 个头像，
    // 渲染层总数 >= 4 由 card-render.spec.ts AC-CARD-005 断言 HTML 输出）
    const altEmptyCount = (trending.match(/alt=""/g) ?? []).length
    expect(altEmptyCount).toBeGreaterThanOrEqual(2)
  })

  it('icon-only buttons carry accessible names (sr-only text)', () => {
    const optionsMenu = read('app/components/tweet/TweetOptionsMenu.tsx')
    expect(optionsMenu).toContain('sr-only')
    const vision = read('app/components/tweet/AIVisionBlock.tsx')
    expect(vision).toContain('sr-only')
  })
})
