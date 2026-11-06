# Reliquary piece set

The game pieces are now a single hand-painted ivory/obsidian miniature set rather than the
32 px procedural sprites. Each piece was rendered as an isolated collectible miniature on a
neutral studio background, cut out, normalized to a shared baseline, and exported at two sizes:

- **160 px heraldic icon WebP** for the flat **Pixel** board and small UI thumbnails. These are deliberately simplified, high-contrast silhouettes with side-colored metal rims so the pieces stay readable at board distance.
- **256 px alpha WebP** detailed miniature cutouts for the 3D **Table** textures.

## Source and fallback

The current set was generated with **OpenAI `gpt-image-1.5`**, high quality, native transparent
PNG output. It replaces an earlier FAL FLUX dev + BirefNet set that was used while the OpenAI
key had no image credits; that earlier set remains in Git history. The OpenAI model supports
transparent output directly, so no external cutout step is needed. Microsoft's procedural pixel
atlas remains in `src/pixel-pieces.js` as a fallback if an art asset fails to load.

Prompt shape:

> A single hand-painted dark-fantasy chess **[piece]** miniature, collectible board-game piece,
> three-quarter view, small dark stone pedestal base, rich painterly texture, dramatic soft rim
> light, deep shadows, centered, isolated on a flat neutral medium-grey studio background, no
> chessboard, no text, no scenery, no other objects, no cast shadow. Carved **warm ivory with aged
> gold filigree** / **black obsidian with cold silver filigree**, tiny arcane runes and a faint
> amber/cold glow.

## Files

`public/art/pieces/icon-{ivory|obsidian}-{p|n|b|r|q|k}-160.webp` for the flat board and
`public/art/pieces/{ivory|obsidian}-{p|n|b|r|q|k}-256.webp` for Table.

Reference sheets: [miniatures](piece-set-v1.webp) and [flat icons](piece-icons-v1.webp).
