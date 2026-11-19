const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'ftp:', 'mailto:', 'tel:', 'sms:']);

export class QrCodeError extends Error {
  constructor(message) {
    super(message);
    this.name = 'QrCodeError';
  }
}

export function normalizeLink(input) {
  if (typeof input !== 'string') {
    throw new QrCodeError('Link must be a string');
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new QrCodeError('Link cannot be empty');
  }
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(mailto|tel|sms):/i.test(trimmed);
  if (!hasScheme) {
    const rawHost = trimmed.split(/[/?#]/)[0].split(':')[0].toLowerCase();
    if (rawHost !== 'localhost' && !/^[^.\s]+(\.[^.\s]+)+$/.test(rawHost)) {
      throw new QrCodeError(`Invalid link: ${trimmed}`);
    }
  }
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  let url;
  try {
    url = new URL(candidate);
  } catch {
    throw new QrCodeError(`Invalid link: ${trimmed}`);
  }
  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    throw new QrCodeError(`Unsupported protocol: ${url.protocol}`);
  }
  if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.includes('.') && url.hostname !== 'localhost') {
    throw new QrCodeError(`Invalid host: ${url.hostname}`);
  }
  return hasScheme ? trimmed : url.toString();
}

export function isValidLink(input) {
  try {
    normalizeLink(input);
    return true;
  } catch {
    return false;
  }
}
