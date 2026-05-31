# Postmortem 005: No Unified Media Pipeline — Proxy, Video, and Screenshot Scattered Across the Codebase

- **日期**: 2026-05-31
- **严重级别**: SEV-2
- **分类**: Architecture
- **状态**: Active

## Summary
Media handling — proxy URLs, video downloading, screenshot capture, and image display — generated 8 fix commits across 6 different files. The absence of a unified media pipeline means each feature (video proxy, video download, screenshot) implements its own URL transformation and fetching logic, leading to duplicate bugs: double-proxying, missing proxy application, headless browser font failures, and hardcoded wait times.

## Leadup
The media features were added piecemeal:
1. **Media proxy**: A proxy server to bypass Twitter's cross-origin restrictions on media URLs (`mediaProxyUrl` in app config)
2. **Video download**: Download media button that fetches video files through the proxy
3. **Screenshot mode**: Headless browser (Puppeteer/modern-screenshot) captures tweet as JPEG/PNG
4. **Video cover mode**: During screenshots, videos should display cover frame only (`58bdb57`)

Each feature was implemented independently, creating parallel URL transformation logic that must stay in sync.

## Fault
Key fault patterns:

1. **Proxy URL not applied to videos** (`d3bdbb3`): The `getMp4Video()` function returned video URLs without applying the media proxy. Because `useProxyMedia()` was only called in React components, the utility function in `lib/react-tweet/utils/index.ts` didn't have access to proxy logic. Fix: imported `useProxyMedia` into the utility and added a `force` parameter.

2. **Double proxy prevention missing** (`d3bdbb3`): Once the proxy was applied to video URLs, there was no check to prevent applying it twice. The fix added `url.startsWith(mediaProxyUrl)` guard — but this guard only exists in `useProxyMedia`. If any other code path constructs a proxy URL, there's no protection.

3. **Proxy URL removed prematurely** (`6d21f45`): The media proxy URL was removed at some point, only to be added back later with more logic. The commit message "remove proxy media url" suggests the proxy was partially disabled rather than managed through configuration.

4. **Video download missing proxy** (`911ece5`): The `DownloadMedia` component downloaded videos directly, without going through the proxy. Fix: added proxy URL prefix to the download URL. This is the same class of bug as #1 — different code path, same missing proxy application.

5. **Screenshot hardcoded wait** (`8047bd6`): Screenshot capture used `setTimeout(..., 500)` to wait for DOM rendering. On slow renders, 500ms wasn't enough; on fast renders, 500ms was wasted. Fix: replaced with `requestAnimationFrame` — but this only works for single-frame renders, not for images or fonts still loading.

6. **Screenshot browser options** (`09acdc5`): Browser launch options for Puppeteer screenshots needed optimization — likely around `--no-sandbox`, `--disable-gpu`, or viewport settings specific to the server environment.

7. **Screenshot video cover mode** (`58bdb57`): A 90-line change to `tweet-media-video.tsx` added a `showCoverOnly` prop for screenshot mode. This required threading a `screenshoting` state through 6 files — the video component, tweet component, save-as-image component, translation store, tweet media, and the tweet route.

8. **Media component rendering** (`9f0cbd6`): Media components displayed inconsistently because Twitter's media rendering logic wasn't fully ported.

## Impact
- **Affected users**: Users who view or download media — broken videos, missing proxy, screenshot failures
- **Silent failures**: Video download without proxy might appear to work but fail in production behind CORS
- **Developer cost**: Each media fix requires touching 2-4 files because proxy logic is duplicated

## Root Cause

| Why # | Question | Answer |
|-------|----------|--------|
| 1 | Why is proxy logic scattered across components and utilities? | `useProxyMedia()` is a React hook, so it can't be used in non-React utility functions like `getMp4Video()`. |
| 2 | Why is `useProxyMedia` a hook instead of a pure function? | It reads from Zustand store (`useAppConfigStore`), which requires the React hook context. |
| 3 | Why does the store need to be the source of proxy config? | The proxy URL and toggle are user-configurable settings persisted in Zustand. |
| 4 | Why wasn't a non-React proxy utility created alongside the hook? | The hook was the path of least resistance. Adding a parallel utility seemed like duplication — but the real duplication is in 4+ code paths implementing their own proxy logic. |
| 5 (root) | — | **Media proxy configuration lives in React state (Zustand), forcing all proxy consumers to be React components or hooks — but media utilities in `lib/` need proxy access too, creating a structural conflict that each fix patches over without resolving.** |

**Root cause (one sentence):** Proxy configuration is trapped inside React state (Zustand), preventing non-React media utilities from accessing it, causing each utility to either miss proxy application or duplicate the logic.

## Detection
- Manual testing: video playback failures, download errors in console
- No automated test verifies that all media URLs flowing through the app have proxy applied
- **Detection gap**: A unit test that verifies `getMp4Video()` output contains the proxy URL prefix

## Recurrence
- Video proxy missing: fixed twice (`d3bdbb3` for playback, `911ece5` for download) — same bug, different consumers
- The double-proxy guard added in `d3bdbb3` could recur if another media source (images, GIFs) needs proxy

## Lessons Learned
- **What went right?** The `force` parameter design in `useProxyMedia` is clean — it separates the user toggle from the programmatic need for proxy.
- **What could be better?** The `force` parameter should have been the default design from the start, with the toggle being the optional behavior.
- **Where did we get lucky?** No user reported broken video playback in production before the proxy fix was applied.

## Corrective Actions

| # | Action | Type | Owner | Completion Criteria |
|---|--------|------|-------|---------------------|
| 1 | Extract `createMediaUrl(originalUrl, config)` as a pure function in `lib/media/proxy.ts` with a singleton config that doesn't depend on React | Prevention | — | All code paths (React and non-React) call the same function for proxy URL construction |
| 2 | Add a debug-only ESLint rule or comment convention that flags any direct use of Twitter media URLs (`pbs.twimg.com`, `video.twimg.com`) without going through `createMediaUrl` | Detection | — | grep for raw Twitter CDN URLs in `app/` returns zero results |
| 3 | Add unit tests: `getMp4Video()` returns proxy-prefixed URLs, `DownloadMedia` uses proxy URL, double proxy is idempotent | Prevention | — | Tests in `lib/media/__tests__/` |
| 4 | Replace screenshot `requestAnimationFrame` wait with a proper font-loading promise: `document.fonts.ready` | Prevention | — | Screenshot doesn't capture until all fonts are loaded |
| 5 | Create a `MediaPipeline` abstraction that wraps URL transformation, download, and screenshot in one interface | Prevention | — | New media features only implement against `MediaPipeline`, not ad-hoc URL construction |

## Changed Files
```
app/lib/react-tweet/utils/index.ts
app/lib/stores/appConfig.ts
app/components/translation/DownloadMedia.tsx
app/components/saveAsImage.tsx
app/components/tweet/Tweet.tsx
app/lib/react-tweet/twitter-theme/tweet-media-video.tsx
app/lib/react-tweet/twitter-theme/tweet-media.tsx
app/hooks/use-screenshot-action.ts
app/lib/browser.ts
```

## Related Postmortems
- #001 (Twitter Content Parsing) — media entity parsing shares code paths with media display
- #008 (Fonts and Rendering) — screenshot font issues overlap with this cluster
- #004 (Build Configuration) — env variable handling for proxy config
