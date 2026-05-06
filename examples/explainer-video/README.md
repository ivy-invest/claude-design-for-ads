# Worked example: 50-second explainer video

A complete animation built end-to-end against the contract in `../../ad-toolkit/video-export-contract.md`. Read this alongside the contract to see what "good" looks like in practice.

> **Note on IP:** the example uses real brand IP from Ivy Invest (logo, wordmark, brand colors, copy). It's included verbatim because the project was developed live; the structure and timing decisions are what's worth studying. If you're sharing this toolkit externally, either replace the brand assets with your own, or treat this folder as illustrative-only and provide your own worked example.

## Files

- `brief.md` — the brief that produced this animation.
- `explainer.html` — entry point. Inlines `video-stage.jsx`, `scenes.jsx`, and the brand SVGs as data URIs, with React, ReactDOM, Babel, and the brand fonts loaded from CDN (unpkg + Google Fonts). Instantiates the Stage at 1080×1080 / 50s. **This is the readable-CDN variant intentionally** — it stays grep-friendly and diff-friendly so you can study how the contract is satisfied. Production exports should follow §8 of the contract (truly self-contained, zero network access at runtime); see the contract for the marker convention if you ship both flavors side by side.
- `scenes.jsx` — the animation source, kept alongside as readable reference. Six beats, each as a `<Sprite start end>` block, with helper components for the staggered text (`StaggerLine`) and animated pie chart (`AnimatedPie`). When you change this file, re-inline it into `explainer.html`.
- `assets/` — brand SVGs (also kept as readable reference; the running page uses inlined copies).

## How to run

Just open `explainer.html` directly in a browser — no server needed.

- **Interactive review:** `explainer.html` — full chrome (scrubber, play/pause), playhead persists across reloads.
- **Embed mode:** `explainer.html?embed=1` — chrome stripped, canvas fills viewport, ready for screen recording or headless capture.

In either mode, `window.__capture` is exposed for deterministic frame stepping (see contract §4).

## What to study in `scenes.jsx`

Concrete examples of the contract's principles in action:

- **Beat 2 → Beat 3 bridge** (~lines 180–230): the pie chart migrates position + size during the last 0.9s of Beat 2, so when Beat 3 takes over, the same pie is already in its target spot. No crossfade — one continuous element. (Contract §"Beat-to-beat transitions: bridge or pause".)
- **`AnimatedPie` uniform angular velocity** (~lines 90–130): wedge draw durations scale with wedge size, so the entire pie reads as one continuous sweep. (Contract §"Sequential reveals: equal velocity, not equal duration".)
- **Final beat at full opacity at t=duration** (Beat 6, ~lines 720+): logo, tagline, CTA hold from t≈47 onward with no exit fade. (Contract §2.)
- **Asset references via `window.__resources`** (Beat 6, the `<img>` blocks): every brand SVG is referenced as `(window.__resources && window.__resources['assets/...']) || 'assets/...'` so the standalone bundler can inline them. (Contract §6.)
- **Type minimums for mobile-feed ad** (throughout): hero text 60–68px, body 38–44px, captions 22–28px. (Contract §"Type minimums by deployment surface".)
