import {test,expect} from '@playwright/test';
async function normalMove(page,from=12,to=28){await page.locator('[data-square="'+from+'"]').click();await page.locator('[data-square="'+to+'"]').click();}
async function fixture(page,card,pieces){await page.goto('/');await page.evaluate(async({card,pieces})=>{const {initialState,positionKey}=await import('/src/engine.js');const s=initialState('cards',42);s.board=Array(64).fill(null);for(const [i,type,color] of [[0,'k','w'],[63,'k','b'],...pieces])s.board[i]={type,color};s.rights='';s.hands.w=[card,'ward','frost'];s.hands.b=['step','retreat','flank'];s.history=[positionKey(s)];localStorage.setItem('herochess-cards-v2',JSON.stringify({version:2,state:s,human:'w',snapshots:[],journal:[],level:'1'}));},{card,pieces});await page.reload();}
test('three-card hand, 18-card library, CPU reply, exact undo and reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#board-view canvas')).toBeVisible();await expect(page.locator('.spell-card')).toHaveCount(3);await expect(page.locator('.cpu-card')).toHaveCount(3);await page.locator('.cpu-card summary').first().click();await expect(page.locator('.cpu-card p').first()).toBeVisible();await page.locator('.cpu-card summary').first().click();await page.screenshot({path:'/tmp/herochess-cards-desktop.png',fullPage:true});
 await page.locator('#library-button').click();await expect(page.locator('.library-card')).toHaveCount(18);await page.locator('.library-art').evaluateAll(images=>images.forEach(img=>{img.loading='eager';}));await expect.poll(()=>page.locator('.library-art').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);await page.screenshot({path:'/tmp/herochess-illustrated-library.png'});await page.locator('#library-dialog .close-dialog').click();const hand=await page.locator('.spell-card strong').allTextContents();
 await page.locator('#view-2d').click();await normalMove(page);await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('.spell-card')).toHaveCount(3);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')));expect(saved.state.hands.w.length).toBe(3);expect(saved.state.hands.b.length).toBe(3);
 await page.reload();await expect(page.locator('#move-count')).toHaveText('02');await page.locator('#undo-button').click();await expect(page.locator('#move-count')).toHaveText('00');expect(await page.locator('.spell-card strong').allTextContents()).toEqual(hand);expect(errors).toEqual([]);
});
test('card power is temporary; leap capture animates and cycles the selected slot',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);await page.locator('[data-slot="0"]').click();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await expect(page.locator('[data-square="44"]')).toHaveClass(/power-move/);await page.locator('#view-3d').click();await page.locator('[data-square="44"]').evaluate(b=>b.click());await expect(page.locator('#board-view')).toHaveAttribute('data-animating','capture');await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await page.locator('#view-2d').click();await expect(page.locator('[data-square="44"]')).toHaveAttribute('aria-label',/White Knight/);await expect(page.locator('#journal')).toContainText('Comet Leap');await expect(page.locator('.spell-card')).toHaveCount(3);
});
test('shield and freeze are target actions, not self-captures',async({page})=>{
 await fixture(page,'ward',[[27,'q','w'],[59,'r','b']]);await page.locator('#difficulty').selectOption('3');await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();await expect(page.locator('#effects')).toContainText('shielded');await expect(page.locator('[data-square="27"]')).toHaveClass(/shielded/);await page.screenshot({path:'/tmp/herochess-cards-shield.png',fullPage:true});await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#effects')).toHaveText('No lasting effects.');await expect(page.locator('#white-captured')).toHaveText('');
 await fixture(page,'frost',[[27,'r','b'],[9,'q','w']]);await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('[data-square="27"]')).toHaveAttribute('aria-label',/Black Rook/);await expect(page.locator('#white-captured')).toHaveText('');
});
test('swap animates both friendly pieces and preserves material',async({page})=>{
 await fixture(page,'relay',[[18,'r','w'],[27,'b','w']]);await page.locator('[data-slot="0"]').click();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('[data-square="27"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('[data-square="18"]')).toHaveAttribute('aria-label',/White Bishop/);await expect(page.locator('[data-square="27"]')).toHaveAttribute('aria-label',/White Rook/);await expect(page.locator('#white-captured')).toHaveText('');
});
test('mobile hand fits; keyboard controls and reduced motion work',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.emulateMedia({reducedMotion:'reduce'});await page.screenshot({path:'/tmp/herochess-cards-mobile.png',fullPage:true});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.locator('[data-slot="2"]').click();await expect(page.locator('[data-slot="2"]')).toHaveAttribute('aria-pressed','true');await page.locator('[data-slot="0"]').click();await page.locator('#normal-mode').click();await page.locator('#view-2d').click();await page.locator('[data-square="12"]').focus();await page.keyboard.press('Enter');await page.locator('[data-square="28"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
});
test('classic mode and Black side remain playable',async({page})=>{await page.goto('/');await page.locator('#new-button').click();await page.locator('input[value="classic"]').check();await page.locator('#side').selectOption('b');await page.getByRole('button',{name:'Deal & play'}).click();await expect(page.locator('#hand-panel')).toBeHidden();await expect(page.locator('#move-count')).toHaveText('01',{timeout:15000});await page.locator('#view-2d').click();await expect(page.locator('.flat-square').first()).toHaveAttribute('data-square','7');});
test('undo and new game cancel animations without stale CPU turns',async({page})=>{await page.goto('/');await page.locator('#view-2d').click();await normalMove(page);await page.locator('#undo-button').click();await expect(page.locator('#move-count')).toHaveText('00');await expect(page.locator('body > .flat-piece')).toHaveCount(0);await normalMove(page);await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();await expect(page.locator('#move-count')).toHaveText('00');await expect(page.locator('.spell-card')).toHaveCount(3);});
test('WebGL fallback and old hero saves are preserved separately',async({page})=>{await page.addInitScript(()=>{localStorage.setItem('herochess-v2','old-match-marker');const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:get.call(this,type,...args);};});await page.goto('/');await expect(page.locator('#flat-board')).toBeVisible();await expect(page.locator('#save-notice')).toBeVisible();await expect(page.locator('#view-3d')).toBeDisabled();await normalMove(page);await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});expect(await page.evaluate(()=>localStorage.getItem('herochess-v2'))).toBe('old-match-marker');});

