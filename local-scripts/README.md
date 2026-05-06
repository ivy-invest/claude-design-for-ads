# local-scripts/

`capture.js` runs on your computer (not inside Claude Design) and
produces an MP4 from a contract-compliant animation HTML file.

It uses two well-known tools under the hood:

- **Puppeteer** — runs a Chromium browser invisibly, behind the
  scenes, so the script can drive your animation without opening a
  visible window. Installed automatically by `npm install`.
- **ffmpeg** — encodes the captured frames into an MP4 file. Install
  separately (e.g. `brew install ffmpeg` on Mac).

It's the worked-out version of the procedure documented in
[`../ad-toolkit/video-export-contract.md`](../ad-toolkit/video-export-contract.md)
under "Capture pipeline cheatsheet." Use this as-is, or read it as a
reference and build your own render script in another language.

---

## Quick start

From the repo root:

```bash
npm install                # installs Puppeteer (one time)
brew install ffmpeg        # or apt-get, etc. — also one time

node local-scripts/capture.js \
  --input=path/to/animation.html \
  --output=path/to/animation.mp4
```

Defaults: 1080×1080 square video at 60fps, with text rendered at 2×
the output size and shrunk down for crispness. Output quality is
visually lossless.

---

## Common variations

By default, the script auto-detects the Stage's authored dimensions
(via `window.__capture.width` / `.height`) — so a 1080×1920 animation
renders at 1080×1920 without any flags, a 2160×3840 4K animation
renders at 2160×3840, etc.

`--width` and `--height` only matter as overrides — for example, to
render an 1080×1080 source at a smaller preview size, or to force a
specific output even if the Stage was authored larger:

```bash
# Force a smaller preview render (the Stage is still authored at 1080×1080,
# but we render the captured frames into a 540×540 MP4)
node local-scripts/capture.js \
  --input=path/to/animation.html \
  --output=path/to/animation-preview.mp4 \
  --width=540 --height=540
```

Note: the animation must be authored at the target aspect ratio — a
1:1 animation can't be reflowed to 9:16 by changing flags. 4K renders
take noticeably longer than 1080p (each frame screenshot is 4× larger).

---

## How it works

1. Loads your animation HTML in an invisible Chromium browser, with
   `?embed=1` in the URL so the playback controls are hidden.
2. Waits for the animation's `window.__capture` API to load, then
   pauses the playhead at time 0.
3. For each frame (60 per second × the animation's duration in
   seconds):
   - jumps the playhead to that exact time (`window.__capture.seek(...)`)
   - waits two browser frame ticks so React can render the new state
   - takes a screenshot
4. Pipes all the screenshots through ffmpeg, which scales them down
   from 2× to the target output size and encodes the result as an MP4.

Because the script jumps the playhead frame-by-frame (rather than
letting the animation play in real time and trying to catch up), you
get identical output every run, and rendering is usually faster than
real-time playback.

---

## Options

```
--input=<path>      input HTML file (required)
--output=<path>     output MP4 file (required)
--duration=<s>      total seconds (default: read from the animation itself)
--fps=<n>           output frame rate (default: 60)
--width=<px>        output width (default: auto-detect from window.__capture.width,
                    falling back to 1080 if the Stage doesn't expose it)
--height=<px>       output height (default: auto-detect from window.__capture.height,
                    falling back to 1080)
--scale=<n>         render at this multiple of output size before shrinking,
                    for crisper text (default: 2; try 3 or 4 at 4K)
--crf=<n>           video quality; lower = better (default: 18, visually
                    lossless; default ffmpeg is 23, noticeably softer)
```

---

## Troubleshooting

**`window.__capture` never appears.** Your input HTML doesn't satisfy
the contract. Open it in a regular browser, open the developer
console (Cmd+Option+J on Mac, Ctrl+Shift+J on Windows/Linux), and type
`window.__capture`. If it says `undefined`, the export is missing the
API. Make sure
[`../ad-toolkit/video-export-contract.md`](../ad-toolkit/video-export-contract.md)
is in your organization's Design System and the `CLAUDE.md` snippet
is in place, then ask Claude Design to re-generate.

**Video plays back too fast or too slow.** The animation HTML probably
has `loop={true}` still set on the `<Stage>` component. With looping
on, the script catches the start of the next loop in your output's
last frames. Re-export with `loop={false}` (the contract requires it).

**Text looks soft or aliased.** Increase `--scale` to 3 or 4. The
default of 2 looks sharp at 1080p; if you're outputting at 4K
(`--width=2160 --height=2160`), bump it up.

**Last frame shows the start of the animation.** Same root cause as
"plays too fast" — the animation is set to loop. Re-export with
`loop={false}` set on the `<Stage>` component.

**ffmpeg: command not found.** ffmpeg isn't installed. On Mac:
`brew install ffmpeg`. On Windows: download from
[ffmpeg.org](https://ffmpeg.org/download.html). On Linux:
`apt install ffmpeg` or your distro's equivalent.
