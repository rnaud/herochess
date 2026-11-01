// Presentation only: the rules engine remains the authority for legal moves.
export const HERO_SUMMARIES = {
 h: { normal: 'Moves like a knight.', power: 'Also jumps 3 squares + 2 across, over any pieces.' },
 o: { normal: 'Slides diagonally like a bishop. Cannot pass through pieces.', power: 'Also jumps in an L shape: 2 squares + 1 across, over any pieces.' },
 s: { normal: 'Moves like a rook.', power: 'Also jumps exactly 2 squares diagonally, over any piece between.' },
};
export function isHeroPowerMove(state, move) {
 const type=state.board[move.from]?.type;
 const dx=Math.abs(move.to%8-move.from%8),dy=Math.abs((move.to>>3)-(move.from>>3));
 return type==='h' ? Math.max(dx,dy)===3 : type==='o' ? dx!==dy : type==='s' ? dx===2&&dy===2 : false;
}
export function oracleMoveHint(state, from, moves) {
 const normal=moves.filter(move=>!isHeroPowerMove(state,move)).length;
 const jumps=moves.length-normal;
 const x=from%8,y=from>>3;
 const adjacent=[[-1,-1],[-1,1],[1,-1],[1,1]].map(([dx,dy])=>[x+dx,y+dy]).filter(([a,b])=>a>=0&&a<8&&b>=0&&b<8);
 const blocked=adjacent.every(([a,b])=>state.board[b*8+a]?.color===state.board[from].color);
 return `${normal} bishop move${normal===1?'':'s'} · ${jumps} knight jump${jumps===1?'':'s'}. `+(blocked?'Your own pieces block every diagonal. Move a blocking piece first; only knight jumps can pass over pieces.':!normal?'No legal bishop moves here: diagonals are blocked or moving would expose your king.':'Bishop moves follow clear diagonals and stop at the first piece. Only knight jumps can pass over pieces.');
}
