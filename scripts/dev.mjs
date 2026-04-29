import { spawn } from "node:child_process";
import { join } from "node:path";

const isWindows = process.platform === "win32";
const viteBin = join(
  process.cwd(),
  "node_modules",
  ".bin",
  isWindows ? "vite.cmd" : "vite",
);

const processes = [
  spawn("uv", ["run", "python", "-m", "backend.server"], {
    stdio: "inherit",
  }),
  spawn(viteBin, ["--host", "127.0.0.1"], {
    stdio: "inherit",
  }),
];

function stopAll() {
  for (const child of processes) {
    if (!child.killed) {
      child.kill();
    }
  }
}

for (const child of processes) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });
}

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});
