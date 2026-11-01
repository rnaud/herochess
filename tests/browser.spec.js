import {test,expect} from '@playwright/test';
async function normalMove(page,from=12,to=28){await page.locator('[data-square="'+from+'"]').click();await page.locator('[data-square="'+to+'"]').click();}
async function fixture(page,card,pieces){await page.goto('/');await page.evaluate(async({card,pieces})=>{const {initialState,positionKey}=await import('/src/engine.js');const s=initialState('cards',42);s.board=Array(64).fill(null);for(const [i,type,color] of [[0,'k','w'],[63,'k','b'],...pieces])s.board[i]={type,color};s.rights='';s.hands.w=[card,'ward','frost'];s.hands.b=['step','retreat','flank'];s.history=[positionKey(s)];localStorage.setItem('herochess-cards-v2',JSON.stringify({version:3,state:s,human:'w',snapshots:[],journal:[],level:'1'}));},{card,pieces});await page.reload();}
test('three-card hand, 18-card library, CPU reply, exact undo and reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('#board-view canvas')).toBeVisible();await expect(page.locator('.spell-card')).toHaveCount(3);await expect(page.locator('.cpu-card')).toHaveCount(3);await page.locator('.cpu-card summary').first().click();await expect(page.locator('#cpu-preview')).toBeVisible();await page.locator('.cpu-card summary').first().click();await page.screenshot({path:'/tmp/herochess-cards-desktop.png',fullPage:true});
 await page.locator('#library-button').click();await expect(page.locator('.library-card')).toHaveCount(18);await page.locator('.library-art').evaluateAll(images=>images.forEach(img=>{img.loading='eager';}));await expect.poll(()=>page.locator('.library-art').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);await page.screenshot({path:'/tmp/herochess-illustrated-library.png'});await page.locator('#library-dialog .close-dialog').click();const hand=await page.locator('.spell-card strong').allTextContents();
 await page.locator('#view-2d').click();await normalMove(page);await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('.spell-card')).toHaveCount(3);const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')));expect(saved.state.hands.w.length).toBe(3);expect(saved.state.hands.b.length).toBe(3);
 await page.reload();await expect(page.locator('#move-count')).toHaveText('02');await page.locator('#undo-button').click();await expect(page.locator('#move-count')).toHaveText('00');expect(await page.locator('.spell-card strong').allTextContents()).toEqual(hand);expect(errors).toEqual([]);
});
test('card power is temporary; leap capture animates and cycles the selected slot',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);await page.locator('[data-slot="0"]').click();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await expect(page.locator('[data-square="44"]')).toHaveClass(/power-move/);await page.locator('#view-3d').click();await page.locator('[data-square="44"]').evaluate(b=>b.click());await expect(page.locator('#board-view')).toHaveAttribute('data-animating','capture');await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await page.locator('#view-2d').click();await expect(page.locator('[data-square="44"]')).toHaveAttribute('aria-label',/White Knight/);await expect(page.locator('#journal')).toContainText('Comet Leap');await expect(page.locator('.spell-card')).toHaveCount(3);
});
test('shield and freeze are target actions, not self-captures',async({page})=>{
 await fixture(page,'ward',[[27,'q','w'],[59,'r','b']]);await page.locator('#difficulty').selectOption('3');await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();await expect(page.locator('#effects')).toContainText('shielded');await expect(page.locator('[data-square="27"]')).toHaveClass(/shielded/);await page.screenshot({path:'/tmp/herochess-cards-shield.png',fullPage:true});await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#effects')).toHaveText('No lasting effects.');await expect(page.locator('#white-captured')).toHaveText('');
 await fixture(page,'frost',[[27,'r','b'],[9,'q','w']]);await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();await expect(page.locator('#move-count')).toHaveText('00');await page.locator('[data-square="9"]').click();await page.locator('[data-square="17"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('[data-square="27"]')).toHaveAttribute('aria-label',/Black Rook/);await expect(page.locator('#white-captured')).toHaveText('');
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
 await page.locator('#card-key-button').click();await expect(page.locator('#card-legend')).toHaveAttribute('open','');await expect(page.locator('#card-legend')).toContainText('Frame colors show power, not rarity');
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
 await page.goto('/');await expect(page.locator('#save-notice')).toBeVisible();await expect(page.locator('#deck-count')).toContainText('12 in deck');
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();
 expect(await page.evaluate(()=>localStorage.getItem('herochess-cards-v1'))).toBe('previous-card-match');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2')).version)).toBe(3);
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
 await page.locator('[data-square="27"]').click();await page.locator('[data-square="9"]').click();await page.locator('[data-square="17"]').click();await expect(page.locator('.game-fx .card-burn')).toBeVisible();await expect(page.locator('.fx-burn-edge')).toHaveCount(1);await expect(page.locator('.fx-frost')).toHaveCount(1);await expect(page.locator('.fx-crystal')).toHaveCount(16);
 await page.locator('.game-fx').evaluate(layer=>layer.getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=300;}));
 await page.screenshot({path:'/tmp/herochess-burn-and-frost.png',fullPage:true});
 await page.locator('#undo-button').click();await expect(page.locator('.game-fx:not(.rewind-fx)')).toHaveCount(0);await expect(page.locator('#move-count')).toHaveText('00');
 await expect(page.locator('[data-slot="0"]')).toBeVisible();await expect(page.locator('[data-square="27"]')).toHaveAttribute('aria-label',/Black Rook/);
});
test('3D spell capture has board feedback and reduced motion skips all transient effects',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);await page.locator('[data-slot="0"]').click();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('#view-3d').click();
 const phase=await page.locator('[data-square="44"]').evaluate(b=>{b.click();document.querySelector('.game-fx').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=700;});return document.querySelector('#board-view').dataset.animating;});expect(phase).toBe('capture');await expect(page.locator('.fx-impact')).toHaveCount(1);await expect(page.locator('.fx-trail')).toHaveCount(1);
 const impact=await page.locator('.fx-impact').boundingBox(),board=await page.locator('#board-view').boundingBox();expect(impact.x+impact.width/2).toBeGreaterThan(board.x);expect(impact.x+impact.width/2).toBeLessThan(board.x+board.width);
 await page.locator('#undo-button').click();await expect(page.locator('.game-fx:not(.rewind-fx)')).toHaveCount(0);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="18"]').click();await page.locator('[data-square="44"]').click();
 await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('.game-fx:not(.rewind-fx)')).toHaveCount(0);await expect(page.locator('body > .flat-piece')).toHaveCount(0);
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
 await page.locator('[data-slot="2"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="44"]')).toHaveClass(/legal/);await expect(page.locator('#card-instruction')).toContainText('Click a highlighted enemy');
 await page.locator('[data-slot="0"]').click();await page.locator('[data-slot="0"]').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="26"]')).not.toHaveClass(/legal/);await expect(page.locator('[data-square="27"]')).toHaveClass(/legal/);
 await page.locator('[data-slot="0"]').click();await page.locator('#normal-mode').click();await expect(piece).toHaveAttribute('aria-pressed','true');await expect(page.locator('[data-square="27"]')).toHaveClass(/legal/);
 await page.locator('[data-slot="0"]').click();await page.locator('[data-square="26"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#journal')).toContainText('Tower Road');
});
test('an incompatible card keeps the piece selected with no invented destinations',async({page})=>{
 await fixture(page,'charge',[[18,'b','w'],[44,'q','b']]);await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('[data-slot="0"]').click();
 await expect(page.locator('[data-square="18"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('.flat-square.legal')).toHaveCount(0);await expect(page.locator('#move-count')).toHaveText('00');
 await page.locator('#normal-mode').click();await expect(page.locator('.flat-square.legal')).not.toHaveCount(0);
});

test('check stays prominent through selection, flip and view changes and clears after escape',async({page})=>{
 await fixture(page,'tower',[[56,'r','b'],[18,'n','w']]);await page.addInitScript(()=>{window.Worker=class{postMessage(){}terminate(){}};});await page.reload();
 await expect(page.locator('#check-banner')).toBeVisible();await expect(page.locator('#check-heading')).toHaveText('CHECK');await expect(page.locator('#status-title')).toHaveText('You are in check!');await expect(page.locator('#turn-chip')).toHaveText('YOU ARE IN CHECK');await expect(page.locator('#check-marker')).toBeVisible();
 const marker=await page.locator('#check-marker').boundingBox(),board=await page.locator('.board-shell').boundingBox();expect(marker.x).toBeGreaterThan(board.x);expect(marker.y).toBeGreaterThan(board.y);
 await page.locator('#flip-button').click();expect((await page.locator('#check-marker').boundingBox()).x).not.toBe(marker.x);await page.locator('#flip-button').click();
 await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('[data-slot="0"]').click();await expect(page.locator('#status-title')).toHaveText('You are in check!');await expect(page.locator('[data-square="0"]')).toHaveClass(/king-in-check/);await expect(page.locator('[data-square="0"]')).toHaveAttribute('aria-label',/in check/);
 await page.locator('#normal-mode').click();await page.locator('[data-square="0"]').click();await page.locator('[data-square="1"]').click();await expect(page.locator('#check-banner')).toBeHidden();await expect(page.locator('#check-marker')).toBeHidden();
 await page.locator('#undo-button').click();await expect(page.locator('#check-banner')).toBeVisible();await page.emulateMedia({reducedMotion:'reduce'});expect(await page.locator('#check-marker').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');
 await page.setViewportSize({width:390,height:844});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'/tmp/herochess-check-mobile.png',fullPage:true});
});
test('CPU check and checkmate identify the correct side',async({page})=>{
 await fixture(page,'ward',[[7,'r','w']]);await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.state.turn='b';localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});
 await page.addInitScript(()=>{window.Worker=class{postMessage(){}terminate(){}};});await page.reload();await expect(page.locator('#status-title')).toHaveText('The Automaton is in check.');await expect(page.locator('#check-message')).toContainText('Automaton’s king');
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.state.board=Array(64).fill(null);saved.state.board[63]={type:'k',color:'b'};saved.state.board[45]={type:'k',color:'w'};saved.state.board[54]={type:'q',color:'w'};localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});await page.reload();await expect(page.locator('#check-heading')).toHaveText('CHECKMATE');await expect(page.locator('#check-message')).toContainText('You win.');
});

