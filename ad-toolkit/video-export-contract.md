# Video export contract

Build-time requirements for any animation in this design system that will be rendered to MP4. Following these makes one HTML source serve three modes — interactive review, screen-recordable embed, and deterministic frame capture — with no code changes.

This file documents *what to build*. Craft heuristics live in `animation-design-principles.md`. Recording/encoding is in `../local-scripts/README.md` (reference only — not your job to run).

`video-stage.jsx` in this folder satisfies §1, §3, and §4 out of the box. Use it.

**Per-export workflow:** when asked to "save as standalone HTML" or "render to MP4," read this contract first — project conventions here override generic export skills.

---

## 1. Stage configuration

```jsx
<Stage
  width={1080} height={1080}      // target output dimensions
  duration={50}
  background="#082519"
  loop={false}                     // REQUIRED: animation must stop at t=duration
  autoplay={true}
>
  <YourAnimation />
</Stage>
```

`loop={false}` is the critical one — looping animations have no stable last frame, so recorders cut into a transition.

## 2. Final frame must hold

The closing composition (logo, CTA, headline) must be **fully visible** at `t === duration`, with no exit fade. Reach the final state by ~`duration - 3s` and hold. This guarantees a clean closing frame for any recorder.

## 3. Embed mode (`?embed=1`)

When `?embed=1` is in the URL, the Stage must:

- Hide all player chrome (scrubber, play/pause)
- Drop the dark wrapper background and any preview affordances (drop-shadow, etc.)
- Skip localStorage persistence so each load starts at `t=0`
- Fill the viewport edge-to-edge at native scale

`video-stage.jsx` does this. If you fork the runtime, preserve the behavior.

## 4. `window.__capture` API

Expose this global in both interactive and embed modes:

```ts
window.__capture = {
  seek(t: number): void   // jump to time t (clamped to [0, duration])
  play(): void
  pause(): void
  duration: number
  width: number           // Stage width in px — capture.js auto-sizes the viewport from this
  height: number          // Stage height in px
  readonly time: number
  readonly playing: boolean
}
```

`video-stage.jsx` exposes this automatically. Surfacing `width` and `height` lets external capture pipelines auto-detect the intended canvas size instead of needing it passed by flag — important for non-square aspect ratios (9:16, 16:9, etc.).

## 5. Virtual-time-safe timing

All animation logic must derive from the framework's time source — `useTime()`, `<Sprite>` `localTime`, or a `requestAnimationFrame` callback's `t` parameter. Never use `Date.now()`, `performance.now()`, or `setTimeout`/`setInterval` for animation timing.

This is what makes `seek(12.4)` produce the exact t=12.4 frame regardless of wall-clock time. (Non-animation `setTimeout` — debounced input, etc. — is fine.)

## 6. Lift JSX-string asset references

The standalone bundler can inline assets referenced as HTML attributes (`<img src="...">`), but it cannot inline assets referenced as **strings inside JSX/JS**. For any asset referenced from JSX:

```html
<!-- In <head> -->
<meta name="ext-resource-dependency" content="assets/logo.svg" data-resource-id="assets/logo.svg" />
```

```jsx
<img src={(window.__resources && window.__resources['assets/logo.svg']) || 'assets/logo.svg'} />
```

**Both halves are required.** The JSX-side fallback expression alone keeps the dev file working when served from disk — but if the matching `<meta>` tag is missing, `window.__resources` will be empty in the bundled standalone and the asset will 404. A missing meta tag does not surface until after bundling.

The literal-path fallback keeps the un-bundled file working during development.

## 7. Verify the standalone

After running the bundler, open the output and confirm:

- No `[bundle] error` entries in the console
- No `<img>` element has `naturalWidth === 0` (a broken-image icon is the #1 sign that §6 is incomplete — the meta tag is missing for that asset)
- The final frame matches the dev file's final frame visually

A 60-second visual check catches the class of bug that §6 violations produce.

## 8. Self-contained, offline-capable

The bundled HTML must work with zero network access at runtime — no CDN scripts (React, Babel), no remote fonts, no external image/asset URLs.

Inline everything:
- React, ReactDOM, Babel — as inline `<script>` blocks, not `<script src="https://unpkg.com/...">`
- Fonts — as `@font-face` rules with `src: url(data:font/woff2;base64,...)`, or via the resources manifest
- All assets — already covered by §6 (`window.__resources`)

A standalone file that depends on the network is not standalone. If you need a "readable, dev-friendly" export with CDN script tags, mark it explicitly as a *non-standalone* artifact (e.g. `(CDN).html`) so it isn't confused with the true standalone.
