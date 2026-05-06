#!/usr/bin/env node
/*
 * Deterministic capture of an HTML animation to MP4.
 *
 * Designed for Claude Design exports that expose window.__capture and
 * support a ?embed=1 bare-render mode (no player chrome). Loads the page,
 * pauses, then seeks the playhead frame-by-frame via window.__capture.seek
 * and screenshots each frame. Output is identical run-to-run, faster than
 * real-time, no clipping or rate-matching needed.
 *
 * Requires the export to expose:
 *   - window.__capture.seek(t), .pause(), .duration
 *   - ?embed=1 query param that hides player chrome
 *
 * See ../ad-toolkit/video-export-contract.md for the full contract.
 *
 * Usage:
 *   node capture.js --input=<file.html> --output=<out.mp4> \
 *     [--duration=<s>] [--fps=60] [--width=1080] [--height=1080] \
 *     [--scale=2] [--crf=18]
 *
 *   --duration  override; otherwise read from window.__capture.duration
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

  const input = path.resolve(args.input);
  const output = path.resolve(args.output);
  const fps = parseFloat(args.fps) || 60;
  const explicitWidth = args.width ? parseInt(args.width, 10) : null;
  const explicitHeight = args.height ? parseInt(args.height, 10) : null;
  const scale = parseFloat(args.scale) || 2;
  const crf = parseInt(args.crf, 10) || 18;
  const explicitDuration = args.duration ? parseFloat(args.duration) : null;

  // Initial viewport guess. Final viewport is reset after we read the
  // Stage's actual width/height from window.__capture (unless --width
  // and --height are both passed, which override auto-detect).
  const initialWidth = explicitWidth || 1080;
  const initialHeight = explicitHeight || 1080;

  if (!fs.existsSync(input)) {
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
    page.on('console', (msg) => {
      const t = msg.type();
      if (t === 'error' || t === 'warning') console.error(`[page:${t}]`, msg.text());
    });

    const url = pathToFileURL(input).href + '?embed=1';
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });

    await page.waitForFunction(
      () => window.__capture && typeof window.__capture.seek === 'function',
      { timeout: 15000 },
    );

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
    console.error(
      `[capture] ${duration}s @ ${fps}fps  ${width}x${height}@${scale}x  ${totalFrames} frames`,
    );

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
        output,
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
    console.error('[capture] done → ' + output);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
