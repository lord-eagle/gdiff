#!/usr/bin/env bash
# gdiff installer — drops `gdiff` into ~/.local/bin
#
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/lord-eagle/gdiff/main/install.sh | bash
#
# Env overrides:
#   GDIFF_PREFIX   install dir (default: ~/.local/bin)
#   GDIFF_REF      git ref to fetch from (default: main)

set -euo pipefail

REPO="lord-eagle/gdiff"
REF="${GDIFF_REF:-main}"
PREFIX="${GDIFF_PREFIX:-$HOME/.local/bin}"
URL="https://raw.githubusercontent.com/$REPO/$REF/bin/gdiff"

mkdir -p "$PREFIX"
DEST="$PREFIX/gdiff"

echo "→ Fetching $URL"
if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$URL" -o "$DEST"
elif command -v wget >/dev/null 2>&1; then
  wget -qO "$DEST" "$URL"
else
  echo "install.sh: need curl or wget" >&2
  exit 1
fi

chmod +x "$DEST"
echo "→ Installed: $DEST"

case ":$PATH:" in
  *":$PREFIX:"*) ;;
  *)
    echo
    echo "⚠  $PREFIX is not on your PATH."
    echo "   Add this to your shell rc (e.g. ~/.zshrc):"
    echo "     export PATH=\"$PREFIX:\$PATH\""
    ;;
esac

echo
echo "Try it: cd into any git repo and run \`gdiff\`."
