import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['server/__tests__/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    // Handle NodeNext-style .js imports resolving to .ts source files
    extensionsTsModule: true,
  },
})
