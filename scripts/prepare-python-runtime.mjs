import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PYODIDE_VERSION = "0.29.4";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_ROOT = join(ROOT, "node_modules", "pyodide");
const OUTPUT_ROOT = join(ROOT, "public", "vendor", "pyodide", PYODIDE_VERSION);
const PACKAGE_CDN = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full`;
const CORE_FILES = [
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];
const ROOT_PACKAGES = ["pandas"];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readLockfile() {
  return JSON.parse(
    await readFile(join(PACKAGE_ROOT, "pyodide-lock.json"), "utf8"),
  );
}

function collectPackages(lockfile) {
  const selected = new Set();
  const visit = (name) => {
    if (selected.has(name)) return;
    const entry = lockfile.packages[name];
    if (!entry) throw new Error(`Pyodide paketi lockfile içinde yok: ${name}`);
    selected.add(name);
    for (const dependency of entry.depends ?? []) visit(dependency);
  };
  for (const name of ROOT_PACKAGES) visit(name);
  return [...selected].sort();
}

async function ensureWheel(name, entry) {
  const target = join(OUTPUT_ROOT, entry.file_name);
  try {
    const existing = await readFile(target);
    if (sha256(existing) === entry.sha256) return existing.byteLength;
  } catch {
    // A missing or stale cache entry is replaced from the pinned distribution.
  }

  const response = await fetch(`${PACKAGE_CDN}/${entry.file_name}`);
  if (!response.ok) {
    throw new Error(
      `${name} indirilemedi: ${response.status} ${response.statusText}`,
    );
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = sha256(bytes);
  if (digest !== entry.sha256) {
    throw new Error(
      `${name} bütünlük doğrulaması başarısız: ${digest} != ${entry.sha256}`,
    );
  }
  await writeFile(target, bytes);
  return bytes.byteLength;
}

async function main() {
  const packageInfo = JSON.parse(
    await readFile(join(PACKAGE_ROOT, "package.json"), "utf8"),
  );
  if (packageInfo.version !== PYODIDE_VERSION) {
    throw new Error(
      `Pyodide sürümü eşleşmiyor: ${packageInfo.version} != ${PYODIDE_VERSION}`,
    );
  }

  await mkdir(OUTPUT_ROOT, { recursive: true });
  const manifest = {
    version: PYODIDE_VERSION,
    files: {},
  };

  for (const fileName of CORE_FILES) {
    const source = join(PACKAGE_ROOT, fileName);
    const target = join(OUTPUT_ROOT, fileName);
    await copyFile(source, target);
    const info = await stat(target);
    manifest.files[fileName] = info.size;
  }

  const lockfile = await readLockfile();
  for (const name of collectPackages(lockfile)) {
    const entry = lockfile.packages[name];
    manifest.files[entry.file_name] = await ensureWheel(name, entry);
  }

  await writeFile(
    join(OUTPUT_ROOT, "runtime-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const totalBytes = Object.values(manifest.files).reduce(
    (sum, size) => sum + size,
    0,
  );
  process.stdout.write(
    `Python runtime hazır: ${Object.keys(manifest.files).length} dosya, ${(totalBytes / 1024 / 1024).toFixed(1)} MiB\n`,
  );
}

await main();
