# AGENTS.md

Anon Tweet — 匿名浏览 Twitter/X 推文与 Instagram 帖子，AI 翻译（Gemini / DeepSeek），卡片导出（截图 + Markdown）。React Router v8 + Bun + Cloudflare Workers 全栈应用。

## 先读哪里

- 文档唯一入口与任务导航：[docs/INDEX.md](docs/INDEX.md)
- 代码规范（TS / React / Zustand / 组件）：[docs/engineering/code-style.md](docs/engineering/code-style.md)
- UI 规范：[docs/ui-design/README.md](docs/ui-design/README.md)、[信息密度](docs/ui-design/INFORMATION-DENSITY.md)
- 历史雷区（写码 / 重构前必读）：[docs/postmortem/README.md](docs/postmortem/README.md)
- 验证套件与 AC：[verify/README.md](verify/README.md)
- 站点 API skill：`.agents/skills/anon-tweet/SKILL.md`

## 验证命令

```bash
bun run typecheck                         # react-router typegen + tsc
bun run lint                              # ESLint autofix
bun run test                              # Vitest；勿用裸 `bun test`（走 Bun 原生 runner）
bun run verify/index.ts --exit-on-fail    # 离线验证套件 + AC
```

pre-push 由 [lefthook.yml](lefthook.yml) 强制：`typecheck` → `eslint .` → `verify --exit-on-fail` → `build` → `build-storybook`。不要 `--no-verify`。

## 硬约束

1. **验证先行**：新功能 / 修复先写 AC（`verify/acceptance-criteria/`）与 verifier + fixture，再实现。
2. **文档先行**：先更新 `docs/development-log/` 与 `docs/planning/backlog.md`，再写代码；实施中同步修订。
3. **原子提交**：先定 commit message 再写代码；一个 commit 一个关注点，diff >10 文件或 >200 行必须拆分。
4. **密钥边界**：API Key / `TWEET_KEYS` / `INS_COOKIES` 只走 `.dev.vars` + `app/lib/env.server.ts`，绝不硬编码、绝不进客户端 bundle。
5. **BFF 边界**：`app/routes/api/*` 只做聚合 / 代理，业务逻辑放 `app/lib/`。
6. **数据库是可选缓存层**：未配置 DB 时全部功能必须可用。

## 维护本文件

只写每次任务都成立、且无法从代码或 `docs/` 推断的约束。细节、目录树、依赖清单、多步流程、进度状态一律外链，同一规则只留一处；被 hook / CI 强制的检查不在本文件复述。
