import {initialState,positionKey} from './engine.js';
import {CARD_IDS} from './cards.js';

const KEY='herochess-trials-v1';
const TRIALS=[
 {id:'tower',card:'tower',name:'The Long Road',prompt:'Tower Road turns a pawn into a back-rank queen. Find mate in one.',hint:'The pawn on e2 has a straight road to e8.',rows:['.......k','........','......K.','........','........','........','....P...','........']},
 {id:'recall',card:'recall',name:'Homeward Bound',prompt:'A crowded back rank hides the finish. Homeward finds it. Find mate in one.',hint:'The queen or rook can finish on h1.',rows:['.......k','........','......K.','........','..B.....','........','.P.NPN..','.RN.QN..']},
 {id:'pierce',card:'pierce',name:'Through the Veil',prompt:'Exactly one piece stands in the rook’s way. Find mate in one.',hint:'The rook jumps the pawn to take the bishop.',rows:['....b..k','........','.......K','........','....P...','........','....R...','........']},
 {id:'comet',card:'comet',name:'Comet’s Edge',prompt:'Comet Leap reaches a mating square no queen can reach here. Find mate in one.',hint:'The queen can land on e1.',rows:['........','........','........','........','..Q.....','...P...K','..P.....','.......k']},
 {id:'saddle',card:'saddle',name:'Saddle the Diagonal',prompt:'A knight’s shape can open a queen’s diagonal. Find mate in one.',hint:'The rook leaps from c3 to d1, opening c3.',rows:['........','........','.....Q..','........','.....N..','..R.....','n.p.....','k......K']},
 {id:'frost',card:'frost',name:'Winter’s Seal',prompt:'Winter Seal freezes a guard, then the queen seals the file. Find mate in one.',hint:'Freeze the knight on g8, then play queen h6.',rows:['.....pnk','K.......','...Q....','..N.....','........','.R......','........','........']}
];
function rowsToBoard(rows){const board=Array(64).fill(null);rows.forEach((row,rank)=>[...row].forEach((ch,file)=>{if(ch!=='.')board[(7-rank)*8+file]={type:ch.toLowerCase(),color:ch===ch.toUpperCase()?'w':'b'};}));return board;}
export {TRIALS};
export function buildTrialState(trial){
 const s=initialState('cards',trial.id.length*97+7);
 s.board=rowsToBoard(trial.rows);s.turn='w';s.rights='';s.ep=null;s.halfmove=0;s.fullmove=1;s.shield=null;s.freeze=null;
 const fill=CARD_IDS.filter(id=>id!==trial.card).slice(0,2);
 s.hands={w:[trial.card,...fill],b:['step','retreat','flank']};
 s.deck=CARD_IDS.filter(id=>!s.hands.w.includes(id)&&!s.hands.b.includes(id));s.discard=[];s.history=[positionKey(s)];
 return s;
}
export function loadSolved(){try{const a=JSON.parse(localStorage.getItem(KEY));return Array.isArray(a)?a:[];}catch{return [];}}
export function saveSolved(ids){try{localStorage.setItem(KEY,JSON.stringify([...new Set(ids)]));}catch{}}
export function nextTrial(id){const i=TRIALS.findIndex(t=>t.id===id);return TRIALS[(i+1)%TRIALS.length];}