test('sound plays only after interaction and mute persists across reloads',async({page})=>{
 await page.addInitScript(()=>{window.audioStarts=0;const original=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(...args){const node=original.apply(this,args),start=node.start;node.start=function(...a){window.audioStarts++;return start.apply(this,a);};return node;};});
 await page.goto('/');expect(await page.evaluate(()=>window.audioStarts)).toBe(0);
 await page.locator('[data-slot="0"]').click();await expect.poll(()=>page.evaluate(()=>window.audioStarts)).toBeGreaterThan(0);
 await page.locator('#sound-button').click();await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','false');const starts=await page.evaluate(()=>window.audioStarts);
 await page.locator('[data-slot="1"]').click();expect(await page.evaluate(()=>window.audioStarts)).toBe(starts);
 await page.reload();await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','false');await page.locator('[data-slot="0"]').click();expect(await page.evaluate(()=>window.audioStarts)).toBe(0);
 await page.locator('#sound-button').click();await expect(page.locator('#sound-button')).toHaveAttribute('aria-pressed','true');await expect.poll(()=>page.evaluate(()=>window.audioStarts)).toBeGreaterThan(0);
});
test('saved duplicate cards upgrade without losing the position or unique held cards',async({page})=>{
 await fixture(page,'tower',[[18,'b','w'],[44,'q','b']]);
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('herochess-cards-v2'));saved.version=2;saved.state.hands.w=['ward','ward','frost'];saved.state.hands.b=['ward','tower','tower'];saved.state.deck.push(...saved.state.deck);localStorage.setItem('herochess-cards-v2',JSON.stringify(saved));});await page.reload();
 const hand=await page.locator('#hand .spell-card').evaluateAll(cards=>cards.map(c=>c.dataset.card));expect(new Set(hand).size).toBe(3);expect(hand[0]).toBe('ward');expect(hand[2]).toBe('frost');
 await page.locator('#difficulty').selectOption('1');const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('herochess-cards-v2'))),pool=[...saved.state.hands.w,...saved.state.hands.b,...saved.state.deck,...saved.state.discard];expect(saved.version).toBe(3);expect(pool).toHaveLength(18);expect(new Set(pool).size).toBe(18);expect(saved.state.board[18]).toEqual({type:'b',color:'w'});
});

