import {CARDS,FAMILIES} from './cards.js';
import {loadStats,trophyList} from './stats.js';

const cardArt=id=>`${import.meta.env.BASE_URL}art/realms/${id}-480.webp`;
const outcomeLabel={win:'Win',loss:'Loss',draw:'Draw'};
const levelLabel={1:'Apprentice',2:'Tactician',3:'Strategist'};

function dateLabel(date){
 try{const d=new Date(`${date}T12:00:00`);return d.toLocaleDateString(undefined,{month:'short',day:'numeric'});}catch{return date;}
}

export function renderRecord(container,stats=loadStats()){
 const games=stats.games||0,wins=stats.wins||0,pct=games?Math.round(100*wins/games):0;
 const cards=Object.entries(stats.cards||{}).sort((a,b)=>b[1]-a[1]).slice(0,6),maxCard=Math.max(1,...cards.map(([,n])=>n));
 const trophies=trophyList(stats),earned=trophies.filter(t=>t.ok).length;
 const matches=Array.isArray(stats.matches)?stats.matches.slice(0,6):[];
 container.innerHTML=`
  <div class="record-summary">
   <div><b>${games}</b><span>Matches</span></div>
   <div><b>${pct}%</b><span>Win rate</span></div>
   <div><b>${stats.bestStreak||0}</b><span>Best streak</span></div>
   <div><b>${stats.daily?.streak||0}</b><span>Daily streak</span></div>
  </div>
  <div class="record-split">
   <section class="record-panel"><div class="record-heading"><h3>Trophies</h3><span>${earned} / ${trophies.length}</span></div><div class="trophy-grid">${trophies.map(t=>`<div class="trophy ${t.ok?'earned':''}" title="${t.desc}"><span class="trophy-icon" aria-hidden="true">${t.icon}</span><div><strong>${t.name}</strong><small>${t.desc}</small></div><span class="sr-only">${t.ok?'Unlocked':'Locked'}</span></div>`).join('')}</div></section>
   <section class="record-panel"><div class="record-heading"><h3>Cards played</h3><span>${cards.reduce((n,[,v])=>n+v,0)} powers</span></div>${cards.length?`<div class="card-usage">${cards.map(([id,n])=>{const c=CARDS[id];if(!c)return '';return `<div class="usage-row"><img src="${cardArt(id)}" alt="" width="36" height="36" loading="lazy"><div><strong>${c.name}</strong><span>${FAMILIES[c.family]?.name||''}</span><div class="usage-bar"><i style="width:${Math.round(100*n/maxCard)}%"></i></div></div><b>${n}×</b></div>`;}).join('')}</div>`:'<p class="record-empty">Play a power to start your card record.</p>'}</section>
  </div>
  <section class="record-panel recent-record"><div class="record-heading"><h3>Recent matches</h3><span>Last ${matches.length||0}</span></div>${matches.length?`<div class="match-list">${matches.map(m=>`<div class="match-row" data-outcome="${m.outcome}"><span class="match-result">${outcomeLabel[m.outcome]||m.outcome}</span><span class="match-meta">${dateLabel(m.date)} · ${m.mode==='classic'?'Classic':'Cards'} · ${levelLabel[m.level]||m.level}</span><span class="match-moves">${m.moves||0} plies · ${(m.powers||[]).length} powers</span></div>`).join('')}</div>`:'<p class="record-empty">No completed matches yet. The first one writes the record.</p>'}</section>`;
}
