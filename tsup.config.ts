import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  outDir: 'dist',
  external: ['@daysnap/utils', 'vue', 'vue-router'],
})
