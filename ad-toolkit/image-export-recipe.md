# High-Resolution PNG Export Recipe

Export an HTML design to a PNG at exactly the dimensions you want. Use whenever `save_screenshot` isn't crisp enough (ads, marketing assets, anything print-adjacent).

## Why

`save_screenshot` caps output at **1600px on the longest side**, so it can't produce a true high-res PNG of a design larger than that. The fix: render through the PPTX screenshots pipeline, then unzip the PPTX and lift out the slide image.

`gen_pptx` always renders at **2× DPR** (a 1440×2560 request → a 2880×5120 PNG). The helper below downscales that back to the requested W×H using a Lanczos-3 resample (`pica`) so callers get exactly the dimensions they ask for. Pass `keep2x: true` to keep the native 2× image instead.

## Helpers

Paste both into a `run_script` block once per export.

### `buildSlideWrapper` — wraps a design in a fixed-size `.slide` container

The PPTX renderer captures whatever element you give it as the `selector`, at the size of its rendered box. Designs that scale themselves down to fit a small preview viewport (`@media`, `transform: scale()`) render *scaled* unless you override that. This helper inlines the design's `<head>` + `<body>` into a wrapper doc with `.slide { width; height }` and `!important` overrides on the design's outer container.

```js
async function buildSlideWrapper({ src, out, width, height, designSelector = '.ad' }) {
  const full = await readFile(src);
  let content = full
    .replace(/^[\s\S]*?<head>/i, '')
    .replace(/<\/head>[\s\S]*?<body[^>]*>/i, '\n')
    .replace(/<\/body>[\s\S]*$/i, '');
  const styles = content.match(/<style>[\s\S]*?<\/style>/gi)?.join('\n') || '';
  const links  = content.match(/<link[^>]*>/g)?.join('\n') || '';
  const body   = content.replace(/<link[^>]*>/g, '').replace(/<style>[\s\S]*?<\/style>/gi, '');
  const wrap = `<!doctype html><html><head>
<meta charset="utf-8"/>
${links}
${styles}
<style>
  html, body { margin: 0; padding: 0; background: #FFF; }
  .slide { width: ${width}px; height: ${height}px; overflow: hidden; position: relative; }
  ${designSelector} {
    transform: none !important;
    position: absolute !important;
    left: 0 !important; top: 0 !important;
    margin: 0 !important; box-shadow: none !important;
  }
</style>
</head><body><div class="slide">${body}</div></body></html>`;
  await saveFile(out, wrap);
}
```

`designSelector` MUST match the outer container of the design being exported (e.g. `.ad`, `.poster`, `.frame`). Default `'.ad'` only works for ad-style files.

### `extractSlidePng` — unzips PPTX, picks the slide PNG, optionally downscales

```js
async function extractSlidePng({ pptxPath, out, width, height, keep2x = false }) {
  async function loadScript(src, globalName) {
    if (window[globalName]) return;
    const s = document.createElement('script');
    s.src = src;
    await new Promise((r, e) => { s.onload = r; s.onerror = e; document.head.appendChild(s); });
  }
  await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', 'JSZip');
  const blob = await readFileBinary(pptxPath);
  const zip  = await JSZip.loadAsync(blob);
  // PPTX has the slide PNG plus tiny placeholder/thumbnail PNGs. Slide is always largest.
  const pngs = Object.keys(zip.files).filter(n => n.endsWith('.png'));
  let best = null, bestSize = 0;
  for (const n of pngs) {
    const data = await zip.files[n].async('blob');
    if (data.size > bestSize) { best = data; bestSize = data.size; }
  }
  if (keep2x || !width || !height) { await saveFile(out, best); return; }
  await loadScript('https://cdn.jsdelivr.net/npm/pica@9.0.1/dist/pica.min.js', 'pica');
  const url = URL.createObjectURL(best);
  const img = await new Promise((r, e) => { const i = new Image(); i.onload = () => r(i); i.onerror = e; i.src = url; });
  const src = createCanvas(img.width, img.height);
  src.getContext('2d').drawImage(img, 0, 0);
  const dst = createCanvas(width, height);
  await pica().resize(src, dst, { quality: 3, alpha: true });
  URL.revokeObjectURL(url);
  await saveFile(out, dst);
}
```

## Call sequence (per export)

1. `run_script` → `buildSlideWrapper({ src, out: '_slide.html', width, height, designSelector })`
2. `show_to_user('_slide.html')` then `sleep(2)` — the exporter captures the user's preview pane, so the wrapper has to be active there.
3. `gen_pptx({ width, height, mode: 'screenshots', save_to_project_path: '_deck.pptx', filename: '_deck', slides: [{ selector: '.slide', delay: 800 }] })`
4. `run_script` → `extractSlidePng({ pptxPath: '_deck.pptx', out: 'My Design.png', width, height })` — pass `keep2x: true` to keep the 2W × 2H native render.
5. `delete_file(['_slide.html', '_deck.pptx'])`
6. `present_fs_item_for_download({ path: 'My Design.png', label: '...' })`

## Gotchas

- **`designSelector` must wrap the whole design.** If the design's outer transform isn't neutralized, the PPTX renderer captures it at the *scaled* size (often the small preview viewport), not native.
- **Pass `.slide` (not the design selector) to `gen_pptx`.** The slide div is the fixed-size container; the design selector is what gets un-transformed inside it.
- **Always pick the largest PNG** from the PPTX zip. The others are tiny placeholders.
- **`no_speaker_notes` validation flag from `gen_pptx` is expected** — the wrapper is a 1-slide deck with no notes.
- **Don't skip `show_to_user` + `sleep(2)`.** `gen_pptx` captures from the user's preview; if the wrapper isn't loaded there, capture fails or returns the wrong content.
