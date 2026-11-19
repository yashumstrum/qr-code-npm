import { QrCodeError } from './validate.js';

export const FORMATS = ['png', 'svg', 'txt'];
export const ERROR_LEVELS = ['L', 'M', 'Q', 'H'];

export const DEFAULTS = Object.freeze({
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 512,
  dark: '#000000',
  light: '#ffffff',
  small: true,
});

export function resolveOptions(options = {}) {
  const merged = { ...DEFAULTS, ...options };
  const level = String(merged.errorCorrectionLevel).toUpperCase();
  if (!ERROR_LEVELS.includes(level)) {
    throw new QrCodeError(`Error correction level must be one of ${ERROR_LEVELS.join(', ')}`);
  }
  const width = Number(merged.width);
  if (!Number.isInteger(width) || width < 64 || width > 4096) {
    throw new QrCodeError('Width must be an integer between 64 and 4096');
  }
  const margin = Number(merged.margin);
  if (!Number.isInteger(margin) || margin < 0 || margin > 20) {
    throw new QrCodeError('Margin must be an integer between 0 and 20');
  }
  return { ...merged, errorCorrectionLevel: level, width, margin };
}

export function qrOptions(opts) {
  return {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    width: opts.width,
    color: { dark: opts.dark, light: opts.light },
  };
}
