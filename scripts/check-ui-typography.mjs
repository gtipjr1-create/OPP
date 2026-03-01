import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const EXTENSIONS = new Set(['.ts', '.tsx']);

const bannedPatterns = [
  /\btext-xs\b/g,
  /\btext-sm\b/g,
  /\btext-base\b/g,
  /\btext-lg\b/g,
  /\btext-xl\b/g,
  /\btext-2xl\b/g,
  /\btext-white(?:\/[0-9]+)?\b/g,
  /\btext-blue-[^\s"'`]+/g,
  /\btext-zinc-[^\s"'`]+/g,
  /\btext-gray-[^\s"'`]+/g,
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }
    if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
}

function findViolations(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const pattern of bannedPatterns) {
      const matches = line.match(pattern);
      if (!matches) continue;
      for (const token of matches) {
        violations.push({ line: i + 1, token, snippet: line.trim() });
      }
    }
  }

  return violations;
}

const files = walk(SRC_DIR);
const all = [];

for (const filePath of files) {
  const violations = findViolations(filePath);
  if (violations.length === 0) continue;
  all.push({ filePath, violations });
}

if (all.length > 0) {
  console.error('UI typography guardrail failed. Banned classes found:\n');
  for (const result of all) {
    const rel = path.relative(ROOT, result.filePath);
    for (const violation of result.violations) {
      console.error(`${rel}:${violation.line}  ${violation.token}`);
      console.error(`  ${violation.snippet}`);
    }
  }
  process.exit(1);
}

console.log('UI typography guardrail passed.');
