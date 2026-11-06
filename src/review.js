import {PIECES,inCheck,squareName} from './engine.js';
import {pixelUrl} from './pixels.js';

export function reviewPositions(snapshots,state,journal){
 const positions=snapshots.length?[...snapshots,state]:[state];
 return positions.map((position,index)=>({position,index,label:index===0?'Start':(journal[index-1]||`Move ${index}`),final:index===positions.length-1}));
}
export function reviewMaterial(position){
 let white=0,black=0;
 for(const piece of position.board){const value=PIECES[piece?.type]?.value||0;if(piece?.color==='w')white+=value;else if(piece?.color==='b')black+=value;}
 const diff=Math.round((white-black)/100);
 return {white:Math.round(white/100),black:Math.round(black/100),diff};
}
export function reviewBoardHtml(position,flipped=false){
 const checked=inCheck(position),king=position.board.findIndex(p=>p?.type==='k'&&p.color===position.turn);
 const cells=[];
 for(let row=0;row<8;row++)for(let col=0;col<8;col++){
  const square=flipped?row*8+7-col:(7-row)*8+col,p=position.board[square];
  const last=position.lastMove&&(position.lastMove.from===square||position.lastMove.to===square);
  const classes=['review-square',(square%8+(square>>3))%2===0?'dark':'',last?'last':'',checked&&square===king?'king-in-check':''].filter(Boolean).join(' ');
  cells.push(`<span class="${classes}" data-square="${square}" aria-hidden="true">${p?`<img src="${pixelUrl(p.type,p.color)}" alt="">`:''}<i>${squareName(square)}</i></span>`);
 }
 return cells.join('');
}
