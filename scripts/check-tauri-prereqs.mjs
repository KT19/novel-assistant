import { spawnSync } from "node:child_process";

const checks = [
  {
    command: "cargo",
    args: ["--version"],
    message:
      "Rust/Cargo が見つかりません。Tauriの開発起動にはRustが必要です。\n" +
      "https://www.rust-lang.org/tools/install からRustをインストールし、ターミナルを開き直してください。",
  },
  {
    command: "uv",
    args: ["--version"],
    message:
      "uv が見つかりません。Pythonバックエンドのsidecar生成にuvが必要です。\n" +
      "https://docs.astral.sh/uv/getting-started/installation/ を参考にuvをインストールしてください。",
  },
];

for (const check of checks) {
  const result = spawnSync(check.command, check.args, {
    encoding: "utf-8",
    stdio: "pipe",
  });

  if (result.status !== 0) {
    console.error(`\n${check.message}\n`);
    process.exit(1);
  }
}
