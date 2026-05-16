const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests/contracts',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'node test-server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
