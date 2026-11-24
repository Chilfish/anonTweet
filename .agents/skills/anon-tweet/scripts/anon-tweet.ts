#!/usr/bin/env bun
/**
 * anon-tweet.ts — anon-tweet BFF 的命令行封装（零依赖，只读接口无需 Key）。
 *
 * 运行：bun scripts/anon-tweet.ts <命令> [参数] [--json]
 * 也可用 Node 22.6+：node --experimental-strip-types scripts/anon-tweet.ts <命令>
 *
 * 为什么不再用 PowerShell：参数解析、UTF-8 输出流和跨平台行为都要各自兜底，
 * 而这里只需要 fetch + 文本渲染。TS 同时能被仓库的 typecheck 覆盖。
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── 类型（只描述渲染需要的字段，其余透传给 --json） ────────────────────────

interface TweetUser {
  name?: string
  screen_name?: string
}

interface TweetArticle {
  title?: string
  format?: string
  blocks?: unknown[]
}

interface Tweet {
  id?: string
  text?: string
  url?: string
  lang?: string
  created_at?: string
  user?: TweetUser
  mediaDetails?: unknown[]
  article?: TweetArticle
}

interface TweetPage {
  tweets?: Tweet[]
  nextCursor?: string | null
}

interface RawUser {
  userName?: string
  fullName?: string
  followersCount?: number
  followingsCount?: number
  statusesCount?: number
  likeCount?: number
  isVerified?: boolean
  createdAt?: string
  location?: string
  description?: string
}

interface IGMedia {
  type?: string
  display_url?: string
  video_url?: string | null
}

interface IGPost {
  id?: string
  url?: string
  username?: string
  fullname?: string
  type?: string
  description?: string
  tags?: string[]
  likes?: number
  captionTranslation?: string
  media?: IGMedia[]
}

interface ErrorBody {
  error?: string
  message?: string
  status?: number
}

interface ApiResult<T> {
  status: number
  body: T | null
  text: string
}

// ─── 基础设施 ──────────────────────────────────────────────────────────────

const DEFAULT_BASE_URL = 'https://anon-tweet.chilfish.top'
const TIMEOUT_MS = 45_000

const USE_COLOR = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR
const paint = (code: string) => (text: string) => USE_COLOR ? `\x1B[${code}m${text}\x1B[0m` : text
const cyan = paint('36')
const gray = paint('90')
const yellow = paint('33')
const red = paint('31')
const green = paint('32')

function skillVersion(): string {
  try {
    const file = fileURLToPath(new URL('../SKILL.md', import.meta.url))
    const match = readFileSync(file, 'utf8').match(/^\s*version:\s*"?(?<version>[\w.-]+)"?\s*$/m)
    return match?.groups?.version ?? 'unknown'
  }
  catch {
    return 'unknown'
  }
}

const USER_AGENT = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) anon-tweet-skill/${skillVersion()}`

// ─── 参数解析 ──────────────────────────────────────────────────────────────

/** 需要读取下一个 token 作为值的开关 */
const VALUE_FLAGS = new Set([
  '--type',
  '--count',
  '--cursor',
  '--manual',
  '--out',
  '--base-url',
  '--api-key',
  '--model',
  '--provider',
  '--thinking',
  '--glossary',
])

interface ParsedArgs {
  positional: string[]
  flags: Map<string, string | true>
}

function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = []
  const flags = new Map<string, string | true>()

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] ?? ''

    if (token === '-h') {
      flags.set('--help', true)
      continue
    }

    const inline = token.match(/^(--[a-z][\d\w-]*)=(.*)$/)
    if (inline) {
      flags.set(inline[1] ?? '', inline[2] ?? '')
      continue
    }

    if (token.startsWith('--')) {
      if (VALUE_FLAGS.has(token)) {
        const next = argv[i + 1]
        if (next === undefined || next.startsWith('--'))
          die(`${token} 缺少值`, 2)
        flags.set(token, next)
        i++
        continue
      }
      flags.set(token, true)
      continue
    }

    positional.push(token)
  }

  return { positional, flags }
}

function flagString(args: ParsedArgs, name: string): string | undefined {
  const value = args.flags.get(name)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// ─── HTTP ──────────────────────────────────────────────────────────────────

function resolveBaseUrl(args: ParsedArgs): string {
  const fromFlag = flagString(args, '--base-url')
  const fromEnv = process.env.ANON_TWEET_BASE_URL?.trim()
  return (fromFlag || fromEnv || DEFAULT_BASE_URL).replace(/\/+$/, '')
}

async function request<T>(
  baseUrl: string,
  path: string,
  init: RequestInit = {},
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers)
  headers.set('User-Agent', USER_AGENT)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type'))
    headers.set('Content-Type', 'application/json; charset=utf-8')

  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  }
  catch (error) {
    die(`请求失败：${error instanceof Error ? error.message : String(error)}\n${baseUrl}${path}`)
  }

  const text = await response.text()
  let body: T | null = null
  try {
    body = text ? JSON.parse(text) as T : null
  }
  catch {
    // 非 JSON（例如代理返回二进制或网关错误页）由调用方按 text 处理
  }

  return { status: response.status, body, text }
}

