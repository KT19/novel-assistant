import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import { join } from "node:path";

const root = process.cwd();
const isWindows = process.platform === "win32";
const binExtension = isWindows ? ".cmd" : "";
const viteBin = join(root, "node_modules", ".bin", `vite${binExtension}`);
const tauriBin = join(root, "node_modules", ".bin", `tauri${binExtension}`);
const devUrl = "http://127.0.0.1:5173/";

let isStopping = false;
const children = [];

const vite = spawnManaged(viteBin, ["--host", "127.0.0.1", "--strictPort"]);
children.push(vite);

try {
  await waitForUrl(devUrl, 30_000);
} catch (error) {
  stopAll();
  throw error;
}

const tauri = spawnManaged(tauriBin, ["dev", "--no-dev-server-wait"]);
children.push(tauri);

tauri.on("exit", (code) => {
  stopAll();
  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    stopAll();
    process.exit(0);
  });
}

process.on("exit", stopAll);

function spawnManaged(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    detached: !isWindows,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    if (!isStopping && code && code !== 0) {
      stopAll();
      process.exit(code);
    }
  });

  return child;
}

function stopAll() {
  if (isStopping) {
    return;
  }
  isStopping = true;

  for (const child of [...children].reverse()) {
    stopProcess(child);
  }
  cleanupBackendSidecar();
}

function stopProcess(child) {
  if (child.killed || child.exitCode !== null) {
    return;
  }

  if (isWindows) {
    child.kill();
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill();
  }
}

function waitForUrl(url, timeoutMs) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    function check() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on("error", () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(check, 300);
      });

      request.setTimeout(1000, () => {
        request.destroy();
      });
    }

    check();
  });
}

function cleanupBackendSidecar() {
  if (isWindows) {
    return;
  }

  const patterns = [
    join(root, "src-tauri", "target", "debug", "novel-assistant-backend"),
    join(root, "src-tauri", "binaries", "novel-assistant-backend"),
  ];

  for (const pattern of patterns) {
    spawnSync("pkill", ["-TERM", "-f", pattern], { stdio: "ignore" });
  }

  sleepSync(500);

  for (const pattern of patterns) {
    spawnSync("pkill", ["-KILL", "-f", pattern], { stdio: "ignore" });
  }
}

function sleepSync(ms) {
  const buffer = new SharedArrayBuffer(4);
  const view = new Int32Array(buffer);
  Atomics.wait(view, 0, 0, ms);
}
