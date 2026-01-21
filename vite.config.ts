import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { reactRouter } from '@react-router/dev/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
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

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
  ],
  ssr: {
    noExternal: ['react-tweet'],
  },
  server: {
    port: 9080,
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
