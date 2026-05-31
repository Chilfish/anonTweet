# Postmortem 008: Font Loading Is OS-Dependent, Headless-Browser-Dependent, and Undertested

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Dependency
- **状态**: Mitigated

## Summary
Chinese text and emoji rendering required 3 fix commits spanning font loading strategy, character coverage, and headless browser font availability. The root cause is a fragile dependency chain: the app runs in a browser (user's OS fonts), in a headless browser (Puppeteer, limited system fonts), and in the DOM (web fonts loaded via CSS). Each environment has different font fallback behavior, and there's no automated validation that all three environments render CJK and emoji correctly.

## Leadup
The project renders Chinese text in three contexts:
1. **Browser UI**: The React app running in the user's normal browser — uses OS fonts and web fonts (`Inter`, `Noto Sans SC`)
2. **Screenshot capture**: Puppeteer/modern-screenshot running in a headless Chromium — limited to fonts explicitly loaded or bundled
3. **Server-side rendering**: SSR during initial page load — fonts may not be loaded yet

The font stack was initially:
```css
font-family: 'Inter', 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif
```
This stack has no Chinese font — it falls back to the OS default, which varies across Windows (SimSun/微软雅黑), macOS (PingFang SC), and Linux (Noto Sans CJK or nothing).

## Fault
Key fault patterns:

1. **Missing Chinese font** (`0af302e`): The initial font stack had no Chinese font, relying entirely on OS fallback. On systems without Chinese fonts (headless Linux, some Windows configs), Chinese text rendered as tofu (□). Fix: added `Noto Sans SC` as the primary Chinese font, removed redundant Puppeteer font downloads, and explicitly set the font in the Twitter theme CSS.

2. **Emoji rendering in headless browser** (`138868b`): The headless Chromium used for screenshots doesn't have system emoji fonts. The Unicode `Emoji` font was missing, causing emoji to render as empty boxes or fallback glyphs. Fix: added `UnifontEX` (a comprehensive Unicode font covering emoji code points) to the font stack specifically for emoji fallback.

3. **Screenshot font loading race condition** (`8047bd6`): The screenshot capture used a hardcoded 500ms `setTimeout` to wait for fonts to load, but web fonts (Noto Sans SC loaded from CDN) might not arrive within 500ms on slow connections. Fix: replaced `setTimeout` with `requestAnimationFrame`, moved `UnifontEX` to a CDN for cross-origin stability, updated `unicode-range` to be more precise, and adjusted font declaration priority to prefer emoji fonts over text fonts for emoji code points.

   ```typescript
   // Before:
   await new Promise(resolve => setTimeout(resolve, 500))  // race condition

   // After:
   await new Promise(resolve => requestAnimationFrame(resolve))  // still not font-aware
   ```

   Additionally, the screenshot options were enhanced with explicit font CSS:
   ```typescript
   font: {
     preferredFormat: 'woff2',
     cssText: `
       p {
         font-family: 'Inter', "Apple Color Emoji", "Segoe UI Emoji",
           "Noto Color Emoji", "Segoe UI Symbol", 'UnifontEX',
           'Noto Sans JP', sans-serif;
       }
     `,
   }
   ```

## Impact
- **Affected users**: All Chinese-reading users — tofu characters in tweet text, missing emoji in screenshots
- **Affected contexts**: Primarily screenshot capture (headless browser), secondarily browser UI on systems without Chinese fonts
- **Duration**: Dec 2025 – Feb 2026, 3 fix commits

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why did Chinese characters render as tofu? | The font stack had no explicit Chinese font — it relied on OS default fallback. |
| 2 | Why wasn't a Chinese font in the stack from the start? | The project started as an English-first Twitter archiver using `react-tweet`'s default theme. Chinese text support was added later, and the font stack wasn't updated. |
| 3 | Why does the headless browser have different font behavior? | Puppeteer/Chromium in headless mode uses a minimal set of system fonts. Web fonts must be explicitly loaded via CSS `@font-face`. System emoji fonts are not available. |
| 4 | Why isn't font loading waited on properly? | The screenshot code uses `requestAnimationFrame`, which waits for one paint cycle — but web fonts may take multiple cycles or complete asynchronously. `document.fonts.ready` is the correct API and was not used. |
| 5 (root) | — | **The font loading strategy is environment-dependent (OS, headless, SSR) with no automated validation that CJK + emoji glyphs render correctly across all three environments.** |

**Root cause (one sentence):** Font rendering for CJK and emoji is validated manually across three runtime environments (browser, headless, SSR), and the screenshot capture doesn't wait for web fonts to finish loading.

## Detection
- Manual testing: screenshots showed tofu where Chinese or emoji should be
- No automated screenshot comparison that checks for missing glyphs
- No CI test that verifies `document.fonts.ready` resolves with the expected font family list
- **Detection gap**: A "tofu detector" — a visual regression test that checks for the Unicode replacement character (U+FFFD □) in screenshot output

## Recurrence
- The `requestAnimationFrame` fix was applied (`8047bd6`) but still doesn't solve the root problem — it shortens the race window but doesn't close it
- If a new Unicode block is needed (e.g., Arabic, Korean), the same class of font-stack bug would recur
- The `UnifontEX` CDN dependency creates a new point of failure — if the CDN is unavailable, screenshots will show tofu for emoji

## Lessons Learned
- **What went right?** The three fixes were applied in the right order: (1) add Chinese font, (2) add emoji font for headless, (3) fix the loading race. Each fix built on the previous.
- **What could be better?** Using `document.fonts.ready` instead of `requestAnimationFrame` would close the race condition entirely. The `fonts.css` file should be treated as a critical resource.
- **Where did we get lucky?** Most users are on macOS or Windows with good system CJK fonts, so the browser UI was unaffected. Screenshot was the primary failure mode.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Replace `requestAnimationFrame` with `document.fonts.ready` in screenshot capture | Prevention | — | Screenshot waits for all fonts to load before capturing |
| 2 | Add a screenshot CI test: capture a tweet containing Chinese + emoji, verify output image has no U+FFFD replacement characters | Detection | — | CI test uses OCR or pixel analysis to detect tofu glyphs |
| 3 | Add a `@font-face` for `UnifontEX` in `fonts.css` with a local fallback path so the CDN isn't a single point of failure | Prevention | — | `src: local('UnifontEX'), url('...')` — local takes priority |
| 4 | Document the font stack rationale in `docs/fonts.md`: which fonts cover which Unicode blocks, why they're in this order, and how to test a new locale | Prevention | — | File exists and is updated when the font stack changes |
| 5 | Add a `preload` link tag for critical web fonts (`Noto Sans SC`, `UnifontEX`) in `root.tsx` to begin loading before CSS parsing | Prevention | — | `<link rel="preload" as="font" ...>` in document head |

## Changed Files
```
app/fonts.css
app/root.tsx
app/hooks/use-screenshot-action.ts
app/lib/browser.ts
app/lib/react-tweet/twitter-theme/theme.css
app/lib/react-tweet/twitter-theme/tweet-body.module.css
```

## Related Postmortems
- #003 (UI Styling/Layout) — CSS and screenshot layout issues overlap
- #005 (Media Handling) — screenshot capture code is shared
- #004 (Build Configuration) — CDN dependency management
