import {test,expect} from '@playwright/test';
async function press(page,index){await page.evaluate(i=>window.testPad.buttons[i].pressed=true,index);await page.waitForTimeout(80);await page.evaluate(i=>window.testPad.buttons[i].pressed=false,index);await page.waitForTimeout(80);}
test.beforeEach(async({page})=>{await page.addInitScript(()=>{window.testPad={connected:true,mapping:'standard',index:0,buttons:Array.from({length:17},()=>({pressed:false})),axes:[0,0,0,0]};Object.defineProperty(navigator,'getGamepads',{value:()=>[window.testPad]});});});
test('controller moves a piece, chooses and cancels a card, navigates dialogs and disconnects',async({page})=>{
 await page.goto('/');await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('#controller-hint')).toContainText('Controller');
 await press(page,5);await expect(page.locator('#hand .controller-focus')).toHaveCount(1);await press(page,0);await expect(page.locator('#hand [aria-pressed=true]')).toHaveCount(1);await press(page,1);await expect(page.locator('#hand [aria-pressed=true]')).toHaveCount(0);
 await press(page,4);await press(page,0);await page.screenshot({path:'/tmp/herochess-controller-desktop.png'});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/herochess-controller-mobile.png'});await page.setViewportSize({width:1280,height:720});await press(page,12);await press(page,12);await press(page,0);await expect(page.locator('#move-count')).toHaveText('02',{timeout:15000});
 await press(page,9);await press(page,0);await expect(page.locator('#library-dialog')).toBeVisible();await press(page,1);await expect(page.locator('#library-dialog')).toBeHidden();
 await press(page,15);await press(page,15);await press(page,0);await expect(page.locator('#install-dialog')).toBeVisible();await press(page,1);
 await page.evaluate(()=>window.testPad.connected=false);await expect(page.locator('#controller-cursor')).toBeHidden();
});
test('held confirm fires once; stick deadzone and board flip preserve spatial navigation',async({page})=>{
 await page.goto('/');await press(page,5);await page.evaluate(()=>window.testPad.buttons[0].pressed=true);await page.waitForTimeout(500);await expect(page.locator('#hand [aria-pressed=true]')).toHaveCount(1);await page.evaluate(()=>window.testPad.buttons[0].pressed=false);await press(page,1);await press(page,4);
 await page.locator('#flip-button').click();await press(page,0);await expect(page.locator('#controller-cursor')).toHaveText('d7');await page.evaluate(()=>window.testPad.axes[0]=.2);await page.waitForTimeout(400);await expect(page.locator('#controller-cursor')).toHaveText('d7');await press(page,15);await expect(page.locator('#controller-cursor')).toHaveText('c7');
});
test('install button uses the browser prompt when available and offers instructions otherwise',async({page})=>{
 await page.goto('/');await page.locator('#install-button').click();await expect(page.locator('#install-dialog')).toContainText('Add to Home screen');await page.locator('#install-dialog .close-dialog').click();
 await page.evaluate(()=>{const event=new Event('beforeinstallprompt',{cancelable:true});event.prompt=async()=>{window.prompted=true;};event.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(event);});await page.locator('#install-button').click();expect(await page.evaluate(()=>window.prompted)).toBe(true);await expect(page.locator('#install-button')).toBeHidden();
});