test('families and power tiers are explicit and library filters compose',async({page})=>{
 await page.goto('/');await expect(page.locator('.spell-card .family-badge')).toHaveCount(3);await expect(page.locator('.spell-card .tier-badge')).toHaveCount(3);
 await page.locator('#card-key-button').click();await expect(page.locator('#card-legend')).toHaveAttribute('open','');await expect(page.locator('#card-legend')).toContainText('Gold cards are rarer');
 await page.locator('#family-filter').selectOption('offense');await expect(page.locator('.library-card')).toHaveCount(4);await expect(page.locator('.library-card .family-badge')).toHaveText(['⚔ Offense','⚔ Offense','⚔ Offense','⚔ Offense']);
 await page.locator('#tier-filter').selectOption('3');await expect(page.locator('.library-card')).toHaveCount(3);await expect(page.locator('#library-count')).toHaveText('3 of 18 spells');
 await page.locator('#family-filter').selectOption('defense');await expect(page.locator('.library-card')).toHaveCount(0);await expect(page.locator('#library-empty')).toBeVisible();
 await page.locator('#reset-filters').click();await expect(page.locator('.library-card')).toHaveCount(18);await expect(page.locator('#library-empty')).toBeHidden();
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/herochess-family-key-mobile.png',fullPage:true});
});

