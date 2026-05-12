# local-scripts/

`capture.js` runs on your computer (not inside Claude Design) and
turns a Claude Design HTML page (animation or static design) into
an MP4 or a PNG. It auto-detects which kind of input it has — if
the page exposes `window.__capture` (animation), it captures
frame-by-frame and encodes to MP4; otherwise it screenshots the
design's wrapper element at 2× DPR and produces a PNG.

`video-stage.jsx` is the toolkit's contract-compliant Stage runtime.
When the input HTML references the default `animations.jsx` runtime,
capture.js intercepts that request and substitutes `video-stage.jsx`
in flight, so deterministic frame capture works regardless of which
Stage the source was authored against. (Most users won't notice this
machinery — Claude Design's standalone-HTML exports already inline a
compatible runtime.)

It uses two well-known tools under the hood:

- **Puppeteer** — runs a Chromium browser invisibly, behind the
  scenes, so the script can drive the page without opening a
  visible window. Installed automatically by `npm install`.
- **ffmpeg** — encodes the captured animation frames into an MP4
  file. Install separately (e.g. `brew install ffmpeg` on Mac).
  Not used for the static-image path.

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

`--input` is normally a local HTML file you got via Claude Design's
**Share → Export as standalone HTML**. http(s) URLs are also accepted
but rarely work for Claude Design these days — Anthropic now requires
auth on Present-mode preview URLs, so a fresh headless session can't
pass the gate. URL capture remains in capture.js for non-Claude-Design
hosts that serve unauthenticated standalone HTML; see "Capturing from
a URL (advanced)" below.

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

## Capturing from a URL (advanced)

`--input` accepts http(s) URLs as well as local file paths. For most
Claude Design users this isn't a useful path anymore — Anthropic
requires auth on Present-mode preview URLs, so capture.js's headless
session can't reach the actual content (it gets a sign-in page or
Cloudflare challenge instead). The script detects both failure modes
and exits with a clear "use Share → Export as standalone HTML
instead" message.

The URL path is still useful for:

- Non-Claude-Design hosts that serve standalone HTML without auth
  (your own dev server, an internal CDN, etc.).
- Claude Design URLs in the rare case they ever become publicly
  accessible without auth in the future.

When given a URL, capture.js intercepts requests for the default
`animations.jsx` Stage runtime in the Puppeteer session and
substitutes our contract-compliant `video-stage.jsx` in flight, so
the page exposes `window.__capture`, supports `?embed=1`, and stops
cleanly at `t=duration` regardless of what the source originally
shipped with. Other relative `.jsx` scripts on the same origin get
re-fetched with the original URL's auth token (if present) and
served via the same interception.

```bash
node local-scripts/capture.js \
  --input="https://your-host.example.com/My%20Animation.html" \
  --output=animation.mp4
```

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

**"Cloudflare blocked the headless browser session" error.** The
Claude Design URL you pasted is gated behind a Cloudflare bot-
detection challenge that headless Chrome can't pass. Your real
browser already cleared the challenge for that session, but
Puppeteer's fresh session is treated as a bot. Workaround: in Claude
Design, click **Share → Export as standalone HTML**, then drag
*that* file into `render.command` instead of pasting the URL.
`file://` URLs aren't behind Cloudflare, so the local-file path
always works.

**"Couldn't access the Claude Design preview URL" error.** Anthropic
requires auth on Present-mode preview URLs, so capture.js's headless
session gets redirected to sign-in instead of the actual design.
Workaround: same as above — in Claude Design, click **Share → Export
as standalone HTML** and render the downloaded file instead.

**Animation came out as a PNG instead of an MP4.** capture.js
auto-detects animation vs static design by checking whether
`window.__capture` is exposed. For animations from Claude Design
preview URLs, capture.js substitutes a contract-compliant runtime
in flight, so this should always work. If you're rendering a
downloaded standalone HTML and it falls through to the static
path, the export is probably missing the `<Stage>` component or
its child structure. Re-export from Claude Design and try again.

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
