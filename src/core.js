import QRCode from 'qrcode';
import { normalizeLink } from './validate.js';
import { FORMATS, resolveOptions } from './options.js';

function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

export function detectFormat(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName));
  const ext = match ? match[1].toLowerCase() : '';
  return FORMATS.includes(ext) ? ext : null;
}

export function defaultFileName(link, format = 'png') {
  let base = 'qr-code';
  try {
    const url = new URL(normalizeLink(link));
    base = `${url.hostname || url.protocol.replace(':', '')}${url.pathname}`
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'qr-code';
  } catch {
    base = 'qr-code';
  }
  return `${base}.${format}`;
}

export function toMatrixSync(link, options = {}) {
  const text = normalizeLink(link);
  const opts = resolveOptions(options);
  const qr = QRCode.create(text, { errorCorrectionLevel: opts.errorCorrectionLevel });
  const { size, data } = qr.modules;
  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      row.push(Boolean(data[y * size + x]));
    }
    rows.push(row);
  }
  return { version: qr.version, size, rows, text };
}

export async function toMatrix(link, options = {}) {
  return toMatrixSync(link, options);
}

export function toSvgSync(link, options = {}) {
  const opts = resolveOptions(options);
  const { size, rows } = toMatrixSync(link, opts);
  const total = size + opts.margin * 2;
  let path = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < size) {
      if (!row[x]) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < size && row[x + run]) run++;
      path += `M${x + opts.margin} ${y + opts.margin}h${run}v1h-${run}z`;
      x += run;
    }
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${opts.width}" height="${opts.width}" shape-rendering="crispEdges">`,
    `<rect width="100%" height="100%" fill="${escapeAttr(opts.light)}"/>`,
    `<path fill="${escapeAttr(opts.dark)}" d="${path}"/>`,
    '</svg>',
  ].join('');
}

export async function toSvg(link, options = {}) {
  return toSvgSync(link, options);
}

export function toTextSync(link, options = {}) {
  const opts = resolveOptions(options);
  const { size, rows } = toMatrixSync(link, opts);
  const total = size + opts.margin * 2;
  const isDark = (x, y) => {
    const mx = x - opts.margin;
    const my = y - opts.margin;
    return mx >= 0 && my >= 0 && mx < size && my < size && rows[my][mx];
  };
  const lines = [];
  for (let y = 0; y < total; y += 2) {
    let line = '';
    for (let x = 0; x < total; x++) {
      const top = isDark(x, y);
      const bottom = y + 1 < total && isDark(x, y + 1);
      line += top && bottom ? '█' : top ? '▀' : bottom ? '▄' : ' ';
    }
    lines.push(line);
  }
  return `${lines.join('\n')}\n`;
}

export async function toText(link, options = {}) {
  return toTextSync(link, options);
}

export function toSvgDataUrl(link, options = {}) {
  const svg = toSvgSync(link, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
