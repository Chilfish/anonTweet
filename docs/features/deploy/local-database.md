# 本地数据库（Postgres + Neon HTTP 代理）

> 目标：本地启用 `ENABLE_DB_CACHE=true`，不连远程 Neon。
> 工具：`@chilfish/devkit`（devDependency），配置见 [`dev.config.ts`](../../../dev.config.ts)，
> 入口见 [`scripts/dev.ts`](../../../scripts/dev.ts)。

## 为什么需要代理

Workers / workerd 不能开 TCP 连接，`@neondatabase/serverless` 只走 Neon 的 HTTP `/sql` 协议。
devkit 在本机启动 **Postgres** 和 **`/sql` 代理**，把 HTTP 请求翻译成 PostgreSQL 连接；
应用侧只要把 `NEON_HTTP_ENDPOINT` 指向代理即可，业务代码不用改。

```text
workerd ──HTTP POST /sql──▶ devkit 代理 (127.0.0.1:4444) ──TCP──▶ 本地 Postgres
                ▲
        NEON_HTTP_ENDPOINT
```

## 前置

| 依赖                      | 说明                                                                             |
| ------------------------- | -------------------------------------------------------------------------------- |
| PostgreSQL                | `pg_ctl` 在 `PATH`，或设置 `PG_CTL` / `PGDATA`（Scoop / 标准安装目录会自动发现） |
| Bun 1.4.4+                | 仓库 `packageManager` 已固定                                                     |
| `@chilfish/devkit` + `pg` | 已在 `devDependencies`，`bun install` 即装好                                     |

本地默认值（改这里即可换端口 / 库名）：

- 数据库：`postgres://postgres@127.0.0.1:5432/anon_tweet_dev`
- 代理：`http://127.0.0.1:4444/sql`
- 迁移目录：`drizzle/`

## 一条命令启动

```env
# .dev.vars
ENABLE_DB_CACHE=true
```

```bash
bun run dev
```

`bun run dev` 的执行顺序：

1. 加载 `.dev.vars`；
2. `ENABLE_DB_CACHE` 为真时，依次：启动 Postgres → 建库（不存在时）→ 跑 Drizzle 迁移 →
   启动 `/sql` 代理 → 把本地地址写进 `.dev.vars`；
3. 启动 `react-router dev`（workerd）。

`ENABLE_DB_CACHE=false`（默认）时跳过第 2 步，只起 dev server，不要求本机安装 PostgreSQL。
集成测试（`TestServer`）固定传 `ENABLE_DB_CACHE=false`，因此 CI 不会被本地库绑住。

## 命令

| 命令                 | 作用                                                    |
| -------------------- | ------------------------------------------------------- |
| `bun run dev`        | 本地唯一入口；`ENABLE_DB_CACHE=true` 时连带本地数据库栈 |
| `bun run dev:status` | 只读检查 Postgres / 代理 / SILO，不启动也不停止任何服务 |

需要单独调试数据库或代理时，再使用 `bun run devkit dev db` / `dev proxy`（支持 `--json`、`--dry-run`）；
日常开发不需要。

## `.dev.vars` 会被写入什么

首次带数据库启动时，devkit 只会覆盖这三个键，其余内容与注释保持原样：

```env
DATABASE_URL=postgres://postgres@127.0.0.1:5432/anon_tweet_dev
NEON_HTTP_ENDPOINT=http://127.0.0.1:4444/sql
LOCAL=1
```

> 如果存在 `.dev.vars.dev`，devkit 会写它；本仓库只维护 `.dev.vars` 一份，**不要创建 `.dev.vars.dev`**，
> 否则应用（dotenv）读不到里面的值。

## 应用侧行为

- `app/lib/database/db.server.ts`：`neon(env.DATABASE_URL)`；当 `DATABASE_URL` 是本地地址且设置了
  `NEON_HTTP_ENDPOINT` 时，赋值给 `neonConfig.fetchEndpoint`。远程库会忽略残留的本地端点。
- `drizzle.config.ts` / `bun run db:push` / `db:migrate`：直接 TCP 连 `DATABASE_URL`，不经过代理。
- 变量校验在 `app/lib/env.server.ts`；空字符串按未设置处理。

## 切回远程 / 关闭本地库

1. `.dev.vars` 里把 `ENABLE_DB_CACHE` 改回 `false`（`bun run dev` 不再拉起本地库）。
2. 删掉 `NEON_HTTP_ENDPOINT`，或保留也不影响远程：应用只对本地 `DATABASE_URL` 使用它。
3. `DATABASE_URL` 改回 Neon 连接串，或交给部署平台注入。

## 生产差异

- 线上 secret 名为 `DATABASE_URL`（过渡期仍兼容旧名 `DB_URL`，见 `normalizeDatabaseUrl`）。
- `NEON_HTTP_ENDPOINT` 只属于本地，**不要**上传到 Workers。
- 代理只接受 localhost 数据库地址，远端库不会暴露到本机端口。

## 停止与重置

后台服务不是 `dev` 的子进程，Ctrl-C 只停 dev server；Postgres 与代理会继续运行，下次启动直接复用。

```powershell
# 代理健康（返回 pid / host / database）
curl http://127.0.0.1:4444/health

# Postgres（devkit 不拥有系统实例，没有 `dev stop`）
pg_ctl status -D $env:PGDATA
pg_ctl stop -D $env:PGDATA

# 清空本地数据
dropdb -h 127.0.0.1 -U postgres anon_tweet_dev
```

代理的 `pid` 可用 `taskkill /PID <pid> /F`（Windows）或 `kill <pid>` 结束。

## 排障

| 现象                                           | 处理                                                                                           |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `bun run dev` 在本地库阶段失败                 | 装好 PostgreSQL / 设置 `PG_CTL`、`PGDATA`；或临时把 `ENABLE_DB_CACHE` 设为 `false`             |
| `pg_ctl (or its data directory) was not found` | 设置 `PG_CTL` / `PGDATA`，或把 PostgreSQL `bin` 加入 `PATH`                                    |
| 代理端口被占用且目标库不一致                   | devkit 会报出两边的 host/database；停掉旧代理或改 `dev.config.ts` 的 `proxyEndpoint`           |
| Worker 仍访问远程库                            | 确认 `ENABLE_DB_CACHE=true` 且 `.dev.vars` 已写入 `NEON_HTTP_ENDPOINT`，然后重启 `bun run dev` |
| 迁移失败                                       | 看 `tmp/logs/postgres.log`，或单独执行 `bun run db:migrate` 获取完整错误                       |
