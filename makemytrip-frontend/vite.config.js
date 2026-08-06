/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // vitest does not pick up the plugin's JSX transform for src/**, so the
  // runtime is set explicitly — without it every component renders as
  // "React is not defined", since none of them import React.
  esbuild: { jsx: 'automatic' },

  // Unit and component tests live here rather than in their own config so they
  // go through exactly the transform pipeline the app is built with — a
  // separate vitest.config.js did not pick up the JSX runtime.
  //
  // The Playwright specs under /tests need a browser and a running server;
  // these need neither, so they can gate every merge.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false
  }
})
