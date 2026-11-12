import { copyFile, mkdir } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await mkdir(new URL('public/engine/', root), { recursive: true });
for (const [source, target] of [
  ['bin/stockfish-19-lite-single.js', 'stockfish.js'],
  ['bin/stockfish-19-lite-single.wasm', 'stockfish.wasm'],
  ['Copying.txt', 'COPYING.txt'],
]) {
  await copyFile(new URL(`node_modules/stockfish/${source}`, root), new URL(`public/engine/${target}`, root));
}
console.log('Stockfish browser engine ready.');
