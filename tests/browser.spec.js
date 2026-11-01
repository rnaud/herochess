import { test, expect } from '@playwright/test';
test('3D renders, CPU replies, undo and saved games work',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('#board-view canvas')).toBeVisible();
 await page.screenshot({path:'/tmp/herochess-desktop.png',fullPage:true});
 await page.locator('#view-2d').click();await page.locator('[data-square="12"]').click();await expect(page.locator('[data-square="28"]')).toHaveClass(/legal/);await page.locator('[data-square="28"]').click();
 await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
 await page.reload();await expect(page.locator('#move-count')).toHaveText('02');
 await page.locator('#undo-button').click();await expect(page.locator('#move-count')).toHaveText('00');
 await page.getByRole('button',{name:/Double Knight: Far leap/}).click();await expect(page.locator('#status-title')).toHaveText('Double Knight.');
 await page.locator('#view-2d').click();await expect(page.locator('[data-square="27"]')).toHaveClass(/legal/); // b1-d4 long leap
 await page.locator('[data-square="27"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
 expect(errors).toEqual([]);
});
test('classic mode, black side and guide',async({page})=>{
 await page.goto('/');await page.locator('#guide-button').click();await expect(page.locator('#guide-dialog')).toBeVisible();await page.locator('#guide-dialog .close-dialog').click();
 await page.locator('#new-button').click();await page.locator('input[value="classic"]').check();await page.locator('#side').selectOption('b');await page.getByRole('button',{name:'Let’s play'}).click();
 await expect(page.locator('#mode-label')).toHaveText('CLASSIC RULES');await expect(page.locator('#move-count')).toHaveText('01',{timeout:15000});await expect(page.locator('#turn-chip')).toHaveText('YOUR TURN');
 await page.locator('#view-2d').click();await expect(page.locator('.flat-square').first()).toHaveAttribute('data-square','7');
 await page.locator('#flip-button').click();await expect(page.locator('.flat-square').first()).toHaveAttribute('data-square','56');
});
test('mobile has no horizontal overflow and keyboard moves work',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await page.screenshot({path:'/tmp/herochess-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.locator('#view-2d').click();await page.locator('[data-square="12"]').focus();await page.keyboard.press('Enter');await expect(page.locator('[data-square="28"]')).toHaveClass(/legal/);await page.locator('[data-square="28"]').focus();await page.keyboard.press('Enter');await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
});
test('3D ray picking selects and moves a pawn',async({page})=>{
 await page.setViewportSize({width:1280,height:1100});await page.goto('/');
 async function clickWorld(x,y,z){
  const point=await page.evaluate(async({x,y,z})=>{
   const {OrthographicCamera,Vector3}=await import('/node_modules/three/build/three.module.js');
   const r=document.querySelector('#board-view').getBoundingClientRect(),aspect=r.width/r.height,extent=Math.max(4.25,4.95/aspect);
   const camera=new OrthographicCamera(-extent*aspect,extent*aspect,extent,-extent,.1,100);camera.position.set(0,11.8,10.3);camera.lookAt(0,0,0);camera.updateMatrixWorld();
   const p=new Vector3(x,y,z).project(camera);return {x:r.left+(p.x+1)/2*r.width,y:r.top+(1-p.y)/2*r.height};
  },{x,y,z});await page.mouse.click(point.x,point.y);
 }
 await clickWorld(.5,.45,2.5);await expect(page.locator('#status-title')).toHaveText('Pawn.');
 await clickWorld(.5,.02,.5);await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
});
test('promotion choice and draw display are functional',async({page})=>{
 await page.goto('/');
 await page.evaluate(async()=>{const {initialState,positionKey}=await import('/src/engine.js');const s=initialState('classic');s.board=Array(64).fill(null);s.board[0]={color:'w',type:'k'};s.board[63]={color:'b',type:'k'};s.board[49]={color:'w',type:'p'};s.rights='';s.history=[positionKey(s)];localStorage.setItem('herochess-v2',JSON.stringify({version:2,state:s,human:'w',snapshots:[],journal:[],level:'1'}));});
 await page.reload();await page.locator('#view-2d').click();await page.locator('[data-square="49"]').click();await page.locator('[data-square="57"]').click();await expect(page.locator('#promotion-dialog')).toBeVisible();await page.getByRole('button',{name:'Knight',exact:false}).last().click();await expect(page.locator('#status-detail')).toContainText('Insufficient material');
});
test('WebGL failure uses a playable 2D fallback',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args);};});
 await page.goto('/');await expect(page.locator('#flat-board')).toBeVisible();await expect(page.locator('#view-3d')).toBeDisabled();await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
});
test('Oracle explains blocked diagonals and can slide once its pawn moves',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Oracle: Phase step/}).click();await expect(page.locator('#status-detail')).toContainText('Your own pieces block every diagonal');
 await page.evaluate(async()=>{const {initialState,positionKey}=await import('/src/engine.js');const s=initialState();s.board[27]=s.board[11];s.board[11]=null;s.history=[positionKey(s)];localStorage.setItem('herochess-v2',JSON.stringify({version:2,state:s,human:'w',snapshots:[],journal:[],level:'1'}));});
 await page.reload();await page.locator('#view-2d').click();await page.locator('[data-square="2"]').click();await expect(page.locator('[data-square="38"]')).toHaveClass(/legal/);await page.locator('[data-square="38"]').click();await expect(page.locator('#flat-board')).toHaveAttribute('data-animating','move');await expect(page.locator('[data-square="38"]')).toHaveAttribute('aria-label',/White Oracle/);await expect(page.locator('#move-count')).toHaveText('02');
});
test('3D captures animate and restarting cancels a moving piece safely',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto('/');
 await page.evaluate(async()=>{const {initialState,positionKey}=await import('/src/engine.js');const s=initialState();s.board=Array(64).fill(null);for(const [i,type,color] of [[0,'k','w'],[63,'k','b'],[18,'o','w'],[45,'q','b']])s.board[i]={type,color};s.rights='';s.history=[positionKey(s)];localStorage.setItem('herochess-v2',JSON.stringify({version:2,state:s,human:'w',snapshots:[],journal:[],level:'1'}));});
 await page.reload();await page.locator('#view-2d').click();await page.locator('[data-square="18"]').click();await page.locator('#view-3d').click();
 // Invoke the selected square's UI handler while retaining the 3D view.
 await page.locator('[data-square="45"]').evaluate(button=>button.click());await expect(page.locator('#board-view')).toHaveAttribute('data-animating','capture');
 await page.screenshot({path:'/tmp/herochess-capture.png',fullPage:true});
 await expect(page.locator('#move-count')).toHaveText('01');await expect(page.locator('#status-detail')).toContainText('Checkmate');await expect(page.locator('#board-view')).not.toHaveAttribute('data-animating');
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Let’s play'}).click();await page.locator('#view-2d').click();await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#flat-board')).toHaveAttribute('data-animating','move');
 await page.locator('#new-button').click();await page.getByRole('button',{name:'Let’s play'}).click();await expect(page.locator('#move-count')).toHaveText('00');await expect(page.locator('#flat-board')).not.toHaveAttribute('data-animating');expect(errors).toEqual([]);
});
test('undo cancels active motion and reduced-motion play remains functional',async({page})=>{
 await page.goto('/');await page.locator('#view-2d').click();await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#flat-board')).toHaveAttribute('data-animating','move');await page.locator('#undo-button').click();await expect(page.locator('#move-count')).toHaveText('00');await expect(page.locator('#flat-board')).not.toHaveAttribute('data-animating');await expect(page.locator('body > .flat-piece')).toHaveCount(0);await expect(page.locator('[data-square="12"]')).toHaveAttribute('aria-label',/White Pawn/);
 await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-square="12"]').click();await page.locator('[data-square="28"]').click();await expect(page.locator('#move-count')).toHaveText('02');await expect(page.locator('#flat-board')).not.toHaveAttribute('data-animating');
});
