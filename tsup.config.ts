import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  platform: 'neutral',
  bundle: true,
  skipNodeModulesBundle: false,
  tsconfig: './tsconfig.build.json',
});
