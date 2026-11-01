# Herochess — The Arcana Deck

A JavaScript + Three.js card-chess game: standard pieces, a three-card hand, and 18 temporary powers.

**[Play online](https://rnaud.github.io/herochess/)**

## The turn loop

1. Choose one of your three cards.
2. Use its power **instead of** your normal move, or choose **Discard & make a normal move**.
3. Select a piece and a legal destination. Shield and freeze cards need just one target; swaps need two friendly pieces.
4. The used/discarded card goes into the shared discard pile. Draw a replacement immediately, so you always hold three; that replacement is available on your next turn.

Both players start with three cards and see each other's hands. There is no extra opening draw. The shared shuffled deck contains three copies of each card (54 total). When it empties, the discard pile is shuffled back into the draw pile. Undo restores the exact cards, pile order, and position. The draw order is hidden from both players, including the CPU.

## The 18 cards

| Card | Temporary power |
| --- | --- |
| Borrowed Saddle | Any friendly non-king piece makes a normal knight jump. |
| Comet Leap | Any friendly non-king piece makes a 3-by-2 leap. |
| Diagonal Rift | Jump exactly two squares diagonally. |
| Stone Vault | Jump exactly two squares horizontally or vertically. |
| Prism Path | Slide along a clear diagonal, like a bishop. |
| Tower Road | Slide along a clear rank or file, like a rook. |
| Lesser Crown | Slide up to two squares in any straight direction. |
| Pocket Portal | Teleport to an empty square within two files and two ranks. |
| Safe Retreat | Move 1–3 squares straight toward home on a clear path; no capture. |
| Sidewinder | Slide 1–3 squares sideways; may capture. |
| Marching Orders | A pawn advances 1–3 clear squares; no capture. A two-square advance permits en passant. |
| Spearpoint | A pawn captures an enemy directly one square ahead. |
| King’s Footwork | A non-king piece steps one square in any direction. |
| Close Quarters | Swap adjacent friendly non-kings; neither may be frozen, and pawns cannot swap onto either back rank. |
| Homeward | Teleport a non-king piece to an empty square on its own back rank. |
| Glass Aegis | Shield a friendly non-king against capture for one opposing turn. |
| Winter Seal | Freeze an enemy non-king for its next turn. It still attacks and blocks paths. |
| Through the Veil | A bishop, rook, or queen captures along its normal line through exactly one intervening piece, leaving that piece intact. |

Unless a card restricts its target type, it applies to any friendly non-king piece. Leaps ignore intervening pieces. Slides stop at blockers. Travel cards marked “no capture” require empty destinations. All exact rules are also available in the in-game card library.

## Chess rules

Card movement lasts for one action. A pawn borrowing a rook slide remains a pawn afterward, including for attack/check detection. Kings cannot receive powers, be frozen or shielded, or be captured. No action may leave your king in check. Cards in a hand do not themselves attack a king; check uses ordinary piece attacks on the resulting board. Checkmate considers all legal card actions and all discard-for-normal-move options in the current hand.

Shields and freezes expire after the following turn, including if that player uses another effect card. Frozen pieces still give check, so freezing a checking piece does not evade check. Shielded pieces still block and attack normally.

Standard castling, en passant, and promotion remain. A pawn reaching the opposite back rank by card movement promotes to a queen, rook, bishop, or knight. Returning a pawn to its own back rank does not promote it. Moving/swapping an original rook forfeits its castling rights; a frozen rook cannot castle. Only ordinary pawn double advances and two-square Marching Orders advances allow en passant.

The 50-move draw and stalemate remain. Repetition includes the complete position, effects, hands, and deck state; threefold repeats are therefore unusual. Only bare kings automatically draw for insufficient material in card mode, because cards can change the mating potential of other material. Classic mode retains conventional material draws and has no card costs.

## Interface and saves

- 3D and keyboard-accessible 2D boards, move/capture animations, and reduced-motion support.
- Three difficulty levels, playing either side, exact undo, and local autosave.
- Read all 18 cards from **The 18 cards** in the header.
- In 2D, Tab or arrows focus squares; Enter/Space selects them.
- Saves use `herochess-cards-v1`. The earlier permanent-hero edition’s `herochess-v2` save is left untouched, but its rules are incompatible with this edition and it is not loaded into card matches.

## CPU

The worker receives public board state and both visible hands, **not the actual deck, shuffle seed, or history containing that order**. It searches legal card actions and discard choices with iterative-deepening alpha-beta search, move ordering, material/position evaluation, and bounded capture/check continuation on stronger levels. It consumes known cards during search but does not predict unknown replacement draws. This is a lightweight tactical opponent, not an exact chance-tree solver or a tournament engine.

Apprentice searches one ply for up to 0.6 seconds; Tactician up to three plies for 1.8 seconds; Strategist up to four for 4 seconds. Search depth depends on branching and device speed. Every actual CPU action is revalidated against the real game state before it is applied.

## Development

Requires Node.js 22.12+ or 20.19+.

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Use `PLAYWRIGHT_CHANNEL=chrome npm run test:e2e` to test an installed Chrome. Tests cover all 18 effects, deck conservation/reshuffling, three-card hands, king safety, ordinary chess perft, CPU card usage and hidden-draw independence, animations, saving, undo, mobile layout, and keyboard/fallback controls.

- `src/cards.js`: card definitions, deterministic shuffle and hand cycling.
- `src/engine.js`: standard chess rules, card actions, effects, turn application and results.
- `src/ai.js` / `src/ai-worker.js`: public-information CPU search off the main thread.
- `src/board.js`: procedural 3D models, picking, motion, capture and effect visuals.
- `src/main.js`: card hand, board controls, library, journal and saves.

The GitHub Actions workflow tests, builds, and publishes to GitHub Pages on pushes to `master`. Vite uses relative asset URLs for the `/herochess/` project path.

## Design research

Physical card-chess games already exist. Steve Jackson Games’ **Knightmare Chess** uses cards to modify chess rules; its official FAQ describes a limit of one card on a player's turn. That supplied a useful precedent for a single-card action economy. This game uses its own 18-card names and wording, a fixed three-card hand, public hands, explicit discard-for-normal-move rules, and a simplified timing model. No card artwork or card text was copied.

- [Knightmare Chess — publisher](https://www.sjgames.com/knightmare/)
- [Official rules](https://www.sjgames.com/knightmare/img/knightmare-chess-rules.pdf)
- [Official FAQ](https://www.sjgames.com/knightmare/KnightmareChess_FAQ.pdf)

The permanent-hero editions remain recoverable in Git history. This edition has no backend, Ruby, or TypeScript.

### Artwork and interface

The Shattered Court uses 18 distinct Midjourney paintings: different characters, environments, palettes and moods connected by a hand-painted fantasy illustration style. Each card has its own frame accent. The complete interface uses an illustrated citadel backdrop, a textured stone board, brass ornament, opponent spell disclosures, and a three-card hand beneath the battlefield.

See [art direction](art-direction/README.md), [full-screen reference](art-direction/site-reference-v2.png) and [prompts / provenance](art-direction/prompts-v2.json). Optimized local images live in `public/art/realms/`; no Midjourney connection is needed to play. The earlier monochromatic concept remains documented as a superseded reference.

### Card families and power tiers

Each card has a primary family badge: **Offense** (attack/capture opportunities), **Defense** (protection and retreat), **Mobility** (reach and repositioning), or **Tactics** (swapping allies and disrupting enemies). The existing movement kind remains visible separately.

The outer frame and labeled stars show a design rating: **silver ★ Standard**, **blue ★★ Powerful**, or **gold ★★★ Exceptional**. These indicate general potential, not a position-specific recommendation or statistical win-rate measurement. All 18 cards retain three copies each; tiers do not change draw odds or rules. Card-specific illustration colors remain intact.

Families and tiers are declared in `src/cards.js` and appear in both hands and the library. The library supports combined family/tier filters, with a legend linked directly from the player's hand.
