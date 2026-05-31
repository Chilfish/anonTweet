# Postmortem 007: Instagram Feature — Rapid Iteration Without Abstraction

- **日期**: 2026-05-31
- **严重级别**: SEV-3
- **分类**: Change
- **状态**: Active

## Summary
The Instagram integration (newest feature in the project) accumulated 7 fix commits in quick succession during May 2026. These are not "bug fixes" in the traditional sense but feature-completion commits — missing routes, missing behaviors, and UI polish that were deferred from the initial implementation. The cluster is marked "Active" because the feature is new and more edge cases are likely to surface as users exercise it.

## Leadup
The Instagram feature was added to extend the tweet archiving/translation tool to support Instagram posts. It required:
- New routes: `plain-ins/:id` for Instagram post display
- New components: `IGActionBar`, `IGCaption`, `IGCardHeader`, `IGMediaGrid`, `IGTranslateDialog`
- New API endpoints: `/api/ig/translate/:id`
- URL parsing: `extractIGId()` to parse Instagram URLs
- Instagram's data model: grid media, carousel indicators, username-prefixed URLs

The feature was built rapidly, with foundational pieces (route, URL parsing) being completed in the same commit series as UI polish (icon sizes, indicator removal).

## Fault
The commits reveal a "ship then finish" pattern:

1. **Missing route** (`fa92657`): The `plain-ins/:id` route was not registered — a foundational piece that should have been part of the initial commit.

2. **Dot indicator removal** (`d548673`): Instagram's grid view had dot indicators (carousel-style pagination dots), but Instagram grids don't paginate — they're a single static grid. The indicator was a leftover from reusing a carousel component.

3. **Icon inconsistency** (`675b9a3`): The Send icon was a different size (not 24px) and the Instagram logo was smaller (not `h-8`) compared to other action bar icons. A design consistency issue that was deferred.

4. **Missing translate button behavior** (`cbe3d0c`): Three fixes in one commit:
   - Only a single translate button should appear (not one per media item)
   - The translate button should be hidden during screenshots
   - A visual separator should appear between original and translated content

5. **Manual translation persistence** (`4fe9dec`): When users manually edited a translation for an Instagram post, it wasn't saved to the database. The API endpoint (`/api/ig/translate/:id`) only supported AI translation. Fix: extended the endpoint to accept a `manualTranslation` field that writes directly to the DB without invoking AI. Also fixed a missing `deepseekThinkingLevel` in `useAIConfig`.

6. **URL parsing gap** (`ce54249`): `extractIGId()` only matched URLs with the format `instagram.com/p/CODE/` but not `instagram.com/USERNAME/p/CODE/`. The regex needed updating to support username-prefixed paths.

7. **Description updates** (`ce54249`): Homepage meta tags, `PageHeader`, and `TweetInputForm` descriptions still referenced only Twitter — needed to mention Instagram support. A marketing/UX polish issue that was deferred.

## Impact
- **Affected users**: Instagram feature users — broken routes, missing save functionality, inconsistent UI
- **Severity**: Mostly polish and edge cases (SEV-3), except for the missing route (#1) and missing persistence (#5) which were functional gaps
- **Duration**: May 2026, 1 month of rapid iteration

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why were foundational pieces (route, URL parsing, persistence) shipped incomplete? | The feature was built incrementally: ship the core, then fill in gaps. |
| 2 | Why was this approach chosen over a complete initial implementation? | Building a new feature for a new data model (Instagram) requires real-world testing — some URLs and behaviors only surface from actual use. |
| 3 | Why wasn't a structured rollout used (feature flag, beta)? | Solo developer workflow — no need for feature flags when there's one user base. But the "fix commits" are effectively post-release QA. |
| 4 | Why weren't these caught in development? | The Instagram feature doesn't have the same test coverage or manual testing rigor as the mature Twitter feature. No test fixtures for Instagram post data exist. |
| 5 (root) | — | **The Instagram feature was shipped with a "fix in production" mindset because: (a) no test fixtures for Instagram data, (b) URL formats vary in the wild, (c) no structured acceptance criteria covering all user flows.** |

**Root cause (one sentence):** The Instagram feature lacked structured acceptance criteria and test fixtures, so foundational gaps (route, persistence, URL parsing) were discovered in production rather than development.

## Detection
- Discovered by developer self-testing with real Instagram URLs
- Missing route found when navigating to `plain-ins/:id` directly
- URL parsing gap found when testing with username-prefixed Instagram URLs from real posts
- **Detection gap**: No automated test that parses a corpus of real Instagram URL formats

## Recurrence
This is the newest cluster — no recurrence yet because the feature is still active. The pattern is similar to the early Twitter feature commits: ship core, fix edge cases in production.

## Lessons Learned
- **What went right?** Each fix was small and targeted — no single commit tried to fix multiple unrelated issues.
- **What could be better?** An acceptance checklist before merging the initial IG feature: "Does route work? Does URL parsing handle all formats? Does manual translation persist? Is UI consistent with Twitter mode?"
- **Where did we get lucky?** The missing persistence (#5) could have been much worse — if users had written translations that were silently lost, it would be data loss (SEV-1). Fortunately, the feature was new enough that few users had manual translations to lose.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Create an Instagram feature acceptance checklist: route registration, URL parsing (3+ formats), translate flow (AI + manual), screenshot, persistence | Prevention | — | Checklist in PR template or issue template |
| 2 | Add test fixtures: 5+ real Instagram post payloads (grid, single image, video, carousel, username-prefixed URL) | Detection | — | `tests/fixtures/ig/` directory with raw JSON and expected parsed output |
| 3 | Add an integration test: `POST /api/ig/translate/:id` with `manualTranslation`, then `GET` to verify it persisted | Detection | — | CI test that verifies the full translate→save→retrieve cycle |
| 4 | Consolidate Instagram and Twitter URL parsing into a single `extractPostId()` utility that handles both platforms | Prevention | — | One function, two platform regexes, shared test suite |
| 5 | Write a feature spec for any new platform integration before implementation starts | Prevention | — | Spec template includes: route list, URL formats, data model, translation flow, screenshot support, persistence |

## Changed Files
```
app/routes/plain-ins.tsx
app/components/ins/IGMediaGrid.tsx
app/components/ins/IGActionBar.tsx
app/components/ins/IGTranslateDialog.tsx
app/components/ins/IGCaption.tsx
app/components/ins/IGCardHeader.tsx
app/components/layout/PageHeader.tsx
app/components/tweet/TweetInputForm.tsx
app/routes/api/ig/translate.ts
app/routes/home.tsx
app/lib/utils.ts
app/lib/stores/hooks.ts
```

## Related Postmortems
- #001 (Twitter Content Parsing) — same pattern of incomplete URL/data parsing
- #002 (Translation System) — translation features now span both Twitter and Instagram
