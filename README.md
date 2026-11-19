# qr-code

QR code generator for links. Use it as a JavaScript library in Node or the browser, or as an interactive CLI that shows codes in the terminal or saves them as PNG, SVG or text.

## Install (local)

```bash
npm install
npm run build
npm link
```

## JavaScript library

### Node (ESM)

```js
import { toTerminal, toFile, toSvg, toPngBuffer, toDataUrl, toMatrix } from 'qr-code';

console.log(await toTerminal('example.com'));
await toFile('https://example.com', 'out/site.png', { width: 600, errorCorrectionLevel: 'H' });
const svg = await toSvg('https://example.com', { dark: '#111827' });
const png = await toPngBuffer('https://example.com');
```

### Node (CommonJS)

```js
const { toFile, toSvgSync } = require('qr-code');

toFile('example.com', 'qr.png').then(({ path }) => console.log(path));
const svg = toSvgSync('example.com');
```

### Browser (bundlers: Vite, webpack, etc.)

Bundlers pick the browser build automatically. You can also import `qr-code/browser` explicitly.

```js
import { mount, toCanvas, download, toImage, toBlob } from 'qr-code';

mount('#qr', 'https://example.com', { width: 256 });
await toCanvas(document.querySelector('canvas'), 'https://example.com');
document.body.append(await toImage('https://example.com'));
await download('https://example.com', 'my-qr.png');
const blob = await toBlob('https://example.com', { format: 'svg' });
```

### Browser (`<script>` tag)

```html
<div id="qr"></div>
<script src="node_modules/qr-code/dist/qr-code.min.js"></script>
<script>
  QrCode.mount('#qr', 'https://example.com');
</script>
```

There's a working demo in `examples/browser.html`. To try it, serve the package folder (for example `python3 -m http.server`) and open `/examples/browser.html`.

### API

| Function | Node | Browser | Returns |
| --- | :-: | :-: | --- |
| `normalizeLink(link)` | ✔ | ✔ | Cleaned link, adds `https://` when missing |
| `isValidLink(link)` | ✔ | ✔ | `boolean` |
| `toSvg` / `toSvgSync` | ✔ | ✔ | SVG string |
| `toText` / `toTextSync` | ✔ | ✔ | Unicode block string |
| `toMatrix` / `toMatrixSync` | ✔ | ✔ | `{ version, size, rows: boolean[][], text }` |
| `toSvgDataUrl` | ✔ | ✔ | `data:image/svg+xml` URL |
| `toDataUrl` | ✔ | ✔ | PNG data URL |
| `defaultFileName(link, format)` | ✔ | ✔ | Safe file name such as `github-com.png` |
| `toTerminal` | ✔ | | Coloured terminal string |
| `toPngBuffer` | ✔ | | `Buffer` |
| `toFile(link, path, options)` | ✔ | | `{ path, format }` |
| `toCanvas(canvas, link, options)` | | ✔ | `HTMLCanvasElement` (pass `null` to create one) |
| `toImage` | | ✔ | `HTMLImageElement` |
| `toBlob` | | ✔ | `Blob` (png, svg, txt) |
| `download(link, fileName, options)` | | ✔ | Triggers a download |
| `mount(target, link, options)` | | ✔ | Renders an SVG into an element or selector |

Options: `errorCorrectionLevel` (`L`, `M`, `Q`, `H`), `width`, `margin`, `dark`, `light`, `small`, `format` (`png`, `svg`, `txt`).

Errors are thrown as `QrCodeError`. TypeScript types are included.

## CLI

Interactive mode:

```bash
qr-code
```

You'll be asked for a link, then whether to show it in the terminal, save it to a file, or both.

Direct mode:

```bash
qr-code https://example.com
qr-code example.com -o example.png
qr-code example.com -o example.svg --dark "#1e3a8a" -e H
echo "https://example.com" | qr-code
```

| Option | Description |
| --- | --- |
| `-t, --terminal` | Show in terminal (default when no `-o`) |
| `-o, --output <file>` | Save to `.png`, `.svg` or `.txt` |
| `-f, --format <fmt>` | Format when the file name has no extension |
| `-e, --error-level <L\|M\|Q\|H>` | Error correction level |
| `-w, --width <px>` | Image width |
| `-m, --margin <n>` | Quiet zone |
| `--dark`, `--light` | Colors |
| `--large` | Bigger terminal output |
| `-i, --interactive` | Force interactive mode |

## Builds

`npm run build` writes:

- `dist/index.cjs`: Node, CommonJS
- `dist/browser.mjs`: browser, ES module
- `dist/browser.cjs`: browser, CommonJS (for older bundlers)
- `dist/qr-code.min.js`: browser `<script>` tag, global `QrCode`

## Test

```bash
npm test
```
