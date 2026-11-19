import type { QrOptions, QrFormat } from './index.js';

export type { QrOptions, QrFormat, QrMatrix, ErrorCorrectionLevel } from './index.js';
export {
  QrCodeError,
  FORMATS,
  ERROR_LEVELS,
  DEFAULTS,
  normalizeLink,
  isValidLink,
  detectFormat,
  defaultFileName,
  toMatrix,
  toMatrixSync,
  toSvg,
  toSvgSync,
  toText,
  toTextSync,
  toSvgDataUrl,
  toDataUrl,
} from './index.js';

export declare function toCanvas(canvas: HTMLCanvasElement | string | null | undefined, link: string, options?: QrOptions): Promise<HTMLCanvasElement>;
export declare function toImage(link: string, options?: QrOptions): Promise<HTMLImageElement>;
export declare function toBlob(link: string, options?: QrOptions): Promise<Blob>;
export declare function download(link: string, fileName?: string, options?: QrOptions): Promise<{ fileName: string; format: QrFormat; size: number }>;
export declare function mount(target: Element | string, link: string, options?: QrOptions): SVGSVGElement;
