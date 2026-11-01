import {initialState,positionKey,squareIndex} from './engine.js';
export const LESSONS=[
 {name:'Oracle · Clear diagonals',hero:'o',from:'c3',to:'f6',pieces:{a1:'wk',h8:'bk',c3:'wo',f6:'bq'},goal:'Capture the queen on f6 by sliding your Oracle from c3 along the clear diagonal.',hint:'Select the blue Oracle on c3, then f6. Bishop slides can cross any number of empty diagonal squares.',success:'Exactly. The Oracle keeps every bishop move. Its knight jump is an additional option, not a replacement.'},
 {name:'Double Knight · The long leap',hero:'h',from:'b1',to:'d4',pieces:{a1:'wk',h8:'bk',b1:'wh',b2:'wp',c2:'wp',c3:'wp',d4:'br'},goal:'Capture the rook on d4 with the Double Knight on b1. Your pawns cannot block a leap.',hint:'Count 3 squares forward and 2 across: b1 → d4. Select b1, then the blue ring on d4.',success:'A 3-by-2 leap clears every piece in between. Normal 2-by-1 knight jumps are still available.'},
 {name:'Bastion · Jump the blocker',hero:'s',from:'c3',to:'e5',pieces:{a1:'wk',h8:'bk',c3:'ws',d4:'wp',e5:'bq'},goal:'Capture the queen on e5 with the Bastion on c3, jumping over your pawn on d4.',hint:'The rift jump travels exactly 2 squares diagonally: c3 → e5. The pawn on d4 stays in place.',success:'You jumped the blocker. A Bastion also keeps its normal rook slides, which still need a clear path.'},
];
export function lessonState(index){
 const s=initialState();s.board=Array(64).fill(null);s.rights='';s.powers={w:false,b:false};
 for(const [square,piece] of Object.entries(LESSONS[index].pieces))s.board[squareIndex(square)]={color:piece[0],type:piece[1]};
 s.history=[positionKey(s)];return s;
}
export const solvesLesson=(index,move)=>move.special!=='shield'&&move.from===squareIndex(LESSONS[index].from)&&move.to===squareIndex(LESSONS[index].to);
