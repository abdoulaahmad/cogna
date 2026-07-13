import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/types/**',          // TypeScript type declarations only
        'src/app.ts',            // Fastify app builder (tested via integration)
        'src/server.ts',         // Process entry point
        'src/worker.ts',         // Worker process entry point
        'src/config/database.ts',// Prisma singleton — mocked in all tests
        'src/config/redis.ts',   // Redis connection factory — mocked via BullMQ mock
        'src/**/*.interface.ts', // Pure interface files (no runtime code)
        'src/queue/fulfillment.queue.ts', // BullMQ Queue constructor — mocked
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.ts'],
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
