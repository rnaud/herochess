# Current UI: The Arcana Table

The current full-screen interface follows [interface-reference-v3.png](interface-reference-v3.png), generated with the built-in image tool. See [exact prompts, asset paths and implementation notes](interface-v3-prompts.md). This replaces the Shattered Court layout below. The varied card illustrations remain in use.

Current implementation: [desktop pixel board](pixel-implemented-v1.webp), [mobile tray](pixel-mobile-implemented-v1.webp), [mobile targeting](pixel-mobile-active-v1.webp), [capture effects](effects-capture-v1.webp), [Glass Aegis effects](effects-shield-v1.webp) and [hybrid Table effects](effects-table-v1.webp). The new [reliquary piece set](piece-set-v1.webp) replaces the procedural pixel pieces; see it [on the Pixel board](piece-set-flat-v1.webp), [on the Table](piece-set-table-v1.webp) and [on mobile](piece-set-mobile-v1.webp). [Source notes](piece-set-notes.md) cover the prompt, cutout and current provider. New this pass: [Match Review](review-v1.webp), [Record & trophies](record-v1.webp), [Arcana Trials](trials-v1.webp), [a solved trial](trial-solved-v1.webp), [Threat Radar](radar-v1.webp) and [audio settings](audio-v1.webp).

# Herochess — The Shattered Court

## Current direction

A varied fantasy anthology, united by painted illustration quality rather than repeated subjects and colors. All 18 card paintings were generated through the signed-in Midjourney website, without the previous teal chessboard style reference.

Each spell has its own world: green meadow cavalry, magenta stars, violet void magic, ochre mountain giants, pearl crystal dragons, golden cloud cities, crimson royal foxes, mischievous portal thieves, misty forest guardians, turquoise desert serpents, fiery armies, storm warriors, a dancing king, tavern companions, autumn homecoming, glass protection, glacial spirits and haunted archery.

## Whole-site design

- `site-reference-v2.png`: the Midjourney game-screen reference for the redesign.
- `../public/art/realms/*-960.webp` and `*-480.webp`: optimized copies of the 18 paintings, with card IDs as filenames. The source JPEGs remain in Git history; the unused `battlefield.jpg` was removed from the runtime.
- `prompts-v2.json`: exact shared medium specification, all individual scene prompts, environment and site prompts, and selected Midjourney job links.

The implementation replaces the old stylesheet and layout. It puts the opponent's inspectable spells above the board and the player's three-card hand below it, with a compact status and journal column. The Pixel board is the default. The optional Three.js table keeps the procedural stone grain, brass corner details and engraved rings; both views use 32 px pixel-art pieces baked from the sculpted models. Controls, dialogs, typography and card frames share the new fantasy visual language. Card rules remain accessible HTML, with keyboard focus and reduced-motion support.

## Superseded references

`board-reference.png`, `card-reference.png`, `midjourney-reference.png` and `prompts.json` document the first teal-and-gold direction. These are retained as design history and are no longer used by the game. The user requested stronger variation and a full-site redesign after reviewing that version.