test('rewind has three charges, requires a new turn, and cannot be refilled by reload',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.addInitScript(()=>{window.Worker=class{
  postMessage(data){import('/src/engine.js').then(({legalMoves})=>{const move=legalMoves(data.state).find(m=>!m.usePower);setTimeout(()=>{if(!this.dead)this.onmessage?.({data:{id:data.id,move,depth:1}});},30);});}
  terminate(){this.dead=true;}
 };});
 await page.goto('/');await page.locator('#view-2d').click();await normalMove(page);await expect(page.locator('#move-count')).toHaveText('02');await normalMove(page,6,21);await expect(page.locator('#move-count')).toHaveText('04');
 const rewind=page.locator('#undo-button');await rewind.click();await expect(page.locator('#move-count')).toHaveText('02');await expect(page.locator('#rewind-count')).toHaveText('2');await expect(rewind).toBeDisabled();
 await page.reload();await expect(page.locator('#rewind-count')).toHaveText('2');await expect(rewind).toBeDisabled();await page.locator('#view-2d').click();
 for(const left of [1,0]){await normalMove(page,6,21);await expect(page.locator('#move-count')).toHaveText('04');await expect(rewind).toBeEnabled();await rewind.click();await expect(page.locator('#move-count')).toHaveText('02');await expect(page.locator('#rewind-count')).toHaveText(String(left));await expect(rewind).toBeDisabled();}
 await normalMove(page,6,21);await expect(page.locator('#move-count')).toHaveText('04');await expect(rewind).toBeDisabled();
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Deal & play'}).click();await expect(page.locator('#rewind-count')).toHaveText('3');
});

