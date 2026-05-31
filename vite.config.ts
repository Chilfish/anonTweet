import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import babel from 'vite-plugin-babel'
import { env } from './app/lib/env.server'

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
    babel({
      include: babelInclude,
      babelConfig: {
        presets: ['@babel/preset-typescript'], // if you use TypeScript
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
    port: 9080,
    host: '127.0.0.1',
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
