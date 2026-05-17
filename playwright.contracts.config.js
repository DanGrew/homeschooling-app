const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/contracts',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'node test-server-contracts.js',
    url: 'http://localhost:3001',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
