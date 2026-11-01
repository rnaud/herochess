export const ORTH=[[1,0],[-1,0],[0,1],[0,-1]];
export const DIAG=[[1,1],[1,-1],[-1,1],[-1,-1]];
export const KNIGHT=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
// Families describe the primary purpose; tiers rate potential; every spell has one copy in the deck.
export const FAMILIES={
 offense:{name:'Offense',icon:'⚔',text:'Create attacks and capture opportunities.'},
 defense:{name:'Defense',icon:'◇',text:'Protect a piece or retreat to safety.'},
 mobility:{name:'Mobility',icon:'➶',text:'Reach new squares and reposition your army.'},
 tactics:{name:'Tactics',icon:'✥',text:'Swap allies or disrupt an enemy.'},
};
export const POWER_TIERS={
 1:{copies:1,name:'Standard',stars:'★',text:'Focused tools with specific uses.'},
 2:{copies:1,name:'Powerful',stars:'★★',text:'Flexible movement or a major tactical effect.'},
 3:{copies:1,name:'Exceptional',stars:'★★★',text:'Long-range reach or a unique capture breakthrough.'},
};
export const CARDS={
 saddle:{summary:"Move your piece in an L-shape like a knight. Can jump and capture.",family:'mobility',tier:2,name:'Borrowed Saddle',icon:'♞',kind:'Leap',text:"Choose one of your pieces except your king. Move it 2 squares across and 1 up or down, or 2 up or down and 1 across, like a knight. Jump over any pieces in the way. You may capture an enemy where you land.",steps:KNIGHT},
 comet:{summary:"Make a longer knight-style jump: 3 squares, then 2. Can capture.",family:'mobility',tier:2,name:'Comet Leap',icon:'☄',kind:'Leap',text:"Choose one of your pieces except your king. Jump 3 squares across and 2 up or down, or 3 up or down and 2 across. Ignore pieces in the way. You may capture an enemy where you land.",steps:[[2,3],[3,2],[-2,3],[-3,2],[2,-3],[3,-2],[-2,-3],[-3,-2]]},
 rift:{summary:"Jump your piece exactly 2 squares diagonally. Can capture.",family:'mobility',tier:1,name:'Diagonal Rift',icon:'◇',kind:'Leap',text:"Choose one of your pieces except your king. Move it exactly 2 squares diagonally. Jump over the square in between, even if occupied. You may capture an enemy on the landing square.",steps:DIAG.map(([x,y])=>[2*x,2*y])},
 vault:{summary:"Jump your piece exactly 2 squares up, down, left, or right. Can capture.",family:'mobility',tier:1,name:'Stone Vault',icon:'⊞',kind:'Leap',text:"Choose one of your pieces except your king. Move it exactly 2 squares up, down, left, or right. Jump over the square in between, even if occupied. You may capture an enemy on the landing square.",steps:ORTH.map(([x,y])=>[2*x,2*y])},
 prism:{summary:"Move your piece diagonally like a bishop. Cannot jump. Can capture.",family:'offense',tier:3,name:'Prism Path',icon:'╳',kind:'Slide',text:"Choose one of your pieces except your king. Move it diagonally any distance, like a bishop. You cannot jump over pieces. You may capture an enemy at the end of the move.",rays:DIAG,range:7},
 tower:{summary:"Move your piece up, down, left, or right like a rook. Can capture.",family:'offense',tier:3,name:'Tower Road',icon:'♜',kind:'Slide',text:"Choose one of your pieces except your king. Move it up, down, left, or right any distance, like a rook. You cannot jump over pieces. You may capture an enemy at the end of the move.",rays:ORTH,range:7},
 crown:{summary:"Move your piece exactly 2 squares in any direction. Cannot jump.",family:'mobility',tier:2,name:'Lesser Crown',icon:'♛',kind:'Slide',text:"Choose one of your pieces except your king. Move it exactly 2 squares up, down, left, right, or diagonally. The square in between must be empty. You may capture an enemy on the landing square.",rays:[...ORTH,...DIAG],range:2,minRange:2},
 blink:{summary:"Teleport your piece up to 2 squares across and 2 up or down. No capture.",family:'mobility',tier:2,name:'Pocket Portal',icon:'◎',kind:'Travel',text:"Choose one of your pieces except your king. Place it on an empty square up to 2 columns and 2 rows away, in any combination. Ignore pieces in the way. You cannot capture.",teleport:2,empty:true},
 retreat:{summary:"Jump your piece 1–3 squares backward to an empty square.",family:'defense',tier:1,name:'Safe Retreat',icon:'↡',kind:'Travel',text:"Choose one of your pieces except your king. Move it 1, 2, or 3 squares straight backward, toward your starting edge. Jump over any pieces in the way. The landing square must be empty.",retreat:true,jump:true,empty:true},
 flank:{summary:"Jump your piece exactly 3 squares left or right. Can capture.",family:'mobility',tier:1,name:'Sidewinder',icon:'↔',kind:'Leap',text:"Choose one of your pieces except your king. Move it exactly 3 squares left or right on the same row. Jump over any pieces in the way. You may capture an enemy on the landing square.",steps:[[3,0],[-3,0]]},
 charge:{summary:"Move your pawn 1–3 squares forward. No jumping or capturing.",family:'mobility',tier:1,name:'Marching Orders',icon:'⇈',kind:'Pawn',text:"Choose one of your pawns. Move it 1, 2, or 3 squares straight forward, even if it has moved before. Every square it passes through or lands on must be empty. A 2-square move can be captured en passant.",pawn:true,charge:true,empty:true},
 lunge:{summary:"Your pawn captures an enemy one square straight ahead.",family:'offense',tier:1,name:'Spearpoint',icon:'↑',kind:'Pawn',text:"Choose one of your pawns with an enemy directly in front of it. Move the pawn one square forward and capture that enemy, instead of capturing diagonally. You cannot use this on an empty square or capture a king.",pawn:true,lunge:true},
 step:{summary:"Move your piece 1 square in any direction. Can capture.",family:'mobility',tier:1,name:'King’s Footwork',icon:'✣',kind:'Step',text:"Choose one of your pieces except your king. Move it 1 square up, down, left, right, or diagonally, like a king. You may capture an enemy on that square. Your actual king cannot use this card.",steps:[...ORTH,...DIAG]},
 relay:{summary:"Swap two of your pieces on neighboring squares.",family:'tactics',tier:2,name:'Close Quarters',icon:'⇄',kind:'Tactic',text:"Choose two of your pieces on neighboring squares, including diagonals. Exchange their positions. Neither piece may be a king or frozen. A pawn cannot be swapped onto either edge row where the armies started.",swap:true},
 recall:{summary:"Teleport your piece to an empty square on your starting edge.",family:'defense',tier:2,name:'Homeward',icon:'⌂',kind:'Travel',text:"Choose one of your pieces except your king. Place it on any empty square of your back row: row 1 for White, row 8 for Black. Ignore pieces in the way. You cannot capture.",recall:true,empty:true},
 ward:{summary:"Protect your piece from capture until the opponent finishes their turn.",family:'defense',tier:2,name:'Glass Aegis',icon:'◈',kind:'Ward',text:"Choose one of your pieces except your king. Protect it without moving it. It cannot be captured during the opponent’s next turn. It still attacks and blocks paths. Protection ends when that turn finishes.",effect:'shield'},
 frost:{summary:"Freeze an enemy for its next turn, then make a normal move.",family:'tactics',tier:2,name:'Winter Seal',icon:'❄',kind:'Hex',text:"Choose an enemy piece except their king, then make a normal chess move with one of your pieces. The chosen enemy cannot move or swap on its next turn. It still attacks and blocks paths, so your move must still get you out of check.",effect:'freeze'},
 pierce:{summary:"Your bishop, rook, or queen jumps one piece to capture an enemy beyond it.",family:'offense',tier:3,name:'Through the Veil',icon:'✧',kind:'Capture',text:"Choose your bishop, rook, or queen. Move in a direction it normally moves, but jump over exactly one piece to capture an enemy beyond it. Your attacker lands on the enemy’s square; the jumped piece stays. All other squares between them must be empty.",pierce:true},
};
export const CARD_IDS=Object.keys(CARDS);
export const DECK_LIST=CARD_IDS.slice();
// A reproducible singleton deck; game state stores the sequence for undo.
export function shuffle(cards,seed){const a=cards.slice();let n=seed>>>0||1;for(let i=a.length-1;i>0;i--){n^=n<<13;n^=n>>>17;n^=n<<5;const j=(n>>>0)%(i+1);[a[i],a[j]]=[a[j],a[i]];}return {cards:a,seed:n>>>0};}
export function deal(seed){const shuffled=shuffle(DECK_LIST,seed);return {hands:{w:shuffled.cards.slice(0,3),b:shuffled.cards.slice(3,6)},deck:shuffled.cards.slice(6),discard:[],rng:shuffled.seed};}
export function cycleCard(state,slot){
 if(state.mode!=='cards')return state;
 const hands={w:state.hands.w.slice(),b:state.hands.b.slice()},hand=hands[state.turn];
 if(!Number.isInteger(slot)||slot<0||slot>=hand.length){if(state.simulation)return state;throw new Error('Choose a card before moving');}
 const [used]=hand.splice(slot,1);let deck=state.deck.slice(),discard=[...state.discard,used],rng=state.rng;
 if(!state.simulation){if(!deck.length){const next=shuffle(discard,rng);deck=next.cards;discard=[];rng=next.seed;}hand.push(deck.shift());}
 return {...state,hands,deck,discard,rng};
}

// Upgrade old multi-copy saves without replacing their board or unique held cards.
export function uniqueDeck(state,priority='w'){
 const used=new Set(),hands={w:[],b:[]},sides=[priority,priority==='w'?'b':'w'];
 for(const side of sides)hands[side]=state.hands[side].map(id=>{if(used.has(id))return null;used.add(id);return id;});
 const pool=[...new Set([...state.deck,...state.discard,...CARD_IDS])].filter(id=>!used.has(id));
 for(const side of sides)hands[side]=hands[side].map(id=>{if(id)return id;const next=pool.shift();used.add(next);return next;});
 const deck=[],discard=[];
 for(const [source,target] of [[state.deck,deck],[state.discard,discard],[CARD_IDS,deck]])for(const id of source)if(!used.has(id)){used.add(id);target.push(id);}
 return {...state,hands,deck,discard};
}
