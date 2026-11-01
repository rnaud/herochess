// Presentation only: the rules engine remains the authority for legal moves.
export const HERO_SUMMARIES = {
 h: { normal: 'Moves like a knight.', power: 'Also jumps 3 squares + 2 across, over any pieces.' },
 o: { normal: 'Moves like a bishop.', power: 'Also jumps in an L shape: 2 squares + 1 across, over any pieces.' },
 s: { normal: 'Moves like a rook.', power: 'Also jumps exactly 2 squares diagonally, over any piece between.' },
};
export function isHeroPowerMove(state, move) {
 const type=state.board[move.from]?.type;
 const dx=Math.abs(move.to%8-move.from%8),dy=Math.abs((move.to>>3)-(move.from>>3));
 return type==='h' ? Math.max(dx,dy)===3 : type==='o' ? dx!==dy : type==='s' ? dx===2&&dy===2 : false;
}
