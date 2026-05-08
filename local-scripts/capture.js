#!/usr/bin/env node
/*
 * Capture a Claude Design HTML page (animation or static design) to MP4 or PNG.
 *
 * Auto-detects animation vs static at load time:
 *   - If the page exposes window.__capture (animation built against the
 *     toolkit's Stage runtime, or auto-substituted via interception for
 *     a Claude Design preview URL), captures frame-by-frame via
 *     seek + screenshot, encodes to MP4 with ffmpeg.
 *   - Otherwise treats it as a static design: walks the DOM to find
 *     the design's wrapper element via a structural heuristic, then
 *     screenshots that element at 2× DPR to produce a PNG.
 *
 * Output extension is normalized — pass --output=foo.mp4 or just
 * --output=foo and the file lands as foo.mp4 (animation) or foo.png
 * (static design) regardless of what was passed.
 *
 * --input accepts a local HTML file path or an http(s) URL. URLs are
 * useful for Claude Design preview links — for animation URLs,
 * capture.js intercepts the default Stage runtime ('animations.jsx')
 * and substitutes the toolkit's contract-compliant video-stage.jsx in
 * flight, so the page exposes window.__capture even if the source
 * didn't use the toolkit. Other relative .jsx scripts on the same
 * origin are re-fetched with the original URL's auth token and served
 * via interception too, sidestepping CDN auth issues.
 *
 * See ../reference/animation-design-principles.md for design guidance.
 *
 * Usage:
 *   node capture.js --input=<file.html|url> --output=<out> \
 *     [--duration=<s>] [--fps=60] [--width=1080] [--height=1080] \
 *     [--scale=2] [--crf=18]
 *
 *   --duration  animation only; otherwise read from window.__capture.duration
 *   --scale     deviceScaleFactor; 2 supersamples for crisper text
 *
 * Requires puppeteer (npm i) and ffmpeg on PATH.
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');

function parseArgs(argv) {
  const out = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) out[m[1]] = m[2] === undefined ? true : m[2];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const required = ['input', 'output'];
  const missing = required.filter((k) => !args[k]);
  if (missing.length) {
    console.error('missing required: ' + missing.join(', '));
    console.error(
      'usage: capture.js --input=<file.html> --output=<out.mp4> [--duration=<s>] [--fps=60] [--width=1080] [--height=1080] [--scale=2] [--crf=18]',
    );
    process.exit(1);
  }

  const isUrl = /^https?:\/\//i.test(args.input);
  const input = isUrl ? args.input : path.resolve(args.input);
  const output = path.resolve(args.output);
  const fps = parseFloat(args.fps) || 60;
  const explicitWidth = args.width ? parseInt(args.width, 10) : null;
  const explicitHeight = args.height ? parseInt(args.height, 10) : null;
  const scale = parseFloat(args.scale) || 2;
  const crf = parseInt(args.crf, 10) || 18;
  const explicitDuration = args.duration ? parseFloat(args.duration) : null;

  // Initial viewport guess. Wide enough to give static designs (posters,
  // ads, etc.) room to render at their intended dimensions without
  // triggering responsive collapse from CSS media queries. Animation
  // flow resizes after reading window.__capture.width/height; static
  // image flow resizes if the design's measured width still exceeds
  // this default. --width / --height override.
  const initialWidth = explicitWidth || 1920;
  const initialHeight = explicitHeight || 1080;

  if (!isUrl && !fs.existsSync(input)) {
    console.error('input not found: ' + input);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--allow-file-access-from-files',
      '--disable-web-security',
      '--no-sandbox',
    ],
    defaultViewport: { width: initialWidth, height: initialHeight, deviceScaleFactor: scale },
  });

  try {
    const page = await browser.newPage();
    page.on('pageerror', (err) => console.error('[page]', err.message));
    // Console handler also flags auth-failure messages so we can bail
    // with a useful error if the URL redirected to (or returned) an
    // auth/login page instead of the actual design.
    let authFailed = false;
    const AUTH_FAIL_PATTERNS = /not signed in|identity provider|unauthorized|authentication required/i;
    page.on('console', (msg) => {
      const t = msg.type();
      const text = msg.text();
      if (AUTH_FAIL_PATTERNS.test(text)) authFailed = true;
      if (t === 'error' || t === 'warning') console.error(`[page:${t}]`, text);
    });

    // Look less like headless Chrome to Cloudflare and similar bot
    // detectors. The default Puppeteer UA contains "HeadlessChrome"
    // (the single most reliable bot signal); we rewrite it to plain
    // "Chrome" using Puppeteer's actual bundled version, so the
    // string stays in sync as Puppeteer updates. We also override
    // navigator.webdriver, another common tell. Not foolproof — if a
    // CF challenge still trips, the explicit detection below catches
    // it and falls back to a useful error message.
    const realisticUA = (await browser.userAgent()).replace('HeadlessChrome', 'Chrome');
    await page.setUserAgent(realisticUA);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    let url;
    if (isUrl) {
      // For Claude Design preview URLs (and any other remote animation URL),
      // intercept the default Stage runtime request and substitute our
      // contract-compliant video-stage.jsx so window.__capture, embed mode,
      // and clean loop-stop are guaranteed regardless of the source's
      // original runtime. Re-fetch other relative .jsx scripts with the
      // page's auth token so CDN auth doesn't 401 them.
      const runtimePath = path.join(__dirname, 'video-stage.jsx');
      const runtimeContent = fs.readFileSync(runtimePath, 'utf8');
      const inputUrl = new URL(input);
      const token = inputUrl.searchParams.get('t');

      await page.setRequestInterception(true);
      page.on('request', async (req) => {
        const reqUrl = req.url();
        // Substitute the default Stage runtime with ours.
        if (/\/animations\.jsx(\?|$)/.test(reqUrl)) {
          console.error(`[capture] substituting video-stage.jsx for ${reqUrl}`);
          await req.respond({
            status: 200,
            contentType: 'application/javascript',
            body: runtimeContent,
          });
          return;
        }
        // Stub favicon.ico — browsers auto-request it when there's no
        // <link rel="icon"> in the HTML, and Claude Design's CDN
        // doesn't have one, which logs a noisy 404 in the console.
        if (/\/favicon\.ico(\?|$)/.test(reqUrl)) {
          await req.respond({
            status: 200,
            contentType: 'image/x-icon',
            body: '',
          });
          return;
        }
        // Re-fetch other same-origin relative .jsx scripts with the auth
        // token, so CDN-served files don't 401 when the relative request
        // omitted the token.
        if (
          token &&
          reqUrl.startsWith(inputUrl.origin) &&
          /\.jsx(\?|$)/.test(reqUrl) &&
          !/[?&]t=/.test(reqUrl)
        ) {
          try {
            const sep = reqUrl.includes('?') ? '&' : '?';
            const tokenized = reqUrl + sep + 't=' + token;
            const fetched = await fetch(tokenized);
            const body = await fetched.text();
            await req.respond({
              status: fetched.status,
              contentType: 'application/javascript',
              body,
            });
          } catch (e) {
            console.error(`[capture] token-fetch failed for ${reqUrl}: ${e.message}`);
            await req.continue();
          }
          return;
        }
        await req.continue();
      });

      const sep = input.includes('?') ? '&' : '?';
      url = input + sep + 'embed=1';
    } else {
      url = pathToFileURL(input).href + '?embed=1';
    }

    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    // Detect Cloudflare bot-detection gate. CF-protected preview URLs
    // sometimes serve a "verify you are human" challenge page to fresh
    // headless sessions instead of the actual design. Without this
    // check capture.js would silently screenshot the challenge page
    // as if it were the design — looks successful but isn't.
    if (isUrl) {
      const challenged = await page.evaluate(() => {
        const title = document.title || '';
        const text = (document.body && document.body.innerText) || '';
        return (
          /performing security verification|verify you are human|checking your browser|just a moment/i.test(text) ||
          /just a moment|attention required|access denied/i.test(title) ||
          !!document.querySelector('#cf-wrapper, #cf-challenge-stage, [class*="cf-challenge"]')
        );
      });
      if (challenged) {
        console.error('');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Cloudflare blocked the headless browser session.');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('');
        console.error('Claude Design preview URLs are sometimes gated behind');
        console.error('a Cloudflare "verify you are human" challenge for');
        console.error('fresh non-browser sessions. Your real browser can pass;');
        console.error("this script's headless Chrome can't, so it just got");
        console.error('served the verification page instead of your design.');
        console.error('');
        console.error('Workaround: in Claude Design, click Share → Export as');
        console.error('standalone HTML, then drop that file into render.command');
        console.error("(or pass to capture.js as --input). file:// URLs aren't");
        console.error('behind Cloudflare so this path always works.');
        console.error('');
        process.exit(1);
      }

      // Auth gate detection. Claude Design preview URLs expire / require
      // a signed-in session; if the token's stale or the script's
      // session isn't authenticated, the page redirects to a sign-in
      // flow and the console emits "Not signed in with the identity
      // provider" (or similar). authFailed is set by the console
      // handler above. Final URL also checked as a fallback signal.
      const finalUrl = page.url();
      const looksLikeAuthPage =
        authFailed ||
        /\/(login|sign[-_]?in|auth(?:enticate)?)/i.test(finalUrl);
      if (looksLikeAuthPage) {
        console.error('');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error("Couldn't access the Claude Design preview URL.");
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('');
        console.error('The URL redirected to a sign-in flow instead of serving');
        console.error('your design. The auth token in the URL is probably');
        console.error('expired (these expire after a few hours) or the URL');
        console.error("requires a signed-in session that this script's");
        console.error("headless browser doesn't have.");
        console.error('');
        console.error('Workaround: in Claude Design, click Share → Export as');
        console.error('standalone HTML, then drop that file into render.command');
        console.error("(or pass to capture.js as --input). file:// URLs don't");
        console.error("require auth so this path always works. Or grab a fresh");
        console.error('preview URL via Present → New tab and try again.');
        console.error('');
        process.exit(1);
      }
    }

    // Auto-detect: animation pages expose window.__capture via the Stage
    // runtime; static design pages don't. Wait briefly to give the runtime
    // time to set it, then dispatch.
    const isAnimation = await page
      .waitForFunction(
        () => window.__capture && typeof window.__capture.seek === 'function',
        { timeout: 5000 },
      )
      .then(() => true)
      .catch(() => false);

    if (!isAnimation) {
      // ──────────────────────────────────────────────────────────────────
      // Static image flow: find the design element, screenshot at 2× DPR.
      // ──────────────────────────────────────────────────────────────────
      console.error('[capture] no window.__capture detected — capturing as static PNG');

      // Output extension swap: if user passed .mp4 (or no extension),
      // produce .png. Animations would have produced .mp4 here.
      const pngOutput = output.replace(/\.(mp4|png|jpg|jpeg)$/i, '') + '.png';

      // Structural heuristic: walk body's children, take the largest
      // non-structural one. If it fills body (95%+ width/height) it's
      // another wrapper, so drill into ITS largest child. Stop when
      // the candidate is smaller than body — that's the design. Works
      // regardless of wrapper tag/class. Sets data-cda-target on the
      // chosen element so we can grab a fresh handle after reloads.
      const findDesign = async () => {
        return await page.evaluate(() => {
          const STRUCTURAL = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'LINK', 'META']);
          const largestChild = (parent) => {
            let best = null, bestArea = 0;
            for (const c of parent.children) {
              if (STRUCTURAL.has(c.tagName)) continue;
              const r = c.getBoundingClientRect();
              const area = r.width * r.height;
              if (area > bestArea) { best = c; bestArea = area; }
            }
            return best;
          };
          const bodyRect = document.body.getBoundingClientRect();
          let el = largestChild(document.body);
          if (!el) return null;
          for (let i = 0; i < 5; i++) {
            const r = el.getBoundingClientRect();
            const fillsBody = r.width >= bodyRect.width * 0.95 && r.height >= bodyRect.height * 0.95;
            if (!fillsBody) break;
            const inner = largestChild(el);
            if (!inner || inner === el) break;
            el = inner;
          }
          el.setAttribute('data-cda-target', '');
          const r = el.getBoundingClientRect();
          return {
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            width: Math.round(r.width),
            height: Math.round(r.height),
          };
        });
      };

      let description = await findDesign();
      if (!description) throw new Error('Could not locate a design element on the page');

      // Only resize the viewport if the design actually exceeds it (e.g.
      // a 4K design in our 1920 default viewport) or if the user passed
      // explicit --width / --height. Resizing to the design's measured
      // dimensions when it already fits would shrink the design (body
      // padding/margin around the design consumes some of the new
      // viewport's width on reload).
      const currentViewport = page.viewport();
      const needsResize =
        description.width > currentViewport.width ||
        (explicitWidth && explicitWidth !== currentViewport.width) ||
        (explicitHeight && explicitHeight !== currentViewport.height);
      if (needsResize) {
        const targetW = explicitWidth || Math.max(description.width, currentViewport.width);
        const targetH = explicitHeight || Math.max(description.height, currentViewport.height);
        console.error(`[capture] resizing viewport to fit design: ${targetW}x${targetH}`);
        await page.setViewport({ width: targetW, height: targetH, deviceScaleFactor: scale });
        await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });
        description = await findDesign();
        if (!description) throw new Error('Lost the design element after viewport resize');
      }

      console.error(`[capture] design element: <${description.tagName}${description.className ? ' class="' + description.className + '"' : ''}>  ${description.width}x${description.height} → ${description.width * scale}x${description.height * scale} @ ${scale}x`);

      // Neutralize body/html background so designs with transparent
      // wrappers come out with proper alpha instead of inheriting the
      // wrapper's background color. Designs with their own opaque
      // background are unaffected (their bg covers the body anyway).
      await page.evaluate(() => {
        document.body.style.background = 'transparent';
        document.documentElement.style.background = 'transparent';
      });

      // Wait for all CSS fonts to fully load + apply before capture.
      // networkidle0 waits for the network, but Font Loading API can
      // finish a beat after that — without this, glyphs may fall back
      // to system fonts and show as tofu (missing-glyph boxes).
      await page.evaluate(() => document.fonts.ready);

      const handle = await page.$('[data-cda-target]');
      // omitBackground gives us PNG transparency where the body bg was visible.
      await handle.screenshot({ path: pngOutput, type: 'png', omitBackground: true });
      console.error('[capture] done → ' + pngOutput);
      return;
    }

    // ──────────────────────────────────────────────────────────────────
    // Animation flow: existing frame-by-frame seek-and-screenshot loop.
    // ──────────────────────────────────────────────────────────────────

    // Auto-detect Stage dimensions if --width / --height weren't both passed.
    // Falls back to initialWidth/Height if the Stage didn't expose them.
    const detected = await page.evaluate(() => ({
      width: typeof window.__capture.width === 'number' ? window.__capture.width : null,
      height: typeof window.__capture.height === 'number' ? window.__capture.height : null,
    }));
    const width = explicitWidth || detected.width || initialWidth;
    const height = explicitHeight || detected.height || initialHeight;

    if (width !== initialWidth || height !== initialHeight) {
      console.error(`[capture] auto-detected Stage dimensions: ${width}x${height} (resizing viewport)`);
      await page.setViewport({ width, height, deviceScaleFactor: scale });
      await page.reload({ waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(
        () => window.__capture && typeof window.__capture.seek === 'function',
        { timeout: 15000 },
      );
    }

    await page.evaluate(() => {
      window.__capture.pause();
      window.__capture.seek(0);
    });

    const duration = explicitDuration ?? await page.evaluate(() => window.__capture.duration);
    const totalFrames = Math.round(fps * duration);
    // Empirical headless capture rate on a recent Mac: ~8 frames/sec
    // (screenshot + double-rAF wait + pipe to ffmpeg). Add ~30s for
    // browser launch + final encode flush. Used purely for ETA display.
    const estSec = Math.ceil(totalFrames / 8) + 30;
    const estMin = Math.max(1, Math.round(estSec / 60));
    console.error(
      `[capture] ${duration}s @ ${fps}fps  ${width}x${height}@${scale}x  ${totalFrames} frames  (eta ~${estMin} min)`,
    );

    // Normalize output extension to .mp4 regardless of what was passed,
    // so callers don't need to know in advance whether they're rendering
    // animation or static.
    const mp4Output = output.replace(/\.(mp4|png|jpg|jpeg)$/i, '') + '.mp4';

    const ff = spawn(
      'ffmpeg',
      [
        '-y',
        '-loglevel', 'error',
        '-stats',
        '-f', 'image2pipe',
        '-vcodec', 'png',
        '-framerate', String(fps),
        '-i', '-',
        '-vf', `scale=${width}:${height}:flags=lanczos`,
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', String(crf),
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        mp4Output,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );
    const ffDone = new Promise((resolve, reject) =>
      ff.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error('ffmpeg exited ' + code)),
      ),
    );
    ff.stdin.on('error', (e) => {
      if (e.code !== 'EPIPE') console.error('[ffmpeg stdin]', e.message);
    });

    const t0 = Date.now();
    for (let i = 0; i < totalFrames; i++) {
      const t = i / fps;
      await page.evaluate((t) => window.__capture.seek(t), t);
      // Two rAFs guarantee React commit + paint before screenshot.
      await page.evaluate(
        () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
      );
      const buf = await page.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) {
        await new Promise((r) => ff.stdin.once('drain', r));
      }
      if (i % 60 === 0 || i === totalFrames - 1) {
        const elapsed = (Date.now() - t0) / 1000;
        const rate = (i + 1) / elapsed;
        const eta = (totalFrames - i - 1) / rate;
        process.stderr.write(
          `\r[capture] ${i + 1}/${totalFrames}  ${rate.toFixed(1)} fps  eta ${eta.toFixed(0)}s   `,
        );
      }
    }
    process.stderr.write('\n');

    ff.stdin.end();
    await ffDone;
    console.error('[capture] done → ' + mp4Output);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
