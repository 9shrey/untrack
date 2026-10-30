#!/usr/bin/env bash
# Builds the Firefox (desktop + Android) version into dist/firefox and dist/untrack-firefox.zip.
set -euo pipefail
cd "$(dirname "$0")"
out=dist/firefox
rm -rf "$out" && mkdir -p "$out"
cp cleaner.js background.js content.js page.js "$out"/
mkdir -p "$out/icons" && cp icons/*.png "$out/icons/"

# Same manifest, with Firefox's background format and an add-on id.
node -e '
const m = require("./manifest.json");
m.background = { scripts: ["cleaner.js", "background.js"] };
m.browser_specific_settings = {
  gecko: {
    id: "untrack@local",
    strict_min_version: "142.0",
    data_collection_permissions: { required: ["none"] },
  },
  gecko_android: { strict_min_version: "142.0" },
};
require("fs").writeFileSync(process.argv[1], JSON.stringify(m, null, 2) + "\n");
' "$out/manifest.json"

rm -f dist/untrack-firefox.zip
(cd "$out" && zip -qr ../untrack-firefox.zip .)
echo "built $out and dist/untrack-firefox.zip"
