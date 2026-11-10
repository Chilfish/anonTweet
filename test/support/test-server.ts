/**
 * test/support/test-server.ts
 *
 * Server lifecycle manager for running integration tests against a live AnonTweet instance.
 * （由 verify/sdk/test-server.ts 迁移，Phase A；集成层 globalSetup 使用）
 *
 * Usage:
 *   const server = new TestServer()
 *   await server.start()
 *   const client = new AnonTweetClient({ baseUrl: server.url })
 *   // ... run tests ...
 *   await server.stop()
 *
 * Lifecycle rules (S8):
 *   - start() probes the target port first: if an HTTP server already answers,
 *     it is REUSED (managed=false) instead of spawning a second instance.
 *   - stop() only terminates a process this instance spawned; reused servers
 *     are left running.
 *   - A process.on('exit') hook kills the spawned child as a fallback so a
 *     crashed verify run never leaves an orphan dev server behind.
 */

import type { ChildProcess } from 'node:child_process'
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseEnvContent } from '../../scripts/lib/env.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

export interface TestServerConfig {
  /** Port to run on (default: 9081 to avoid conflict with dev server on 9080) */
  port?: number
  /** Max wait time for server ready (ms, default: 90000) */
  readyTimeoutMs?: number
  /** Interval for health check polling (ms, default: 500) */
  pollIntervalMs?: number
  /**
   * Isolate external API keys (INS_COOKIES / TWEET_KEYS / AI keys) from the
   * spawned dev server (default: true). Keeps `--server` deterministic —
   * real-key integration runs are opted into explicitly (S9).
   */
  isolateExternal?: boolean
}

/** Keys handed to the dev server; emptied under isolation so `.dev.vars` never fills them. */
export const EXTERNAL_KEYS = [
  'INS_COOKIES',
  'TWEET_KEYS',
  'GEMINI_API_KEY',
  'DEEPSEEK_API_KEY',
] as const

export class TestServer {
  private process: ChildProcess | null = null
  private managed = false
  private _url: string
  private config: Required<TestServerConfig>
  private readonly devVarsPath = path.join(PROJECT_ROOT, '.dev.vars')
  private devVarsBackup: string | null = null
  private devVarsWritten = false

  constructor(config: TestServerConfig = {}) {
    this.config = {
      port: config.port ?? 9081,
      // 冷启动 SSR 编译在本机实测 23s（缓存热）~ 50s+（并发/缓存冷），
      // 30s 默认值在并发或冷态下会误杀（对齐 2026-08-14 冷加载超时修复的调参思路）
      readyTimeoutMs: config.readyTimeoutMs ?? 90_000,
      pollIntervalMs: config.pollIntervalMs ?? 500,
      isolateExternal: config.isolateExternal ?? true,
    }
    this._url = `http://localhost:${this.config.port}`
  }

  get url(): string {
    return this._url
  }

  /** True when this instance spawned the child and owns its lifecycle. */
  get isManaged(): boolean {
    return this.managed
  }

  /** True when external API keys are withheld from the spawned server. */
  get isolatesExternal(): boolean {
    return this.config.isolateExternal
  }

  /**
   * Start the AnonTweet development server, or reuse one already listening.
   * Throws if no server can be made ready.
   */
  async start(): Promise<void> {
    // Reuse an existing server on the target port (e.g. a running dev server).
    if (await this.probe()) {
      console.log(`[TestServer] Reusing existing server at ${this._url}`)
      return
    }

    console.log(`[TestServer] Starting on port ${this.config.port}...`)
    this.managed = true

    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      PORT: String(this.config.port),
      // Disable external API calls during testing
      ENABLE_DB_CACHE: 'false',
      ENABLE_LOCAL_CACHE: 'false',
    }

    if (this.config.isolateExternal) {
      // Point DOTENV_CONFIG_PATH at a missing file so env.server's dotenv
      // cannot repopulate real credentials from .dev.vars.
      childEnv.DOTENV_CONFIG_PATH = path.join(PROJECT_ROOT, '.env.verify-absent')
      childEnv.INS_COOKIES = ''
      childEnv.TWEET_KEYS = ''
      // An empty string trips the .min(1) zod check on these — leave them unset.
      delete childEnv.GEMINI_API_KEY
      delete childEnv.DEEPSEEK_API_KEY
    }
    else {
      delete childEnv.DOTENV_CONFIG_PATH
    }

    // Cloudflare Vite 插件在 workerd 里跑 SSR，宿主的 process.env 不会自动传进去；
    // 把测试需要的值写进 .dev.vars（结束后恢复），wrangler 会原生读取。
    const devVarsOverrides: Record<string, string | undefined> = {
      PORT: String(this.config.port),
      ENABLE_DB_CACHE: 'false',
      ENABLE_LOCAL_CACHE: 'false',
    }
    if (this.config.isolateExternal) {
      Object.assign(devVarsOverrides, {
        INS_COOKIES: '',
        TWEET_KEYS: '',
        GEMINI_API_KEY: undefined,
        DEEPSEEK_API_KEY: undefined,
      })
    }
    else {
      for (const key of [
        'INS_COOKIES',
        'TWEET_KEYS',
        'GEMINI_API_KEY',
        'DEEPSEEK_API_KEY',
        'GEMINI_MODEL',
        'ENABLE_AI_TRANSLATION',
        'HOSTNAME',
      ]) {
        if (childEnv[key] !== undefined)
          devVarsOverrides[key] = childEnv[key]
      }
    }
    this.prepareDevVars(devVarsOverrides, !this.config.isolateExternal)

