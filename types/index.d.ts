export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';
export type QrFormat = 'png' | 'svg' | 'txt';

export interface QrOptions {
  errorCorrectionLevel?: ErrorCorrectionLevel;
  margin?: number;
  width?: number;
  dark?: string;
  light?: string;
  small?: boolean;
  format?: QrFormat;
}

export interface QrMatrix {
  version: number;
  size: number;
  rows: boolean[][];
  text: string;
}

export declare class QrCodeError extends Error {}

export declare const FORMATS: QrFormat[];
export declare const ERROR_LEVELS: ErrorCorrectionLevel[];
export declare const DEFAULTS: Readonly<Required<Omit<QrOptions, 'format'>>>;

export declare function normalizeLink(input: string): string;
export declare function isValidLink(input: string): boolean;
export declare function detectFormat(fileName: string): QrFormat | null;
export declare function defaultFileName(link: string, format?: QrFormat): string;

export declare function toMatrix(link: string, options?: QrOptions): Promise<QrMatrix>;
export declare function toMatrixSync(link: string, options?: QrOptions): QrMatrix;
export declare function toSvg(link: string, options?: QrOptions): Promise<string>;
export declare function toSvgSync(link: string, options?: QrOptions): string;
export declare function toText(link: string, options?: QrOptions): Promise<string>;
export declare function toTextSync(link: string, options?: QrOptions): string;
export declare function toSvgDataUrl(link: string, options?: QrOptions): string;
export declare function toDataUrl(link: string, options?: QrOptions): Promise<string>;

export declare function toTerminal(link: string, options?: QrOptions): Promise<string>;
export declare function toPngBuffer(link: string, options?: QrOptions): Promise<Buffer>;
export declare function toFile(link: string, filePath: string, options?: QrOptions): Promise<{ path: string; format: QrFormat }>;

export interface ParsedArgs {
  links: string[];
  options: QrOptions;
  terminal: boolean;
  output: string | null;
  interactive: boolean;
  help: boolean;
  version: boolean;
}

export declare function parseArgs(argv: string[]): ParsedArgs;
export declare function run(argv?: string[]): Promise<number>;
export declare function runInteractive(options?: QrOptions): Promise<void>;