test('spell workbench fits a laptop and shows exact rules for the selected card',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/');await page.locator('[data-slot="0"]').click();await page.screenshot({path:'/tmp/herochess-interface-complete.png',fullPage:true});
 await page.setViewportSize({width:1280,height:720});await fixture(page,'ward',[[27,'q','w'],[59,'r','b']]);
 await expect(page.locator('#power-mode')).toHaveCount(0);await expect(page.locator('#normal-mode')).toBeHidden();
 await page.locator('[data-slot="0"]').click();await expect(page.locator('#selected-card-title')).toHaveText('Glass Aegis');await expect(page.locator('#selected-card-art')).toBeVisible();await expect(page.locator('#selected-card-meta')).toContainText('Defense');await expect(page.locator('#card-instruction')).toContainText('It cannot be captured during the opponent’s next turn.');
 await expect(page.locator('#card-instruction')).toContainText('Click a highlighted target');await page.locator('#normal-mode').click();await expect(page.locator('#card-instruction')).toContainText('Normal moves keep all your cards');await page.locator('[data-slot="0"]').click();
 for(const selector of ['#board-view','[data-slot="0"]','[data-slot="1"]','[data-slot="2"]','#normal-mode']){const box=await page.locator(selector).boundingBox();expect(box.x).toBeGreaterThanOrEqual(0);expect(box.x+box.width).toBeLessThanOrEqual(1280);expect(box.y+box.height).toBeLessThanOrEqual(720);}
 await page.screenshot({path:'/tmp/herochess-interface-desktop.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900});await page.screenshot({path:'/tmp/herochess-interface-wide.png',fullPage:true});
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/herochess-interface-mobile.png',fullPage:true});
 await page.locator('#new-button').click();await expect(page.locator('#new-dialog')).toBeVisible();await page.screenshot({path:'/tmp/herochess-interface-dialog.png'});
});

test('clicking a selected card clears its targets and restores the unselected state',async({page})=>{
 await fixture(page,'ward',[[27,'q','w'],[59,'r','b']]);await page.locator('#view-2d').click();
 const hand=await page.locator('.spell-card strong').allTextContents();
 await page.locator('[data-slot="0"]').click();await expect(page.locator('.flat-square.legal')).not.toHaveCount(0);
 await page.locator('[data-slot="0"]').click();await expect(page.locator('.spell-card[aria-pressed="true"]')).toHaveCount(0);
 await expect(page.locator('.flat-square.legal')).toHaveCount(0);await expect(page.locator('#selected-card-art')).toBeHidden();
 await expect(page.locator('#power-mode')).toHaveCount(0);await expect(page.locator('#normal-mode')).toBeHidden();
 await expect(page.locator('#move-count')).toHaveText('00');expect(await page.locator('.spell-card strong').allTextContents()).toEqual(hand);
 await page.locator('[data-slot="0"]').press('Enter');await expect(page.locator('[data-slot="0"]')).toHaveAttribute('aria-pressed','true');
 await page.locator('[data-slot="0"]').press('Enter');await expect(page.locator('[data-slot="0"]')).toHaveAttribute('aria-pressed','false');
});
test('fresh matches deal three cards in order, without replaying on selection or reduced motion',async({page})=>{
 await page.addInitScript(()=>{window.deals=[];const animate=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.classList.contains('spell-card'))window.deals.push({delay:options.delay,frames});return animate.call(this,frames,options);};});
 await page.goto('/');expect(await page.evaluate(()=>window.deals.map(a=>a.delay))).toEqual([0,170,340]);
 await page.locator('.spell-card').evaluateAll(cards=>cards.forEach(card=>card.getAnimations().forEach(a=>{a.pause();a.currentTime=400;})));
 await page.screenshot({path:'/tmp/herochess-opening-deal.png',fullPage:true});
 await page.locator('.spell-card').evaluateAll(cards=>cards.forEach(card=>card.getAnimations().forEach(a=>a.finish())));
 await page.locator('[data-slot="0"]').click();await page.locator('[data-slot="0"]').click();expect(await page.evaluate(()=>window.deals.length)).toBe(3);
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();expect(await page.evaluate(()=>window.deals.length)).toBe(6);
 await page.reload();expect(await page.evaluate(()=>window.deals.length)).toBe(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();expect(await page.evaluate(()=>window.deals.length)).toBe(0);
});

test('old card saves are preserved separately when balance rules change',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('herochess-cards-v1','previous-card-match'));
 await page.goto('/');await expect(page.locator('#save-notice')).toBeVisible();await expect(page.locator('#deck-count')).toContainText('34 in deck');
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('herochess-cards-v1'))).toBe('previous-card-match');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')).version)).toBe(2);
});

