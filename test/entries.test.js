import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as esm from '../src/index.js';

const require = createRequire(import.meta.url);

test('CommonJS build exposes the same API', async () => {
  const cjs = require('../dist/index.cjs');
  for (const key of Object.keys(esm)) {
    assert.equal(typeof cjs[key], typeof esm[key], key);
  }
  assert.equal(await cjs.toSvg('example.com'), await esm.toSvg('example.com'));
  const png = await cjs.toPngBuffer('example.com');
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
});

test('package exports resolve', () => {
  assert.equal(require.resolve('@yashumstrum/qr-code'), require.resolve('../dist/index.cjs'));
  assert.ok(require.resolve('@yashumstrum/qr-code/browser').endsWith('browser.cjs'));
});

test('browser ESM bundle works without a DOM for pure functions', async () => {
  const browser = await import('../dist/browser.mjs');
  assert.match(browser.toSvgSync('example.com'), /^<svg/);
  assert.match(browser.toTextSync('example.com'), /█/);
  assert.equal(browser.toMatrixSync('example.com').rows.length, browser.toMatrixSync('example.com').size);
  await assert.rejects(() => browser.toDataUrl('example.com'), browser.QrCodeError);
  assert.throws(() => browser.mount('#x', 'example.com'), browser.QrCodeError);
});

test('IIFE bundle registers a global', async () => {
  const code = await readFile(new URL('../dist/qr-code.min.js', import.meta.url), 'utf8');
  const context = { URL, encodeURIComponent, Promise, TextEncoder, Uint8Array, Uint8ClampedArray };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(code, context);
  assert.equal(typeof context.QrCode.toSvgSync, 'function');
  assert.match(context.QrCode.toSvgSync('https://example.com'), /<path/);
  assert.equal(context.QrCode.isValidLink('nope'), false);
});

test('sync and async renderers agree', async () => {
  assert.equal(esm.toSvgSync('example.com'), await esm.toSvg('example.com'));
  assert.equal(esm.toTextSync('example.com'), await esm.toText('example.com'));
  assert.match(esm.toSvgDataUrl('example.com'), /^data:image\/svg\+xml/);
  assert.match(esm.toSvgSync('example.com', { dark: '"><script>' }), /fill="&quot;>&lt;script>"/);
});
