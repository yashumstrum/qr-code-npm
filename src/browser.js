import QRCode from 'qrcode';
import { normalizeLink, QrCodeError } from './validate.js';
import { FORMATS, resolveOptions, qrOptions } from './options.js';
import { detectFormat, defaultFileName, toSvgSync, toTextSync, toSvgDataUrl } from './core.js';

export { normalizeLink, isValidLink, QrCodeError } from './validate.js';
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

function requireDom() {
  if (typeof document === 'undefined') {
    throw new QrCodeError('This function needs a browser environment');
  }
}

function resolveElement(target) {
  requireDom();
  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) {
    throw new QrCodeError(`Element not found: ${target}`);
  }
  return element;
}

export async function toCanvas(canvas, link, options = {}) {
  const text = normalizeLink(link);
  const opts = qrOptions(resolveOptions(options));
  if (canvas === undefined || canvas === null) {
    requireDom();
    return QRCode.toCanvas(text, opts);
  }
  await QRCode.toCanvas(resolveElement(canvas), text, opts);
  return resolveElement(canvas);
}

export async function toDataUrl(link, options = {}) {
  requireDom();
  const text = normalizeLink(link);
  return QRCode.toDataURL(text, qrOptions(resolveOptions(options)));
}

export async function toImage(link, options = {}) {
  requireDom();
  const image = new Image();
  image.alt = normalizeLink(link);
  image.width = resolveOptions(options).width;
  image.height = image.width;
  const src = options.format === 'svg' ? toSvgDataUrl(link, options) : await toDataUrl(link, options);
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new QrCodeError('Failed to load QR image'));
    image.src = src;
  });
  return image;
}

export async function toBlob(link, options = {}) {
  const format = (options.format || 'png').toLowerCase();
  if (!FORMATS.includes(format)) {
    throw new QrCodeError(`Format must be one of ${FORMATS.join(', ')}`);
  }
  if (format === 'svg') return new Blob([toSvgSync(link, options)], { type: 'image/svg+xml' });
  if (format === 'txt') return new Blob([toTextSync(link, options)], { type: 'text/plain;charset=utf-8' });
  const canvas = await toCanvas(null, link, options);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new QrCodeError('Failed to create PNG'))), 'image/png');
  });
}

export async function download(link, fileName, options = {}) {
  requireDom();
  const format = (options.format || detectFormat(fileName || '') || 'png').toLowerCase();
  let name = fileName || defaultFileName(link, format);
  if (!detectFormat(name)) name = `${name}.${format}`;
  const blob = await toBlob(link, { ...options, format });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { fileName: name, format, size: blob.size };
}

export function mount(target, link, options = {}) {
  const element = resolveElement(target);
  element.innerHTML = toSvgSync(link, options);
  const svg = element.firstElementChild;
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `QR code for ${normalizeLink(link)}`);
  return svg;
}
