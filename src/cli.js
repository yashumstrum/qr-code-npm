import { createInterface } from 'node:readline/promises';
import { stdin, stdout, stderr } from 'node:process';
import { readFileSync } from 'node:fs';
import {
  FORMATS,
  ERROR_LEVELS,
  toTerminal,
  toFile,
  defaultFileName,
  detectFormat,
} from './generate.js';
import { normalizeLink, QrCodeError } from './validate.js';

const color = {
  bold: (s) => (stdout.isTTY ? `\x1b[1m${s}\x1b[0m` : s),
  green: (s) => (stdout.isTTY ? `\x1b[32m${s}\x1b[0m` : s),
  red: (s) => (stderr.isTTY ? `\x1b[31m${s}\x1b[0m` : s),
  cyan: (s) => (stdout.isTTY ? `\x1b[36m${s}\x1b[0m` : s),
  dim: (s) => (stdout.isTTY ? `\x1b[2m${s}\x1b[0m` : s),
};

function version() {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  return pkg.version;
}

const HELP = `
${color.bold('qr-code')} - turn links into QR codes

${color.bold('Usage')}
  qr-code                         start the interactive tool
  qr-code <link> [options]        generate directly

${color.bold('Options')}
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

export function parseArgs(argv) {
  const args = { links: [], options: {}, terminal: false, output: null, interactive: false, help: false, version: false };
  const takeValue = (i, name) => {
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('-')) {
      throw new QrCodeError(`Missing value for ${name}`);
    }
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '-v':
      case '--version':
        args.version = true;
        break;
      case '-i':
      case '--interactive':
        args.interactive = true;
        break;
      case '-t':
      case '--terminal':
        args.terminal = true;
        break;
      case '--large':
        args.options.small = false;
        break;
      case '-o':
      case '--output':
        args.output = takeValue(i, arg);
        i++;
        break;
      case '-f':
      case '--format':
        args.options.format = takeValue(i, arg).toLowerCase();
        i++;
        break;
      case '-e':
      case '--error-level':
        args.options.errorCorrectionLevel = takeValue(i, arg).toUpperCase();
        i++;
        break;
      case '-w':
      case '--width':
        args.options.width = Number(takeValue(i, arg));
        i++;
        break;
      case '-m':
      case '--margin':
        args.options.margin = Number(takeValue(i, arg));
        i++;
        break;
      case '--dark':
        args.options.dark = takeValue(i, arg);
        i++;
        break;
      case '--light':
        args.options.light = takeValue(i, arg);
        i++;
        break;
      default:
        if (arg.startsWith('-')) {
          throw new QrCodeError(`Unknown option: ${arg}`);
        }
        args.links.push(arg);
    }
  }
  return args;
}

function createPrompter() {
  const rl = createInterface({ input: stdin, output: stdout, terminal: stdin.isTTY });
  const queue = [];
  const waiting = [];
  let closed = false;
  rl.on('line', (line) => {
    const next = waiting.shift();
    if (next) next.resolve(line);
    else queue.push(line);
  });
  rl.on('close', () => {
    closed = true;
    while (waiting.length) waiting.shift().reject(new QrCodeError('Input closed'));
  });
  rl.on('SIGINT', () => {
    stdout.write('\n');
    rl.close();
    process.exit(130);
  });
  return {
    question(prompt) {
      stdout.write(prompt);
      if (queue.length) {
        const line = queue.shift();
        if (!stdin.isTTY) stdout.write(`${line}\n`);
        return Promise.resolve(line);
      }
      if (closed) return Promise.reject(new QrCodeError('Input closed'));
      return new Promise((resolve, reject) => waiting.push({ resolve, reject }));
    },
    close() {
      rl.close();
    },
  };
}

async function ask(rl, question, fallback = '') {
  const suffix = fallback ? color.dim(` (${fallback})`) : '';
  const answer = (await rl.question(`${color.cyan('?')} ${question}${suffix} `)).trim();
  return answer || fallback;
}

async function choose(rl, question, choices) {
  stdout.write(`${color.cyan('?')} ${question}\n`);
  choices.forEach((choice, index) => stdout.write(`  ${color.bold(index + 1)}) ${choice.label}\n`));
  while (true) {
    const answer = (await rl.question(color.dim('  Select a number: '))).trim();
    const index = Number(answer) - 1;
    if (Number.isInteger(index) && choices[index]) return choices[index].value;
    const byValue = choices.find((c) => c.value === answer.toLowerCase());
    if (byValue) return byValue.value;
    stdout.write(color.red('  Invalid choice, try again\n'));
  }
}

async function askLink(rl) {
  while (true) {
    const answer = await ask(rl, 'Enter the link to turn into a QR code:');
    try {
      return normalizeLink(answer);
    } catch (error) {
      stdout.write(color.red(`  ${error.message}\n`));
    }
  }
}

async function askSave(rl, link, options) {
  const format = await choose(rl, 'File format:', [
    { label: 'PNG image', value: 'png' },
    { label: 'SVG vector', value: 'svg' },
    { label: 'Text (unicode blocks)', value: 'txt' },
  ]);
  const name = await ask(rl, 'File name:', defaultFileName(link, format));
  const fileFormat = detectFormat(name) || format;
  const result = await toFile(link, name, { ...options, format: fileFormat });
  stdout.write(color.green(`✔ Saved ${result.format.toUpperCase()} to ${result.path}\n`));
}

export async function runInteractive(options = {}) {
  const rl = createPrompter();
  try {
    stdout.write(`\n${color.bold('QR Code Generator')} ${color.dim(`v${version()}`)}\n\n`);
    let again = true;
    while (again) {
      const link = await askLink(rl);
      const action = await choose(rl, 'What do you want to do?', [
        { label: 'Show in terminal', value: 'terminal' },
        { label: 'Save to a file', value: 'file' },
        { label: 'Both', value: 'both' },
      ]);
      if (action === 'terminal' || action === 'both') {
        stdout.write(`\n${await toTerminal(link, options)}\n`);
        stdout.write(color.dim(`  ${link}\n\n`));
      }
      if (action === 'file' || action === 'both') {
        await askSave(rl, link, options);
      }
      const next = (await ask(rl, 'Generate another? y/n', 'n')).toLowerCase();
      again = next === 'y' || next === 'yes';
      stdout.write('\n');
    }
    stdout.write(color.dim('Bye!\n'));
  } finally {
    rl.close();
  }
}

async function runDirect(args) {
  for (const link of args.links) {
    const normalized = normalizeLink(link);
    const showTerminal = args.terminal || !args.output;
    if (showTerminal) {
      stdout.write(`${await toTerminal(normalized, args.options)}\n`);
      if (args.links.length > 1) stdout.write(color.dim(`  ${normalized}\n\n`));
    }
    if (args.output) {
      let target = args.output;
      if (args.links.length > 1) {
        const format = args.options.format || detectFormat(target) || 'png';
        const base = target.replace(/\.(png|svg|txt)$/i, '');
        target = `${base}-${args.links.indexOf(link) + 1}.${format}`;
      }
      const result = await toFile(normalized, target, args.options);
      stdout.write(color.green(`✔ Saved ${result.format.toUpperCase()} to ${result.path}\n`));
    }
  }
}

export async function run(argv = process.argv.slice(2)) {
  try {
    const args = parseArgs(argv);
    if (args.help) {
      stdout.write(HELP);
      return 0;
    }
    if (args.version) {
      stdout.write(`${version()}\n`);
      return 0;
    }
    if (args.options.format && !FORMATS.includes(args.options.format)) {
      throw new QrCodeError(`Format must be one of ${FORMATS.join(', ')}`);
    }
    if (args.options.errorCorrectionLevel && !ERROR_LEVELS.includes(args.options.errorCorrectionLevel)) {
      throw new QrCodeError(`Error level must be one of ${ERROR_LEVELS.join(', ')}`);
    }
    if (args.interactive || args.links.length === 0) {
      if (!stdin.isTTY && !args.interactive && args.links.length === 0) {
        const piped = (await new Promise((resolve) => {
          let data = '';
          stdin.setEncoding('utf8');
          stdin.on('data', (chunk) => (data += chunk));
          stdin.on('end', () => resolve(data));
        })).split(/\s+/).filter(Boolean);
        if (piped.length === 0) throw new QrCodeError('No link provided');
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
      stderr.write(color.red(`✖ ${error.message}\n`));
      return 1;
    }
    stderr.write(color.red(`✖ ${error.stack || error}\n`));
    return 1;
  }
}
