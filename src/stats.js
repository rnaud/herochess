const KEY='herochess-stats-v1';
export function loadStats(){
 try{const s=JSON.parse(localStorage.getItem(KEY));return s&&typeof s==='object'?{games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,cards:{},levels:{},...s}:empty();}catch{return empty();}
}
function empty(){return {games:0,wins:0,losses:0,draws:0,streak:0,bestStreak:0,cards:{},levels:{},daily:{date:null,streak:0,wins:0}};}
export function saveStats(s){try{localStorage.setItem(KEY,JSON.stringify(s));}catch{}}
export function recordResult(r){
 const s=loadStats();s.games++;
 if(r.outcome==='win'){s.wins++;s.streak++;s.bestStreak=Math.max(s.bestStreak,s.streak);}
 else if(r.outcome==='loss'){s.losses++;s.streak=0;}
 else s.draws++;
 const level=String(r.level||'2');s.levels[level]=(s.levels[level]||0)+1;
 for(const id of r.powers||[])s.cards[id]=(s.cards[id]||0)+1;
 if(r.daily){const today=r.date||new Date().toISOString().slice(0,10);const prev=s.daily||{};const yesterday=new Date(Date.now()-864e5).toISOString().slice(0,10);const next=r.outcome==='win'?(prev.date===yesterday?1:0)+1:0;s.daily={date:today,streak:next,wins:(prev.wins||0)+(r.outcome==='win'?1:0)};}
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
