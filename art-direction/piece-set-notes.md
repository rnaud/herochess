# Reliquary piece set

The game pieces are now a single hand-painted ivory/obsidian miniature set rather than the
32 px procedural sprites. Each piece was rendered as an isolated collectible miniature on a
neutral studio background, cut out, normalized to a shared baseline, and exported at two sizes:

- **96 px painted-pixel WebP** for the flat **Pixel** board and small UI thumbnails.
- **256 px alpha WebP** for the 3D **Table** textures.

## Source and fallback

The current set was generated with **FAL FLUX dev** and **FAL BirefNet v2** cutout because the
provided OpenAI image key returned `credit_balance_exhausted`. The prompts and size/normalization
pipeline are provider-independent and can be re-run with `gpt-image-2` when OpenAI image credits
are available. The original procedural pixel atlas remains in `src/pixel-pieces.js` as a fallback
if an art asset fails to load.

Prompt shape:

> A single hand-painted dark-fantasy chess **[piece]** miniature, collectible board-game piece,
> three-quarter view, small dark stone pedestal base, rich painterly texture, dramatic soft rim
> light, deep shadows, centered, isolated on a flat neutral medium-grey studio background, no
> chessboard, no text, no scenery, no other objects, no cast shadow. Carved **warm ivory with aged
> gold filigree** / **black obsidian with cold silver filigree**, tiny arcane runes and a faint
> amber/cold glow.

## Files

`public/art/pieces/{ivory|obsidian}-{p|n|b|r|q|k}-{96|256}.webp`

The reference sheet is [piece-set-v1.webp](piece-set-v1.webp).
