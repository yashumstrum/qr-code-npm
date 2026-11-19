const __importMetaUrl = require("url").pathToFileURL(__filename).href;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.js
var index_exports = {};
__export(index_exports, {
  DEFAULTS: () => DEFAULTS,
  ERROR_LEVELS: () => ERROR_LEVELS,
  FORMATS: () => FORMATS,
  QrCodeError: () => QrCodeError,
  defaultFileName: () => defaultFileName,
  detectFormat: () => detectFormat,
  isValidLink: () => isValidLink,
  normalizeLink: () => normalizeLink,
  parseArgs: () => parseArgs,
  run: () => run,
  runInteractive: () => runInteractive,
  toDataUrl: () => toDataUrl,
  toFile: () => toFile,
  toMatrix: () => toMatrix,
  toMatrixSync: () => toMatrixSync,
  toPngBuffer: () => toPngBuffer,
  toSvg: () => toSvg,
  toSvgDataUrl: () => toSvgDataUrl,
  toSvgSync: () => toSvgSync,
  toTerminal: () => toTerminal,
  toText: () => toText,
  toTextSync: () => toTextSync
});
module.exports = __toCommonJS(index_exports);

// src/validate.js
var ALLOWED_PROTOCOLS = /* @__PURE__ */ new Set(["http:", "https:", "ftp:", "mailto:", "tel:", "sms:"]);
var QrCodeError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "QrCodeError";
  }
};
function normalizeLink(input) {
  if (typeof input !== "string") {
    throw new QrCodeError("Link must be a string");
  }
  const trimmed = input.trim();
  if (!trimmed) {
    throw new QrCodeError("Link cannot be empty");
  }
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^(mailto|tel|sms):/i.test(trimmed);
  if (!hasScheme) {
    const rawHost = trimmed.split(/[/?#]/)[0].split(":")[0].toLowerCase();
    if (rawHost !== "localhost" && !/^[^.\s]+(\.[^.\s]+)+$/.test(rawHost)) {
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
  if ((url.protocol === "http:" || url.protocol === "https:") && !url.hostname.includes(".") && url.hostname !== "localhost") {
    throw new QrCodeError(`Invalid host: ${url.hostname}`);
  }
  return hasScheme ? trimmed : url.toString();
}
function isValidLink(input) {
  try {
    normalizeLink(input);
    return true;
  } catch {
    return false;
  }
}

// src/generate.js
var import_promises = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"), 1);
var import_qrcode2 = __toESM(require("qrcode"), 1);

// src/options.js
var FORMATS = ["png", "svg", "txt"];
var ERROR_LEVELS = ["L", "M", "Q", "H"];
var DEFAULTS = Object.freeze({
  errorCorrectionLevel: "M",
  margin: 2,
  width: 512,
  dark: "#000000",
  light: "#ffffff",
  small: true
});
function resolveOptions(options = {}) {
  const merged = { ...DEFAULTS, ...options };
  const level = String(merged.errorCorrectionLevel).toUpperCase();
  if (!ERROR_LEVELS.includes(level)) {
    throw new QrCodeError(`Error correction level must be one of ${ERROR_LEVELS.join(", ")}`);
  }
  const width = Number(merged.width);
  if (!Number.isInteger(width) || width < 64 || width > 4096) {
    throw new QrCodeError("Width must be an integer between 64 and 4096");
  }
  const margin = Number(merged.margin);
  if (!Number.isInteger(margin) || margin < 0 || margin > 20) {
    throw new QrCodeError("Margin must be an integer between 0 and 20");
  }
  return { ...merged, errorCorrectionLevel: level, width, margin };
}
function qrOptions(opts) {
  return {
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin,
    width: opts.width,
    color: { dark: opts.dark, light: opts.light }
  };
}

// src/core.js
var import_qrcode = __toESM(require("qrcode"), 1);
function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function detectFormat(fileName) {
  const match = /\.([a-z0-9]+)$/i.exec(String(fileName));
  const ext = match ? match[1].toLowerCase() : "";
  return FORMATS.includes(ext) ? ext : null;
}
function defaultFileName(link, format = "png") {
  let base = "qr-code";
  try {
    const url = new URL(normalizeLink(link));
    base = `${url.hostname || url.protocol.replace(":", "")}${url.pathname}`.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "qr-code";
  } catch {
    base = "qr-code";
  }
  return `${base}.${format}`;
}
function toMatrixSync(link, options = {}) {
  const text = normalizeLink(link);
  const opts = resolveOptions(options);
  const qr = import_qrcode.default.create(text, { errorCorrectionLevel: opts.errorCorrectionLevel });
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
async function toMatrix(link, options = {}) {
  return toMatrixSync(link, options);
}
function toSvgSync(link, options = {}) {
  const opts = resolveOptions(options);
  const { size, rows } = toMatrixSync(link, opts);
  const total = size + opts.margin * 2;
  let path2 = "";
  rows.forEach((row, y) => {
    let x = 0;
    while (x < size) {
      if (!row[x]) {
        x++;
        continue;
      }
      let run2 = 1;
      while (x + run2 < size && row[x + run2]) run2++;
      path2 += `M${x + opts.margin} ${y + opts.margin}h${run2}v1h-${run2}z`;
      x += run2;
    }
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${opts.width}" height="${opts.width}" shape-rendering="crispEdges">`,
    `<rect width="100%" height="100%" fill="${escapeAttr(opts.light)}"/>`,
    `<path fill="${escapeAttr(opts.dark)}" d="${path2}"/>`,
    "</svg>"
  ].join("");
}
async function toSvg(link, options = {}) {
  return toSvgSync(link, options);
}
function toTextSync(link, options = {}) {
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
    let line = "";
    for (let x = 0; x < total; x++) {
      const top = isDark(x, y);
      const bottom = y + 1 < total && isDark(x, y + 1);
      line += top && bottom ? "\u2588" : top ? "\u2580" : bottom ? "\u2584" : " ";
    }
    lines.push(line);
  }
  return `${lines.join("\n")}
`;
}
async function toText(link, options = {}) {
  return toTextSync(link, options);
}
function toSvgDataUrl(link, options = {}) {
  const svg = toSvgSync(link, options);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// src/generate.js
async function toTerminal(link, options = {}) {
  const text = normalizeLink(link);
  const opts = resolveOptions(options);
  return import_qrcode2.default.toString(text, {
    type: "terminal",
    small: opts.small,
    errorCorrectionLevel: opts.errorCorrectionLevel,
    margin: opts.margin
  });
}
async function toPngBuffer(link, options = {}) {
  const text = normalizeLink(link);
  return import_qrcode2.default.toBuffer(text, { ...qrOptions(resolveOptions(options)), type: "png" });
}
async function toDataUrl(link, options = {}) {
  const text = normalizeLink(link);
  return import_qrcode2.default.toDataURL(text, qrOptions(resolveOptions(options)));
}
async function toFile(link, filePath, options = {}) {
  if (!filePath || typeof filePath !== "string") {
    throw new QrCodeError("A file path is required");
  }
  const format = (options.format || detectFormat(filePath) || "png").toLowerCase();
  if (!FORMATS.includes(format)) {
    throw new QrCodeError(`Format must be one of ${FORMATS.join(", ")}`);
  }
  let target = import_node_path.default.resolve(filePath);
  if (!detectFormat(target)) {
    target = `${target}.${format}`;
  }
  await (0, import_promises.mkdir)(import_node_path.default.dirname(target), { recursive: true });
  let content;
  if (format === "png") content = await toPngBuffer(link, options);
  else if (format === "svg") content = await toSvg(link, options);
  else content = await toText(link, options);
  await (0, import_promises.writeFile)(target, content);
  return { path: target, format };
}

// src/cli.js
var import_promises2 = require("node:readline/promises");
var import_node_process = require("node:process");
var import_node_fs = require("node:fs");
var color = {
  bold: (s) => import_node_process.stdout.isTTY ? `\x1B[1m${s}\x1B[0m` : s,
  green: (s) => import_node_process.stdout.isTTY ? `\x1B[32m${s}\x1B[0m` : s,
  red: (s) => import_node_process.stderr.isTTY ? `\x1B[31m${s}\x1B[0m` : s,
  cyan: (s) => import_node_process.stdout.isTTY ? `\x1B[36m${s}\x1B[0m` : s,
  dim: (s) => import_node_process.stdout.isTTY ? `\x1B[2m${s}\x1B[0m` : s
};
function version() {
  const pkg = JSON.parse((0, import_node_fs.readFileSync)(new URL("../package.json", __importMetaUrl), "utf8"));
  return pkg.version;
}
var HELP = `
${color.bold("qr-code")} - turn links into QR codes

${color.bold("Usage")}
  qr-code                         start the interactive tool
  qr-code <link> [options]        generate directly

${color.bold("Options")}
  -t, --terminal                  show the QR code in the terminal (default)
  -o, --output <file>             save to a file (.png, .svg, .txt)
  -f, --format <png|svg|txt>      file format when the name has no extension
  -e, --error-level <L|M|Q|H>     error correction level (default M)
  -w, --width <px>                image width for png/svg (default 512)
  -m, --margin <n>                quiet zone size (default 2)
      --dark <color>              dark module color (default #000000)
      --light <color>             light module color (default #ffffff)
      --large                     bigger terminal output
  -i, --interactive               force interactive mode
  -h, --help                      show help
  -v, --version                   show version
`;
function parseArgs(argv) {
  const args = { links: [], options: {}, terminal: false, output: null, interactive: false, help: false, version: false };
  const takeValue = (i, name) => {
    const value = argv[i + 1];
    if (value === void 0 || value.startsWith("-")) {
      throw new QrCodeError(`Missing value for ${name}`);
    }
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case "-h":
      case "--help":
        args.help = true;
        break;
      case "-v":
      case "--version":
        args.version = true;
        break;
      case "-i":
      case "--interactive":
        args.interactive = true;
        break;
      case "-t":
      case "--terminal":
        args.terminal = true;
        break;
      case "--large":
        args.options.small = false;
        break;
      case "-o":
      case "--output":
        args.output = takeValue(i, arg);
        i++;
        break;
      case "-f":
      case "--format":
        args.options.format = takeValue(i, arg).toLowerCase();
        i++;
        break;
      case "-e":
      case "--error-level":
        args.options.errorCorrectionLevel = takeValue(i, arg).toUpperCase();
        i++;
        break;
      case "-w":
      case "--width":
        args.options.width = Number(takeValue(i, arg));
        i++;
        break;
      case "-m":
      case "--margin":
        args.options.margin = Number(takeValue(i, arg));
        i++;
        break;
      case "--dark":
        args.options.dark = takeValue(i, arg);
        i++;
        break;
      case "--light":
        args.options.light = takeValue(i, arg);
        i++;
        break;
      default:
        if (arg.startsWith("-")) {
          throw new QrCodeError(`Unknown option: ${arg}`);
        }
        args.links.push(arg);
    }
  }
  return args;
}
function createPrompter() {
  const rl = (0, import_promises2.createInterface)({ input: import_node_process.stdin, output: import_node_process.stdout, terminal: import_node_process.stdin.isTTY });
  const queue = [];
  const waiting = [];
  let closed = false;
  rl.on("line", (line) => {
    const next = waiting.shift();
    if (next) next.resolve(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    closed = true;
    while (waiting.length) waiting.shift().reject(new QrCodeError("Input closed"));
  });
  rl.on("SIGINT", () => {
    import_node_process.stdout.write("\n");
    rl.close();
    process.exit(130);
  });
  return {
    question(prompt) {
      import_node_process.stdout.write(prompt);
      if (queue.length) {
        const line = queue.shift();
        if (!import_node_process.stdin.isTTY) import_node_process.stdout.write(`${line}
`);
        return Promise.resolve(line);
      }
      if (closed) return Promise.reject(new QrCodeError("Input closed"));
      return new Promise((resolve, reject) => waiting.push({ resolve, reject }));
    },
    close() {
      rl.close();
    }
  };
}
async function ask(rl, question, fallback = "") {
  const suffix = fallback ? color.dim(` (${fallback})`) : "";
  const answer = (await rl.question(`${color.cyan("?")} ${question}${suffix} `)).trim();
  return answer || fallback;
}
async function choose(rl, question, choices) {
  import_node_process.stdout.write(`${color.cyan("?")} ${question}
`);
  choices.forEach((choice, index) => import_node_process.stdout.write(`  ${color.bold(index + 1)}) ${choice.label}
`));
  while (true) {
    const answer = (await rl.question(color.dim("  Select a number: "))).trim();
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && choices[index]) return choices[index].value;
    const byValue = choices.find((c) => c.value === answer.toLowerCase());
    if (byValue) return byValue.value;
    import_node_process.stdout.write(color.red("  Invalid choice, try again\n"));
  }
}
async function askLink(rl) {
  while (true) {
    const answer = await ask(rl, "Enter the link to turn into a QR code:");
    try {
      return normalizeLink(answer);
    } catch (error) {
      import_node_process.stdout.write(color.red(`  ${error.message}
`));
    }
  }
}
async function askSave(rl, link, options) {
  const format = await choose(rl, "File format:", [
    { label: "PNG image", value: "png" },
    { label: "SVG vector", value: "svg" },
    { label: "Text (unicode blocks)", value: "txt" }
  ]);
  const name = await ask(rl, "File name:", defaultFileName(link, format));
  const fileFormat = detectFormat(name) || format;
  const result = await toFile(link, name, { ...options, format: fileFormat });
  import_node_process.stdout.write(color.green(`\u2714 Saved ${result.format.toUpperCase()} to ${result.path}
`));
}
async function runInteractive(options = {}) {
  const rl = createPrompter();
  try {
    import_node_process.stdout.write(`
${color.bold("QR Code Generator")} ${color.dim(`v${version()}`)}

`);
    let again = true;
    while (again) {
      const link = await askLink(rl);
      const action = await choose(rl, "What do you want to do?", [
        { label: "Show in terminal", value: "terminal" },
        { label: "Save to a file", value: "file" },
        { label: "Both", value: "both" }
      ]);
      if (action === "terminal" || action === "both") {
        import_node_process.stdout.write(`
${await toTerminal(link, options)}
`);
        import_node_process.stdout.write(color.dim(`  ${link}

`));
      }
      if (action === "file" || action === "both") {
        await askSave(rl, link, options);
      }
      const next = (await ask(rl, "Generate another? y/n", "n")).toLowerCase();
      again = next === "y" || next === "yes";
      import_node_process.stdout.write("\n");
    }
    import_node_process.stdout.write(color.dim("Bye!\n"));
  } finally {
    rl.close();
  }
}
async function runDirect(args) {
  for (const link of args.links) {
    const normalized = normalizeLink(link);
    const showTerminal = args.terminal || !args.output;
    if (showTerminal) {
      import_node_process.stdout.write(`${await toTerminal(normalized, args.options)}
`);
      if (args.links.length > 1) import_node_process.stdout.write(color.dim(`  ${normalized}

`));
    }
    if (args.output) {
      let target = args.output;
      if (args.links.length > 1) {
        const format = args.options.format || detectFormat(target) || "png";
        const base = target.replace(/\.(png|svg|txt)$/i, "");
        target = `${base}-${args.links.indexOf(link) + 1}.${format}`;
      }
      const result = await toFile(normalized, target, args.options);
      import_node_process.stdout.write(color.green(`\u2714 Saved ${result.format.toUpperCase()} to ${result.path}
`));
    }
  }
}
async function run(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      import_node_process.stdout.write(HELP);
      return 0;
    }
    if (args.version) {
      import_node_process.stdout.write(`${version()}
`);
      return 0;
    }
    if (args.options.format && !FORMATS.includes(args.options.format)) {
      throw new QrCodeError(`Format must be one of ${FORMATS.join(", ")}`);
    }
    if (args.options.errorCorrectionLevel && !ERROR_LEVELS.includes(args.options.errorCorrectionLevel)) {
      throw new QrCodeError(`Error level must be one of ${ERROR_LEVELS.join(", ")}`);
    }
    if (args.interactive || args.links.length === 0) {
      if (!import_node_process.stdin.isTTY && !args.interactive && args.links.length === 0) {
        const piped = (await new Promise((resolve) => {
          let data = "";
          import_node_process.stdin.setEncoding("utf8");
          import_node_process.stdin.on("data", (chunk) => data += chunk);
          import_node_process.stdin.on("end", () => resolve(data));
        })).split(/\s+/).filter(Boolean);
        if (piped.length === 0) throw new QrCodeError("No link provided");
        args.links = piped;
        await runDirect(args);
        return 0;
      }
      await runInteractive(args.options);
      return 0;
    }
    await runDirect(args);
    return 0;
  } catch (error) {
    if (error instanceof QrCodeError) {
      import_node_process.stderr.write(color.red(`\u2716 ${error.message}
`));
      return 1;
    }
    import_node_process.stderr.write(color.red(`\u2716 ${error.stack || error}
`));
    return 1;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULTS,
  ERROR_LEVELS,
  FORMATS,
  QrCodeError,
  defaultFileName,
  detectFormat,
  isValidLink,
  normalizeLink,
  parseArgs,
  run,
  runInteractive,
  toDataUrl,
  toFile,
  toMatrix,
  toMatrixSync,
  toPngBuffer,
  toSvg,
  toSvgDataUrl,
  toSvgSync,
  toTerminal,
  toText,
  toTextSync
});
