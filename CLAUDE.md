## Animated video work

For any animation intended to be rendered to MP4 (ads, social posts, sales-deck embeds, explainers), read both:

- `ad-toolkit/video-export-contract.md` — build-time requirements (stage config, embed mode, capture API, virtual-time-safe timing, asset references). Following this lets the same HTML source serve interactive review, screen-recordable embed, and deterministic frame capture.
- `ad-toolkit/animation-design-principles.md` — craft heuristics (type minimums by surface, sequential reveals at uniform velocity, beat-to-beat bridges vs. crossfades, optical alignment, compliance keyword sweeps, storyboard-as-proposal).

Use the Stage runtime at `ad-toolkit/video-stage.jsx` — it ships with embed mode and `window.__capture` already wired, satisfying §1, §3, and §4 of the contract out of the box. Load it with a `<script type="text/babel">` tag whose `src` points to `ad-toolkit/video-stage.jsx`.

Do **not** use the default `animations.jsx` starter for video work. It lacks embed mode and the capture API; `ad-toolkit/video-stage.jsx` is the video-ready replacement.

## Native-resolution PNG export

When the user asks for a high-resolution PNG of a design (for ads, marketing assets, anything print-adjacent), do **not** use `save_screenshot` — it caps at 1600px on the longest side. Instead follow the procedure in `ad-toolkit/image-export-recipe.md`, which routes through `gen_pptx` (which renders at 2× DPR internally) and downscales to exactly the requested W×H via Lanczos-3. Pass `keep2x: true` if the caller wants the supersampled 2× native render instead.
