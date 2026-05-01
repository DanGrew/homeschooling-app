const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'cmd /c "set PATH=C:\\Users\\danie\\AppData\\Local\\nodejs\\node-v22.16.0-win-x64;%PATH% && npx serve . -l 3000 --no-clipboard"',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } }
  ]
})
