# Arcana Deck balance pass

This is a rules/design audit with deterministic legal-position tests, not a claim of measured competitive balance. Further playtesting should track how often cards are used versus held, whether they produce captures or escapes, and win rates by starting hand and player side.

## Turn and draw economy

- Each turn is either a normal move (no card spent) or a card power instead of a normal move (one card spent). Winter Seal is the explicit exception: freezing an enemy also includes one normal move.
- Normal moves preserve both hands and the draw pile. Selecting a card activates its power directly; cancelling returns to a normal move without spending it.
- Draw one replacement only after using a power; each player holds three. There is no additional start-of-turn draw, so there is no overflow/discard loophole.
- Both sides draw from the same shuffled 18-card pool with one copy of every spell. No card can be duplicated in either hand, the deck, or the used-card pile.
- All cards now have equal copy counts. A higher tier indicates broader potential, not draw rarity or a universally correct choice. Holding any one spell keeps that unique copy out of the opponent’s hand until it is spent and recycled.
- A situational card can be held indefinitely while you move normally. There is no unlimited discard or reroll. Holding a card occupies one of three slots, so it limits your access to fresh powers.
- In 2,000 simulated opening deals, 54.4% of hands contained at least one card with no legal action, 22% of dealt cards were dead on move one, and 0.6% of hands were entirely dead. Homeward, Safe Retreat, Spearpoint and Sidewinder are always dead in the initial position. Those cards become available as the position opens.
- Dead cards are now marked **No target yet**, and selecting one keeps normal moves available instead of trapping the player in power mode. Once per match, a player may exchange one dead card; the old card goes to the bottom of the deck. This is a limited remedy, not a free redraw, so holding a situational card still has a cost.
- Used cards recycle only when the draw pile empties. Undo restores the deck, hands and board for the last action; exchange and hint charges are deliberately not refunded. CPU search uses the visible hands and never predicts the hidden draw order.

## All 18 roles

| Card | Reason to use it | Limitation / tradeoff |
|---|---|---|
| Borrowed Saddle | Knight-shaped jumps create forks with pieces that normally cannot jump. | Fixed landing pattern; one copy. |
| Comet Leap | Long 3-by-2 jumps bypass crowded positions and reach distant targets. | Awkward near edges; cannot make small adjustments. |
| Diagonal Rift | Two-square diagonal jump through a blocker. | Only four destinations; preserves square color. |
| Stone Vault | Two-square straight jump through a blocker. | Only four destinations. |
| Prism Path | Converts a pawn, knight or rook into a long diagonal attacker for one action. | Clear path required; one copy. |
| Tower Road | Long straight captures and cross-board relocation for bishops, knights and pawns. | Clear path required; one copy. |
| Lesser Crown | Exactly two squares in any of eight directions, combining diagonal and straight reach. | Cannot make one-square adjustments and cannot cross blockers. |
| Pocket Portal | Flexible local evacuation or repositioning through congestion. | Empty destination only; no capture. |
| Safe Retreat | Pull a piece backwards through blockers while keeping it near the battle. | Same file, 1–3 squares towards home, empty destination. |
| Sidewinder | Three-square lateral jump crosses a pawn wall or captures behind a screen. | Exactly three sideways; cannot fine-tune position. |
| Marching Orders | Pawn acceleration and promotion tempo; can advance three squares. | Pawn only, forward clear path; two-square advances allow en passant. |
| Spearpoint | Break a pawn blockade by capturing the piece immediately ahead. | Pawn only, must capture; unusable without pawns; remains held. |
| King’s Footwork | Precise one-square corrections, sideways pawn captures and bishop color changes. | One square only; despite its name it does not empower kings. |
| Close Quarters | Swap adjacent allies to extract a trapped piece or bring another into attack. | Both squares must have allies; no kings or frozen pieces; no back-rank pawn swaps. |
| Homeward | Rescue a far-away piece to any empty home-rank square. | Gives up advanced territory; often unavailable in a crowded opening. |
| Glass Aegis | Keep a threatened piece in place for one enemy action while it still attacks. | Costs your entire action; protection expires after the reply. |
| Winter Seal | Deny an enemy non-king piece its next move while making your own normal move. | The frozen piece still attacks; freezing a checker does not resolve check. |
| Through the Veil | Capture through a single screen without removing that screen. | Bishop/rook/queen only, exactly one intervening piece, must capture; one copy. |

## Changes from the previous deck

Safe Retreat now jumps over blockers. Sidewinder now jumps exactly three squares sideways. Lesser Crown now slides exactly two squares, leaving one-square versatility to King's Footwork. The latest update replaces tier-weighted copies with one copy of every spell, at the player’s request. CPU hand evaluation follows tier potential and assigns no reserve value to pawn-only spells when no pawns remain, or Through the Veil when no sliding pieces remain. Actual choices still search the legal effects.

All powers remain temporary. Kings cannot be empowered or captured. No action may leave the mover's king in check. Shield/freeze expire after one opposing action, including another spell. Version-2 card saves upgrade to version 3 with the same board and unique held cards; duplicate copies are replaced and repetition tracking restarts for the changed deck. Older hero saves remain separate.

Regression coverage includes a non-ordinary useful action for every card, the new blocker/range distinctions, exact deck composition through reshuffles, CPU legal play, castling, en passant, promotion, checkmate escapes, and temporary-effect expiry. These establish rule correctness and concrete utility, not equal win rates.
