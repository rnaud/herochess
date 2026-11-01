# Herochess

Classic chess. Extraordinary pieces. A browser game rebuilt from scratch with **JavaScript and Three.js**, featuring a sculpted 3D board and a CPU that understands every hero move.

[Play Herochess](https://rnaud.github.io/herochess/)

## Play

Select a piece and then a highlighted destination. Ivory (White) moves first. Checkmate wins; kings cannot be captured. Choose either side and switch between Hero and Classic rules when starting a new match.

In Hero mode, each army replaces its a-file rook, b-file knight, and c-file bishop with:

| Hero | Power |
| --- | --- |
| **Double Knight** | Normal knight jumps plus (3, 2) and (2, 3) jumps, in every direction. |
| **Oracle** | Bishop slides plus normal knight jumps. |
| **Bastion** | Rook slides plus jumps exactly two squares diagonally. |

Ivory’s heroes have blue bodies; Obsidian’s heroes have orange bodies. Their bases keep their army’s color. Hero cards show each piece’s current square and explain its normal moves and extra power. Select a hero to see normal destinations as green dots and extra power destinations as blue rings.

The Oracle’s bishop slides need a clear diagonal: its own pawns block both forward diagonals at the start. Selecting it shows available bishop moves and knight jumps, and explains blocked diagonals.

All jumps ignore intervening pieces. Powers are unlimited, always active, and identical for both sides. Heroes can capture on their destinations but cannot land on allies. All pieces must respect king safety. Bastions can castle from their original rook squares.

Castling, en passant, and four promotion choices are supported. Stalemate, threefold repetition, the 50-move rule, and basic insufficient-material positions automatically draw. Promotions use standard pieces. In the 2D view, use Tab or arrow keys to focus a square and Enter or Space to select it. The 2D board also works when WebGL is unavailable.

Moves animate in both 3D and 2D: sliding pieces glide, jumping pieces arc over the board, and captures dissolve. Castling moves both pieces together. Reduced-motion preferences skip these effects. Undo and new matches safely cancel animations.

Undo takes back the player's last turn and the CPU reply, including while the CPU is thinking. The current match and undo history save locally in this browser. No account or server is required.

## Develop

Requires Node.js 22.12+ (or 20.19+).

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

Browser integration tests:

```sh
npx playwright install chromium
npm run test:e2e
```

To use an installed Google Chrome instead: `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e`.

## Architecture

- `src/engine.js`: pure rules, piece definitions, attack detection, legal moves, and game results. Shared by the interface and CPU.
- `src/ai.js`: iterative-deepening negamax with alpha-beta pruning, capture ordering, material and positional evaluation, and a time budget.
- `src/ai-worker.js`: CPU search off the main thread; restarting or undoing terminates stale searches.
- `src/board.js`: procedural Three.js board, piece geometry, lighting, shadows, and picking.
- `src/main.js`: game lifecycle, controls, accessible 2D board, promotion, move journal, and local saves.
- `tests/engine.test.js`: standard perft, hero powers, king safety, special moves, draws, and CPU behavior.
- `tests/browser.spec.js`: complete user flows, saves, undo, both sides, keyboard controls, and mobile layout.

### Add a hero

Add a definition to `PIECES` in `engine.js`, with a name, material value, step offsets and/or sliding rays. Set `base` to a standard piece type for its 3D model and add descriptive text. Then add the hero to the initial setup, UI card/glyph lists, and tests. The CPU automatically generates and evaluates its moves from the same definition. Stateful powers such as cooldowns require extending the position, move application, and repetition key as well.

The CPU is a lightweight custom opponent, not a tournament engine. Apprentice searches one ply; Tactician searches up to three; Strategist up to four within its time budget. It models hero powers at every search node, including check and mate. Conservative insufficient-material detection does not attempt to prove every possible dead position with heroes.

## Deploy

The GitHub Actions workflow tests and builds on pushes to `master`, then deploys `dist` to GitHub Pages. In repository settings, choose **GitHub Actions** as the Pages source. Vite uses relative asset URLs, so the build works beneath the `/herochess/` project path. A successful deployment is available at the Play link above.

The old Rails implementation remains recoverable in Git history. This version has no Ruby or TypeScript and needs no backend. All piece models are generated in code; typography uses Google Fonts with local system fallbacks.
