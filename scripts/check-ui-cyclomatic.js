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

async function run() {
  const eslint = new ESLint({
    useEslintrc: false,
    baseConfig: {
      parserOptions: { ecmaVersion: 2022 },
      rules: { complexity: ['error', COMPLEXITY_THRESHOLD] }
    }
  });

  const results = await eslint.lintFiles([path.join(process.cwd(), 'ui/**/*.js')]);

  const violations = [];
  const exceptions = [];
  let scanned = 0;

  results.forEach(result => {
    const content = fs.readFileSync(result.filePath, 'utf8');
    const rel = path.relative(process.cwd(), result.filePath).replace(/\\/g, '/');
    if (content.includes('arch: allow-cyclomatic')) {
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

  let output = `## ui-cyclomatic\n`;
  if (violations.length === 0) {
    output += `✅ No issues (scanned ${scanned} files, threshold: ${COMPLEXITY_THRESHOLD})\n`;
  } else {
    output += `❌ Violations (scanned ${scanned} files, threshold: ${COMPLEXITY_THRESHOLD}):\n`;
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
