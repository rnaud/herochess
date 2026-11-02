// Standard-mapped pads: Xbox A/B and PlayStation cross/circle share these indices.
export class Controller {
 constructor(api){
  this.api=api;this.zone=0;this.index=0;this.row=6;this.col=4;this.previous={};this.nextRepeat=0;this.direction='';this.active=false;
  this.marker=document.getElementById('controller-cursor');this.hint=document.getElementById('controller-hint');
  document.addEventListener('pointerdown',()=>{this.active=false;this.paint();});
  document.addEventListener('visibilitychange',()=>{this.previous={};this.direction='';});
  const tick=time=>{this.poll(time);requestAnimationFrame(tick);};requestAnimationFrame(tick);
 }
 zones(){return ['Board','Your cards','CPU cards','Board controls','Menu'].filter(z=>!['Your cards','CPU cards'].includes(z)||!document.getElementById('hand-panel').hidden);}
 dialog(){return document.querySelector('dialog[open]');}
 elements(){
  const dialog=this.dialog(),zone=this.zones()[this.zone];
  const selector=dialog?'button,input,select,summary':({'Your cards':'#hand .spell-card','CPU cards':'#cpu-hand summary','Board controls':'.board-toolbar button,#close-cpu-preview','Menu':'.header-actions button'}[zone]);
  return selector?[...(dialog||document).querySelectorAll(selector)].filter(e=>!e.disabled&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'):[];
 }
 square(){return this.api.flipped()?this.row*8+7-this.col:(7-this.row)*8+this.col;}
 cancel(){const dialog=this.dialog();if(dialog){dialog.close();this.index=0;}else this.api.cancel();}
 press(key){
  this.active=true;this.api.unlock();const dialog=this.dialog(),zones=this.zones();
  if(key==='back'){this.cancel();this.paint();return;}
  if(key==='menu'){if(dialog)this.cancel();else{this.zone=zones.indexOf('Menu');this.index=0;if(zones[this.zone]==='Board')document.querySelector('.board-shell').scrollIntoView({block:'center'});}this.paint(true);return;}
  if(key==='previous'||key==='next'){if(!dialog){this.zone=(this.zone+(key==='next'?1:-1)+zones.length)%zones.length;this.index=0;if(zones[this.zone]==='Board')document.querySelector('.board-shell').scrollIntoView({block:'center'});}this.paint(true);return;}
  const board=!dialog&&zones[this.zone]==='Board',elements=this.elements();this.index=Math.min(this.index,Math.max(0,elements.length-1));const target=elements[this.index];
  if(key==='confirm'){if(board)this.api.select(this.square());else if(target){if(target.matches('input[type=radio]')){target.checked=true;target.dispatchEvent(new Event('change',{bubbles:true}));}else if(!target.matches('select'))target.click();}this.paint();return;}
  if(board){this.row=Math.max(0,Math.min(7,this.row+(key==='down'?1:key==='up'?-1:0)));this.col=Math.max(0,Math.min(7,this.col+(key==='right'?1:key==='left'?-1:0)));}
  else if(target?.matches('select')&&['left','right'].includes(key)){target.selectedIndex=Math.max(0,Math.min(target.options.length-1,target.selectedIndex+(key==='right'?1:-1)));target.dispatchEvent(new Event('change',{bubbles:true}));}
  else if(elements.length)this.index=(this.index+(['down','right'].includes(key)?1:-1)+elements.length)%elements.length;
  this.paint(true);
 }
 poll(time){
  if(document.hidden||this.blocked)return;
  let pads;try{pads=Array.from(navigator.getGamepads?.()||[]);}catch{this.blocked=true;this.marker.hidden=true;this.hint.hidden=true;return;}
  const pad=pads.find(p=>p?.connected&&p.mapping==='standard');this.supported=!!pad;
  if(!pad){this.active=false;this.previous={};this.direction='';this.hint.hidden=!pads.some(p=>p?.connected);if(!this.hint.hidden)this.hint.textContent='Controller detected without a standard mapping. Use touch or keyboard.';this.paint();return;}
  this.hint.hidden=false;
  const down=i=>!!pad.buttons[i]?.pressed,buttons={confirm:down(0),back:down(1),previous:down(4),next:down(5),menu:down(9)};
  for(const key of Object.keys(buttons))if(buttons[key]&&!this.previous[key])this.press(key);this.previous=buttons;
  const x=pad.axes[0]||0,y=pad.axes[1]||0,direction=down(12)?'up':down(13)?'down':down(14)?'left':down(15)?'right':Math.abs(x)>.6&&Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):Math.abs(y)>.6?(y>0?'down':'up'):'';
  if(direction&&(direction!==this.direction||time>=this.nextRepeat)){this.press(direction);this.nextRepeat=time+(direction===this.direction?130:350);}this.direction=direction;
  if(this.active&&Math.abs(pad.axes[3]||0)>.3){const scroller=this.dialog()||document.querySelector('#cpu-preview details[open]')||document.scrollingElement;scroller.scrollTop+=(pad.axes[3]||0)*12;}
  this.paint();
 }
 paint(scroll=false){
  const dialog=this.dialog(),zones=this.zones();if(dialog!==this.lastDialog){this.index=0;this.lastDialog=dialog;}this.zone=Math.min(this.zone,zones.length-1);const board=this.active&&!dialog&&zones[this.zone]==='Board';
  this.marker.hidden=!board;
  if(board){const point=this.api.point(this.square());if(point){this.marker.style.left=point.x+'px';this.marker.style.top=point.y+'px';this.marker.textContent=String.fromCharCode(97+this.square()%8)+(1+(this.square()>>3));}}
  const target=this.active&&!board?this.elements()[this.index]:null;
  if(target!==this.target){this.target?.classList.remove('controller-focus');this.target=target;target?.classList.add('controller-focus');if(target){target.focus({preventScroll:true});if(scroll)target.scrollIntoView({block:'nearest',inline:'nearest'});}}
  if(!this.hint.hidden&&this.supported){const text=`Controller · ${dialog?'Dialog':zones[this.zone]} · A/✕ select · B/○ back · LB/RB section · Start menu · right stick scroll`;if(this.hint.textContent!==text)this.hint.textContent=text;}
 }
}
