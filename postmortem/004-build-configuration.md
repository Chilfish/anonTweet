# Postmortem 004: Build Configuration Churn From Framework Migrations and SSR Complexity

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Dependency
- **状态**: Mitigated

## Summary
The build configuration accumulated 10 fix commits spanning Vite config, SSR setup, dependency migration (jsdom→happy-dom), runtime migration (rettiwt-api→Hono), and environment variable schema alignment. Each migration introduced configuration drift that required follow-up fixes. The pattern stabilized after the Hono migration completed, but the underlying fragility remains: there is no build health check that validates the production build against the current config.

## Leadup
The project's build system went through several major shifts:

1. **Initial setup**: Remix + Vite with SSR, forked from a template
2. **SSR entry point** (`f32eabe`): Server entry point was missing, requiring explicit server configuration
3. **'use client' cleanup** (`e8a7020`): Redundant `'use client'` directives were scattered across server modules, causing SSR build failures
4. **Client/server boundary violations** (`5cb2fd5`): Client components were importing server modules (e.g., `constants.ts` importing from server-only code), causing build errors
5. **node:* import issues** (`7ab766d`, `645f988`): Node.js built-in module imports (`node:fs`, `node:path`) leaked into client bundles — first removed, then marked as comments when needed for type checking
6. **Dependency migration** (`dba2ecd`): jsdom was replaced with happy-dom for test compatibility
7. **Runtime migration** (`9926698`): The entire rettiwt-api was synced from upstream and the runtime was migrated to Hono — a 71-file, 2323-line insertion change
8. **Hono adapter cleanup** (`ef29efc`): The Hono adapter was removed after initial addition
9. **Environment variable schema** (`a812bc8`): Direct checks on `isProduction` and `env.ENABLE_DB_CACHE` were replaced with robust env object checks

## Fault
Key fault patterns:

1. **Client/server import boundary violations** (`5cb2fd5`, `e8a7020`): The most frequent build error pattern. Vite's SSR mode requires strict separation of client and server code, but the project imports utilities from a shared `lib/` directory without clear demarcation. Constants, types, and utilities intermix freely.

2. **node:* imports in browser bundles** (`7ab766d`, `645f988`): Node.js built-in imports (`node:fs`) leaked into client code. The first fix removed them; the second fix marked them as comments because they were needed for TypeScript type checking of API routes that share files with client code.

3. **Massive dependency churn** (`9926698`): The rettiwt-api sync + Hono migration touched 71 files. The scope was too large for a single commit — the `bun.lock` file changed 223 lines, package.json changed 27 lines, and yet the commit message is a single line.

4. **Environment variable fragility** (`a812bc8`): The code initially used bare `isProduction` and `env.ENABLE_DB_CACHE` checks, which broke when the environment variable schema was updated. The fix added robust `env` object checks, but the fact that multiple files had the same pattern (browser.ts, db.server.ts, env.server.ts) indicates a copy-paste of fragile code.

5. **Build errors post-merge** (`22dfe4e`): A generic "fix: build error" commit touched 3 files (Tweet.tsx, root.tsx, server/express.js) — indicating a build failure that wasn't caught before merge.

## Impact
- **Affected users**: Build breakages block all development and deployment
- **Duration**: Spread across the entire project timeline (Nov 2025 – Jan 2026)
- **Worst incident**: The rettiwt-api sync (`9926698`) was a 71-file change that could have broken the entire API layer if not tested carefully

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why do client/server import boundary violations recur? | The `lib/` directory has no internal structure separating server-only code from shared code. |
| 2 | Why wasn't `lib/` structured this way from the start? | The project grew from a Remix template where `lib/` is a catch-all. The `server/` directory exists but isn't consistently used for all server-only code. |
| 3 | Why do dependency migrations cause cascading build issues? | The project has no `tsc --noEmit` or build step in pre-commit hooks. CI exists but wasn't always passing before merge. |
| 4 | Why wasn't CI enforced? | Solo developer workflow — no branch protection rules, no required status checks. |
| 5 (root) | — | **The project has no automated build validation in pre-commit or CI that blocks merges when the production build fails, and the `lib/` directory structure doesn't enforce client/server separation.** |

**Root cause (one sentence):** No automated build gate exists, so client/server import violations and dependency breakages are only discovered after manual inspection or failed deploys.

## Detection
- Manual: developer runs `bun run build` after changes and discovers errors
- The `7a76f7a` commit ("fix: typecheck") suggests TypeScript errors accumulated until a dedicated fix was needed
- **Detection gap**: No pre-commit hook running `tsc --noEmit` or `bun run build`

## Recurrence
- Client/server boundary: at least 3 occurrences (`5cb2fd5`, `e8a7020`, `7ab766d`)
- Build error: generic "fix: build error" commit suggests pattern is recurring
- The Hono migration is now complete, so that specific migration risk is mitigated

## Lessons Learned
- **What went right?** The Hono migration (`9926698`) was completed and the adapter was cleaned up (`ef29efc`) — the migration was closed properly.
- **What could be better?** The migration should have been split into smaller PRs: (1) sync types, (2) update service layer, (3) switch runtime. A 71-file commit is unreviewable.
- **Where did we get lucky?** The rettiwt-api upstream changes were mostly additive types — the service layer had reasonable backward compatibility.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Restructure `lib/` into `lib/shared/` and `lib/server/` with ESLint `no-restricted-imports` rules blocking server imports from client | Prevention | — | ESLint rule blocks cross-boundary imports; CI fails on violations |
| 2 | Add pre-commit hook: `bun run typecheck && bun run build` | Detection | — | Husky pre-commit hook in `.husky/pre-commit` |
| 3 | Add GitHub Actions CI job: typecheck + build on every PR | Detection | — | CI status is required before merge |
| 4 | Add a `--mode production` build smoke test that starts the server and hits `/api/health` | Detection | — | SSR build doesn't just compile — it boots and responds |
| 5 | Document the client/server boundary rules in CONTRIBUTING.md | Prevention | — | File exists and explains `lib/shared` vs `lib/server` vs `app/` |

## Changed Files
```
vite.config.ts
package.json
bun.lock
app/root.tsx
server/express.js
server/app.ts
app/lib/env.server.ts
app/lib/database/db.server.ts
app/lib/browser.ts
app/routes/api/tweet/get.ts
app/types/global.d.ts
```

## Related Postmortems
- #005 (Media Handling) — media proxy config intersects with env variable handling
- #006 (State Management) — store schema changes have build implications
