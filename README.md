# claude-design-for-ads

Take animations and designs you make in [Claude Design](https://claude.ai/)
and turn them into the actual files you need to ship — MP4 videos for
Reels/TikTok/Meta/YouTube, and high-resolution PNGs for static ads,
social cards, and print.

Here's an example:

https://github.com/user-attachments/assets/ae9b17e6-955e-4e55-8a7e-1e56d595bc87

(If the above preview doesn't load for you, click here to [view](https://static-assets.ivyinvest.co/claude-design-for-ads/example.mp4).)

The flow:

1. Make an animation or static design in Claude Design.
2. Click **Present** → **New tab** to open the preview, copy that
   tab's URL.
3. Paste the URL into the toolkit's local render script. Animations
   come back as MP4, static designs as high-resolution PNG.

**Why this instead of screen-recording the animation or just asking
Claude Design to export an image?**

- **For animations**, deterministic frame-by-frame capture rather
  than real-time recording. No dropped frames, no jittery timing,
  no cutting into the next loop iteration. The script substitutes
  a contract-compliant Stage runtime in flight so it can pause and
  seek the playhead to any time `t` and screenshot the exact frame
  — output is identical run-to-run.
- **For static designs**, native 2× DPR capture at any size. When
  you ask Claude Design itself to export an image, it caps native
  capture at ~2576px and falls back to a soft 1×-upscaled image for
  anything larger, which produces visibly fuzzy text and vectors at
  print resolutions. This script captures the design's wrapper
  element at 2× DPR directly, with no cap.

---

## Installation

### Mac one-line installer (recommended)

Open the Terminal app (⌘+Space, type **Terminal**, press Enter).
Paste the line below and press Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ivy-invest/claude-design-for-ads/main/install.sh)"
```

The script installs Homebrew (if you don't have it — asks for your
Mac password), Node.js, and ffmpeg via Homebrew, asks you where to
put the toolkit (defaults to `~/claude-design-for-ads`), installs
the render script's dependencies, and renders a tiny smoke test as
a verification step. First run takes 5–10 minutes (mostly the
Homebrew install).

When the verification render opens automatically, the setup worked —
continue to [Using the toolkit](#using-the-toolkit).

### Linux, Windows, or DIY on Mac

The Mac one-liner just runs the standard steps below. If you'd
rather install each piece yourself, or you're not on a Mac:

**Install Node.js and ffmpeg.** Mac: `brew install node ffmpeg`
(install [Homebrew](https://brew.sh/) first if needed). Linux:
`sudo apt install nodejs npm ffmpeg` (Debian/Ubuntu) or your distro
equivalent. Windows: installers from
[nodejs.org/en/download](https://nodejs.org/en/download) and
[ffmpeg.org/download.html](https://ffmpeg.org/download.html).

**Get the toolkit.** Either
`git clone https://github.com/ivy-invest/claude-design-for-ads.git`
or download
[the ZIP](https://github.com/ivy-invest/claude-design-for-ads/archive/refs/heads/main.zip)
and unzip.

**Install the render script's dependencies.** In Terminal, navigate
into the toolkit folder and run `npm install`.

**Render the smoke test to verify:**

```bash
node local-scripts/capture.js \
  --input=examples/hello-world.html \
  --output=example
```

If a short MP4 plays cleanly, your setup works.

---

## Using the toolkit

This is the day-to-day workflow once you've installed the toolkit.
Animations and static designs both go through the same render
pipeline — the script auto-detects which one you've handed it.

1. **Open a Project in Claude Design** and make whatever you want
   to ship — an animation, a poster, an ad, a slide.

2. **Brief Claude Design.** For animations, describe the scenes, the
   motion, the duration, where it'll deploy, and any brand or
   compliance copy. For static designs, just describe what you want.

   **Tip on animations:** if writing the brief from scratch feels
   intimidating, drag
   [`reference/brief-template.md`](reference/brief-template.md) into
   a [Claude.ai](https://claude.ai/) chat, describe what you're
   trying to make in plain language, and let Claude walk you through
   filling in the blanks. Then paste the completed brief into
   Claude Design.

3. **Get the design off Claude Design.** Two ways:

   - **Copy the preview URL.** In Claude Design, click **Present**
     in the upper right and choose **New tab** from the dropdown —
     the design opens in a fresh browser tab. Copy that tab's URL
     (looks like
     `https://...claudeusercontent.com/.../My Design.html?t=...`).
     Fastest path. The token in the URL expires after a few hours,
     so render reasonably soon after copying.
   - **Or save as standalone HTML.** Click **Share** in the upper
     right and choose **Export as standalone HTML**. Gives you a
     self-contained file you can archive, share, or render later
     without depending on a session token.

4. **Render it.** On Mac, open the toolkit folder
   (`~/claude-design-for-ads`) in Finder and double-click
   `render.command`. A Terminal window opens and prompts you to
   paste the URL or drag the HTML file in. Press Enter.

   - For **animations**, the script substitutes a contract-compliant
     Stage runtime in flight, captures every frame deterministically
     via `seek(t)`, and pipes them through ffmpeg → MP4. ~5 minutes
     for a 50s 1080×1080 animation.
   - For **static designs**, the script finds the design's wrapper
     element via a structural heuristic, waits for fonts to apply,
     and screenshots the element at 2× DPR → PNG. Seconds.

   The output lands next to your HTML (or in the toolkit folder for
   URLs) and opens automatically when done.

   On Linux/Windows or if you want control over output settings (size,
   frame rate, etc.), run the capture script directly from Terminal:

   ```bash
   cd ~/claude-design-for-ads
   node local-scripts/capture.js \
     --input=~/Downloads/your-design.html \
     --output=~/Downloads/your-design
   ```

   See [`local-scripts/README.md`](local-scripts/README.md) for
   size variations (9:16 vertical, 4K, etc.) and troubleshooting.

---

## Common questions

**Do I have to use Claude Design?**
The toolkit is built around Claude Design's preview URL conventions
and the `<Stage>` API its default animation runtime exposes, but the
core ideas — runtime substitution at capture time, element-targeted
PNG capture at 2× DPR — work with any tool that produces standalone
HTML in a similar shape. The render script works on any HTML that
exposes a `window.__capture`-compatible API for animations, or any
static design page for images.

**Do I need anything installed in my Claude Design Design System?**
No. Earlier versions of this toolkit installed an image-export
recipe in your Design System; that's no longer needed because
`capture.js` produces high-DPR PNGs entirely locally. Nothing the
toolkit ships gets installed into Claude Design.

**How big can the output PNG be?**
There's no cap from this toolkit. `capture.js` opens the design's
preview at the design's native dimensions (or a sufficiently wide
viewport) and screenshots the design's wrapper element at 2× DPR,
so a 1440×2560 design comes out as a 2880×5120 PNG with crisp text
and vectors.

By contrast, Claude Design's default `save_screenshot` caps native
capture at ~2576px on the longest side, and above that falls back to
upscaling the 1× capture — which produces soft text and vectors
compared to a native 2× render. The local pipeline sidesteps that
cap entirely, so high-DPR ad/print output stays crisp.

**How long does a render take?**
About 5–8 minutes for a 50-second 1080×1080 video on a recent Mac.
Mostly determined by how many frames there are (60fps × 50s = 3000
frames) and how complex the animation is. You can speed it up by
dropping `--fps=30` (cuts to 1500 frames) or `--scale=1` (no
2× supersampling — slightly softer text but ~3× faster).

**My animation came out as a PNG instead of an MP4.**
capture.js auto-detects animation vs static design by waiting briefly
for `window.__capture` to appear. For Claude Design preview URLs the
script substitutes a contract-compliant Stage runtime in flight, so
animations capture cleanly even if the source uses Claude Design's
default Stage. If you're rendering a downloaded standalone HTML and
it falls through to the static path, the export is probably missing
the `<Stage>` component or its expected child structure — re-export
from Claude Design and try again.

**Can I render at a different size or aspect ratio?**
Yes — `--width` and `--height` flags. For a 9:16 vertical (TikTok,
Reels), use `--width=1080 --height=1920`. The animation has to be
authored at that aspect ratio though; you can't reflow a 1:1 animation
to 9:16 by changing flags.

**macOS says "render.command could not be verified" and won't open.**
Recent macOS releases (Sequoia and later) sometimes apply Gatekeeper's
quarantine attribute to files even when downloaded via curl, which
isn't supposed to happen but does. Fresh installs since the fix don't
hit this; if you installed before then, recover by running:

```bash
xattr -dr com.apple.quarantine ~/claude-design-for-ads/
```

Then double-click `render.command` again. (Replace
`~/claude-design-for-ads/` with the path you installed to if you
chose a custom location.)

**Is this an Anthropic project?**
No — we independently developed this at
[Ivy Invest](https://ivyinvest.co) as part of our efforts to generate
better creatives, and we thought others would find it useful too.
Claude Design is Anthropic's; this toolkit is just a set of
conventions and tools for using it more effectively for ads/marketing
work.

---

## What's in the toolkit

```
local-scripts/          — local render pipeline
  capture.js            ← URL or HTML → MP4 (animation) or PNG (static design)
  video-stage.jsx       ← runtime substituted in-flight for animations
  README.md

reference/              — design guides + brief template, read on GitHub or drag into briefs
  brief-template.md
  animation-design-principles.md

install.sh              ← Mac one-line installer (run via curl-bash from Terminal)
render.command          ← Mac convenience: double-click, paste URL or drag HTML

examples/
  hello-world.html      ← tiny smoke test; install.sh renders this to verify the pipeline
```

The pieces, by what they do:

- **`local-scripts/`** is the toolkit's only moving part — capture.js
  + video-stage.jsx + supporting README. capture.js takes a Claude
  Design preview URL or a downloaded standalone HTML, auto-detects
  whether it's an animation or a static design, and produces the
  right output (MP4 or PNG).
- **`reference/`** are design guides — read them on GitHub, or drag
  them into a Claude.ai chat when drafting a brief. They aren't
  installed anywhere; they shape *how you brief* a design.

---

## License

MIT — see [LICENSE](LICENSE).
