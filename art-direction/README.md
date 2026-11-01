# Current UI: The Arcana Table

The current full-screen interface follows [interface-reference-v3.png](interface-reference-v3.png), generated with the built-in image tool. See [exact prompts, asset paths and implementation notes](interface-v3-prompts.md). This replaces the Shattered Court layout below. The varied card illustrations remain in use.

# Herochess — The Shattered Court

## Current direction

A varied fantasy anthology, united by painted illustration quality rather than repeated subjects and colors. All 18 card paintings were generated through the signed-in Midjourney website, without the previous teal chessboard style reference.

Each spell has its own world: green meadow cavalry, magenta stars, violet void magic, ochre mountain giants, pearl crystal dragons, golden cloud cities, crimson royal foxes, mischievous portal thieves, misty forest guardians, turquoise desert serpents, fiery armies, storm warriors, a dancing king, tavern companions, autumn homecoming, glass protection, glacial spirits and haunted archery.

## Whole-site design

- `site-reference-v2.png`: the Midjourney game-screen reference for the redesign.
- `../public/art/realms/battlefield.jpg`: painted citadel environment with amber sunset and violet storm light.
- `../public/art/realms/*.jpg`: the 18 new paintings, with card IDs as filenames.
- `prompts-v2.json`: exact shared medium specification, all individual scene prompts, environment and site prompts, and selected Midjourney job links.

The implementation replaces the old stylesheet and layout. It puts the opponent's inspectable spells above the board and the player's three-card hand below it, with a compact status and journal column. The Three.js board has subtle procedural stone grain, ivory and obsidian pieces, brass corner details and engraved rings. Controls, dialogs, typography and card frames share the new fantasy visual language. Card rules remain accessible HTML, with keyboard focus and reduced-motion support.

## Superseded references

`board-reference.png`, `card-reference.png`, `midjourney-reference.png` and `prompts.json` document the first teal-and-gold direction. These are retained as design history and are no longer used by the game. The user requested stronger variation and a full-site redesign after reviewing that version.
