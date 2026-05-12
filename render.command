#!/usr/bin/env bash
#
# claude-design-for-ads — render a Claude Design HTML into MP4 or PNG
#
# Workflow:
#   1. In Claude Design, click Share → Export as standalone HTML
#   2. Double-click render.command in Finder (opens Terminal)
#   3. Drag the downloaded HTML file into the Terminal window
#   4. Press Enter
#
# capture.js auto-detects animation vs static design:
#   - Animation (window.__capture exposed) → MP4
#   - Static design (no capture API) → PNG at 2× DPR
#
# Or run from Terminal with the file as an arg:
#   ./render.command path/to/design.html
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

  Drag a Claude Design HTML file (animation or static design) into
  this Terminal window, then press Enter. Animations render to MP4;
  static designs render to PNG at 2× DPR.

  Don't have the HTML yet? In Claude Design, click Share → Export
  as standalone HTML.
================================================================

PROMPT
  read -r DROPPED
  # URLs are taken literally; file paths from Finder drags use
  # backslash escapes that eval needs to interpret.
  if [[ "$DROPPED" =~ ^https?:// ]]; then
    INPUT="$DROPPED"
  else
    eval "INPUT=$DROPPED"
  fi
fi

# Detect URL vs file path so we know how to derive the output path
# and whether to validate file existence.
if [[ "$INPUT" =~ ^https?:// ]]; then
  IS_URL=1
else
  IS_URL=0
  if [ ! -f "$INPUT" ]; then
    echo ""
    echo "File not found: $INPUT"
    echo ""
    echo "Press any key to close..."
    read -n 1
    exit 1
  fi
fi

# Output basename (no extension). capture.js auto-detects whether the
# input is an animation or a static design and produces .mp4 or .png
# accordingly.
if [ "$IS_URL" -eq 1 ]; then
  # e.g. .../How%20Gravity%20Works.html?t=... → "How Gravity Works"
  RAW="${INPUT##*/}"             # last path segment + query
  RAW="${RAW%%\?*}"              # strip query string
  RAW="${RAW%.*}"                # strip extension
  DECODED="${RAW//%20/ }"        # URL-decode %20 → space
  BASE="$PWD/${DECODED}"
else
  BASE="${INPUT%.*}"
fi

# Avoid clobbering an existing render: if either <BASE>.mp4 or
# <BASE>.png is already taken, append -2, -3, ... until both
# candidate names are free.
if [ -f "${BASE}.mp4" ] || [ -f "${BASE}.png" ]; then
  i=2
  while [ -f "${BASE}-${i}.mp4" ] || [ -f "${BASE}-${i}.png" ]; do
    i=$((i + 1))
  done
  BASE="${BASE}-${i}"
  echo ""
  echo "Note: a render with that name already exists."
  echo "Saving this one as ${BASE##*/}.mp4 or ${BASE##*/}.png instead."
fi

cat <<HEADER

================================================================
  Rendering: ${INPUT}
  Output:    ${BASE}.mp4 (animation) or ${BASE}.png (static design)
================================================================

HEADER

# Pass the .mp4 path; capture.js swaps to .png if it detects a static design.
node local-scripts/capture.js --input="$INPUT" --output="${BASE}.mp4"

# Open whichever file actually got produced.
if [ -f "${BASE}.mp4" ]; then
  OUTPUT="${BASE}.mp4"
elif [ -f "${BASE}.png" ]; then
  OUTPUT="${BASE}.png"
else
  echo ""
  echo "Render did not produce an output file. Check the logs above."
  echo ""
  echo "Press any key to close..."
  read -n 1
  exit 1
fi

echo ""
echo "→ Done. Opening $(basename "$OUTPUT")..."
open "$OUTPUT"

cat <<DONE

================================================================
  Render complete.

  You can close this window.
================================================================

DONE
