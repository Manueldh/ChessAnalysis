# Chess Review

Review your Chess.com games, see which moves were good or bad, and try the engine’s better alternatives on an interactive board.

## Requirements

- **Node.js 24** and npm (npm comes with Node.js).
- **Git** to clone the repository.
- A modern browser with WebAssembly support, such as Chrome, Firefox, Safari, or Edge.

You do **not** need API keys, a Chess.com subscription, a database, Docker, or a ChatGPT account to run the app locally.

## Quick start

Copy this repository’s HTTPS URL from GitHub’s **Code** button, then run:

```sh
git clone https://github.com/Manueldh/ChessAnalysis.git chess-review
cd chess-review
npm ci
npm run dev
```

Open **http://localhost:5173** in your browser. If the terminal prints a different port, use that URL instead.

Keep the terminal running while using the app. Press **Ctrl+C** to stop it.

### Node.js setup on macOS

Install Node.js 24 from [nodejs.org](https://nodejs.org/en/download), then open a new terminal. Check your installation:

```sh
node --version
npm --version
```

If you already use nvm, run these commands from the project folder instead:

```sh
nvm install
nvm use
npm ci
npm run dev
```

The included `.nvmrc` selects Node.js 24. Windows and Linux users can use the same npm commands; `start.command` is an optional Mac launcher.

## Using the app

1. Click **Import game**.
2. Paste a completed Chess.com game link. If the link cannot be resolved, enter your Chess.com username and optionally the month the game was played. You can also paste or upload a `.pgn` file.
3. Wait for the first review pass, or start stepping through the moves immediately. Ratings appear as positions finish analysing.
4. Click a move in the list, use the board controls, or press the left/right arrow keys.
5. Read its rating and alternative. **Show best move** plays that alternative on the board.
6. Move pieces yourself to explore a variation; **Back to game** returns to the original game.
7. Use **Practice** to revisit mistakes, or select a deeper review in the analysis-quality menu.

The default demo game lets you try everything without importing a game.

## How analysis works

Stockfish 19 runs locally in browser Web Workers. Its JavaScript and WebAssembly files are copied into `public/engine` automatically by `npm ci`; you do not need to install a separate chess engine.

- Fast review: approximately **0.2 seconds per position**, plus startup/processing time.
- Balanced / deeper / thorough review: **0.5 / 1.5 / 4 seconds per position**.
- New variation positions: approximately **0.6 seconds** with three candidate lines.
- Analysed positions are cached in memory, so revisiting them does not repeat the search.
- Evaluations are from White’s perspective: positive favours White, negative favours Black.

Move ratings use this app’s own evaluation-loss thresholds, not Chess.com’s proprietary algorithm. Short searches can disagree with deeper searches. Coaching text is rule-based and currently limited; it is not a full explanation of every tactic or exchange. Threefold-repetition history before a selected position is not supplied to the engine.

## Saved games and privacy

Your latest 30 imported games are saved in this browser’s local storage. They are not synced between computers or browsers, and clearing browser data removes them. Export PGNs to keep a backup or share games.

Game import contacts Chess.com through the app’s local API route. Engine analysis runs on your device. No paid AI service or secret configuration is required.

## Development commands

```sh
npm run dev                  # Development server, normally port 5173
npm run build                # Build the client and server
npm start                    # Serve the built Worker locally; use the printed URL
npx tsc --noEmit              # TypeScript check
node tests/engine.test.mjs    # Stockfish startup and candidate-line test
```

Run the chess regression checks on macOS/Linux:

```sh
npx esbuild tests/chess.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/chess-review-tests.cjs
node /tmp/chess-review-tests.cjs
```

### Project structure

| Path | Purpose |
| --- | --- |
| `app/page.tsx` | Review interface and interactive board |
| `app/globals.css` | Layout and styles |
| `app/api/import/route.ts` | Chess.com game import |
| `lib/chess/core.ts` | PGN parsing, move ratings, and explanations |
| `lib/chess/engine.ts` | Browser Stockfish integration |
| `public/engine/` | Bundled Stockfish engine and license |
| `public/pieces/` | Chess piece graphics |
| `tests/` | Chess and engine checks |

The stack is React + TypeScript, Vinext/Vite, chess.js, and Stockfish. The Cloudflare/Sites build configuration is included, but local development needs no hosting login. The GitHub copy uses an unlinked hosting configuration. Configure your own hosting project before deployment.

## Troubleshooting

- **Node version or installation error:** switch to Node.js 24, then run `npm ci` again. Use `npm ci` to install the versions recorded in the lockfile.
- **The page will not open:** keep `npm run dev` running and use the URL printed in that terminal. Opening source files directly will not run the app.
- **Port 5173 is busy:** close an older development server with Ctrl+C, or use the alternate port printed by Vite.
- **Import cannot find a game:** try username + game month, or export the game’s PGN from Chess.com and paste it. New games may take time to appear in public archives. Only standard chess is supported.
- **Engine does not load:** reload the page in an up-to-date browser. Make sure `/engine/stockfish.js` and `/engine/stockfish.wasm` are being served by the app.
- **Review is slow:** select Fast review. Longer games and deeper settings take longer; navigation itself does not require waiting for the whole game.

## Credits

This is an independent project, not affiliated with Chess.com.

- Stockfish.js 19.0.1: GPL v3; license in `public/engine/COPYING.txt`.
- chess.js 1.4.0: BSD-2-Clause; license in `public/chess-LICENSE.txt`.
- Cburnett chess pieces: Colin M. L. Burnett, via Lichess, CC BY-SA 3.0.
- React: MIT. Lucide: ISC.

See `public/licenses.html` for upstream source and license links. Preserve third-party notices when redistributing.
