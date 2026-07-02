#!/usr/bin/env node
// PostToolUse hook: run Prettier on files Claude edits/writes.
// Reads the hook payload from stdin, formats the touched file, always exits 0
// (formatting must never block the agent).
const fs = require("fs");
const { execFileSync } = require("child_process");

const FORMATTABLE = /\.(ts|tsx|js|jsx|mjs|cjs|css|json|md)$/i;

let filePath;
try {
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  filePath = payload?.tool_input?.file_path;
} catch {
  process.exit(0);
}

if (!filePath || !FORMATTABLE.test(filePath) || !fs.existsSync(filePath)) {
  process.exit(0);
}

try {
  execFileSync("npx", ["--no-install", "prettier", "--write", filePath], {
    stdio: "ignore",
    shell: process.platform === "win32",
    timeout: 15000,
  });
} catch {
  // Missing prettier or unparseable file: stay silent, never block.
}
process.exit(0);
