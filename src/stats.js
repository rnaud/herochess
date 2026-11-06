const KEY='herochess-stats-v1';
export function loadStats(){
 try{const s=JSON.parse(localStorage.getItem(KEY));return s&&typeof s==='object'?{games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,cards:{},levels:{},matches:[],checkmates:0,flawlessWins:0,daily:{date:null,streak:0,wins:0},...s}:empty();}catch{return empty();}
}
function empty(){return {games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,cards:{},levels:{},matches:[],checkmates:0,flawlessWins:0,daily:{date:null,streak:0,wins:0}};}
export function saveStats(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
export function recordResult(r){
 const s=loadStats();s.games++;
 if(r.outcome==='win'){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);if(r.reason==='Checkmate')s.checkmates=(s.checkmates||0)+1;if(!r.rewinds&&!r.hints)s.flawlessWins=(s.flawlessWins||0)+1;}
 else if(r.outcome==='loss'){s.losses++;s.streak=0;}
 else s.draws++;
 const level=String(r.level||'2');s.levels[level]=(s.levels[level]||0)+1;
 for(const id of r.powers||[])s.cards[id]=(s.cards[id]||0)+1;
 const date=(r.date||new Date().toISOString().slice(0,10));
 s.matches=[{date,outcome:r.outcome,mode:r.mode||'cards',level, moves:Number(r.moves)||0,powers:(r.powers||[]).slice(0,6),reason:r.reason||'',daily:!!r.daily},...(Array.isArray(s.matches)?s.matches:[])].slice(0,12);
 if(r.daily){const prev=s.daily||{};const yesterday=new Date(Date.now()-864e5).toISOString().slice(0,10);const next=r.outcome==='win'?(prev.date===yesterday?1:0)+1:0;s.daily={date,streak:next,wins:(prev.wins||0)+(r.outcome==='win'?1:0)};}
 saveStats(s);return s;
}
export function statsLine(s=loadStats()){
 if(!s.games)return 'Your first match is still unwritten.';
 const pct=s.games?Math.round(100*s.wins/s.games):0;
 return `${s.games} match${s.games===1?'':'es'} · ${s.wins}W ${s.losses}L ${s.draws}D · ${pct}% wins · best streak ${s.bestStreak}`;
}
export function dailySummary(s=loadStats()){
 const d=s.daily||{};
 return d.date?`Daily streak ${d.streak} · ${d.wins} daily win${d.wins===1?'':'s'}`:'No daily result yet.';
}
export function trophyList(s=loadStats()){
 const cards=Object.keys(s.cards||{}).length;
 return [
  {id:'first',icon:'✦',name:'First light',desc:'Win your first match.',ok:s.wins>0},
  {id:'streak3',icon:'⌁',name:'Three in a row',desc:'Win three matches in a row.',ok:s.bestStreak>=3},
  {id:'veteran',icon:'♜',name:'Table veteran',desc:'Play ten matches.',ok:s.games>=10},
  {id:'collector',icon:'❖',name:'Arcana collector',desc:'Play ten different cards.',ok:cards>=10},
  {id:'daily3',icon:'☼',name:'Daily devotion',desc:'Reach a three-day daily streak.',ok:(s.daily?.streak||0)>=3},
  {id:'checkmate',icon:'✧',name:'Clean finish',desc:'Win by checkmate.',ok:(s.checkmates||0)>0},
  {id:'flawless',icon:'♛',name:'No second thoughts',desc:'Win without rewinds or hints.',ok:(s.flawlessWins||0)>0}
 ];
}
