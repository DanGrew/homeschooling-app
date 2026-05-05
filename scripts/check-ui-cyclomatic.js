#!/usr/bin/env node

const { ESLint } = require('eslint');
const fs = require('fs');
const path = require('path');

const outputFile = process.argv[2];
if (!outputFile) {
  console.error('Usage: node check-ui-cyclomatic.js <outputFile>');
  process.exit(1);
}

const COMPLEXITY_THRESHOLD = 1;
const ROOT = process.cwd();

function getAllFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { recursive: true })
    .filter(f => path.extname(f) === ext)
    .map(f => path.join(dir, f));
}

function extractInlineScripts(htmlFile) {
  const content = fs.readFileSync(htmlFile, 'utf8');
  const scripts = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    if (m[1].includes('src=')) continue;
    const code = m[2].trim();
    if (code) scripts.push(code);
  }
  return scripts;
}

async function run() {
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      rules: { complexity: ['error', COMPLEXITY_THRESHOLD] }
    }
  });

  const violations = [];
  const exceptions = [];
  let scanned = 0;

  // ui/**/*.js
  const uiResults = await eslint.lintFiles([path.join(ROOT, 'ui/**/*.js')]);
  uiResults.forEach(result => {
    const content = fs.readFileSync(result.filePath, 'utf8');
    const rel = path.relative(ROOT, result.filePath).replace(/\\/g, '/');
    if (content.includes('arch: allow-complexity')) {
      exceptions.push(rel);
      return;
    }
    scanned++;
    result.messages.forEach(msg => {
      if (msg.ruleId === 'complexity') {
        violations.push(`${rel} — ${msg.message} (line ${msg.line})`);
      }
    });
  });

  // app/**/*.html inline <script> blocks
  const htmlFiles = getAllFiles(path.join(ROOT, 'app'), '.html');
  for (const htmlFile of htmlFiles) {
    const rel = path.relative(ROOT, htmlFile).replace(/\\/g, '/');
    const blocks = extractInlineScripts(htmlFile);
    for (const code of blocks) {
      if (code.includes('arch: allow-complexity')) {
        exceptions.push(rel + ' (inline script)');
        continue;
      }
      scanned++;
      const results = await eslint.lintText(code, { filePath: path.join(ROOT, 'virtual.js') });
      results[0].messages.forEach(msg => {
        if (msg.ruleId === 'complexity') {
          violations.push(`${rel} inline script — ${msg.message} (line ${msg.line})`);
        }
      });
    }
  }

  let output = `## ui-cyclomatic\n`;
  if (violations.length === 0) {
    output += `✅ No issues (scanned ${scanned} files/blocks, threshold: ${COMPLEXITY_THRESHOLD})\n`;
  } else {
    output += `❌ Violations (scanned ${scanned} files/blocks, threshold: ${COMPLEXITY_THRESHOLD}):\n`;
    violations.forEach(v => output += `- ${v}\n`);
  }
  if (exceptions.length > 0) {
    output += `\n⚠️ Exceptions (pending fix):\n`;
    exceptions.forEach(e => output += `- ${e}\n`);
  }

  fs.writeFileSync(outputFile, output);
  console.log(output);
  process.exit(violations.length > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
