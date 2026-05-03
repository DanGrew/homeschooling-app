import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['app/**/*.js'],
      exclude: [
        'app/**/*.json',
        'app/shared/colouring-pictures/**',
        'app/activities/connect-the-dots/shapes/**',
        'app/activities/simulator/sims/**',
        'app/activities/story-time/data.js',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
});
