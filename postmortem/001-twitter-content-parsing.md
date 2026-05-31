# Postmortem 001: Tweet Entity Parser Is Monolithic and Brittle

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Architecture
- **状态**: Active

## Summary
The `parseTweet.ts` parser is the single most error-prone module in the codebase, with 10 fix commits targeting it directly plus another 5 on adjacent react-tweet components. The parser is a monolithic function that handles entity extraction, deduplication, text range adjustment, media processing, and quoted tweet enrichment — all in a single file. Each upstream Twitter API change or edge case (note_tweet, leading mentions, player cards) triggers a cascade of indexing and range-calculation bugs.

## Leadup
The parser was originally forked from the `react-tweet` library's API v2 parser and extended to support Chinese localization features. The introducing commit evolved from a simple `parseTweet` export to a complex function handling `RawTweet → EnrichedTweet` transformation. As features were bolted on (note_tweet text ranges, quoted tweet enrichment, entity deduplication), the function grew to 115+ lines with deeply nested conditionals.

## Fault
The fault manifests as:
1. **Off-by-one errors** in entity indices — mention range checks using `>=` instead of `>` (commit `1cfef30`)
2. **Entity duplication** — no deduplication logic existed initially, causing the same entity to appear twice in the rendered tweet (commit `801a366`)
3. **Missing entity types** — player cards (`a905c86`), media entities not handled
4. **Text range miscalculation** — `display_text_range` offsets not adjusted when stripping leading mentions (commit `801a366`)
5. **Data source variance** — tweets come in multiple structural shapes (`tweet.legacy` vs `tweet.tweet.legacy`, commit `2950ddd`)

The core pattern: every new feature requires modifying the same monolithic function, and each modification introduces new indexing bugs because there are no unit tests pinning the entity extraction contract.

## Impact
- **Affected users**: All users viewing tweets — broken entity rendering causes missing @mentions, mangled hashtags, and invisible media links
- **Duration**: Recurring — each fix commits weeks apart across the entire project history (Oct 2025 – Jan 2026)
- **Related issues**: `parseTweet.ts` is the most-changed non-config file with 10 fix commits

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why are entity indices wrong? | The parser manually adjusts indices for leading mentions and text ranges without a centralized offset model. |
| 2 | Why is index adjustment manual? | The parser operates on raw string slices with `Array.from()` character arrays, recalculating offsets ad-hoc for each entity type. |
| 3 | Why is the parser a single function? | No architectural boundary between "extract raw entities from API" and "convert to UI-friendly structure." |
| 4 | Why was it designed this way? | The parser started as a direct port from `react-tweet`, which assumes a single, simple tweet shape from the v2 API. The project gradually diverged to support v1.1 data shapes, note_tweet, and translation integration. |
| 5 (root) | — | **The parser has no test coverage and no internal abstraction boundaries — every change risks breaking all entity types simultaneously.** |

**Root cause (one sentence):** The tweet parser lacks automated tests and internal separation of concerns, making it a single point of failure for all entity rendering.

## Detection
- Discovered by manual testing: Chinese tweet rendering showing duplicate text, missing media URLs, broken @mentions
- No automated regression tests exist for tweet parsing
- **Detection gap**: Would need a snapshot test suite of known tweet payloads (`raw_in.json` → `expected_out.json`) run in CI

## Recurrence
This pattern has repeated 10 times across `parseTweet.ts` and 5 more times in adjacent react-tweet files:
- `a131b5f`: media entity index range miscalculation (separate from the main parser fix)
- `44a284a`: note_tweet text range not handled
- `d592945`: quoted tweet display broken
- `9394201`: comment IDs lost when filtering

## Lessons Learned
- **What went right?** Individual fixes were small and targeted, each addressing a specific symptom.
- **What could be better?** No test was ever added alongside any parser fix. Each fix was a production hotfix.
- **Where did we get lucky?** The Twitter API didn't change its entity format often enough to cause a complete outage.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Add snapshot tests for `parseTweet` with 5+ real tweet payloads covering note_tweet, quoted tweet, media, and player card variants | Prevention | — | CI passes on every PR touching `parseTweet.ts` |
| 2 | Extract entity deduplication into its own pure function with explicit input/output types | Prevention | — | Deduplication logic lives in `lib/entities/dedup.ts` with dedicated tests |
| 3 | Add a structural schema assertion on the raw tweet input — if the shape is unrecognized, fail loudly instead of silently producing wrong output | Detection | — | `parseTweet` throws `UnknownTweetShapeError` on unrecognized payloads |
| 4 | Run the tweet parser in CI against a frozen corpus of 20 raw tweet JSON fixtures | Detection | — | GitHub Actions workflow that fails on any diff in parser output |

## Changed Files
```
app/lib/react-tweet/api-v2/parseTweet.ts
app/lib/react-tweet/api-v2/get-tweet.ts
app/components/tweet/TweetTextBody.tsx
app/lib/react-tweet/twitter-theme/tweet-media.tsx
app/lib/react-tweet/utils/index.ts
app/components/tweet/Tweet.tsx
```

## Related Postmortems
- #005 (Media Handling) — media entity parsing touches the same code paths
