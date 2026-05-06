#!/usr/bin/env bash
#
# claude-design-for-ads — one-line installer for Mac
#
# Run from Terminal:
#   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/ivy-invest/claude-design-for-ads/main/install.sh)"
#
# Installs Homebrew (if missing), Node + ffmpeg, prompts the user
# for a destination directory (default is ./claude-design-for-ads
# relative to their Terminal cwd, usually home), downloads the toolkit
# there, runs npm install, renders the example, and opens it.
#
# Bypasses macOS Gatekeeper since files downloaded via curl/git in
# Terminal aren't quarantined the way ZIP-via-Safari downloads are —
# so the resulting render.command is double-clickable later.

set -e

REPO_NAME="claude-design-for-ads"

# Prompt the user for where to install. Default is a 'claude-design-for-ads'
# folder in their current Terminal directory (typically the home folder).
DEFAULT_DIR="$PWD/$REPO_NAME"
echo ""
echo "Where would you like the toolkit installed?"
echo "  Default: $DEFAULT_DIR"
echo ""
echo "Press Enter to use the default, or type a different path."
read -r -p "Install to: " CHOSEN

if [ -z "$CHOSEN" ]; then
  INSTALL_DIR="$DEFAULT_DIR"
else
  # Expand a leading ~ to $HOME so paths like ~/Documents/cda work.
  INSTALL_DIR="${CHOSEN/#\~/$HOME}"
fi

echo ""
echo "→ Installing to: $INSTALL_DIR"
REPO_URL="https://github.com/ivy-invest/claude-design-for-ads"
ZIP_URL="$REPO_URL/archive/refs/heads/main.zip"

cat <<'BANNER'

================================================================
  claude-design-for-ads — one-line installer
================================================================

This will:
  1. Install Homebrew (if you don't have it)
  2. Install Node.js and ffmpeg
  3. Ask you where to put the toolkit and download it there
     (default is a claude-design-for-ads/ folder in your home)
  4. Install the render script's dependencies
  5. Render the example animation as a verification step
  6. Open the rendered video when finished

First run takes 5-10 minutes (mostly the Homebrew install).

================================================================

BANNER

# 1. Homebrew
if ! command -v brew >/dev/null 2>&1; then
  echo "→ Installing Homebrew..."
  echo "  You'll be asked for your Mac password — type it and"
  echo "  press Enter. You won't see characters appear; that's normal."
  echo ""
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  echo ""
else
  echo "→ Homebrew already installed."
fi

# Apple Silicon installs Homebrew to /opt/homebrew, may not be on PATH yet.
if [ -x /opt/homebrew/bin/brew ]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [ -x /usr/local/bin/brew ]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# 2. Node and ffmpeg
echo ""
echo "→ Installing Node.js and ffmpeg via Homebrew..."
brew install node ffmpeg

# 3. Download the toolkit
echo ""
if [ -d "$INSTALL_DIR" ]; then
  echo "→ Toolkit already at $INSTALL_DIR — using existing install."
  cd "$INSTALL_DIR"
  if [ -d ".git" ]; then
    echo "  Pulling latest changes..."
    git pull --ff-only || echo "  (Pull skipped; continuing with current copy.)"
  fi
else
  echo "→ Downloading the toolkit to $INSTALL_DIR..."
  if command -v git >/dev/null 2>&1; then
    git clone --depth=1 "$REPO_URL.git" "$INSTALL_DIR"
  else
    TMP_ZIP="$(mktemp -t claude-design-for-ads).zip"
    curl -fsSL "$ZIP_URL" -o "$TMP_ZIP"
    unzip -q "$TMP_ZIP" -d "$PWD"
    mv "$PWD/claude-design-for-ads-main" "$INSTALL_DIR"
    rm -f "$TMP_ZIP"
  fi
  cd "$INSTALL_DIR"
fi

# 4. npm install
echo ""
echo "→ Installing the render script's dependencies (Puppeteer)..."
npm install

# 5. Render the example
echo ""
echo "→ Rendering example.mp4 as a verification step (~5 minutes)..."
node local-scripts/capture.js \
  --input=examples/explainer-video/explainer.html \
  --output=example.mp4

# 6. Open it
echo ""
echo "→ Opening example.mp4..."
open example.mp4

cat <<DONE

================================================================
  Setup complete.

  The toolkit lives at: $INSTALL_DIR

  To render your own animations later:
  - Open that folder in Finder, double-click render.command,
    drag your animation HTML into the Terminal window when
    prompted, and press Enter.
  - Or from Terminal:
      $INSTALL_DIR/render.command path/to/animation.html

  Next: install the toolkit's ad-toolkit/ folder into your
  Claude Design System. See the README on GitHub for steps.

================================================================

DONE
