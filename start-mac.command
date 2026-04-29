#!/bin/zsh
cd "$(dirname "$0")"

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js が見つかりません。https://nodejs.org/ から Node.js LTS を入れてください。"
  read "?Enterキーで閉じます。"
  exit 1
fi

if ! command -v uv >/dev/null 2>&1; then
  echo "uv が見つかりません。https://docs.astral.sh/uv/ を参考に uv を入れてください。"
  read "?Enterキーで閉じます。"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "初回準備中です。少し時間がかかります。"
  npm install
fi

echo "アプリを起動しています。ブラウザで http://127.0.0.1:5173/ を開いてください。"
npm run dev