test('Winter Seal waits for your normal move and can be cancelled without spending the card',async({page})=>{
 await fixture(page,'frost',[[27,'r','b'],[9,'q','w']]);await page.locator('#view-2d').click();await page.locator('[data-square="9"]').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();
 await expect(page.locator('[data-square="9"]')).toHaveAttribute('aria-pressed','true');await expect(page.locator('#card-instruction')).toContainText('then move one of your pieces normally');await expect(page.locator('#move-count')).toHaveText('00');await expect(page.locator('#hand [data-card="frost"]')).toHaveCount(2);
 await page.locator('#normal-mode').click();await expect(page.locator('[data-square="27"]')).not.toHaveClass(/frozen/);await expect(page.locator('#move-count')).toHaveText('00');
 await page.locator('[data-slot="0"]').click();await page.locator('[data-square="27"]').click();await page.locator('[data-square="17"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#journal')).toContainText('Winter Seal · freeze d4 + b2–b3');
});

test.describe('opponent inspection',()=>{
 test.use({hasTouch:true});
 test('opponent card inspection opens only one card at a time with pointer or keyboard',async({page})=>{
 await page.goto('/');const cards=page.locator('#cpu-hand .cpu-card');
 await cards.nth(0).locator('summary').click();await expect(cards.nth(0)).toHaveAttribute('open','');
 await cards.nth(1).locator('summary').click();await expect(cards.nth(1)).toHaveAttribute('open','');await expect(page.locator('#cpu-hand details[open]')).toHaveCount(1);
 await cards.nth(2).locator('summary').press('Enter');await expect(cards.nth(2)).toHaveAttribute('open','');await expect(page.locator('#cpu-hand details[open]')).toHaveCount(1);
 await cards.nth(2).locator('summary').press('Enter');await expect(page.locator('#cpu-hand details[open]')).toHaveCount(0);
 await page.setViewportSize({width:390,height:844});await cards.nth(0).locator('summary').tap();await cards.nth(1).locator('summary').tap();await expect(page.locator('#cpu-hand details[open]')).toHaveCount(1);
});

});

