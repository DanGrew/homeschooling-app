import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '../..');
const EXEMPT = [
  join(ROOT, 'components/speech'),
  join(ROOT, 'components/guidance'),
];

function isExempt(filePath) {
  return EXEMPT.some(dir => filePath.startsWith(dir));
}

function collectJs(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.claude') continue;
      collectJs(full, files);
    } else if (entry.endsWith('.js') || entry.endsWith('.html')) {
      files.push(full);
    }
  }
  return files;
}

describe('no bare speak import from speech-ui', () => {
  it('no file outside speech/guidance components imports speak directly', () => {
    const violations = [];
    for (const file of collectJs(ROOT)) {
      if (isExempt(file)) continue;
      const src = readFileSync(file, 'utf8');
      if (/import[^'"]*\bspeak\b(?!Interrupt)[^'"]*speech-ui/.test(src)) {
        violations.push(file.replace(ROOT, ''));
      }
    }
    expect(violations).toEqual([]);
  });
});
