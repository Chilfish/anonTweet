import { defineDevkit } from '@chilfish/devkit'

/**
 * 本地开发基础设施配置（@chilfish/devkit）。
 *
 * 只负责本地 Postgres 与 Neon HTTP `/sql` 代理；`bun run dev` 仍由
 * react-router 直接启动，不经过 devkit。
 */
export const devkit = defineDevkit({
  identity: {
    name: 'anon-tweet',
    description: 'Anon Tweet local development tooling',
    helpHint: 'bun run devkit',
  },
  env: { file: '.dev.vars' },
  database: {
    localUrl: 'postgres://postgres@127.0.0.1:5432/anon_tweet_dev',
    proxyEndpoint: 'http://127.0.0.1:4444/sql',
    migrations: 'drizzle',
  },
  paths: { logs: 'tmp/logs' },
})
