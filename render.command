#!/usr/bin/env bash
#
# claude-design-for-ads — render an animation HTML to MP4
#
# Workflow:
#   1. Double-click render.command in Finder (opens Terminal)
#   2. Drag your animation HTML file into the Terminal window
#   3. Press Enter
#
# Or run from Terminal with the file as an arg:
#   ./render.command path/to/animation.html
#
# Mac only. For Linux/Windows, run the capture script directly:
#   node local-scripts/capture.js --input=... --output=...
#
# Requires the one-line installer to have been run first (which
# installs Node, ffmpeg, and Puppeteer). See the README on GitHub.

set -e

# Always operate from this script's own directory (the toolkit folder),
# so node local-scripts/capture.js resolves correctly.
cd "$(dirname "$0")"

# Apple Silicon installs Homebrew to /opt/homebrew, which may not be
# on PATH for a fresh shell. Intel uses /usr/local. Pick whichever
# exists so node/ffmpeg are findable.
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# Prereq checks — point at the one-line installer if anything's missing.
for cmd in node ffmpeg; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo ""
    echo "$cmd not found. Run the one-line installer first (see README on GitHub)."
    echo ""
    echo "Press any key to close..."
    read -n 1
    exit 1
  fi
done

if [ ! -d "node_modules/puppeteer" ]; then
  echo ""
  echo "→ Puppeteer not found in this toolkit folder. Installing..."
  echo ""
  npm install
fi

# Get input file. If passed as arg (Terminal invocation), use that;
# otherwise prompt the user to drag a file in.
INPUT="${1:-}"

if [ -z "$INPUT" ]; then
  cat <<'PROMPT'

================================================================
  claude-design-for-ads — render

  Drag your animation HTML file into this Terminal window
  (the file path will appear), then press Enter:
================================================================

PROMPT
  read -r DROPPED
  # When you drag a file from Finder into Terminal, spaces in the
  # path are backslash-escaped. eval interprets those escapes so
  # the path resolves correctly.
  eval "INPUT=$DROPPED"
fi

if [ ! -f "$INPUT" ]; then
  echo ""
  echo "File not found: $INPUT"
  echo ""
  echo "Press any key to close..."
  read -n 1
  exit 1
fi

# Output: same directory as input, same basename, .mp4 extension.
OUTPUT="${INPUT%.*}.mp4"

cat <<HEADER

================================================================
  Rendering: $(basename "$INPUT")
  Output:    $(basename "$OUTPUT")
================================================================

This takes ~5 minutes for a 50-second 1080×1080 animation.

HEADER

node local-scripts/capture.js --input="$INPUT" --output="$OUTPUT"

echo ""
echo "→ Done. Opening $(basename "$OUTPUT")..."
open "$OUTPUT"

cat <<DONE

================================================================
  Render complete.

  You can close this window.
================================================================

DONE
