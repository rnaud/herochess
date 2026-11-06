import * as THREE from 'three';
import { PIECES,inCheck } from './engine.js';
import {CARDS} from './cards.js';
import {actionTiming} from './motion.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {createPieceMaterials} from './piece-model.js';
import {pixelCanvas} from './pixels.js';
const isHeroPowerMove=(_state,move)=>!!move.usePower;
const world = i => [i%8-3.5,0,3.5-(i>>3)];
const SPRITE_HEIGHT={p:.82,n:1.0,b:1.08,r:1.0,q:1.18,k:1.24};
export class ChessBoard {
 constructor(container,onSelect){
  this.container=container;this.onSelect=onSelect;this.flipped=false;this.pieceMeshes=[];this.disposed=false;
  this.scene=new THREE.Scene();
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0,0);
  container.appendChild(this.renderer.domElement);
  this.camera=new THREE.OrthographicCamera(-6,6,5,-5,.1,100);
  const pmrem=new THREE.PMREMGenerator(this.renderer),room=new RoomEnvironment();this.environment=pmrem.fromScene(room,.08,.1,100,{size:64});this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.3;room.dispose();pmrem.dispose();
  this.scene.add(new THREE.HemisphereLight(0xfff4df,0x292b34,1.65));
  const key=new THREE.DirectionalLight(0xffe6c4,2.2);key.position.set(-3,14,3);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});key.shadow.normalBias=.035;key.shadow.bias=-.0004;key.shadow.radius=5;key.shadow.intensity=.45;this.scene.add(key);
  const fill=new THREE.DirectionalLight(0xd5e2f2,1.25);fill.position.set(5,5,-6);this.scene.add(fill);
  this.materials=createPieceMaterials();
  this.pieceTextures={};for(const color of ['w','b'])for(const type of Object.keys(SPRITE_HEIGHT)){const texture=new THREE.CanvasTexture(pixelCanvas(type,color));texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.colorSpace=THREE.SRGBColorSpace;this.pieceTextures[color+type]=texture;}
  this.shadowTexture=(()=>{const c=document.createElement('canvas');c.width=32;c.height=16;const x=c.getContext('2d');for(let y=0;y<16;y++)for(let i=0;i<32;i++){const dx=(i-15.5)/15.5,dy=(y-7.5)/7.5,d=dx*dx+dy*dy;if(d<1){x.fillStyle=d<.5?'rgba(0,0,0,.52)':'rgba(0,0,0,.24)';x.fillRect(i,y,1,1);}}const t=new THREE.CanvasTexture(c);t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;return t;})();
  const base=new THREE.Mesh(new THREE.BoxGeometry(8.7,.32,8.7),new THREE.MeshStandardMaterial({color:0x514134,metalness:.25,roughness:.45}));base.position.y=-.23;base.receiveShadow=true;this.scene.add(base);
  const trim=new THREE.Mesh(new THREE.BoxGeometry(8.72,.045,8.72),this.materials.gold);trim.position.y=-.35;this.scene.add(trim);
  const lower=new THREE.Mesh(new THREE.BoxGeometry(8.85,.14,8.85),new THREE.MeshStandardMaterial({color:0x26201b,roughness:.6}));lower.position.y=-.45;this.scene.add(lower);
  this.squares=[];
  // Painted mineral grain keeps the board tactile without competing with its squares.
  const stoneCanvas=document.createElement('canvas');stoneCanvas.width=256;stoneCanvas.height=256;
  const stoneContext=stoneCanvas.getContext('2d'),pixels=stoneContext.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const wave=Math.sin(x*.018+y*.014+Math.sin(y*.021)*2.3+Math.sin(x*.067)*.25),vein=Math.pow(Math.abs(wave),22);
   const grain=(Math.sin(x*127.1+y*311.7)*43758.5453)%1;
   const shade=242-vein*4+grain*1.5,i=(y*256+x)*4;
   pixels.data[i]=shade;pixels.data[i+1]=shade;pixels.data[i+2]=shade;pixels.data[i+3]=255;
  }
  stoneContext.putImageData(pixels,0,0);const stoneMap=new THREE.CanvasTexture(stoneCanvas);stoneMap.colorSpace=THREE.SRGBColorSpace;
  for(const x of [-4.22,4.22])for(const z of [-4.22,4.22]){
   const finial=new THREE.Mesh(new THREE.OctahedronGeometry(.13),this.materials.gold);finial.position.set(x,.02,z);this.scene.add(finial);
  }


  const light=new THREE.MeshStandardMaterial({color:0xd8cbb1,roughness:.42,map:stoneMap,bumpMap:stoneMap,bumpScale:.008});const dark=new THREE.MeshStandardMaterial({color:0x39413f,roughness:.4,map:stoneMap,bumpMap:stoneMap,bumpScale:.008});
  for(let i=0;i<64;i++){
   const square=new THREE.Mesh(new THREE.BoxGeometry(.996,.075,.996),((i%8+(i>>3))%2===0)?dark:light);square.position.set(...world(i));square.position.y=-.035;square.receiveShadow=true;square.userData.square=i;this.scene.add(square);this.squares.push(square);
  }
  this.labels=new THREE.Group();this.scene.add(this.labels);this.makeLabels();
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.25}));ground.rotation.x=-Math.PI/2;ground.position.y=-.53;ground.receiveShadow=true;this.scene.add(ground);
  this.marks=new THREE.Group();this.scene.add(this.marks);
  this.raycaster=new THREE.Raycaster();this.pointer=new THREE.Vector2();
  container.addEventListener('pointerup',e=>{if(e.button!==0)return;const square=this.pick(e);if(square!==null)this.onSelect(square);});
  container.addEventListener('pointermove',e=>{container.style.cursor=this.pick(e)!==null?'pointer':'default';});
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(container);this.resize();
 }
 makeLabels(){
  for(const child of [...this.labels.children]){child.material.map.dispose();child.material.dispose();this.labels.remove(child);}
  for(let i=0;i<8;i++)for(const [label,pos] of [[String.fromCharCode(97+i),[i-3.5,.01,this.flipped?-4.2:4.2]],[String(i+1),[this.flipped?4.2:-4.2,.01,3.5-i]]]){
   const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#bccbb0';ctx.font='500 30px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,32,32);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.position.set(...pos);sprite.scale.set(.28,.28,1);this.labels.add(sprite);
  }
 }
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const aspect=w/h;const extent=Math.max(4.65,4.65/aspect);this.camera.left=-extent*aspect;this.camera.right=extent*aspect;this.camera.top=extent;this.camera.bottom=-extent;this.camera.position.set(0,17,this.flipped?-9:9);this.camera.lookAt(0,0,0);this.camera.updateProjectionMatrix();this.render();}
 flip(value=!this.flipped){this.flipped=value;this.makeLabels();this.resize();}
 pick(event){const r=this.container.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects([...this.pieceMeshes,...this.squares],true);for(const hit of hits){let obj=hit.object;while(obj){if(obj.userData.square!==undefined)return obj.userData.square;obj=obj.parent;}}return null;}
 piece(type,color){
  const group=new THREE.Group(),height=SPRITE_HEIGHT[type]||.85;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:this.pieceTextures[color+type],transparent:true,alphaTest:.08,depthWrite:true}));
  sprite.center.set(.5,0);sprite.scale.set(height,height,1);sprite.position.y=.045;sprite.userData.disposableMaterial=true;group.add(sprite);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(height*.86,height*.34),new THREE.MeshBasicMaterial({map:this.shadowTexture,transparent:true,opacity:.62,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.012;shadow.renderOrder=1;shadow.userData.disposableMaterial=true;group.add(shadow);
  group.userData.sprite=sprite;
  return group;
 }
 screenPoint(square){
  const p=new THREE.Vector3(...world(square));p.y=.45;p.project(this.camera);
  const rect=this.renderer.domElement.getBoundingClientRect();return {x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2};
 }
 cancelAnimation(){this.finishAnimation?.();}
 animateShield(square,frozen=false){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.045,12,48),new THREE.MeshBasicMaterial({color:frozen?0xb5eeff:0x82d3ff,transparent:true}));ring.rotation.x=-Math.PI/2;ring.position.set(...world(square));this.scene.add(ring);
  return new Promise(resolve=>{let frame;const start=performance.now();const finish=()=>{cancelAnimationFrame(frame);this.scene.remove(ring);ring.geometry.dispose();ring.material.dispose();this.finishAnimation=null;resolve();};this.finishAnimation=finish;const tick=now=>{const t=Math.min((now-start)/550,1);ring.position.y=.1+t*1.4;ring.scale.setScalar(1+t*.5);ring.material.opacity=1-t;this.render();if(t<1)frame=requestAnimationFrame(tick);else finish();};frame=requestAnimationFrame(tick);});
 }
 animateMove(state,move){
  this.cancelAnimation();
  if(['shield','freeze'].includes(move.special))return this.animateShield(move.from,move.special==='freeze');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const moving=this.pieceMeshes.find(mesh=>mesh.userData.square===move.from);
  if(!moving)return Promise.resolve();
  const piece=state.board[move.from];
  const capturedSquare=move.special==='ep'?move.to+(piece.color==='w'?-8:8):move.to;
  const partner=move.special==='swap'?this.pieceMeshes.find(mesh=>mesh.userData.square===move.to):null;
  const victim=partner?null:this.pieceMeshes.find(mesh=>mesh.userData.square===capturedSquare);
  const rook=move.special==='castle'?this.pieceMeshes.find(mesh=>mesh.userData.square===(move.to>move.from?move.from+3:move.from-4)):null;
  const start=new THREE.Vector3(...world(move.from)),end=new THREE.Vector3(...world(move.to));
  const rookStart=rook?.position.clone(),rookEnd=rook?new THREE.Vector3(...world(move.to>move.from?move.from+1:move.from-1)):null;
  const jump=move.usePower&&move.freezeTarget===undefined?['Leap','Travel'].includes(CARDS[move.card]?.kind):piece.type==='n';
  const originals=[];
  victim?.traverse(object=>{if((object.isMesh||object.isSprite)&&object.material){const original=object.material;object.material=original.clone();object.material.transparent=true;originals.push([object,original]);}});
  const burst=new THREE.Group();burst.position.set(...world(capturedSquare));burst.position.y=.12;
  if(victim){
   const material=new THREE.MeshBasicMaterial({color:0xffd48c,transparent:true,opacity:0});
   for(let i=0;i<12;i++){const spark=new THREE.Mesh(new THREE.OctahedronGeometry(.045),material);burst.add(spark);}
   this.scene.add(burst);
  }
  this.container.dataset.animating=victim?'capture':'move';this.marks.visible=false;
  return new Promise(resolve=>{
   let frame;const began=performance.now(),timing=actionTiming(state,move),duration=timing.duration;
   const finish=()=>{cancelAnimationFrame(frame);this.finishAnimation=null;delete this.container.dataset.animating;this.marks.visible=true;
    for(const [object,original] of originals){object.material.dispose();object.material=original;}
    this.scene.remove(burst);for(const spark of burst.children)spark.geometry.dispose();burst.children[0]?.material.dispose();resolve();};
   this.finishAnimation=finish;
   const tick=now=>{
    const elapsed=now-began,t=Math.min(elapsed/duration,1),travel=Math.max(0,Math.min((elapsed-timing.anticipation)/timing.travel,1)),ease=travel*travel*(3-2*travel);
    moving.position.lerpVectors(start,end,ease);moving.position.y=Math.sin(travel*Math.PI)*(jump?1.15:.16);
    if(rook)rook.position.lerpVectors(rookStart,rookEnd,ease);if(partner){partner.position.lerpVectors(end,start,ease);partner.position.y=Math.sin(travel*Math.PI)*.7;}
    if(victim){const impact=Math.max(0,Math.min((elapsed-timing.impact)/300,1));victim.scale.setScalar((state.board[capturedSquare]?.type==='p' ? 0.8 : 1)*(1-impact*.9));victim.position.y=-impact*.35;victim.rotation.z=impact*.8;for(const [object] of originals)object.material.opacity=1-impact;
     burst.children.forEach((spark,i)=>{const angle=i*Math.PI*2/12;spark.position.set(Math.cos(angle)*impact*.9,Math.sin(impact*Math.PI)*.45,Math.sin(angle)*impact*.9);spark.material.opacity=impact>0?1-impact:0;});
    }
    this.render();if(t<1)frame=requestAnimationFrame(tick);else finish();
   };frame=requestAnimationFrame(tick);
  });
 }
 update(state,selected,moves,preview=false){
  for(const m of this.pieceMeshes){this.scene.remove(m);m.traverse(o=>{if(o.isMesh&&o.geometry)o.geometry.dispose();if(o.userData.disposableMaterial)o.material.dispose();});}this.pieceMeshes=[];
  state.board.forEach((p,i)=>{if(!p)return;const m=this.piece(p.type,p.color);m.position.set(...world(i));m.userData.square=i;
   if(state.shield?.square===i||state.freeze?.square===i){const shell=new THREE.Mesh(state.freeze?.square===i?new THREE.IcosahedronGeometry(.7,0):new THREE.SphereGeometry(.62,24,16),new THREE.MeshBasicMaterial({color:state.freeze?.square===i?0xb5eeff:0x8ad8ff,transparent:true,opacity:.25,depthWrite:false}));shell.position.y=.6;shell.scale.y=1.25;shell.userData.disposableMaterial=true;m.add(shell);}
   this.scene.add(m);this.pieceMeshes.push(m);});
  for(const m of [...this.marks.children]){m.geometry.dispose();m.material.dispose();this.marks.remove(m);}
  const tile=(i,color,opacity)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.96,.96),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(...world(i));m.position.y=.01;this.marks.add(m);};
  if(state.lastMove){tile(state.lastMove.from,0xd7bc71,.25);tile(state.lastMove.to,0xd7bc71,.32);}
  if(selected!==null)tile(selected,preview?0xc79cff:0xe6bd64,.65);
  if(inCheck(state)){const king=state.board.findIndex(p=>p?.type==='k'&&p.color===state.turn);if(king>=0)tile(king,0xe73836,.65);}
  for(const to of new Set(moves.map(m=>m.to))){
   const capture=!!state.board[to],power=moves.some(move=>move.to===to&&isHeroPowerMove(state,move));const m=new THREE.Mesh(capture?new THREE.RingGeometry(.36,.42,48):power?new THREE.RingGeometry(.12,.2,32):new THREE.CircleGeometry(.105,32),new THREE.MeshBasicMaterial({color:preview?0xc79cff:power?0x27a8ff:capture?0xf0d48d:0x234c37,transparent:true,opacity:.82,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(...world(to));m.position.y=.025;this.marks.add(m);
  }
  this.render();
 }
 render(){this.renderer.render(this.scene,this.camera);}
}
