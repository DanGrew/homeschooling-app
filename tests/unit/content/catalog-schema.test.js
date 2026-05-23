import { describe, it, expect, beforeAll } from 'vitest';
import Ajv from 'ajv';
import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

function readJSON(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

let validate;

beforeAll(() => {
  const schema = readJSON('content/schemas/activities/catalog.schema.json');
  validate = new Ajv({ allErrors: true }).compile(schema);
});

describe('catalog schema', () => {
  it('groceries.json passes', () => {
    const data = readJSON('content/shopping-play/catalogs/groceries.json');
    expect(validate(data)).toBe(true);
  });

  it('fails when name is missing', () => {
    expect(validate({ tags: [], items: [{ name: 'Apple', barcode: '001', icon: '🍎' }] })).toBe(false);
  });

  it('fails when items is empty', () => {
    expect(validate({ name: 'Test', tags: [], items: [] })).toBe(false);
  });

  it('fails when item is missing barcode', () => {
    expect(validate({ name: 'Test', tags: [], items: [{ name: 'Apple', icon: '🍎' }] })).toBe(false);
  });
});
