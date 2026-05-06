# Install the ad-toolkit (instructions for Claude Design)

**Already installed?** If you're reading this file from inside the Design System (e.g. it lives at `ad-toolkit/INSTALL.md`), the install is already complete. Treat this file as a historical record only — do nothing, do not re-install, do not "fix" or reorganize anything. Stop here.

---

If you're reading this because the user just dropped the toolkit's `ad-toolkit/` folder into the Design System chat (the files aren't yet saved into the Design System): you've been handed the contents of a folder called `ad-toolkit/` from the [claude-design-for-ads](https://github.com/ivy-invest/claude-design-for-ads) toolkit, which gives this design system the ability to produce contract-compliant animated videos and high-resolution PNG ads.

Install them like this:

1. **Create a folder** named exactly `ad-toolkit/` at the root of this Design System (as a peer to `ui_kits/`, `assets/`, etc.). Do not nest it inside any other folder, and do not rename it — the toolkit's documentation references files by `ad-toolkit/<filename>` paths, so the folder name and root location both matter.

2. **Save these files into `ad-toolkit/`** with their exact filenames and exact contents (preserve all whitespace, code, and quote characters — do not "clean up" or reformat anything):

   - `video-export-contract.md`
   - `animation-design-principles.md`
   - `video-stage.jsx`
   - `image-export-recipe.md`
   - `INSTALL.md` (this file — save it alongside the others as a record of how the toolkit was installed)

3. **Update this Design System's root `CLAUDE.md`.** Append the snippet below to the Design System's own `CLAUDE.md` file (create the file if it doesn't exist). If the Design System's `CLAUDE.md` already contains a `## Animated video work` heading or a `## Native-resolution PNG export` heading, the snippet is already installed — do not re-append (skip this step entirely).

   The exact snippet to append (copy verbatim — preserve all whitespace, formatting, backticks, and code-fence characters; do not paraphrase or "improve" any sentence):

   ```markdown
   ## Animated video work

   For any animation intended to be rendered to MP4 (ads, social posts, sales-deck embeds, explainers), read both:

   - `ad-toolkit/video-export-contract.md` — build-time requirements (stage config, embed mode, capture API, virtual-time-safe timing, asset references). Following this lets the same HTML source serve interactive review, screen-recordable embed, and deterministic frame capture.
   - `ad-toolkit/animation-design-principles.md` — craft heuristics (type minimums by surface, sequential reveals at uniform velocity, beat-to-beat bridges vs. crossfades, optical alignment, compliance keyword sweeps, storyboard-as-proposal).

   Use the Stage runtime at `ad-toolkit/video-stage.jsx` — it ships with embed mode and `window.__capture` already wired, satisfying §1, §3, and §4 of the contract out of the box. Load it with a `<script type="text/babel">` tag whose `src` points to `ad-toolkit/video-stage.jsx`.

   Do **not** use the default `animations.jsx` starter for video work. It lacks embed mode and the capture API; `ad-toolkit/video-stage.jsx` is the video-ready replacement.

   ## Native-resolution PNG export

   When the user asks for a high-resolution PNG of a design (for ads, marketing assets, anything print-adjacent), do **not** use `save_screenshot` — it caps at 1600px on the longest side. Instead follow the procedure in `ad-toolkit/image-export-recipe.md`, which routes through `gen_pptx` (which renders at 2× DPR internally) and downscales to exactly the requested W×H via Lanczos-3. Pass `keep2x: true` if the caller wants the supersampled 2× native render instead.
   ```

4. **Stop there.** Don't render sample ads or preview frames, don't suggest restructuring the toolkit, don't summarize what was installed, don't modify any file contents. The user has their own example animation and image flow already; they will exercise the toolkit themselves.

5. **Tell the user one short sentence** confirming the install completed:

   > "ad-toolkit installed at `/ad-toolkit/`, and the snippet appended to this Design System's `CLAUDE.md`. You can start a new Project to use it for ad/animation/image work."
