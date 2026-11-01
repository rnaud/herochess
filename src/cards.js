export const ORTH=[[1,0],[-1,0],[0,1],[0,-1]];
export const DIAG=[[1,1],[1,-1],[-1,1],[-1,-1]];
export const KNIGHT=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
export const CARDS={
 saddle:{name:'Borrowed Saddle',icon:'♞',kind:'Leap',text:'Move any friendly non-king piece with a knight’s 2-by-1 jump. May capture.',steps:KNIGHT},
 comet:{name:'Comet Leap',icon:'☄',kind:'Leap',text:'Jump any friendly non-king piece 3 squares in one direction and 2 across. May capture.',steps:[[2,3],[3,2],[-2,3],[-3,2],[2,-3],[3,-2],[-2,-3],[-3,-2]]},
 rift:{name:'Diagonal Rift',icon:'◇',kind:'Leap',text:'Jump a friendly non-king piece exactly 2 squares diagonally. May capture.',steps:DIAG.map(([x,y])=>[2*x,2*y])},
 vault:{name:'Stone Vault',icon:'⊞',kind:'Leap',text:'Jump a friendly non-king piece exactly 2 squares horizontally or vertically. May capture.',steps:ORTH.map(([x,y])=>[2*x,2*y])},
 prism:{name:'Prism Path',icon:'╳',kind:'Slide',text:'Move a friendly non-king piece any distance diagonally along a clear path. May capture.',rays:DIAG,range:7},
 tower:{name:'Tower Road',icon:'♜',kind:'Slide',text:'Move a friendly non-king piece any distance horizontally or vertically along a clear path. May capture.',rays:ORTH,range:7},
 crown:{name:'Lesser Crown',icon:'♛',kind:'Slide',text:'Move a friendly non-king piece up to 2 squares in any straight direction along a clear path. May capture.',rays:[...ORTH,...DIAG],range:2},
 blink:{name:'Pocket Portal',icon:'◎',kind:'Travel',text:'Teleport a friendly non-king piece to any empty square within 2 files and 2 ranks. Cannot capture.',teleport:2,empty:true},
 retreat:{name:'Safe Retreat',icon:'↡',kind:'Travel',text:'Move a friendly non-king piece 1–3 squares straight toward its home rank along a clear path. Cannot capture.',retreat:true,empty:true},
 flank:{name:'Sidewinder',icon:'↔',kind:'Slide',text:'Move a friendly non-king piece 1–3 squares sideways along a clear path. May capture.',rays:[[1,0],[-1,0]],range:3},
 charge:{name:'Marching Orders',icon:'⇈',kind:'Pawn',text:'Advance one pawn 1–3 squares straight forward along a clear path. Cannot capture. A 2-square advance allows en passant.',pawn:true,charge:true,empty:true},
 lunge:{name:'Spearpoint',icon:'↑',kind:'Pawn',text:'Capture an enemy directly one square ahead of a pawn. The destination must contain an enemy non-king piece.',pawn:true,lunge:true},
 step:{name:'King’s Footwork',icon:'✣',kind:'Step',text:'Move a friendly non-king piece one square in any direction. May capture.',steps:[...ORTH,...DIAG]},
 relay:{name:'Close Quarters',icon:'⇄',kind:'Tactic',text:'Swap two adjacent friendly non-king pieces. Frozen pieces cannot take part. Pawns cannot swap onto either back rank.',swap:true},
 recall:{name:'Homeward',icon:'⌂',kind:'Travel',text:'Teleport any friendly non-king piece to an empty square on its own back rank. Cannot capture.',recall:true,empty:true},
 ward:{name:'Glass Aegis',icon:'◈',kind:'Ward',text:'Shield one friendly non-king piece instead of moving. It cannot be captured during the opponent’s next turn. It still attacks and blocks paths.',effect:'shield'},
 frost:{name:'Winter Seal',icon:'❄',kind:'Hex',text:'Freeze one enemy non-king piece instead of moving. It cannot move on its next turn, but still attacks and blocks paths. Does not remove check.',effect:'freeze'},
 pierce:{name:'Through the Veil',icon:'✧',kind:'Capture',text:'A bishop, rook, or queen captures along one of its normal lines through exactly one intervening piece. The intervening piece stays.',pierce:true},
};
export const CARD_IDS=Object.keys(CARDS);
// A reproducible shuffled 54-card deck; game state stores the sequence for undo.
export function shuffle(cards,seed){const a=cards.slice();let n=seed>>>0||1;for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return {cards:a,seed:n>>>0};}
export function deal(seed){const shuffled=shuffle([...CARD_IDS,...CARD_IDS,...CARD_IDS],seed);return {hands:{w:shuffled.cards.slice(0,3),b:shuffled.cards.slice(3,6)},deck:shuffled.cards.slice(6),discard:[],rng:shuffled.seed};}
export function cycleCard(state,slot){
 if(state.mode!=='cards')return state;
 const hands={w:state.hands.w.slice(),b:state.hands.b.slice()},hand=hands[state.turn];
 if(!Number.isInteger(slot)||slot<0||slot>=hand.length){if(state.simulation)return state;throw new Error('Choose a card before moving');}
 const [used]=hand.splice(slot,1);let deck=state.deck.slice(),discard=[...state.discard,used],rng=state.rng;
 if(!state.simulation){if(!deck.length){const next=shuffle(discard,rng);deck=next.cards;discard=[];rng=next.seed;}hand.push(deck.shift());}
 return {...state,hands,deck,discard,rng};
}
