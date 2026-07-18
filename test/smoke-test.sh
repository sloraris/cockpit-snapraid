#!/bin/sh
# Lightweight post-build sanity check. Unlike test/check-application (which
# needs a full Cockpit test VM + browser), this just asserts the build
# actually produced a sane, loadable package -- cheap enough to run on
# every PR.
set -eu

DIST="${1:-dist}"

fail() {
    echo "FAIL: $1" >&2
    exit 1
}

[ -f "$DIST/index.html" ] || fail "$DIST/index.html missing"
grep -q '<title' "$DIST/index.html" || fail "$DIST/index.html has no <title>"

[ -f "$DIST/manifest.json" ] || fail "$DIST/manifest.json missing"
python3 -c "
import json
with open('$DIST/manifest.json') as f:
    m = json.load(f)
label = m.get('menu', {}).get('index', {}).get('label')
assert label == 'SnapRAID', f'unexpected menu label: {label!r}'
" || fail "$DIST/manifest.json failed validation"

[ -f "$DIST/index.js" ] || [ -f "$DIST/index.js.gz" ] || fail "$DIST/index.js(.gz) missing"

echo "smoke test passed"
