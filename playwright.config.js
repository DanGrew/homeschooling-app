const { defineConfig } = require('@playwright/test')

const PORT = 3000 + Math.floor(Math.random() * 1000);

module.exports = defineConfig({
  testDir: './tests',
  testIgnore: ['**/unit/**', '**/contracts/**'],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  webServer: {
    command: 'node test-server.js',
    url: `http://localhost:${PORT}`,
    env: { PORT: String(PORT) },
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