test('ordinary moves keep the entire hand through CPU reply, reload and undo',async({page})=>{
 await page.goto('/');await page.locator('#view-2d').click();
 const before=await page.locator('.spell-card').evaluateAll(cards=>cards.map(c=>c.dataset.card));
 await page.locator('[data-square="12"]').click();await expect(page.locator('[data-square="28"]')).toHaveClass(/legal/);
 await expect(page.locator('[data-square="28"]')).not.toHaveClass(/power-move/);
 await page.locator('[data-square="28"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')));
 expect(saved.state.hands.w).toEqual(before);expect(saved.state.hands.w).toHaveLength(3);
 await page.reload();expect(await page.locator('#hand .spell-card').evaluateAll(cards=>cards.map(c=>c.dataset.card))).toEqual(before);await page.locator('#undo-button').click();expect(await page.locator('.spell-card').evaluateAll(cards=>cards.map(c=>c.dataset.card))).toEqual(before);
});
test('choosing another card after cancelling activates its power immediately',async({page})=>{
 await fixture(page,'tower',[[27,'q','w'],[59,'r','b']]);await page.locator('#view-2d').click();
 await page.locator('[data-slot="0"]').click();await page.locator('#normal-mode').click();
 await page.locator('[data-slot="1"]').click();await expect(page.locator('[data-slot="1"]')).toHaveAttribute('data-action','power');
 await expect(page.locator('#card-instruction')).toContainText('Click a highlighted target');
 await page.locator('[data-square="27"]').click();await expect(page.locator('#effects')).toContainText('shielded');
});

test('card burn and board frost animate together and undo cleans up presentation',async({page})=>{
 await fixture(page,'frost',[[27,'r','b'],[9,'q','w']]);await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();
 await page.locator('[data-square="27"]').click();await expect(page.locator('.game-fx .card-burn')).toBeVisible();await expect(page.locator('.fx-burn-edge')).toHaveCount(1);await expect(page.locator('.fx-frost')).toHaveCount(1);await expect(page.locator('.fx-crystal')).toHaveCount(12);
 await page.locator('.game-fx').evaluate(layer=>layer.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=300;}));
 await page.screenshot({path:'/tmp/herochess-burn-and-frost.png',fullPage:true});
 await page.locator('#undo-button').click();await expect(page.locator('.game-fx')).toHaveCount(0);await expect(page.locator('#move-count')).toHaveText('00');
 await expect(page.locator('[data-slot="0"]')).toBeVisible();await expect(page.locator('[data-square="27"]')).toHaveAttribute('aria-label',/Black Rook/);
});
test('3D spell capture has board feedback and reduced motion skips all transient effects',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);await page.locator('[data-slot="0"]').click();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('#view-3d').click();
 await page.locator('[data-square="44"]').evaluate(b=>b.click());await expect(page.locator('.fx-impact')).toHaveCount(1);await expect(page.locator('.fx-trail')).toHaveCount(1);await expect(page.locator('#board-view')).toHaveAttribute('data-animating','capture');
 const impact=await page.locator('.fx-impact').boundingBox(),board=await page.locator('#board-view').boundingBox();expect(impact.x+impact.width/2).toBeGreaterThan(board.x);expect(impact.x+impact.width/2).toBeLessThan(board.x+board.width);
 await page.locator('#undo-button').click();await expect(page.locator('.game-fx')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="18"]').click();await page.locator('[data-square="44"]').click();
 await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('.game-fx')).toHaveCount(0);await expect(page.locator('body > .flat-piece')).toHaveCount(0);
});

