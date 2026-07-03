/**
 * verify/sdk/test-server.ts
 *
 * Server lifecycle manager for running tests against a live AnonTweet instance.
 *
 * Usage:
 *   const server = new TestServer()
 *   await server.start()
 *   const client = new AnonTweetClient({ baseUrl: server.url })
 *   // ... run tests ...
 *   await server.stop()
 */

import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = path.resolve(__dirname, '..', '..')

export interface TestServerConfig {
  /** Port to run on (default: 9081 to avoid conflict with dev server on 9080) */
  port?: number
  /** Max wait time for server ready (ms, default: 30000) */
  readyTimeoutMs?: number
  /** Interval for health check polling (ms, default: 500) */
  pollIntervalMs?: number
}

export class TestServer {
  private process: ChildProcess | null = null
  private _url: string
  private config: Required<TestServerConfig>

  constructor(config: TestServerConfig = {}) {
    this.config = {
      port: config.port ?? 9081,
      readyTimeoutMs: config.readyTimeoutMs ?? 30_000,
      pollIntervalMs: config.pollIntervalMs ?? 500,
    }
    this._url = `http://localhost:${this.config.port}`
  }

  get url(): string {
    return this._url
  }

  /**
   * Start the AnonTweet development server.
   */
  async start(): Promise<void> {
    console.log(`[TestServer] Starting on port ${this.config.port}...`)

    this.process = spawn('bun', ['run', 'dev'], {
      cwd: PROJECT_ROOT,
      env: {
        ...process.env,
        PORT: String(this.config.port),
        // Disable external API calls during testing
        ENABLE_DB_CACHE: 'false',
        ENABLE_LOCAL_CACHE: 'false',
      },
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

    await this.waitForReady()
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
        const res = await fetch(`${this._url}/`, { signal: AbortSignal.timeout(3000) })
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
   * Stop the server gracefully.
   */
  async stop(): Promise<void> {
    if (!this.process)
      return

    console.log('[TestServer] Stopping...')

    // Send SIGTERM on Unix, taskkill on Windows
    const killed = this.process.kill('SIGTERM')

    if (!killed) {
      // Fallback for stubborn processes
      const { execSync } = await import('node:child_process')
      try {
        if (process.platform === 'win32') {
          execSync(`taskkill /PID ${this.process.pid} /T /F`, { stdio: 'ignore' })
        }
        else {
          this.process.kill('SIGKILL')
        }
      }
      catch {}
    }

    this.process = null
    console.log('[TestServer] Stopped')
  }
}
