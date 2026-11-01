# Arcana Deck balance pass

This is a rules/design audit with deterministic legal-position tests, not a claim of measured competitive balance. Further playtesting should track how often cards are used versus discarded, whether they produce captures or escapes, and win rates by starting hand and player side.

## Turn and draw economy

- Each action consumes exactly one card: use its power **instead of** a normal move, or discard it to make a normal move. No free spell plus move combinations.
- Draw one replacement after acting; each player holds three. There is no additional start-of-turn draw, so there is no overflow/discard loophole.
- Both sides draw from the same shuffled 40-card pool: 7 Standard spells × 3 copies, 8 Powerful × 2, 3 Exceptional × 1. The initial pool is 52.5% Standard, 40% Powerful, 7.5% Exceptional. These are pool proportions, not fixed independent draw probabilities.
- Exceptional reach is deliberately scarce. Pawn-focused spells are common alternatives to spending a scarce Tower Road on the same maneuver. A higher tier indicates broader potential, not a universally correct choice.
- Discarding always buys a normal move and a replacement. Situational cards never force a wasted turn. Holding a rare card costs one of only three hand slots.
- Used cards recycle only when the draw pile empties. Undo restores the exact deck, hands and board. CPU search uses the visible hands and never predicts the hidden draw order.

## All 18 roles

| Card | Reason to use it | Limitation / tradeoff |
|---|---|---|
| Borrowed Saddle | Knight-shaped jumps create forks with pieces that normally cannot jump. | Fixed landing pattern; two copies. |
| Comet Leap | Long 3-by-2 jumps bypass crowded positions and reach distant targets. | Awkward near edges; cannot make small adjustments. |
| Diagonal Rift | Two-square diagonal jump through a blocker. | Only four destinations; preserves square color. |
| Stone Vault | Two-square straight jump through a blocker. | Only four destinations. |
| Prism Path | Converts a pawn, knight or rook into a long diagonal attacker for one action. | Clear path required; one copy. |
| Tower Road | Long straight captures and cross-board relocation for bishops, knights and pawns. | Clear path required; one copy. |
| Lesser Crown | Exactly two squares in any of eight directions, combining diagonal and straight reach. | Cannot make one-square adjustments and cannot cross blockers. |
| Pocket Portal | Flexible local evacuation or repositioning through congestion. | Empty destination only; no capture. |
| Safe Retreat | Pull a piece backwards through blockers while keeping it near the battle. | Same file, 1–3 squares towards home, empty destination. |
| Sidewinder | Three-square lateral jump crosses a pawn wall or captures behind a screen. | Exactly three sideways; cannot fine-tune position. |
| Marching Orders | Common pawn acceleration and promotion tempo; can advance three squares. | Pawn only, forward clear path; two-square advances allow en passant. |
| Spearpoint | Break a pawn blockade by capturing the piece immediately ahead. | Pawn only, must capture; useless without pawns and safely discardable. |
| King’s Footwork | Precise one-square corrections, sideways pawn captures and bishop color changes. | One square only; despite its name it does not empower kings. |
| Close Quarters | Swap adjacent allies to extract a trapped piece or bring another into attack. | Both squares must have allies; no kings or frozen pieces; no back-rank pawn swaps. |
| Homeward | Rescue a far-away piece to any empty home-rank square. | Gives up advanced territory; often unavailable in a crowded opening. |
| Glass Aegis | Keep a threatened piece in place for one enemy action while it still attacks. | Costs your entire action; protection expires after the reply. |
| Winter Seal | Deny an enemy non-king piece its next move. | The frozen piece still attacks; freezing a checker does not resolve check. |
| Through the Veil | Capture through a single screen without removing that screen. | Bishop/rook/queen only, exactly one intervening piece, must capture; one copy. |

## Changes from the previous deck

Safe Retreat now jumps over blockers. Sidewinder now jumps exactly three squares sideways. Lesser Crown now slides exactly two squares, leaving one-square versatility to King's Footwork. Equal three-copy distribution is replaced by 3/2/1 tier weighting. CPU hand evaluation follows tier potential and assigns no reserve value to pawn-only spells when no pawns remain, or Through the Veil when no sliding pieces remain. Actual choices still search the legal effects.

All powers remain temporary. Kings cannot be empowered or captured. No action may leave the mover's king in check. Shield/freeze expire after one opposing action, including another spell. Rule changes start a fresh version-2 save; version-1 matches remain stored separately and are not silently reinterpreted.

Regression coverage includes a non-ordinary useful action for every card, the new blocker/range distinctions, exact deck composition through reshuffles, CPU legal play, castling, en passant, promotion, checkmate escapes, and temporary-effect expiry. These establish rule correctness and concrete utility, not equal win rates.
