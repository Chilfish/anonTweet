# Postmortem 006: Zustand Store Misuse — Selector Greed and Migration Fragility

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Bug
- **状态**: Mitigated

## Summary
The Zustand stores (`useAppConfigStore`, `useTranslationStore`) accumulated 6 fix commits for persistent issues: store migration data loss, excessive re-renders from unselective subscriptions, and stale comment state after fetching new tweets. The root cause is a pattern of subscribing to entire store objects instead of individual fields, combined with Zustand's manual migration API that silently drops data when the partialize schema doesn't match the migration version.

## Leadup
The project uses Zustand with the `persist` middleware for:
- `appConfig.ts`: User settings (AI provider, API keys, proxy URL, UI preferences)
- `translation.ts`: Translation mode, settings, template management

Zustand's `persist` middleware requires explicit configuration of:
1. `partialize`: Which fields to persist to localStorage
2. `migrate`: How to transform old versions when the store schema changes
3. `version`: The current schema version number

The migration logic is entirely manual and provides no type safety — old state is typed as `any`, and there's no compile-time check that the migration preserves all fields.

## Fault
Key fault patterns:

1. **Store migration data loss** (`e23f285`): The `translationMode` field was stored at the top level of the Zustand state, but `partialize` only persisted `state.settings`. When the store version bumped to 5, `translationMode` was silently excluded from persistence because `partialize` didn't include it. Fix: implemented a `migrate` function that copies `translationMode` into `settings.translationMode` for versions < 5, and updated `partialize` to nest `translationMode` under `settings`.

   ```typescript
   // Before (broken):
   partialize: state => ({
     settings: state.settings,
     translationMode: state.translationMode,  // persisted separately
   })

   // After (fixed):
   partialize: state => ({
     settings: {
       ...state.settings,
       translationMode: state.translationMode,  // nested under settings
     },
   })
   ```

2. **Zustand misuse — subscribing to entire store** (`2e9e84b`): 7 components were importing the entire store object:
   ```typescript
   // Broken: causes re-render on ANY store change
   const { enableAITranslation, aiProvider, geminiApiKey, ... } = useAppConfigStore()
   ```
   Fix: Each component now uses `useShallow` with explicit field selectors:
   ```typescript
   const { enableAITranslation, aiProvider, ... } = useAppConfigStore(
     useShallow(state => ({
       enableAITranslation: state.enableAITranslation,
       aiProvider: state.aiProvider,
       // ... only the fields this component needs
     }))
   )
   ```
   This affected: `ThemeProvider`, `AITranslationSettings`, `GeneralSettings`, `SeparatorTemplateManager`, `ThemeSwitcher`, `TranslationDictionaryManager`, `TweetOptionsMenu`.

3. **Stale comment state** (`13a4148`): When fetching new tweets, the comment section state was not reset. This meant old comment threads remained visible when switching to a new tweet. Fix: a 2-line addition to `tweet.tsx` that resets comment state on tweet fetch.

4. **Template storage versioning** (`2e9e8a8`): Template management needed a storage version upgrade, following the same pattern as #1 — the version number was bumped and migration logic was added to handle old-format templates.

## Impact
- **Store migration bug (#1)**: Potentially affected all users who upgraded — `translationMode` (show/hide original, AI translation toggle) silently reset to defaults
- **Re-render bug (#2)**: Performance degradation — every settings change triggered re-renders in 7 unrelated components
- **Stale comment state (#3)**: UX confusion — users saw comments from the wrong tweet
- **Duration**: Migration bugs were ticking time bombs that only surfaced on version bump

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why does store migration silently drop data? | Zustand's `migrate` function uses `any` types — there's no type-level connection between the persisted partialize schema and the migration function. |
| 2 | Why was `translationMode` stored at the top level separately from settings? | The store evolved incrementally: `settings` was the original persist target, then `translationMode` was added later as a top-level field without updating the persistence strategy. |
| 3 | Why wasn't this caught during development? | The migration only runs once when a user loads the app with an old localStorage version. During development, localStorage is frequently cleared, so the migration path is rarely exercised. |
| 4 | Why do components subscribe to the entire store? | Zustand's API makes it easy: `useStore()` returns the whole state. Using selectors (`useStore(s => s.field)`) requires explicit opt-in, and the ergonomic default is the broken pattern. |
| 5 (root) | — | **Zustand's defaults encourage anti-patterns (whole-store subscription, `any`-typed migrations), and the project has no automated tests for migration paths or selector correctness.** |

**Root cause (one sentence):** Zustand's ergonomic defaults encourage subscribing to entire stores and writing untyped migrations — both patterns caused real bugs that could have been prevented with a store testing strategy.

## Detection
- Migration bug: discovered when a user upgraded and their translation settings were lost
- Re-render bug: discovered via React DevTools profiling (or manual sluggishness observation)
- Stale comment bug: discovered by manual testing of the tweet fetch flow
- **Detection gap**: No unit test that serializes a store snapshot, bumps version, and verifies all fields survive

## Recurrence
- The `translationMode` migration pattern also appeared in `2e9e8a8` for templates — same class of bug, different field
- The `useShallow` fix was applied consistently across 7 files in a single commit — good practice, but only after the pattern was already widespread

## Lessons Learned
- **What went right?** The `useShallow` fix was applied comprehensively in one commit — all 7 affected components were fixed together, preventing a trickle of follow-up fixes.
- **What could be better?** An ESLint rule (`eslint-plugin-zustand` or custom) could have caught the whole-store subscription pattern at lint time.
- **Where did we get lucky?** The migration bug was recoverable — `translationMode` had a sensible default, so users weren't blocked, just mildly confused by reset preferences.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Add a store migration test helper: `testMigration(oldState, newVersion, expectedState)` that runs the store's `migrate` function and asserts all fields | Detection | — | At least one migration test per store version bump |
| 2 | Add ESLint rule: `no-restricted-syntax` to forbid `useAppConfigStore()` and `useTranslationStore()` without a selector argument | Prevention | — | ESLint blocks whole-store subscriptions at lint time |
| 3 | Add TypeScript generic constraint: make `migrate` accept a typed `Partial<State>` instead of `any` | Prevention | — | `migrate: (state: OldState, version: number) => NewState` — no `any` in migration signatures |
| 4 | Add a CI test that creates a store with version N's schema, serializes it, then deserializes with version N+1's schema and verifies no field loss | Detection | — | CI catches migration bugs before release |
| 5 | Document the Zustand patterns in `docs/zustand-conventions.md`: always use selectors, always test migrations, always bump version on schema change | Prevention | — | File exists and is referenced from store files |

## Changed Files
```
app/lib/stores/translation.ts
app/lib/stores/appConfig.ts
app/lib/stores/hooks.ts
app/components/ThemeProvider.tsx
app/components/settings/AITranslationSettings.tsx
app/components/settings/GeneralSettings.tsx
app/components/settings/SeparatorTemplateManager.tsx
app/components/settings/ThemeSwitcher.tsx
app/components/settings/TranslationDictionaryManager.tsx
app/components/tweet/TweetOptionsMenu.tsx
app/routes/tweet.tsx
```

## Related Postmortems
- #002 (Translation System) — store migration for translation settings
- #004 (Build Configuration) — store schema changes have build implications
