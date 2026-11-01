import { PIECES, legalMoves, applyMove, inCheck, outcome } from './engine.js';
export function evaluate(state) {
 let score=0;
 for(let i=0;i<64;i++) {
  const p=state.board[i];if(!p)continue;
  const x=i%8,y=p.color==='w'?i>>3:7-(i>>3),center=3.5-Math.abs(3.5-x)+3.5-Math.abs(3.5-y);
  let value=PIECES[p.type].value;
  if(p.type==='p')value+=y*9+center*3;
  else if(p.type==='k')value+=y<2?(Math.abs(3.5-x)>1.5?24:0):-center*8;
  else value+=center*(['n','h','o','b'].includes(p.type)?12:4);
  score+=p.color===state.turn?value:-value;
 }
 return score;
}
function priority(s,m){return (s.board[m.to]?10*PIECES[s.board[m.to].type].value-PIECES[s.board[m.from].type].value:0)+(m.promotion?900:0)+(m.special==='ep'?100:0);}
export function chooseMove(state,{maxDepth=3,timeMs=1600}={}) {
 const start=performance.now();let nodes=0,completedDepth=0;
 const rootMoves=legalMoves(state);if(!rootMoves.length||outcome(state,rootMoves).over)return {move:null,nodes,depth:0};
 let best=rootMoves[0];
 const timeout={};
 function search(s,depth,alpha,beta,ply) {
  if((++nodes&127)===0&&performance.now()-start>timeMs)throw timeout;
  const moves=legalMoves(s),end=outcome(s,moves);
  if(end.over)return end.winner?-100000+ply:0;
  if(depth<=0)return evaluate(s);
  moves.sort((a,b)=>priority(s,b)-priority(s,a));
  let score=-Infinity;
  for(const m of moves){const value=-search(applyMove(s,m),depth-1,-beta,-alpha,ply+1);score=Math.max(score,value);alpha=Math.max(alpha,value);if(alpha>=beta)break;}
  return score;
 }
 for(let depth=1;depth<=maxDepth;depth++) {
  try {
   let candidate=best,alpha=-Infinity;
   rootMoves.sort((a,b)=>(b===best?1:0)-(a===best?1:0)||priority(state,b)-priority(state,a));
   for(const m of rootMoves){const score=-search(applyMove(state,m),depth-1,-Infinity,-alpha,1);if(score>alpha){alpha=score;candidate=m;}}
   best=candidate;completedDepth=depth;
  }catch(e){if(e!==timeout)throw e;break;}
 }
 return {move:best,nodes,depth:completedDepth};
}
