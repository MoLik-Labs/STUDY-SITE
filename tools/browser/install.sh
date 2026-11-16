#!/usr/bin/env bash
# Cài Chromium headless cho Playwright khi máy không tải được từ CDN của Playwright.
# Dùng gói npm @sparticuz/chromium (registry npm), giải nén thư viện NSS đi kèm.
# Kết quả: in đường dẫn trình duyệt. Dùng:  export CHROMIUM_PATH=$(bash tools/browser/install.sh)
set -euo pipefail
DIR="${BROWSER_DIR:-$HOME/.cache/study-browser}"
mkdir -p "$DIR/lib"
cd "$DIR"
[ -f package.json ] || npm init -y >/dev/null
npm ls @sparticuz/chromium >/dev/null 2>&1 || npm i --no-audit --no-fund @sparticuz/chromium@131 >/dev/null
node --input-type=module -e "
import zlib from 'zlib'; import fs from 'fs'; import path from 'path';
const b = path.resolve('node_modules/@sparticuz/chromium/bin') + '/';
const out = process.argv[1];
fs.writeFileSync(out + '/chromium', zlib.brotliDecompressSync(fs.readFileSync(b + 'chromium.br')));
fs.chmodSync(out + '/chromium', 0o755);
for (const t of ['al2023', 'al2']) {
  const tar = out + '/' + t + '.tar';
  fs.writeFileSync(tar, zlib.brotliDecompressSync(fs.readFileSync(b + t + '.tar.br')));
}
" "$DIR"
tar xf "$DIR/al2023.tar" -C "$DIR" && tar xf "$DIR/al2.tar" -C "$DIR"
echo "$DIR/chromium"