test('clicking affected pieces explains their status and does not spend a card',async({page})=>{
 await fixture(page,'ward',[[9,'q','w'],[27,'r','b']]);
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.state.shield={square:27,color:'b'};localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});await page.reload();
 await page.locator('[data-square="27"]').evaluate(b=>b.click());await expect(page.locator('#piece-status')).toBeVisible();await expect(page.locator('#piece-status-title')).toHaveText('Black Rook · d4');await expect(page.locator('#piece-status')).toContainText('cannot be captured');await expect(page.locator('#piece-status')).toContainText('White completes this turn');await expect(page.locator('#move-count')).toHaveText('00');
 await page.screenshot({path:'/tmp/herochess-piece-status.png',fullPage:true});await page.locator('#close-piece-status').click();await expect(page.locator('#piece-status')).toBeHidden();
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.state.shield=null;saved.state.freeze={square:9,color:'w'};localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});await page.reload();await page.locator('#view-2d').click();
 await page.locator('[data-square="9"]').press('Enter');await expect(page.locator('#piece-status')).toContainText('cannot move or swap');await expect(page.locator('#piece-status')).toContainText('still give check');await expect(page.locator('.flat-square.legal')).toHaveCount(0);
 await page.keyboard.press('Escape');await expect(page.locator('#piece-status')).toBeHidden();await page.locator('[data-square="9"]').click();await page.locator('[data-square="0"]').click();await expect(page.locator('#piece-status')).toBeHidden();await expect(page.locator('.flat-square.legal')).not.toHaveCount(0);
});
test('statuses can be inspected during the CPU turn',async({page})=>{
 await fixture(page,'ward',[[9,'q','w'],[27,'r','b']]);
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.state.turn='b';saved.state.shield={square:9,color:'w'};localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});
 await page.addInitScript(()=>{window.Worker=class{postMessage(){}terminate(){}};});await page.reload();await expect(page.locator('#thinking-overlay')).toBeVisible();
 await page.locator('[data-square="9"]').evaluate(b=>b.click());await expect(page.locator('#piece-status')).toContainText('Black completes this turn');await expect(page.locator('#move-count')).toHaveText('00');
});
test('Through the Veil includes an explicit capture example in hand and atlas',async({page})=>{
 await fixture(page,'pierce',[[18,'b','w'],[27,'p','w'],[45,'q','b']]);await page.locator('[data-slot="0"]').click();
 await expect(page.locator('#card-instruction')).toContainText('jumped piece stays');await expect(page.locator('#selected-card-example')).toBeVisible();await expect(page.locator('#selected-card-example')).toContainText('Your rook lands on a6');
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'/tmp/veil-mobile-fixed.png',fullPage:true});await page.locator('#library-button').click();await expect(page.locator('.library-card[data-card="pierce"] .veil-example')).toContainText('The pawn on a3 stays');
});

test('piece selection survives choosing, switching and cancelling powers',async({page})=>{
 await fixture(page,'tower',[[18,'b','w'],[44,'q','b']]);await page.locator('#view-2d').click();
 const piece=page.locator('[data-square="18"]');await piece.click();await expect(piece).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('[data-square="26"]')).not.toHaveClass(/legal/);
 await page.locator('[data-slot="0"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="26"]')).toHaveClass(/power-move/);
 await page.locator('[data-slot="1"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(piece).toHaveClass(/legal/);
 await page.locator('[data-slot="2"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="44"]')).toHaveClass(/legal/);await expect(page.locator('#card-instruction')).toContainText('Click a highlighted target');
 await page.locator('[data-slot="0"]').click();await page.locator('[data-slot="0"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="26"]')).not.toHaveClass(/legal/);await expect(page.locator('[data-square="27"]')).toHaveClass(/legal/);
 await page.locator('[data-slot="0"]').click();await page.locator('#normal-mode').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="27"]')).toHaveClass(/legal/);
 await page.locator('[data-slot="0"]').click();await page.locator('[data-square="26"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#journal')).toContainText('Tower Road');
});
test('an incompatible card keeps the piece selected with no invented destinations',async({page})=>{
 await fixture(page,'charge',[[18,'b','w'],[44,'q','b']]);await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('[data-slot="0"]').click();
 await expect(page.locator('[data-square="18"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.flat-square.legal')).toHaveCount(0);await expect(page.locator('#move-count')).toHaveText('00');
 await page.locator('#normal-mode').click();await expect(page.locator('.flat-square.legal')).not.toHaveCount(0);
});
