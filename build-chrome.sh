#!/usr/bin/env bash
# Builds dist/untrack-chrome.zip, the file you upload to the Chrome Web Store.
set -euo pipefail
cd "$(dirname "$0")"
rm -f dist/untrack-chrome.zip && mkdir -p dist
zip -qr dist/untrack-chrome.zip manifest.json cleaner.js background.js content.js page.js icons/*.png
echo "built dist/untrack-chrome.zip"
