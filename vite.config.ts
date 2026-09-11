import type { Plugin } from 'vite'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import { env } from './app/lib/env.server'

/**
 * dev 静态服务 charset 修复：public 静态文件由 sirv 提供，.md 响应头
 * `Content-Type: text/markdown` 缺 charset → 浏览器按系统默认编码（GBK/CP1252）
 * 渲染 UTF-8 中文产生乱码。sirv 的 send() 会尊重预设的 Content-Type，故在
 * 静态中间件之前设好即可；构建产物（Vercel）由 vercel.json headers 规则补齐。
 */
function skillsMarkdownCharset(): Plugin {
  return {
    name: 'skills-markdown-charset',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/skills/anon-tweet/SKILL.md')) {
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        }
        next()
      })
    },
  }
}

// 获取 git 信息
function getGitInfo() {
  try {
    const commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const commitDate = execSync('git log -1 --format=%ci', { encoding: 'utf8' }).trim()
    return {
      hash: commitHash,
      date: commitDate,
    }
  }
  catch (error) {
    console.warn('Failed to get git info:', error)
    return {
      hash: 'unknown',
      date: 'unknown',
    }
  }
}

if (env.ENABLE_LOCAL_CACHE) {
  const dir = path.join(process.cwd(), 'cache')
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
}

const gitInfo = getGitInfo()

const babelInclude = /\.[jt]sx?$/
const ReactCompilerConfig = { /* ... */ }

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    skillsMarkdownCharset(),
    babel({
      include: babelInclude,
      babelConfig: {
        // 版本约束：vite-plugin-babel@1.x 的 peer 为 @babel/core ^7，而
        // @babel/preset-typescript v8 的 peer 是 @babel/core ^8，且 v8 移除了
        // isTSX/allExtensions —— 不再自动为 .tsx 开启 JSX 解析（需另配
        // @babel/plugin-syntax-jsx）。二者混用会让 .tsx 的 <Jsx/> 被当作 TS
        // 类型断言解析而构建失败。故该 preset 必须锁在 core-7 线（见 package.json
        // 的 `~7.29.7`）与 postmortem 010。升级前请先确认 vite-plugin-babel 支持 core 8。
        presets: ['@babel/preset-typescript'],
        plugins: [
          ['babel-plugin-react-compiler', ReactCompilerConfig],
        ],
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  optimizeDeps: {
    include: [
      // base-ui
      '@base-ui/react/avatar',
      '@base-ui/react/checkbox',
      '@base-ui/react/dialog',
      '@base-ui/react/field',
      '@base-ui/react/input',
      '@base-ui/react/menu',
      '@base-ui/react/merge-props',
      '@base-ui/react/popover',
      '@base-ui/react/scroll-area',
      '@base-ui/react/select',
      '@base-ui/react/switch',
      '@base-ui/react/tabs',
      '@base-ui/react/toast',
      '@base-ui/react/toggle',
      '@base-ui/react/tooltip',
      '@base-ui/react/use-render',
      // utilities
      'axios',
      'class-variance-authority',
      'clsx',
      'date-fns',
      'lucide-react',
      'modern-screenshot',
      'react/compiler-runtime',
      'spin-delay',
      'swr',
      'tailwind-merge',
      'xlsx',
      'zustand',
      'zustand/middleware',
      'zustand/react/shallow',
    ],
  },
  server: {
    // PORT env overrides the default (TestServer spawns dev on a custom port)
    port: Number(process.env.PORT) || 9080,
    host: process.env.HOST ?? '127.0.0.1',
    allowedHosts: true,
  },
  define: {
    __GIT_HASH__: JSON.stringify(gitInfo.hash),
    __GIT_DATE__: JSON.stringify(gitInfo.date),
    __GEMINI_MODEL__: JSON.stringify(env.GEMINI_MODEL),
  },
  build: {
    rollupOptions: {
      input: isSsrBuild ? './server/app.ts' : undefined,
      // input: isSsrBuild ? './server/express.ts' : undefined,
    },
  },
}))
