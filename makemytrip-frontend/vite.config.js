/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // None of the components import React, and the plugin's JSX transform is not
  // applied to src/** under vitest — without an explicit runtime every render
  // fails with "React is not defined".
  //
  // Both keys are set on purpose: `vite build` transforms with oxc, vitest with
  // esbuild. Setting only one leaves the other pipeline broken. `vite build`
  // prints a notice that it is ignoring the esbuild option; that notice is the
  // price of having the tests and the build agree on one JSX runtime.
  esbuild: { jsx: 'automatic' },
  oxc: { jsx: 'automatic' },

  // Unit and component tests live here rather than in their own config so they
  // run through the same transform pipeline as the build — a separate
  // vitest.config.js did not pick up the JSX runtime at all.
  //
  // The Playwright specs in ./e2e need a browser and a built app; these need
  // neither, so they are the ones that gate every merge.
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false
  }
})
