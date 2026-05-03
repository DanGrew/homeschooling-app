import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const APP_DIR = join(process.cwd(), 'app');
const THEME_CSS = join(APP_DIR, 'shared', 'theme.css');

function findFiles(dir, ext) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...findFiles(full, ext));
    else if (extname(full) === ext) results.push(full);
  }
  return results;
}

const htmlFiles = findFiles(APP_DIR, '.html');
const sourceFiles = [
  ...htmlFiles,
  ...findFiles(APP_DIR, '.css'),
  ...findFiles(APP_DIR, '.js'),
];

describe('theme.css', () => {
  it('exists and defines --font as Arial', () => {
    const css = readFileSync(THEME_CSS, 'utf8');
    expect(css).toContain('--font');
    expect(css).toContain('Verdana');
  });

  it('sets body font-family via --font variable', () => {
    const css = readFileSync(THEME_CSS, 'utf8');
    expect(css).toMatch(/body\s*\{[^}]*font-family\s*:\s*var\(--font\)/);
  });
});

describe('font standardisation', () => {
  it.each(htmlFiles.map(f => [f.replace(process.cwd(), '')]))(
    '%s links theme.css',
    (rel) => {
      const html = readFileSync(join(process.cwd(), rel), 'utf8');
      expect(html).toContain('href="/homeschooling-app/app/shared/theme.css"');
    }
  );

  it.each(sourceFiles.map(f => [f.replace(process.cwd(), '')]))(
    '%s contains no Comic Sans or Chalkboard SE',
    (rel) => {
      const src = readFileSync(join(process.cwd(), rel), 'utf8');
      expect(src).not.toMatch(/Comic Sans|Chalkboard SE/);
    }
  );
});
