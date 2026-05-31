# Postmortem 003: UI Styling and Layout Is a Whac-a-Mole of One-Line CSS Fixes

- **日期**: 2026-05-31
- **严重级别**: SEV-3
- **分类**: Bug
- **状态**: Active

## Summary
The project accumulated ~20 fix commits for UI styling and layout issues — the largest cluster by volume but individually the smallest in severity. Most fixes are single-property CSS changes (z-index, overflow, min-width) or one-line component adjustments. The pattern reveals a systemic lack of design tokens, layout primitives, and visual regression testing, forcing developers to manually spot and patch every visual bug.

## Leadup
The project's UI started as a direct port of `react-tweet`'s Twitter theme CSS, then was extended with:
- Thread lines (comment branching visualization) — custom CSS with manual pixel offsets
- Screenshot mode (screenshot-as-image feature) — requires layout that looks good at fixed width
- Plain mode (minimalist view without Twitter chrome) — alternate layout path
- Mobile responsive — added ad-hoc after desktop-first design
- Settings panels with tabs, popovers, and drawers — Radix UI component integration

Each of these features introduced new CSS rules that interact with existing ones in unpredictable ways, especially around z-index stacking and overflow containment.

## Fault
Representative fault patterns:

1. **Z-index wars** (`352d467`): Avatar z-index was lower than thread lines, causing the avatar to appear "behind" the connection line. Fixed by changing a single `z-index` value.

2. **Overflow cropping** (`3889e3c`): Long usernames overflowed the tweet header because no `text-overflow: ellipsis` or `overflow: hidden` was applied to the username container.

3. **Layout component signature** (`322e4e8`): The `Layout` component didn't accept `children`, requiring a prop interface change — a basic React pattern missed during initial implementation.

4. **Radix UI imports** (`dc577fb`): Default imports were used instead of named imports for Radix UI components, causing issues with tree-shaking and type resolution.

5. **Thread line measurement** (`3dc1be2`): When screenshot mode toggled, DOM nodes remounted, invalidating height measurements used for thread line positioning. Required `useMemo` + `createRef` restructuring across 89 lines of diff.

6. **Render performance** (`513a847`): Tweet list re-rendered excessively because `MainThreadLine` wasn't memoized and `useElementSize` didn't do deep comparison on size changes.

7. **Responsive gaps** (`56ee649`): `SettingsRow` component was incorrectly used in mobile layouts, and the mobile breakpoint behavior wasn't consistent across settings panels.

8. **Min-width constraint** (`043273f`): Plain mode had no minimum width, causing content to collapse on narrow viewports.

9. **Button placement** (`1e5ca7a`, `ccdf83c`): Bilibili publish button was in the wrong location (item selector vs footer), back button needed to be a `<Link>` instead of a `<button>` for proper navigation.

10. **Video cover-only mode** (`6af156f`): Videos in the UI needed to show only the cover frame, not the full player, for a cleaner tweet display.

11. **Single-image portrait restraint** (`3f9b447`): When there's only one image and it's portrait orientation, the width needed to be constrained — a layout rule that only emerged from manual testing.

## Impact
- **Affected users**: All users — visual bugs degrade perceived quality
- **Severity**: Individually SEV-3 (cosmetic), but collectively they undermine trust in the UI
- **Developer cost**: ~20 fix commits is significant overhead for what should be caught by visual regression testing

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why do visual bugs keep appearing? | CSS is written ad-hoc per component without a shared set of design tokens or layout primitives. |
| 2 | Why are there no design tokens? | The project started from `react-tweet`'s Twitter theme CSS, which is a standalone stylesheet. Extensions were added directly to `.module.css` files without extracting common values. |
| 3 | Why wasn't this systematized? | CSS changes feel "too small to refactor" — each z-index fix is 1 line. The cumulative cost of 20 such fixes went unnoticed. |
| 4 | Why aren't visual bugs caught before merge? | No visual regression testing. Every bug was caught by the developer manually browsing the app. |
| 5 (root) | — | **The project has no visual regression testing and no shared CSS design tokens, so every layout change must be manually verified across all modes (desktop, mobile, plain, screenshot, thread) — a combinatorial explosion the developer can't keep in their head.** |

**Root cause (one sentence):** Absence of visual regression testing and shared CSS tokens forces manual verification of every layout change across 5+ rendering modes.

## Detection
- Every bug caught by manual inspection
- No automated screenshot comparison
- No Storybook visual tests (despite having Storybook configured — `fa92657` fixed Storybook TC types)

## Recurrence
- Z-index issues: at least 2 separate fixes (`352d467` for avatar, and implicit in `3dc1be2` thread line work)
- Overflow/truncation: recurring theme across tweet header, settings panel, and media display
- Component signature issues: `Layout` props, `SettingsRow` usage — basic React patterns missed under time pressure

## Lessons Learned
- **What went right?** Each fix was small and low-risk — no cascading regressions from any individual CSS change.
- **What could be better?** A visual regression test would have caught 80% of these before merge. Setting one up (Chromatic or Percy) is a one-time cost that pays back after ~5 prevented fixes.
- **Where did we get lucky?** No CSS bug caused data loss or functional breakage — purely visual issues.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Define CSS custom properties for z-index layers (`--z-header`, `--z-avatar`, `--z-thread-line`, `--z-overlay`, `--z-popover`) and enforce via stylelint rule | Prevention | — | All z-index values reference CSS variables; stylelint blocks raw integers |
| 2 | Define design tokens for spacing, breakpoints, and typography in a shared `tokens.css` | Prevention | — | No magic numbers in component CSS; all spacing values reference tokens |
| 3 | Set up Chromatic or Percy visual regression testing on Storybook stories | Detection | — | PR comment shows visual diffs for any CSS change; blocking on regressions |
| 4 | Add Storybook stories for tweet in all modes: default, plain, screenshot, mobile (375px), thread with 3+ levels | Prevention | — | CI runs Chromatic on these stories |
| 5 | Create a Layout audit checklist for new features: verify desktop/mobile/plain/screenshot/thread view | Prevention | — | Part of PR template |

## Changed Files
```
app/components/tweet/Tweet.tsx
app/components/tweet/CommentBranch.tsx
app/components/tweet/PlainTweet.tsx
app/components/tweet/SelectableTweetWrapper.tsx
app/components/layout/Layout.tsx
app/components/layout/PageHeader.tsx
app/components/settings/SettingsRow.tsx
app/lib/react-tweet/twitter-theme/tweet-header.tsx
app/lib/react-tweet/twitter-theme/tweet-body.module.css
app/lib/react-tweet/twitter-theme/theme.css
app/app.css
app/hooks/use-element-size.ts
```

## Related Postmortems
- #008 (Fonts and Rendering) — font rendering overlaps with screenshot layout issues
- #005 (Media Handling) — media display layout overlaps with this cluster