    this.process = spawn('bun', ['run', 'dev'], {
      cwd: PROJECT_ROOT,
      env: childEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    // Log server output for debugging
    if (this.process.stdout) {
      this.process.stdout.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().trim().split('\n')
        for (const line of lines) {
          if (line)
            console.log(`[Server] ${line}`)
        }
      })
    }
    if (this.process.stderr) {
      this.process.stderr.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().trim().split('\n')
        for (const line of lines) {
          if (line)
            console.warn(`[Server:err] ${line}`)
        }
      })
    }

    // Best-effort cleanup if the verify process dies abruptly (crash / Ctrl+C).
    process.on('exit', () => {
      this.killProcessSync()
      this.restoreDevVars()
    })

    const ready = await this.waitForReady()
    if (!ready) {
      this.killProcessSync()
      this.restoreDevVars()
      throw new Error(`TestServer failed to become ready at ${this._url}`)
    }
  }

  /**
   * Wait for the server to respond to health checks.
   */
  async waitForReady(timeoutMs?: number): Promise<boolean> {
    const timeout = timeoutMs ?? this.config.readyTimeoutMs
    const interval = this.config.pollIntervalMs
    const start = Date.now()

    while (Date.now() - start < timeout) {
      try {
        const res = await fetch(this._url, {
          signal: AbortSignal.timeout(3000),
        })
        if (res.ok) {
          console.log(`[TestServer] Ready at ${this._url} (${Date.now() - start}ms)`)
          return true
        }
      }
      catch {
        // Not ready yet
      }

      // Check if process died
      if (this.process?.exitCode !== null && this.process?.exitCode !== undefined) {
        console.error(`[TestServer] Process exited with code ${this.process.exitCode}`)
        return false
      }

      await new Promise(resolve => setTimeout(resolve, interval))
    }

    console.error(`[TestServer] Timeout waiting for server (${timeout}ms)`)
    return false
  }

  /**
   * Stop the server gracefully. Reused servers are left untouched.
   */
  async stop(): Promise<void> {
    const child = this.process
    this.process = null
    if (!child || !this.managed) {
      this.restoreDevVars()
      return
    }

    console.log('[TestServer] Stopping...')
    this.killTree(child)
    this.managed = false
    this.restoreDevVars()
    console.log('[TestServer] Stopped')
  }

  /**
   * 合并写入测试用的 .dev.vars；undefined 表示从文件里删掉该键。
   * mergeExisting=false 时只写显式覆盖值（隔离模式不继承本机真实凭据 / 域名）。
   */
  private prepareDevVars(overrides: Record<string, string | undefined>, mergeExisting: boolean): void {
    this.devVarsBackup = existsSync(this.devVarsPath)
      ? readFileSync(this.devVarsPath, 'utf8')
      : null

    const values = mergeExisting && this.devVarsBackup
      ? parseEnvContent(this.devVarsBackup)
      : {}

    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined)
        delete values[key]
      else
        values[key] = value
    }

    const content = Object.entries(values)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    writeFileSync(this.devVarsPath, `${content}\n`)
    this.devVarsWritten = true
  }

  /** 恢复测试前的 .dev.vars；原本不存在时直接删除。 */
  private restoreDevVars(): void {
    if (!this.devVarsWritten)
      return

    if (this.devVarsBackup === null)
      rmSync(this.devVarsPath, { force: true })
    else
      writeFileSync(this.devVarsPath, this.devVarsBackup)

    this.devVarsWritten = false
    this.devVarsBackup = null
  }

  /** Probe whether an HTTP server is already answering on the target port. */
  private async probe(): Promise<boolean> {
    try {
      const res = await fetch(this._url, {
        signal: AbortSignal.timeout(1500),
      })
      return res.ok
    }
    catch {
      return false
    }
  }

  /**
   * Kill the spawned child and its process tree.
   * On Windows a bare SIGTERM leaves the dev-server tree (vite workers etc.)
   * holding the stdio pipes open, which hangs the CLI — use taskkill /T /F.
   */
  private killTree(child: ChildProcess): void {
    try {
      if (process.platform === 'win32') {
        spawnSync('taskkill', [
          '/PID',
          String(child.pid),
          '/T',
          '/F',
        ], { stdio: 'ignore' })
      }
      else {
        child.kill('SIGTERM')
      }
    }
    catch {}
  }

  /** Synchronous kill used by the process-exit fallback. */
  private killProcessSync(): void {
    if (!this.process || !this.managed)
      return
    this.killTree(this.process)
  }
}
