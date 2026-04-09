import { defineConfig } from 'vite'
import { builtinModules } from 'module'

export default defineConfig({
  build: {
    ssr: true,
    target: 'node18',
    outDir: 'dist/server',
    rollupOptions: {
      input: 'server/index.ts',
      external: [
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`),
        // Externalize all node_modules
        /^[^./]/,
      ],
      output: {
        format: 'cjs',
        entryFileNames: '[name].js',
      },
    },
  },
})
