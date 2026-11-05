# Arcana Table — built-in image generation

Generator: built-in image_gen tool. No Midjourney calls were used for this UI pass.

## Complete UI reference

Use case: ui-mockup. Create a polished full-screen desktop UI design reference for HEROCHESS, a fantasy chess game with spell cards, landscape 16:10 composition. This is the ENTIRE FUNCTIONAL GAME INTERFACE, not an illustration of a room or a background. Crisp highly legible UI and restrained handcrafted fantasy materials, aged brass hairline borders, near-black ink panels, warm ivory type, subtle engraved corners and oxblood accents. Top navigation is a slim bar: HEROCHESS / THE ARCANA DECK at left, Card atlas, How to play, New match at right. Main layout occupies one screen: LEFT roughly 65 percent contains opponent name and three compact face-up cards in a narrow row above a large clear square chess board with sculpted ivory and charcoal pieces, coordinates, tasteful brass frame; player's name and turn indicator plus Undo / Flip / 3D / 2D below board. RIGHT roughly 35 percent is the player's spell workbench: 'YOUR TURN' small status at top, 'Choose your spell' heading, THREE equally visible illustrated spell cards in a horizontal row, no fanning or overlapping, each with large varied fantasy art, concise readable power text, colored family badge and star power tier. Cards: green 'Borrowed Saddle' with pegasus rider, blue 'Glass Aegis' with guardian shielding against fire, gold 'Through the Veil' with ghost archer. Beneath cards a framed selected spell detail and two large explicit buttons 'Use power' and 'Discard & move'. Lower right contains compact active effects and recent moves. Screen must show all principal controls with no scrolling, maximize board and card clarity. Include family-color badges Offense red, Defense blue, Mobility green, Tactics purple; tiers silver one star, blue two stars, gold three stars. Rich oil-painted card art but clear actual app UI, subtle dark burgundy tabletop texture behind panels, no full-screen scenic landscape, no huge title hero, no gimmicky clutter, no copied franchise logos. A beautiful premium strategy game screenshot, not a website landing page.

Saved reference: `interface-reference-v3.png`. The concept is a layout/style reference; its invented game rules, timer, player identities and effects were not implemented.

## Tabletop asset prompt

Use case: stylized-concept. Asset type: subtle full-screen tabletop material for the Herochess fantasy game UI. Produce a dark oxblood burgundy leather and worn velvet tabletop, nearly black edges, faint embossed medieval botanical filigree in the corners, fine tactile grain, warm muted directional light. Flat overhead material plane, no perspective. Quiet uniform center and no focal subject; this is a restrained background texture underneath many readable UI panels. Very dark, low contrast, premium handmade fantasy board-game surface. Landscape 16:10. Absolutely no text, no cards, no chess pieces, no interface, no borders, no objects.

Saved game asset: `../public/art/interface/tabletop.webp`.

## Automaton portrait prompt

Use case: stylized-concept. Asset type: square opponent avatar for a refined fantasy chess game. Close-up painted portrait of The Automaton, an ancient sentient brass chess strategist: elegant aged bronze faceplate like a knight's visor, two dim amethyst eyes, intricate engraved crown-like brow, dark oxblood mantle, black background. Regal intelligent and mysterious, not threatening, beautifully modeled realistic oil painting with restrained brushwork, warm ivory rim light, antique brass highlights. Strong readable silhouette and face at tiny 64px avatar size. Centered head and shoulders filling square crop. No text, no border, no chessboard, no glowing background.

Saved game asset: `../public/art/interface/automaton.webp`.

## Implementation

The entire match UI follows the generated reference: slim menu, opponent portrait and face-up hand, warm stone board with brass corners, player controls beneath it, a three-card spell workbench alongside it, selected-card details, explicit power/discard modes, compact effects and journal. Dialogs and atlas share the same ink-and-brass surface treatment. The previously generated, varied card illustrations remain in use. Short card summaries are supplemented by full rules in the selected panel, atlas and accessible labels.
