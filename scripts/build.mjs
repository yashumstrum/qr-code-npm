import { build } from 'esbuild';
import { rm } from 'node:fs/promises';

await rm(new URL('../dist', import.meta.url), { recursive: true, force: true });

const shared = { bundle: true, logLevel: 'info', target: ['es2020'] };

await Promise.all([
  build({
    ...shared,
    entryPoints: ['src/index.js'],
    outfile: 'dist/index.cjs',
    platform: 'node',
    format: 'cjs',
    target: ['node18'],
    external: ['qrcode'],
    define: { 'import.meta.url': '__importMetaUrl' },
    banner: { js: 'const __importMetaUrl = require("url").pathToFileURL(__filename).href;' },
  }),
  build({
    ...shared,
    entryPoints: ['src/browser.js'],
    outfile: 'dist/browser.mjs',
    platform: 'browser',
    format: 'esm',
  }),
  build({
    ...shared,
    entryPoints: ['src/browser.js'],
    outfile: 'dist/browser.cjs',
    platform: 'browser',
    format: 'cjs',
  }),
  build({
    ...shared,
    entryPoints: ['src/browser.js'],
    outfile: 'dist/qr-code.min.js',
    platform: 'browser',
    format: 'iife',
    globalName: 'QrCode',
    minify: true,
  }),
]);
