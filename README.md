# claude-design-for-ads

Take animations and designs you make in [Claude Design](https://claude.ai/)
and turn them into the actual files you need to ship — MP4 videos for
Reels/TikTok/Meta/YouTube, and high-resolution PNGs for static ads,
social cards, and print.

Here's an example:

<video src="https://github.com/user-attachments/assets/ae9b17e6-955e-4e55-8a7e-1e56d595bc87" poster="https://raw.githubusercontent.com/ivy-invest/claude-design-for-ads/main/assets/preview.png" autoplay loop muted controls playsinline width="540"></video>

This toolkit gives you everything to do that reliably:

- A small ruleset Claude Design follows when making animations and
  high-res images, so the output is always shippable.
- A simple script that turns a Claude Design animation into a finished
  MP4.
- A worked example you can render in five minutes to see how it all
  fits together.

**Two flows, and you only need the parts you'll use.** Both start
with installing the toolkit into your Design System. For static
images, that's the whole setup — Claude Design produces the PNGs
in-Project. For animated videos, you also set up a local render
script that turns the HTML Claude Design produces into a finished
MP4.

---

## A few terms you'll see

The toolkit plugs into how Claude Design is structured. Three terms
to know:

**Design System.** In Claude Design, your **Design System** is an
organization-level UI kit — colors, typography, components, layout
patterns, plus any standing instructions and reference files you've
uploaded. Per [Anthropic's docs](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design),
it's "the foundation for every project created within your account."
You set it up once at the org level (Design Systems live in
organization settings); every Project your org creates from then on
inherits from it automatically. **This is where the toolkit goes** —
add it to the Design System once and every future ad/animation/image
project picks it up by default.

**Project.** An individual workspace inside Claude Design where one
piece of work happens (one ad campaign, one explainer video, one
landing page mock). Projects reference the org's Design System
automatically — you don't wire them up per-project. So when this
toolkit is in your Design System, opening any new Project to make an
ad means the contract and runtime are already loaded.

**`CLAUDE.md`.** A standing-instructions file inside the Design
System. Whatever's in it gets loaded into every Project's
conversations automatically. The toolkit ships a small `CLAUDE.md`
snippet (at the top level of the toolkit) that you paste into your
Design System's own `CLAUDE.md` so Claude Design discovers the contract
and recipe when relevant.

The practical takeaway: **install once at the Design System level,
benefit forever across Projects.** No per-project setup.

---

## Installation

Pick **one** of the three paths below — don't run more than one.

For Mac users, the one-line installer is the simplest path and covers
both flows. If you only need static images and don't want Node/ffmpeg
on your machine, the lightweight option is just to download the ZIP.
On Linux/Windows, follow the manual instructions.

### Mac one-line installer (recommended, for video + images)

Open the Terminal app (⌘+Space, type **Terminal**, press Enter).
Paste the line below and press Enter:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ivy-invest/claude-design-for-ads/main/install.sh)"
```

The script installs Homebrew (if you don't have it — asks for your
Mac password), Node.js, and ffmpeg via Homebrew, asks you where to
put the toolkit (defaults to `~/claude-design-for-ads`), installs the
render script's dependencies, and renders the example animation as a
verification step. First run takes 5–10 minutes (mostly the Homebrew
install).

When the example MP4 opens automatically, the setup worked — continue
to [Add to your Design System](#add-to-your-design-system).

### Image-only quick path (no install required)

If you only need static images, just download
[the ZIP](https://github.com/ivy-invest/claude-design-for-ads/archive/refs/heads/main.zip)
and unzip it (double-click on Mac). The image flow runs entirely
inside Claude Design, so no other local setup is needed — skip ahead
to [Add to your Design System](#add-to-your-design-system).

### Manual install (Linux, Windows, or DIY on Mac)

The Mac one-liner just runs the standard steps below. If you'd rather
install each piece yourself, or you're not on a Mac:

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

**Render the example to verify:**

```bash
node local-scripts/capture.js \
  --input=examples/explainer-video/explainer.html \
  --output=example.mp4
```

If `example.mp4` plays cleanly, your setup works.

---

## Add to your Design System

**Prerequisite: you need a Design System already set up.** If your
org doesn't have one yet, follow
[Anthropic's setup guide](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
to create one (uploads your brand assets, generates a UI kit). The
toolkit is added to an *existing* Design System — don't try to drag
the `ad-toolkit/` folder in during the initial Design System
creation flow. Come back here once your Design System is created
and you can see its **Design Files** tab.

**You do this once at the Design System level**, and every Project
your org spins up from then on can use the toolkit without further
setup.

**Drag the `ad-toolkit/` folder into your Design System.** Open your
Design System, click the **Design Files** tab, and drag the entire
`ad-toolkit/` folder from your computer into the **Drop Files Here**
area. The 5 files inside attach to a chat with the design-system
agent. Send the chat — `INSTALL.md` instructs the agent to:

1. Create a folder called `ad-toolkit/` at the root of your Design
   System and save the 5 files into it.
2. Append the toolkit's snippet to this Design System's root
   `CLAUDE.md` (creating the file if it doesn't exist), so Claude
   Design discovers the toolkit during ad/animation/image work.

The agent should confirm both steps in one short message when it's
done. If it asks you where to put the files instead of just following
`INSTALL.md`, reply: **"Follow `INSTALL.md`."**

To verify the install, open Finder (or your file browser), navigate
to the toolkit folder you unzipped earlier, go into the `examples`
folder inside it, and double-click `hello-world.html`. It should open
in your default browser and play a 5-second animation with playback
controls. Then click into the browser's address bar, add `?embed=1`
to the end of the URL, and hit Enter — the controls should disappear
and the animation should fill the window. If both work, the toolkit
is wired up correctly.

---

## Using the toolkit

Once it's installed at the Design System level, this is the day-to-day
workflow.

### Making an animated video

1. **Open a Project in Claude Design.** Any new Project inherits your
   Design System automatically, so the toolkit is already loaded — no
   per-project setup.

2. **Brief Claude Design.** Describe the animation you want: the scenes,
   the motion, the duration, where it'll deploy (TikTok, YouTube,
   Reels, in-product, etc.), and any brand or compliance copy that has
   to appear. See
   [`examples/brief-template.md`](examples/brief-template.md) for the
   briefing format and
   [`examples/explainer-video/brief.md`](examples/explainer-video/brief.md)
   for a worked example.

   **Tip:** if writing the brief from scratch feels intimidating, drag
   `brief-template.md` into a [Claude.ai](https://claude.ai/) chat,
   describe what you're trying to make in plain language, and let
   Claude walk you through filling in the blanks. Then paste the
   completed brief into Claude Design.

3. **Claude Design produces a single self-contained HTML file** that
   satisfies the export contract (loop turned off, embed mode, the
   capture API). Download it by clicking **Share** in the upper right
   of the Claude Design window and choosing **Export as standalone
   HTML**.

4. **Render it to MP4.** On Mac, open the toolkit folder
   (`~/claude-design-for-ads`) in Finder and double-click
   `render.command`. A Terminal window opens and prompts you to drag
   your HTML file in — drag it from Finder into the Terminal window
   (the path appears), then press Enter. The MP4 lands next to your
   HTML and opens automatically when done. Takes ~5 minutes for a 50s
   1080×1080 animation.

   On Linux/Windows or if you want control over output settings (size,
   frame rate, etc.), run the capture script directly from Terminal:

   ```bash
   cd ~/claude-design-for-ads
   node local-scripts/capture.js \
     --input=~/Downloads/your-animation.html \
     --output=~/Downloads/your-animation.mp4
   ```

   See [`local-scripts/README.md`](local-scripts/README.md) for size
   variations (1080×1920 for TikTok/Reels, 4K, etc.) and
   troubleshooting.

### Making a high-resolution image (PNG)

1. **Open a Project in Claude Design.** Same as above — your Design
   System is already loaded.

2. **Ask for a high-resolution PNG**, specifying the dimensions you
   need (e.g. "1440×2560 for a vertical ad" or "1440×1440 for a feed
   square"). Claude Design hands back a PNG at exactly those
   dimensions.

3. **Download the PNG.** No rendering step needed for static images.

---

## Common questions

**Do I have to use Claude Design?**
The toolkit is built around Claude Design's Design System / `CLAUDE.md`
mechanism, but the core ideas (the contract, the runtime, the recipe)
work with any AI design tool that lets you load standing instructions.
The render script works on any HTML that satisfies the contract,
regardless of who or what produced it.

**Do I need Node.js, ffmpeg, or the render script for image work?**
No. The image flow runs entirely inside Claude Design — none of
those local tools are involved. Get the toolkit on your computer
(the lightweight ZIP path is enough; you don't need the full Mac
installer), drag the `ad-toolkit/` folder into your Design System,
paste the `CLAUDE.md` snippet, and you're done. Ask Claude Design
for a PNG at the dimensions you need and download it from the
Project.

**How big can the output PNG be?**
There's no cap from this toolkit. `gen_pptx` renders at 2× DPR
internally and downscales via Lanczos-3 to whatever dimensions you
asked for, so a request for 1440×2560 returns exactly 1440×2560. If
you'd rather have the supersampled native render, ask Claude Design
to "keep the native 2× render" — a 1440×2560 spec then yields a
2880×5120 PNG.

**What if my org doesn't have a Design System set up yet?**
You'll need one before this toolkit is worth installing. Set up your
Design System first (Anthropic's
[setup guide](https://support.claude.com/en/articles/14604397-set-up-your-design-system-in-claude-design)
walks through uploading brand assets and generating the UI kit), then
add this toolkit on top. The toolkit expects a Design System as its
host — without one, you'd have to drag the contract into every
conversation by hand, which defeats the point.

**Can I add this to a single Project instead of the Design System?**
Technically yes — upload `ad-toolkit/` to a specific Project's files
and paste the `CLAUDE.md` snippet into that Project's instructions.
But you'd have to repeat that work for every new Project. Installing
at the Design System level means every future Project inherits it for
free, which is almost always what you want.

**How long does a render take?**
About 5–8 minutes for a 50-second 1080×1080 video on a recent Mac.
Mostly determined by how many frames there are (60fps × 50s = 3000
frames) and how complex the animation is. You can speed it up by
dropping `--fps=30` (cuts to 1500 frames) or `--scale=1` (no
2× supersampling — slightly softer text but ~3× faster).

**The example renders fine but my own animation doesn't.**
The animation HTML probably doesn't satisfy the contract — most often
because `loop={true}` is still set on the `<Stage>` (so the animation
wraps back to the start instead of stopping cleanly), or the
`window.__capture` API isn't being exposed. See
[`local-scripts/README.md`](local-scripts/README.md) under
"Troubleshooting."

**Can I render at a different size or aspect ratio?**
Yes — `--width` and `--height` flags. For a 9:16 vertical (TikTok,
Reels), use `--width=1080 --height=1920`. The animation has to be
authored at that aspect ratio though; you can't reflow a 1:1 animation
to 9:16 by changing flags.

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
ad-toolkit/             ← drop this folder into your Design System
  INSTALL.md            ← tells Claude Design how to install the toolkit
  video-export-contract.md
  animation-design-principles.md
  video-stage.jsx
  image-export-recipe.md

CLAUDE.md               ← snippet to paste into your Design System's CLAUDE.md

install.sh              ← Mac one-line installer (run via curl-bash from Terminal)
render.command          ← Mac convenience: double-click, drag your HTML in, press Enter

examples/               — open in a browser to verify install & study the contract
  hello-world.html
  brief-template.md
  explainer-video/

local-scripts/          — runs on your computer, turns animation HTML into MP4
  capture.js
```

Three top-level pieces, one job each:

- **`ad-toolkit/`** is what goes in your Design System. Claude Design
  reads from it when building animations or producing images.
- **`CLAUDE.md`** is what tells Claude Design the toolkit exists. Paste
  it into your Design System's own `CLAUDE.md`.
- **`local-scripts/capture.js`** runs on your computer (not inside
  Claude Design) and turns a contract-compliant animation HTML file
  into an MP4.

---

## License

MIT — see [LICENSE](LICENSE).
