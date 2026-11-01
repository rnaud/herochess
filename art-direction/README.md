# Herochess: The Living Grimoire

Art direction: original painterly high fantasy with playful magical storytelling. The tactile, dramatic appeal of illustrated fantasy trading cards, without copying another game's characters, symbols or frames.

## Shared visual language

- Midnight teal and blue-black environments; antique brass, warm ivory and parchment materials.
- Brush-painted detail, believable sculpted objects, theatrical rim lighting, luminous magic and atmospheric depth.
- A distinct visual gag or magical event on every card. Chess pieces are characters, but retain recognizable silhouettes.
- Effects distinguish cards: honey gold for movement, violet for teleportation, turquoise for protection and glacial blue for freezing.
- Art has no baked-in text or borders. Names, rules, selection and focus states remain accessible HTML.
- The board uses the same ivory, teal and brass materials. Decoration must never obscure squares or legal-move highlights.

## Reference targets

1. Game: an enchanted chess table in an old observatory, surrounded by three illuminated spell cards; restrained brass interface framing, clear board and legible parchment rules.
2. Cards: a coherent family of painted vignettes with ornate brass edges, strong titles, large art windows and readable rules. Every painting has one unmistakable central action.

## Asset production

The scene descriptions in `prompts.json` share one style specification. Produce one distinct landscape painting per card. Reuse a chosen painting as a style reference when generating subsequent artwork. Keep references and final assets separate. Record the actual generator used; do not label non-Midjourney work as Midjourney.

## Selected references and delivery

Generated through the signed-in Midjourney website. The board reference was reused as a style reference for the card concepts and all 18 illustrations. No built-in image generator or fallback API was used.

- `board-reference.png`: selected board / environment concept.
- `card-reference.png`: selected frame and illustration concept.
- `midjourney-reference.png`: screenshot of the generated card concept on Midjourney.
- `../public/art/*.jpg`: 18 optimized game paintings, one per card ID. Full-resolution originals were downloaded to the user's Downloads folder.
- `prompts.json`: exact shared style, individual scene prompts and selected Midjourney job links.

The interface implements the reference using HTML brass frames, parchment rule panels and responsive art windows. Artwork is decorative and card names/rules remain accessible text; game mechanics are unchanged.
