import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  normalizeLink,
  isValidLink,
  QrCodeError,
  toTerminal,
  toSvg,
  toText,
  toPngBuffer,
  toDataUrl,
  toMatrix,
  toFile,
  defaultFileName,
  parseArgs,
} from '../src/index.js';

test('normalizeLink adds https when missing', () => {
  assert.equal(normalizeLink('example.com'), 'https://example.com/');
  assert.equal(normalizeLink('  https://example.com/a?b=1 '), 'https://example.com/a?b=1');
});

test('normalizeLink rejects bad input', () => {
  assert.throws(() => normalizeLink(''), QrCodeError);
  assert.throws(() => normalizeLink('not a link'), QrCodeError);
  assert.throws(() => normalizeLink('javascript:alert(1)'), QrCodeError);
  assert.equal(isValidLink('mailto:a@b.co'), true);
  assert.equal(isValidLink('nope'), false);
  assert.equal(isValidLink('1'), false);
  assert.equal(isValidLink('localhost:3000'), true);
});

test('renders terminal, text and svg output', async () => {
  assert.ok((await toTerminal('example.com')).length > 100);
  assert.match(await toText('example.com'), /█/);
  assert.match(await toSvg('example.com'), /^<svg/);
});

test('renders png buffer and data url', async () => {
  const png = await toPngBuffer('example.com', { width: 128 });
  assert.deepEqual([...png.subarray(1, 4)], [0x50, 0x4e, 0x47]);
  assert.match(await toDataUrl('example.com'), /^data:image\/png;base64,/);
});

test('toMatrix returns a square grid', async () => {
  const { size, rows } = await toMatrix('example.com');
  assert.equal(rows.length, size);
  assert.ok(rows.every((r) => r.length === size));
});

test('toFile writes each format', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'qr-code-'));
  try {
    const png = await toFile('example.com', path.join(dir, 'a.png'));
    assert.equal(png.format, 'png');
    const svg = await toFile('example.com', path.join(dir, 'b'), { format: 'svg' });
    assert.ok(svg.path.endsWith('b.svg'));
    assert.match(await readFile(svg.path, 'utf8'), /<svg/);
    const txt = await toFile('example.com', path.join(dir, 'nested/c.txt'));
    assert.match(await readFile(txt.path, 'utf8'), /█/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('rejects invalid options', async () => {
  await assert.rejects(() => toSvg('example.com', { errorCorrectionLevel: 'Z' }), QrCodeError);
  await assert.rejects(() => toSvg('example.com', { width: 5 }), QrCodeError);
});

test('defaultFileName builds a safe name', () => {
  assert.equal(defaultFileName('https://github.com/user/repo'), 'github-com-user-repo.png');
  assert.equal(defaultFileName('example.com', 'svg'), 'example-com.svg');
});

test('parseArgs reads flags', () => {
  const args = parseArgs(['example.com', '-o', 'out.svg', '-e', 'h', '-w', '300', '--large']);
  assert.deepEqual(args.links, ['example.com']);
  assert.equal(args.output, 'out.svg');
  assert.equal(args.options.errorCorrectionLevel, 'H');
  assert.equal(args.options.width, 300);
  assert.equal(args.options.small, false);
  assert.throws(() => parseArgs(['--bogus']), QrCodeError);
  assert.throws(() => parseArgs(['-o']), QrCodeError);
});