test('mobile tray keeps all cards and board visible, expands rules, and classic removes the tray',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.emulateMedia({reducedMotion:'reduce'});
 for(const index of [0,1,2])await expect(page.locator('#hand .spell-card').nth(index)).toBeInViewport();
 const board=await page.locator('.board-shell').boundingBox(),hand=await page.locator('#hand-panel').boundingBox();expect(board.y+board.height).toBeLessThan(hand.y);
 await page.locator('#hand .spell-card').nth(0).click();await expect(page.locator('#card-instruction')).toBeVisible();
 const expanded=await page.locator('#hand-panel').boundingBox(),selectedBoard=await page.locator('.board-shell').boundingBox();expect(selectedBoard.y+selectedBoard.height).toBeLessThan(expanded.y);
 await page.screenshot({path:'/tmp/herochess-polish-mobile.png'});
 for(const height of [740,667]){await page.setViewportSize({width:375,height});const b=await page.locator('.board-shell').boundingBox(),h=await page.locator('#hand-panel').boundingBox();expect(b.y+b.height).toBeLessThan(h.y);await expect(page.locator('#normal-mode')).toBeInViewport();}await page.setViewportSize({width:390,height:844});
 await page.locator('#normal-mode').click();await expect(page.locator('.spell-workspace')).toBeHidden();
 await page.locator('#new-button').click();await page.locator('input[value="classic"]').check();await page.getByRole('button',{name:'Deal & play'}).click();await expect(page.locator('#hand-panel')).toBeHidden();
});

test('capture impact shares board timing, replacement is dealt, and CPU recap survives reload and rewind',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);
 await page.evaluate(()=>{window.__deals=[];const original=Element.prototype.animate;Element.prototype.animate=function(frames,options){if(this.matches?.('#hand .spell-card'))window.__deals.push({card:this.dataset.card,options});return original.call(this,frames,options);};});
 await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="18"]').click();await page.locator('[data-square="44"]').click();
 const timing=await page.locator('.game-fx:not(.rewind-fx)').evaluate(layer=>({impact:Number(layer.dataset.impact),ring:layer.querySelector('.fx-impact').getAnimations()[0].effect.getTiming().delay}));expect(timing.impact).toBe(620);expect(timing.ring).toBe(timing.impact);
 await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});await expect(page.locator('#cpu-recap')).toBeVisible();const recap=await page.locator('#cpu-recap').textContent();
 expect(await page.evaluate(()=>window.__deals.some(d=>d.options.duration===300))).toBe(true);await page.reload();await expect(page.locator('#cpu-recap')).toHaveText(recap);await page.locator('#undo-button').click();await expect(page.locator('#cpu-recap')).toBeHidden();
});