function isErrorBody(value: unknown): value is ErrorBody {
  return typeof value === 'object'
    && value !== null
    && 'error' in value
}

function assertNoError(result: ApiResult<unknown>, context: string): void {
  const body = result.body
  if (!isErrorBody(body))
    return

  const detail = body.message ? `${body.error ?? 'Request failed'}：${body.message}` : body.error
  die(`${context}（HTTP ${result.status}）\n${detail ?? result.text}`)
}

function die(message: string, code = 1): never {
  process.stderr.write(`${red('✗')} ${message}\n`)
  process.exit(code)
}

// ─── 渲染 ──────────────────────────────────────────────────────────────────

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}

function renderTweet(tweet: Tweet, index = 0): void {
  const handle = tweet.user?.screen_name ? `@${tweet.user.screen_name}` : '?'
  const name = tweet.user?.name ? ` (${tweet.user.name})` : ''
  const label = index > 0 ? `[${index}] ` : ''
  console.log(cyan(`${label}${handle}${name}`))

  if (tweet.created_at || tweet.lang)
    console.log(gray(`    ${tweet.created_at ?? ''}  lang=${tweet.lang ?? '?'}`))

  if (tweet.text)
    console.log(`    ${tweet.text}`)

  if (tweet.url)
    console.log(gray(`    ${tweet.url}`))

  if (tweet.mediaDetails?.length)
    console.log(gray(`    media x${tweet.mediaDetails.length}`))

  if (tweet.article)
    console.log(gray(`    article: ${tweet.article.title ?? '(untitled)'} [${tweet.article.format ?? '?'}]`))

  console.log()
}

function renderTweetPage(page: TweetPage | null, label: string): void {
  const tweets = page?.tweets ?? []
  console.log(cyan(`# ${label}  → ${tweets.length} 条`))

  tweets.forEach((tweet, index) => renderTweet(tweet, index + 1))

  if (page?.nextCursor)
    console.log(yellow(`nextCursor: ${page.nextCursor}`))
  else if (tweets.length > 0)
    console.log(gray('(无更多：nextCursor=null)'))
}

function renderTweetArray(value: Tweet[] | null | ErrorBody, label: string): void {
  if (isErrorBody(value)) {
    die(`${label}失败\n${value.message ?? value.error ?? '未知错误'}`)
  }

  const tweets = value ?? []
  if (tweets.length === 0) {
    console.log(yellow(`未找到推文（${label}）`))
    return
  }

  console.log(cyan(`# ${label}  → ${tweets.length} 条`))
  tweets.forEach((tweet, index) => renderTweet(tweet, index + 1))
}

function renderUser(user: RawUser | null, username: string): void {
  if (!user) {
    console.log(yellow(`无记录（${username}）：/api/user/get 只读 DB 缓存，未缓存时返回 null`))
    return
  }

  console.log(cyan(`@${user.userName ?? username}  ${user.fullName ?? ''}`))
  console.log(`    followers=${user.followersCount ?? '?'}  following=${user.followingsCount ?? '?'}  posts=${user.statusesCount ?? '?'}  likes=${user.likeCount ?? '?'}`)
  console.log(`    verified=${user.isVerified ?? false}  created=${user.createdAt ?? '?'}  location=${user.location ?? '?'}`)
  if (user.description)
    console.log(`    ${user.description}`)
}

function renderIGPosts(posts: IGPost[] | null | ErrorBody, label: string): void {
  if (isErrorBody(posts)) {
    die(`${label}失败\n${posts.message ?? posts.error ?? '未知错误'}`)
  }

  const items = posts ?? []
  if (items.length === 0) {
    console.log(yellow(`空结果（${label}）：未配置 INS_COOKIES 时 IG 接口返回空数组`))
    return
  }

  items.forEach((post, index) => {
    console.log(cyan(`[${index + 1}] @${post.username ?? '?'}  ${post.type ?? '?'}  ${post.url ?? ''}`))
    if (post.tags?.length)
      console.log(gray(`    tags: ${post.tags.join(', ')}`))
    if (typeof post.likes === 'number')
      console.log(gray(`    likes=${post.likes}`))
    if (post.description)
      console.log(`    ${post.description}`)
    if (post.captionTranslation)
      console.log(green(`    translation: ${post.captionTranslation}`))

    for (const media of post.media ?? []) {
      const url = media.video_url || media.display_url || ''
      console.log(gray(`    - [${media.type ?? '?'}] ${url}`))
    }

    console.log()
  })
}

