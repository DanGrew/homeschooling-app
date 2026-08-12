import { describe, it, expect, afterEach } from 'vitest';
import path from 'path';

const configPath = path.join(__dirname, '../../playwright.config.js');

function loadConfig() {
  delete require.cache[require.resolve(configPath)];
  return require(configPath);
}

describe('playwright.config.js — port resolution', () => {
  afterEach(() => {
    delete process.env.CHECKS_LOCAL_PORT;
    delete process.env.PORT;
  });

  it('binds webServer and baseURL to CHECKS_LOCAL_PORT when checks-local sets it', () => {
    process.env.CHECKS_LOCAL_PORT = '54321';
    const config = loadConfig();
    expect(config.use.baseURL).toBe('http://localhost:54321');
    expect(config.webServer.url).toBe('http://localhost:54321');
    expect(config.webServer.env.PORT).toBe('54321');
  });

  it('falls back to today\'s default of 3000 when CHECKS_LOCAL_PORT and PORT are both unset', () => {
    const config = loadConfig();
    expect(config.use.baseURL).toBe('http://localhost:3000');
  });

  it('still honours an explicit PORT when CHECKS_LOCAL_PORT is unset', () => {
    process.env.PORT = '3007';
    const config = loadConfig();
    expect(config.use.baseURL).toBe('http://localhost:3007');
  });
});
