import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { normalizeLink, QrCodeError } from './validate.js';
import { FORMATS, resolveOptions, qrOptions } from './options.js';
import { detectFormat, toSvg, toText } from './core.js';

export { FORMATS, ERROR_LEVELS, DEFAULTS } from './options.js';
export {
  detectFormat,
  defaultFileName,
  toMatrix,
  toMatrixSync,
  toSvg,
  toSvgSync,
  toText,
  toTextSync,
  toSvgDataUrl,
} from './core.js';

export async function toTerminal(link, options = {}) {
  const text = normalizeLink(link);
  const opts = resolveOptions(options);
  return QRCode.toString(text, {
    type: 'terminal',
    small: opts.small,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
  });
}

export async function toPngBuffer(link, options = {}) {
  const text = normalizeLink(link);
  return QRCode.toBuffer(text, { ...qrOptions(resolveOptions(options)), type: 'png' });
}

export async function toDataUrl(link, options = {}) {
  const text = normalizeLink(link);
  return QRCode.toDataURL(text, qrOptions(resolveOptions(options)));
}

export async function toFile(link, filePath, options = {}) {
  if (!filePath || typeof filePath !== 'string') {
    throw new QrCodeError('A file path is required');
  }
  const format = (options.format || detectFormat(filePath) || 'png').toLowerCase();
  if (!FORMATS.includes(format)) {
    throw new QrCodeError(`Format must be one of ${FORMATS.join(', ')}`);
  }
  let target = path.resolve(filePath);
  if (!detectFormat(target)) {
    target = `${target}.${format}`;
  }
  await mkdir(path.dirname(target), { recursive: true });
  let content;
  if (format === 'png') content = await toPngBuffer(link, options);
  else if (format === 'svg') content = await toSvg(link, options);
  else content = await toText(link, options);
  await writeFile(target, content);
  return { path: target, format };
}
