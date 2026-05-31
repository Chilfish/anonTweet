# Postmortem 002: Translation Editor Complexity Explodes Without Guardrails

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Architecture
- **状态**: Active

## Summary
The `TranslationEditor` component and its supporting infrastructure (dictionary viewer, AI translation prompt, template manager) accumulated 16 fix commits across the project's lifetime. The root cause is a tightly coupled system where the translation UI, dictionary storage, AI prompt engineering, and entity-skipping logic all live in the same component boundary with no clear data flow contract. Changes to any one subsystem (e.g., AI prompt strategy) cascade into the editor's state management.

## Leadup
The translation system evolved iteratively:
1. Simple text replacement editor → added entity awareness (mentions, hashtags, URLs should not be translated)
2. Entity awareness → added dictionary viewer (manual glossary of translations)
3. Dictionary viewer → added Excel import (`b3af482`: switch to Excel format)
4. Excel import → added Popover UI (`f6ca27d`: use Popover for DictionaryViewer)
5. Popover → added AI auto-translation with prompt engineering (`7e68aa3`)
6. AI translation → added template management with store versioning (`2e9e8a8`)

Each layer was added directly into the same component or its immediate imports, without extracting into independent, testable modules.

## Fault
The fault patterns:

1. **HTML entity display corruption** (`07baf0a`): HTML entities (`&amp;`, `&lt;`) in tweet text appeared raw in the editor because the translation editor was rendering HTML strings without decoding — requiring a 65-line utility function to fix.

2. **Entity skip logic bugs** (`fbda221`): The `shouldSkipEntity` function failed when users cleared translation input — empty inputs caused entities to be "skipped" because the logic checked translation text emptiness, not original text emptiness. Required introducing `originalTweet` reference into the skip logic.

3. **Empty-text translation skip** (`d0450a9`): The editor skipped empty text entities even when translation was needed — condition was inverted.

4. **AI hide-original regression** (`737fe74`, `276b8d4` — fixed twice): When AI translation was enabled, the original text was not being hidden as expected. Two attempts needed because the first fix didn't cover all code paths.

5. **Store migration data loss** (`e23f285`): The `translationMode` field was stored at the top level of Zustand state, but the partialize configuration only persisted `settings`. When the store version bumped, `translationMode` was silently dropped — requiring a store migration function to copy it into `settings`.

6. **Alt translation editor display** (`cf7927a`): The alternative translation editor failed to initialize properly because state synchronization between the main and alt editors wasn't linearized.

## Impact
- **Affected users**: All users who use translation features — broken entity display, lost translations, missing AI toggle
- **Duration**: Recurring across Dec 2025 – Jan 2026
- **Data loss risk**: Store migration bug (#5) could permanently lose translation settings

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why does the translation editor have recurring entity bugs? | The entity-skipping logic depends on both original tweet text and current translation input, with no invariant enforcement. |
| 2 | Why is there no invariant enforcement? | The editor component mixes UI state, translation state, entity filtering, and dictionary lookups in a single component. |
| 3 | Why is it in a single component? | Features were added incrementally without refactoring boundaries. The dictionary went from simple list → Excel → Popover, each adding more state to the same component. |
| 4 | Why wasn't refactoring done between features? | No automated tests meant every refactor carried high risk. Each fix was a minimal hotfix to restore functionality. |
| 5 (root) | — | **The translation editor has no pure-function core for entity filtering and text processing — all logic is embedded in React component state, making it untestable without full DOM rendering.** |

**Root cause (one sentence):** Translation logic is embedded in React component state rather than extracted into testable pure functions, causing each feature addition to destabilize existing behavior.

## Detection
- Manual testing caught most issues (users noticed HTML entities appearing raw, empty fields, missing toggle)
- The store migration bug was a ticking time bomb — only surfaced when users upgraded
- **Detection gap**: No integration test that runs "enter text → translate → clear → verify" end-to-end

## Recurrence
- `fbda221` and `d0450a9` are essentially the same class of bug (entity skip logic) fixed in different parts of the condition
- `737fe74` and `276b8d4` are identical commits — the first fix was incomplete
- Store migration pattern also appears in #006 (Zustand misuse)

## Lessons Learned
- **What went right?** The AI prompt refactor (`7e68aa3`) was done well — it restructured the entire prompt strategy in a single cohesive commit with clear description of what changed and why.
- **What could be better?** "Fix it twice" pattern (`737fe74`/`276b8d4`) indicates the first fix wasn't verified against all usage sites.
- **Where did we get lucky?** The store migration bug didn't cause user-visible data corruption that required manual recovery. The migration function silently recovered the data.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Extract `shouldSkipEntity` and entity text processing into a pure function module (`lib/translation/entity-filter.ts`) with unit tests | Prevention | — | 100% test coverage on entity filter logic; no `shouldSkip` logic in components |
| 2 | Extract HTML entity decoding into a dedicated utility with exhaustive test cases (all named entities, numeric entities, mixed content) | Prevention | — | `lib/translation/decode-entities.ts` with 30+ test cases |
| 3 | Add a store migration integration test: create store at version N, trigger migration to N+1, assert all fields survive | Detection | — | CI test that runs all migration versions in sequence |
| 4 | Add an E2E smoke test: load a tweet with mixed entities → open translation editor → verify entity placeholders render, type translation → verify no entity corruption | Detection | — | Playwright test in CI |
| 5 | Document the translation data flow: which store owns what, how AI results merge with manual translations, the priority resolution order | Prevention | — | `docs/translation-architecture.md` exists and is referenced from TranslationEditor.tsx |

## Changed Files
```
app/components/translation/TranslationEditor.tsx
app/components/translation/AltTranslationEditor.tsx
app/components/translation/DictionaryViewer.tsx
app/lib/AITranslation.ts
app/lib/stores/translation.ts
app/lib/constants.ts
app/components/settings/TranslationDictionaryManager.tsx
app/components/settings/SeparatorTemplateManager.tsx
```

## Related Postmortems
- #006 (State Management) — store migration pattern
- #003 (UI Styling/Layout) — Popover and UI integration bugs
