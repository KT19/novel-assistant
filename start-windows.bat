@echo off
cd /d "%~dp0"

where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js が見つかりません。https://nodejs.org/ から Node.js LTS を入れてください。
  pause
  exit /b 1
)

where uv >nul 2>nul
if errorlevel 1 (
  echo uv が見つかりません。https://docs.astral.sh/uv/ を参考に uv を入れてください。
  pause
  exit /b 1
)

if not exist node_modules (
  echo 初回準備中です。少し時間がかかります。
  call npm install
)

echo アプリを起動しています。ブラウザで http://127.0.0.1:5173/ を開いてください。
call npm run dev
