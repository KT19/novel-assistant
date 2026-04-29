import { mkdirSync, rmSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const binariesDir = join(root, "src-tauri", "binaries");
const uvCacheDir = join(root, ".uv-cache");
const pyinstallerConfigDir = join(root, ".pyinstaller-cache");
const targetTriple = readTargetTriple();
const executableExtension = process.platform === "win32" ? ".exe" : "";
const binaryName = `novel-assistant-backend-${targetTriple}${executableExtension}`;
const distDir = join(root, "backend-dist");
const buildDir = join(root, "backend-build");

mkdirSync(binariesDir, { recursive: true });
rmSync(distDir, { force: true, recursive: true });
rmSync(buildDir, { force: true, recursive: true });

run("uv", [
  "run",
  "pyinstaller",
  "--onefile",
  "--clean",
  "--name",
  binaryName,
  "--distpath",
  distDir,
  "--workpath",
  buildDir,
  "--specpath",
  buildDir,
  "backend/sidecar.py",
]);

const builtBinary = join(distDir, binaryName);
const targetBinary = join(binariesDir, binaryName);
rmSync(targetBinary, { force: true });
run(process.platform === "win32" ? "cmd" : "cp", copyArgs(builtBinary, targetBinary));

console.log(`Built backend sidecar: ${targetBinary}`);

function readTargetTriple() {
  const output = run("rustc", ["-vV"], { allowFailure: true, capture: true });
  const hostLine = output?.split("\n").find((line) => line.startsWith("host:"));
  if (hostLine) {
    return hostLine.replace("host:", "").trim();
  }
  return fallbackTargetTriple();
}

function fallbackTargetTriple() {
  if (process.platform === "darwin" && process.arch === "arm64") {
    return "aarch64-apple-darwin";
  }
  if (process.platform === "darwin" && process.arch === "x64") {
    return "x86_64-apple-darwin";
  }
  if (process.platform === "win32" && process.arch === "x64") {
    return "x86_64-pc-windows-msvc";
  }
  if (process.platform === "win32" && process.arch === "arm64") {
    return "aarch64-pc-windows-msvc";
  }
  if (process.platform === "linux" && process.arch === "x64") {
    return "x86_64-unknown-linux-gnu";
  }
  if (process.platform === "linux" && process.arch === "arm64") {
    return "aarch64-unknown-linux-gnu";
  }
  throw new Error(
    `Rust target triple could not be inferred for ${process.platform}/${process.arch}. Install Rust and make sure rustc is available on PATH.`,
  );
}

function copyArgs(source, target) {
  if (process.platform === "win32") {
    return ["/c", "copy", "/Y", source, target];
  }
  return [source, target];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf-8",
    env: {
      ...process.env,
      PYINSTALLER_CONFIG_DIR: pyinstallerConfigDir,
      UV_CACHE_DIR: uvCacheDir,
    },
    stdio: options.capture ? "pipe" : "inherit",
  });
  if (result.status !== 0) {
    if (options.allowFailure) {
      return null;
    }
    const commandLabel = [basename(command), ...args].join(" ");
    const stderr = result.stderr ? `\n${result.stderr.trim()}` : "";
    const cause = result.error ? `\n${result.error.message}` : "";
    throw new Error(`Command failed: ${commandLabel}${stderr}${cause}`);
  }
  return result.stdout ?? "";
}
