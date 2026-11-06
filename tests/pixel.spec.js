import {test,expect} from '@playwright/test';
async function fresh(page){await page.goto('/');await page.evaluate(()=>{localStorage.clear();localStorage.setItem('herochess-coach-v1','done');});await page.reload();await page.waitForTimeout(400);}
async function deadFixture(page){await fresh(page);await page.evaluate(async()=>{const {initialState,positionKey}=await import('/src/engine.js');const {CARD_IDS}=await import('/src/cards.js');const s=initialState('cards',42);s.hands.w=['recall','tower','ward'];s.hands.b=['saddle','rift','vault'];const used=[...s.hands.w,...s.hands.b];s.deck=CARD_IDS.filter(id=>!used.includes(id));s.discard=[];s.history=[positionKey(s)];localStorage.setItem('herochess-cards-v2',JSON.stringify({version:3,state:s,human:'w',snapshots:[],journal:[],level:'1',rewindsUsed:0,rewindReady:true,exchangesUsed:0,hotseat:false,resultRecorded:false}));});await page.reload();await page.waitForTimeout(500);}
test('pixel board is the default and tabulates the pixel piece sprites',async({page})=>{
 await fresh(page);
 await expect(page.locator('#view-2d')).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('#flat-board .flat-piece-img')).toHaveCount(32);
 await expect(page.locator('.flat-piece-img').first()).toHaveAttribute('src',/art\/pieces\/.*-96\.webp$/);
 await page.locator('#view-3d').click();await expect(page.locator('#board-view canvas')).toBeVisible();
});
test('mobile 320px keeps the board above the tray and never clips the toolbar',async({page})=>{
 await page.setViewportSize({width:320,height:568});await deadFixture(page);
 const board=await page.locator('.board-shell').boundingBox(),hand=await page.locator('#hand-panel').boundingBox();
 expect(board.width).toBeGreaterThanOrEqual(280);expect(board.y+board.height).toBeLessThan(hand.y);
 const toolbar=await page.locator('.board-toolbar').boundingBox();expect(toolbar.x+toolbar.width).toBeLessThanOrEqual(320);
 await page.locator('#hand-toggle').click();await page.locator('#hand .spell-card').first().click();await page.waitForTimeout(250);
 const activeBoard=await page.locator('.board-shell').boundingBox(),activeHand=await page.locator('#hand-panel').boundingBox();
 expect(activeBoard.y+activeBoard.height).toBeLessThan(activeHand.y);
 await expect(page.locator('#hand-panel')).toBeVisible();await expect(page.locator('#exchange-card')).toBeVisible();
});
test('dead cards are marked, allow normal moves, and can be exchanged once',async({page})=>{
 await deadFixture(page);
 await expect(page.locator('.spell-card').first()).toHaveClass(/unplayable/);await expect(page.locator('.card-wait')).toHaveCount(1);
 await page.locator('.spell-card').first().click();await expect(page.locator('body')).toHaveAttribute('data-power-active','false');
 await expect(page.locator('#card-instruction')).toContainText('No legal target');await expect(page.locator('#exchange-card')).toBeVisible();
 const before=await page.locator('#hand .spell-card').evaluateAll(n=>n.map(x=>x.dataset.card));
 await page.locator('#exchange-card').click();await page.waitForTimeout(300);
 const after=await page.locator('#hand .spell-card').evaluateAll(n=>n.map(x=>x.dataset.card));
 expect(after).not.toEqual(before);expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')).exchangesUsed)).toBe(1);
 const pool=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('herochess-cards-v2')).state;return [...s.hands.w,...s.hands.b,...s.deck,...s.discard];});
 expect(pool).toHaveLength(18);expect(new Set(pool).size).toBe(18);
 await page.reload();await expect(page.locator('#exchange-card')).toBeHidden();
});
test('selecting a non-dead card can still choose a normal move',async({page})=>{
 await deadFixture(page);
 await page.locator('.spell-card').nth(1).click(); // tower is playable
 await page.locator('[data-square="12"]').click();await page.locator('[data-square="20"]').click();await page.waitForTimeout(2500);
 await expect(page.locator('#move-count')).toHaveText('02'); // CPU reply at level 1
});
test('keyboard focus moves to a piece after choosing a card',async({page})=>{
 await fresh(page);await page.locator('.spell-card').first().focus();await page.keyboard.press('Enter');await page.waitForTimeout(200);
 const active=await page.evaluate(()=>({tag:document.activeElement.tagName,cls:document.activeElement.className,sq:document.activeElement.dataset.square}));
 expect(active.tag).not.toBe('BODY');expect(active.cls).toMatch(/flat-square/);
});
test('result dialog records a local result only once',async({page})=>{
 await fresh(page);
 await page.evaluate(()=>{localStorage.removeItem('herochess-stats-v1');});
 await page.evaluate(()=>{const b=Array(64).fill(null);b[7]={type:'k',color:'w'};b[56]={type:'k',color:'b'};b[62]={type:'r',color:'b'};b[63]={type:'r',color:'b'};const s={board:b,turn:'w',rights:'',ep:null,halfmove:0,fullmove:12,mode:'cards',shield:null,freeze:null,history:[],hands:{w:['recall','lunge','charge'],b:['saddle','rift','vault']},deck:[],discard:[],rng:1};localStorage.setItem('herochess-cards-v2',JSON.stringify({version:3,state:s,human:'w',snapshots:[],journal:[],level:'2',rewindsUsed:0,rewindReady:true,exchangesUsed:0,hotseat:false,resultRecorded:false}));});
 await page.reload();await page.waitForTimeout(700);
 await expect(page.locator('#result-dialog')).toBeVisible();await expect(page.locator('#result-title')).toContainText('Automaton');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-stats-v1')).games)).toBe(1);
 await page.locator('#result-review').click();await page.reload();await page.waitForTimeout(700);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-stats-v1')).games)).toBe(1);
});
test('pass-and-play switches hands without starting the CPU',async({page})=>{
 await fresh(page);await page.locator('#new-button').click();await page.locator('#hotseat-option').check();await page.getByRole('button',{name:'Deal & play'}).click();await page.waitForTimeout(500);
 await expect(page.locator('#turn-chip')).toHaveText('WHITE TO MOVE');await expect(page.locator('#opponent-name')).toHaveText('Black');
 const white=await page.locator('#hand .spell-card').evaluateAll(n=>n.map(x=>x.dataset.card));
 await page.locator('[data-square="12"]').click();await page.locator('[data-square="20"]').click();await page.waitForTimeout(1200);
 await expect(page.locator('#turn-chip')).toHaveText('BLACK TO MOVE');await expect(page.locator('#bottom-name')).toHaveText('Black');
 const black=await page.locator('#hand .spell-card').evaluateAll(n=>n.map(x=>x.dataset.card));
 expect(black).not.toEqual(white);expect(await page.locator('#thinking-overlay').isHidden()).toBe(true);
});
test('daily challenge is seeded and labelled in the result flow',async({page})=>{
 await fresh(page);await page.locator('#new-button').click();await page.getByRole('button',{name:/Daily Arcana/}).click();await page.waitForTimeout(500);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')).dailyMode)).toBe(true);
 await expect(page.locator('#result-dialog')).toBeHidden();
});
test('first-game coach can be skipped and remembered',async({page})=>{
 await page.goto('/');await page.evaluate(()=>localStorage.clear());await page.reload();await page.waitForTimeout(1200);
 await expect(page.locator('#coach')).toBeVisible();await page.locator('#coach-skip').click();await expect(page.locator('#coach')).toBeHidden();
 expect(await page.evaluate(()=>localStorage.getItem('herochess-coach-v1'))).toBe('done');
 await page.reload();await page.waitForTimeout(1200);await expect(page.locator('#coach')).toBeHidden();
});
test('hint spends a charge and highlights a suggested action',async({page})=>{
 await fresh(page);await page.locator('#hint-button').click();await expect(page.locator('#hint-count')).toHaveText('2',{timeout:20000});
 await expect(page.locator('.flat-square.hint')).not.toHaveCount(0);await expect(page.locator('#status-title')).toHaveText('Hint');
});
test('capture particle effects respond to the intensity setting',async({page})=>{
 await fresh(page);
 await page.evaluate(async()=>{
  const {initialState,positionKey}=await import('/src/engine.js');
  const s=initialState('cards',42);s.board=Array(64).fill(null);
  for(const [i,type,color] of [[4,'k','w'],[55,'k','b'],[0,'r','w'],[56,'q','b']])s.board[i]={type,color};
  s.rights='';s.turn='w';s.hist=[positionKey(s)];s.history=[positionKey(s)];
  localStorage.setItem('herochess-cards-v2',JSON.stringify({version:3,state:s,human:'w',snapshots:[],journal:[],level:'1',rewindsUsed:0,rewindReady:true,exchangesUsed:0,hotseat:false,resultRecorded:false}));
 });
 await page.reload();await page.waitForTimeout(400);
 await page.locator('[data-square="0"]').click();await page.locator('[data-square="56"]').click();
 await expect(page.locator('#fx-layer')).toHaveAttribute('data-active','true');
 await expect(page.locator('.game-fx')).not.toHaveCount(0);
 await page.waitForTimeout(2600);
 await page.locator('#guide-button').click();await page.locator('#fx-intensity').selectOption('off');await page.locator('#guide-dialog .close-dialog').click();
 await page.reload();await page.waitForTimeout(400);
 await expect(page.locator('#fx-intensity')).toHaveValue('off');
 await page.locator('[data-square="4"]').click();await page.locator('[data-square="12"]').click();await page.waitForTimeout(700);
 await expect(page.locator('#fx-layer')).toHaveAttribute('data-active','false');await expect(page.locator('.game-fx')).toHaveCount(0);
});
test('reduced motion disables particles as well as DOM effects',async({page})=>{
 await fresh(page);await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await page.waitForTimeout(800);
 await expect(page.locator('#fx-layer')).toHaveAttribute('data-active','false');await expect(page.locator('.game-fx')).toHaveCount(0);
});