// ─── 命令 ──────────────────────────────────────────────────────────────────

async function cmdSearch(args: ParsedArgs): Promise<void> {
  const query = args.positional[0]
  if (!query)
    die('用法: search "q" [--type latest|top] [--count N] [--cursor C]', 2)

  const params = new URLSearchParams({ q: query })
  const type = flagString(args, '--type')
  const count = flagString(args, '--count')
  const cursor = flagString(args, '--cursor')
  if (type)
    params.set('type', type)
  if (count)
    params.set('count', count)
  if (cursor)
    params.set('cursor', cursor)

  const result = await request<TweetPage>(resolveBaseUrl(args), `/api/tweet/search?${params}`)
  assertNoError(result, '搜索失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderTweetPage(result.body, `搜索: ${query}`)
}

async function cmdGet(args: ParsedArgs): Promise<void> {
  const id = args.positional[0]
  if (!id)
    die('用法: get <tweetId|url>', 2)

  const result = await request<Tweet[] | ErrorBody>(
    resolveBaseUrl(args),
    `/api/tweet/get/${encodeURIComponent(id)}`,
  )
  assertNoError(result, '拉取推文失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderTweetArray(result.body, id)
}

async function cmdReplies(args: ParsedArgs): Promise<void> {
  const id = args.positional[0]
  if (!id)
    die('用法: replies <tweetId> [--cursor C]', 2)

  const cursor = flagString(args, '--cursor')
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  const result = await request<TweetPage>(
    resolveBaseUrl(args),
    `/api/tweet/replies/${encodeURIComponent(id)}${query}`,
  )
  assertNoError(result, '拉取回复失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderTweetPage(result.body, `回复 ${id}`)
}

async function cmdList(args: ParsedArgs): Promise<void> {
  const id = args.positional[0]
  if (!id)
    die('用法: list <listId>', 2)

  const result = await request<Tweet[] | ErrorBody>(
    resolveBaseUrl(args),
    `/api/tweet/list/${encodeURIComponent(id)}`,
  )
  assertNoError(result, '拉取 List 失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderTweetArray(result.body, `List ${id}`)
}

async function cmdUser(args: ParsedArgs): Promise<void> {
  const username = args.positional[0]?.replace(/^@/, '')
  if (!username)
    die('用法: user <username>', 2)

  const result = await request<RawUser | null>(resolveBaseUrl(args), `/api/user/get/${encodeURIComponent(username)}`)
  assertNoError(result, '查询用户失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderUser(result.body, username)
}

async function cmdTimeline(args: ParsedArgs): Promise<void> {
  const username = args.positional[0]?.replace(/^@/, '')
  if (!username)
    die('用法: timeline <username> [--cursor C]', 2)

  const cursor = flagString(args, '--cursor')
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  const result = await request<TweetPage | ErrorBody>(
    resolveBaseUrl(args),
    `/api/user/timeline/${encodeURIComponent(username)}${query}`,
  )

  // 默认关闭时固定 429 + 说明，不当作正常翻页结果
  assertNoError(result, '拉取用户时间线失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderTweetPage(result.body as TweetPage, `@${username} 时间线`)
}

async function cmdIG(args: ParsedArgs): Promise<void> {
  const shortcode = args.positional[0]
  if (!shortcode)
    die('用法: ig <shortcode|url>', 2)

  const result = await request<IGPost[] | ErrorBody>(
    resolveBaseUrl(args),
    `/api/ig/get/${encodeURIComponent(shortcode)}`,
  )
  assertNoError(result, '拉取 IG 帖子失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  renderIGPosts(result.body, shortcode)
}

async function cmdTranslate(args: ParsedArgs): Promise<void> {
  const shortcode = args.positional[0]
  if (!shortcode)
    die('用法: translate <shortcode> [--manual "译文"] [--api-key K --model M]', 2)

  const manual = flagString(args, '--manual')
  const apiKey = flagString(args, '--api-key') ?? process.env.ANON_TWEET_AI_KEY
  const model = flagString(args, '--model') ?? process.env.ANON_TWEET_AI_MODEL
  const provider = flagString(args, '--provider') ?? process.env.ANON_TWEET_AI_PROVIDER ?? 'google'
  const thinking = flagString(args, '--thinking')
  const glossary = flagString(args, '--glossary')

  let payload: Record<string, unknown>
  if (manual) {
    payload = { manualTranslation: manual }
  }
  else {
    if (!apiKey || !model) {
      die(
        'AI 翻译需要 apiKey + model：\n'
        + '  环境变量 ANON_TWEET_AI_KEY / ANON_TWEET_AI_MODEL（推荐）\n'
        + '  或 --api-key/--model 参数；已有译文可用 --manual "..." 跳过 AI',
        2,
      )
    }
    payload = { apiKey, model, provider }
    if (thinking)
      payload.thinkingLevel = thinking
    if (glossary)
      payload.translationGlossary = glossary
  }

  const result = await request<{ captionTranslation?: string } & ErrorBody>(
    resolveBaseUrl(args),
    `/api/ig/translate/${encodeURIComponent(shortcode)}`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
  assertNoError(result, '翻译失败')

  if (args.flags.has('--json'))
    return printJson(result.body)

  console.log(cyan(`# ${shortcode} 翻译`))
  console.log(`    ${result.body?.captionTranslation ?? '(空结果)'}`)
}

async function cmdImage(args: ParsedArgs): Promise<void> {
  const url = args.positional[0]
  if (!url)
    die('用法: image <url> [--out FILE]', 2)

  const baseUrl = resolveBaseUrl(args)
  const target = `${baseUrl}/api/proxy/image?url=${encodeURIComponent(url)}`

  let response: Response
  try {
    response = await fetch(target, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  }
  catch (error) {
    die(`图片代理请求失败：${error instanceof Error ? error.message : String(error)}`)
  }

  if (!response.ok) {
    const text = await response.text()
    die(`图片代理失败（HTTP ${response.status}）\n${text}`)
  }

  const ext = guessImageExtension(url)
  const out = flagString(args, '--out') ?? join(tmpdir(), `anon-tweet-image.${ext}`)
  writeFileSync(out, Buffer.from(await response.arrayBuffer()))
  console.log(green(`已保存: ${out}`))
}

function guessImageExtension(url: string): string {
  try {
    const ext = extname(new URL(url).pathname).replace(/^\./, '').toLowerCase()
    return ext && ext.length <= 5 ? ext : 'jpg'
  }
  catch {
    return 'jpg'
  }
}

// ─── 帮助 ──────────────────────────────────────────────────────────────────

function showHelp(): void {
  console.log(`anon-tweet.ts — anon-tweet API 命令行（读取接口无需 Key）

用法: bun scripts/anon-tweet.ts <命令> [参数] [--json]

命令:
  search    "q" [--type latest|top] [--count N] [--cursor C]   推文搜索（支持 X 高级语法）
  get       <tweetId|url>                                      单条推文（返回数组，可能为空）
  replies   <tweetId> [--cursor C]                             推文回复（cursor 翻页）
  list      <listId>                                           List 时间线
  user      <username>                                         用户资料（DB 缓存，未命中为 null）
  timeline  <username> [--cursor C]                            用户时间线（默认关闭，固定 429）
  ig        <shortcode|url>                                    Instagram 帖子
  translate <shortcode> [--manual "译文"]                      IG caption 翻译（--manual 跳过 AI）
  image     <url> [--out FILE]                                 图片代理（二进制落盘）
  help                                                         显示本帮助

通用开关:
  --json              输出原始 JSON（方便机器解析）
  --base-url <url>    覆盖站点地址（也可用 ANON_TWEET_BASE_URL）

AI 翻译（不传 --manual 时）:
  --api-key / --model / --provider / --thinking / --glossary
  或环境变量 ANON_TWEET_AI_KEY / ANON_TWEET_AI_MODEL / ANON_TWEET_AI_PROVIDER

示例:
  bun scripts/anon-tweet.ts search "from:GeminiApp" --type latest --count 5
  bun scripts/anon-tweet.ts get 2032649981690261684
  bun scripts/anon-tweet.ts user meeeei.gt --json
  bun scripts/anon-tweet.ts ig DWlrun0AVbE
  bun scripts/anon-tweet.ts translate DWlrun0AVbE --manual "中文译文"`)
}

// ─── 入口 ──────────────────────────────────────────────────────────────────

const args = parseArgs(process.argv.slice(2))
const command = args.positional.shift()?.toLowerCase() ?? 'help'

if (args.flags.has('--help') || command === 'help') {
  showHelp()
  process.exit(0)
}

switch (command) {
  case 'search':
    await cmdSearch(args)
    break
  case 'get':
    await cmdGet(args)
    break
  case 'replies':
    await cmdReplies(args)
    break
  case 'list':
    await cmdList(args)
    break
  case 'user':
    await cmdUser(args)
    break
  case 'timeline':
    await cmdTimeline(args)
    break
  case 'ig':
    await cmdIG(args)
    break
  case 'translate':
    await cmdTranslate(args)
    break
  case 'image':
    await cmdImage(args)
    break
  default:
    process.stderr.write(`${red('✗')} 未知命令: ${command}\n\n`)
    showHelp()
    process.exit(2)
}