test('2D pieces stay at their destination while impact finishes; rewind clears the staged pieces',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[44,'q','b']]);await page.locator('#view-2d').click();await page.locator('[data-slot="0"]').click();await page.locator('[data-square="18"]').click();await page.locator('[data-square="44"]').click();
 await page.evaluate(()=>{document.querySelector('.game-fx').getAnimations({subtree:true}).forEach(a=>a.pause());document.querySelectorAll('body > .flat-piece').forEach(piece=>piece.getAnimations().forEach(a=>a.finish()));});
 await expect(page.locator('body > .flat-piece')).toHaveCount(2);await expect(page.locator('[data-square="18"] .flat-piece')).toHaveCSS('visibility','hidden');await page.locator('#undo-button').click();await expect(page.locator('body > .flat-piece')).toHaveCount(0);await expect(page.locator('#move-count')).toHaveText('00');
});

test('CPU power preview is read-only, follows the piece when switching cards, and restores your selection',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[27,'r','b']]);await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();
 const saved=await page.evaluate(()=>localStorage.getItem('herochess-cards-v2'));
 await page.locator('#cpu-hand summary').first().click();await page.locator('[data-square="27"]').click();await expect(page.locator('#cpu-preview-instruction')).toContainText('Rook on d4');await expect(page.locator('.preview-destination')).not.toHaveCount(0);
 const targets=await page.locator('.preview-destination').evaluateAll(nodes=>nodes.map(n=>Number(n.dataset.square)));
 const expected=await page.evaluate(async()=>{const {opponentPreview}=await import('/src/preview.js'),s=JSON.parse(localStorage.getItem('herochess-cards-v2'));return [...new Set(opponentPreview(s.state,s.human,0,27).map(m=>m.to))];});expect(targets.sort()).toEqual(expected.sort());
 await page.locator('.preview-destination').first().click();await expect(page.locator('#move-count')).toHaveText('00');expect(await page.evaluate(()=>localStorage.getItem('herochess-cards-v2'))).toBe(saved);
 await page.locator('#cpu-hand summary').nth(1).click();await expect(page.locator('[data-square="27"]')).toHaveClass(/preview-origin/);await expect(page.locator('#cpu-preview-title')).toContainText('Safe Retreat');
 await page.locator('#view-3d').click();await expect(page.locator('#board-view canvas')).toBeVisible();await page.screenshot({path:'/tmp/herochess-cpu-preview-desktop.png'});await page.locator('#view-2d').click();await page.keyboard.press('Escape');await expect(page.locator('#cpu-preview')).toBeHidden();await expect(page.locator('[data-square="18"]')).toHaveAttribute('aria-pressed','true');
 await page.setViewportSize({width:390,height:844});await page.locator('#cpu-hand summary').first().click();await page.locator('[data-square="27"]').click();await page.screenshot({path:'/tmp/herochess-cpu-preview-mobile.png'});await page.locator('#close-cpu-preview').click();await expect(page.locator('.preview-destination')).toHaveCount(0);
});

test('CPU preview describes shield, freeze, and incompatible pieces without spending a turn',async({page})=>{
 await fixture(page,'comet',[[18,'n','w'],[27,'r','b']]);await page.evaluate(()=>{const k='herochess-cards-v2',s=JSON.parse(localStorage.getItem(k));s.state.hands.b=['ward','frost','pierce'];localStorage.setItem(k,JSON.stringify(s));});await page.reload();await page.locator('#view-2d').click();
 await page.locator('#cpu-hand summary').first().click();await page.locator('[data-square="27"]').click();await expect(page.locator('#cpu-preview-instruction')).toContainText('does not move it');await expect(page.locator('.preview-destination')).toHaveCount(1);
 await page.locator('#cpu-hand summary').nth(1).click();await expect(page.locator('#cpu-preview-instruction')).toContainText('normal movement');await expect(page.locator('#cpu-preview-instruction')).toContainText('c3');
 await page.locator('#cpu-hand summary').nth(2).click();await expect(page.locator('#cpu-preview-instruction')).toContainText('no legal action');await expect(page.locator('.preview-destination')).toHaveCount(0);await page.locator('#hand [data-slot="0"]').click();await expect(page.locator('#cpu-preview')).toBeHidden();await expect(page.locator('#move-count')).toHaveText('00');
});
