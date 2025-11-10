import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Configuration spécifique pour Vitest
// Ce fichier est utilisé uniquement pour les tests
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    // Désactiver certaines optimisations qui peuvent causer des problèmes
    server: {
      deps: {
        inline: [
          'react',
          'react-dom',
          'react-router-dom',
          '@tanstack/react-query',
          'axios',
        ],
      },
    },
  },
  // Configuration pour éviter les problèmes de transformation SSR
  ssr: {
    noExternal: ['react', 'react-dom', 'react-router-dom'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    conditions: ['development', 'browser', 'import'],
  },
  // Désactiver certaines optimisations pour les tests
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: [],
  },
  // Configuration pour éviter les problèmes avec rolldown-vite
  esbuild: {
    target: 'esnext',
  },
  // Configuration de la couverture
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov'],
    exclude: [
      'node_modules/',
      'src/setupTests.ts',
      '**/*.d.ts',
      '**/*.config.*',
      '**/coverage/**',
      '**/dist/**',
      '**/build/**',
      '**/*.test.{ts,tsx}',
      '**/__tests__/**',
      'src/main.tsx', // Point d'entrée, généralement non testé
    ],
    include: ['src/**/*.{ts,tsx}'],
    thresholds: {
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
    },
  },
})

