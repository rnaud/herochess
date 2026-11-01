import * as THREE from 'three';
import { PIECES } from './engine.js';
import { isHeroPowerMove } from './hero-ui.js';
const world = i => [i%8-3.5,0,3.5-(i>>3)];
export class ChessBoard {
 constructor(container,onSelect){
  this.container=container;this.onSelect=onSelect;this.flipped=false;this.pieceMeshes=[];this.disposed=false;
  this.scene=new THREE.Scene();
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.setClearColor(0,0);
  container.appendChild(this.renderer.domElement);
  this.camera=new THREE.OrthographicCamera(-6,6,5,-5,.1,100);
  this.scene.add(new THREE.HemisphereLight(0xf6f4df,0x31473a,2.5));
  const key=new THREE.DirectionalLight(0xffecd0,4.0);key.position.set(-3,10,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:.5,far:25});key.shadow.normalBias=.035;key.shadow.bias=-.0004;key.shadow.radius=3;this.scene.add(key);
  const fill=new THREE.DirectionalLight(0xb5f4de,1.7);fill.position.set(5,5,-6);this.scene.add(fill);
  this.materials={white:new THREE.MeshStandardMaterial({color:0xe4ddc6,roughness:.32,metalness:.12}),black:new THREE.MeshStandardMaterial({color:0x263b34,roughness:.3,metalness:.32}),gold:new THREE.MeshStandardMaterial({color:0xd6b876,metalness:.65,roughness:.3}),whiteHero:new THREE.MeshStandardMaterial({color:0x187be0,metalness:.15,roughness:.34}),blackHero:new THREE.MeshStandardMaterial({color:0xec6718,metalness:.15,roughness:.34})};
  const base=new THREE.Mesh(new THREE.BoxGeometry(8.7,.32,8.7),new THREE.MeshStandardMaterial({color:0x1d322a,metalness:.25,roughness:.45}));base.position.y=-.23;base.receiveShadow=true;this.scene.add(base);
  const trim=new THREE.Mesh(new THREE.BoxGeometry(8.72,.045,8.72),this.materials.gold);trim.position.y=-.35;this.scene.add(trim);
  const lower=new THREE.Mesh(new THREE.BoxGeometry(8.85,.14,8.85),new THREE.MeshStandardMaterial({color:0x18281f,roughness:.6}));lower.position.y=-.45;this.scene.add(lower);
  this.squares=[];
  const light=new THREE.MeshStandardMaterial({color:0xc3c8b0,roughness:.73});const dark=new THREE.MeshStandardMaterial({color:0x557a65,roughness:.63});
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
 resize(){const w=this.container.clientWidth,h=this.container.clientHeight;if(!w||!h)return;this.renderer.setSize(w,h,false);const aspect=w/h;const extent=Math.max(4.25,4.95/aspect);this.camera.left=-extent*aspect;this.camera.right=extent*aspect;this.camera.top=extent;this.camera.bottom=-extent;this.camera.position.set(0,11.8,this.flipped?-10.3:10.3);this.camera.lookAt(0,0,0);this.camera.updateProjectionMatrix();this.render();}
 flip(value=!this.flipped){this.flipped=value;this.makeLabels();this.resize();}
 pick(event){const r=this.container.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);const hits=this.raycaster.intersectObjects([...this.pieceMeshes,...this.squares],true);for(const hit of hits){let obj=hit.object;while(obj){if(obj.userData.square!==undefined)return obj.userData.square;obj=obj.parent;}}return null;}
 mesh(geometry,material,parent,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 piece(type,color){
  const group=new THREE.Group(),hero=!!PIECES[type].base,baseMat=color==='w'?this.materials.white:this.materials.black,mat=hero?(color==='w'?this.materials.whiteHero:this.materials.blackHero):baseMat,gold=this.materials.gold,kind=PIECES[type].base||type;
  const lathe=points=>new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),32);
  this.mesh(lathe([[0,0],[.29,0],[.33,.045],[.33,.09],[.29,.14],[.27,.16],[.27,.2],[.21,.23],[.17,.31],[.13,.48],[.16,.54],[.2,.56],[.2,.61],[0,.61]]),mat,group);
  this.mesh(new THREE.TorusGeometry(.276,.018,8,48),hero?gold:mat,group,0,.18).rotation.x=Math.PI/2;
  if(kind==='p'){this.mesh(new THREE.SphereGeometry(.2,24,16),mat,group,0,.7);group.scale.setScalar(.8);}
  if(kind==='r'){
   this.mesh(new THREE.CylinderGeometry(.25,.2,.27,24),mat,group,0,.73);
   this.mesh(new THREE.CylinderGeometry(.29,.25,.08,24),mat,group,0,.89);
   for(let j=0;j<6;j++){const a=j*Math.PI/3;const block=this.mesh(new THREE.BoxGeometry(.13,.16,.13),mat,group,Math.sin(a)*.22,1,Math.cos(a)*.22);block.rotation.y=a;}
  }
  if(kind==='b'){
   this.mesh(new THREE.SphereGeometry(.22,24,20),mat,group,0,.78).scale.set(1,1.35,1);
   this.mesh(new THREE.ConeGeometry(.12,.23,24),mat,group,0,1.02);
   const slit=this.mesh(new THREE.BoxGeometry(.025,.28,.065),hero?gold:this.materials.black,group,.06,.9,.19);slit.rotation.z=-.35;
   this.mesh(new THREE.SphereGeometry(.055,16,12),gold,group,0,1.16);
  }
  if(kind==='n'){
   const shape=new THREE.Shape();shape.moveTo(-.22,.57);shape.lineTo(-.2,.86);shape.lineTo(-.08,1.12);shape.lineTo(.01,1.28);shape.lineTo(.08,1.12);shape.lineTo(.2,1.07);shape.lineTo(.35,.85);shape.lineTo(.31,.73);shape.lineTo(.12,.77);shape.lineTo(.02,.86);shape.lineTo(.05,.64);shape.closePath();
   const geo=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035});geo.translate(0,0,-.12);this.mesh(geo,mat,group);
   for(const z of [-.155,.155])this.mesh(new THREE.SphereGeometry(.025,12,8),hero?gold:this.materials.black,group,.12,1,z);
   group.rotation.y=color==='w'?.15:Math.PI+.15;
  }
  if(kind==='q'){
   this.mesh(new THREE.CylinderGeometry(.25,.13,.35,24),mat,group,0,.8);
   this.mesh(new THREE.TorusGeometry(.23,.035,8,32),mat,group,0,1).rotation.x=Math.PI/2;
   for(let j=0;j<7;j++){const a=j*Math.PI*2/7;this.mesh(new THREE.SphereGeometry(.055,12,8),mat,group,Math.sin(a)*.22,1.1,Math.cos(a)*.22);this.mesh(new THREE.ConeGeometry(.045,.16,12),mat,group,Math.sin(a)*.22,1.04,Math.cos(a)*.22);}
   this.mesh(new THREE.SphereGeometry(.08,16,12),gold,group,0,1.08);
  }
  if(kind==='k'){
   this.mesh(new THREE.CylinderGeometry(.22,.14,.33,24),mat,group,0,.79);this.mesh(new THREE.SphereGeometry(.17,24,16),mat,group,0,1);
   this.mesh(new THREE.BoxGeometry(.09,.34,.09),mat,group,0,1.24);this.mesh(new THREE.BoxGeometry(.27,.08,.09),mat,group,0,1.28);
  }
  if(hero){
   this.mesh(new THREE.CylinderGeometry(.334,.334,.105,32),baseMat,group,0,.055);
   this.mesh(new THREE.TorusGeometry(.33,.022,10,48),gold,group,0,.07).rotation.x=Math.PI/2;
   this.mesh(new THREE.OctahedronGeometry(.075),color==='w'?this.materials.whiteHero:this.materials.blackHero,group,0,.33,.165);
  }
  return group;
 }
 cancelAnimation(){this.finishAnimation?.();}
 animateShield(square){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.5,.045,12,48),new THREE.MeshBasicMaterial({color:0x82d3ff,transparent:true}));ring.rotation.x=-Math.PI/2;ring.position.set(...world(square));this.scene.add(ring);
  return new Promise(resolve=>{let frame;const start=performance.now();const finish=()=>{cancelAnimationFrame(frame);this.scene.remove(ring);ring.geometry.dispose();ring.material.dispose();this.finishAnimation=null;resolve();};this.finishAnimation=finish;const tick=now=>{const t=Math.min((now-start)/550,1);ring.position.y=.1+t*1.4;ring.scale.setScalar(1+t*.5);ring.material.opacity=1-t;this.render();if(t<1)frame=requestAnimationFrame(tick);else finish();};frame=requestAnimationFrame(tick);});
 }
 animateMove(state,move){
  this.cancelAnimation();
  if(move.special==='shield')return this.animateShield(move.from);
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
  const moving=this.pieceMeshes.find(mesh=>mesh.userData.square===move.from);
  if(!moving)return Promise.resolve();
  const piece=state.board[move.from];
  const capturedSquare=move.special==='ep'?move.to+(piece.color==='w'?-8:8):move.to;
  const victim=this.pieceMeshes.find(mesh=>mesh.userData.square===capturedSquare);
  const rook=move.special==='castle'?this.pieceMeshes.find(mesh=>mesh.userData.square===(move.to>move.from?move.from+3:move.from-4)):null;
  const start=new THREE.Vector3(...world(move.from)),end=new THREE.Vector3(...world(move.to));
  const rookStart=rook?.position.clone(),rookEnd=rook?new THREE.Vector3(...world(move.to>move.from?move.from+1:move.from-1)):null;
  const jump=piece.type==='n'||isHeroPowerMove(state,move)||piece.type==='h';
  const originals=[];
  victim?.traverse(object=>{if(object.isMesh){const original=object.material;object.material=original.clone();object.material.transparent=true;originals.push([object,original]);}});
  const burst=new THREE.Group();burst.position.set(...world(capturedSquare));burst.position.y=.12;
  if(victim){
   const material=new THREE.MeshBasicMaterial({color:0xffd48c,transparent:true,opacity:0});
   for(let i=0;i<12;i++){const spark=new THREE.Mesh(new THREE.OctahedronGeometry(.045),material);burst.add(spark);}
   this.scene.add(burst);
  }
  this.container.dataset.animating=victim?'capture':'move';this.marks.visible=false;
  return new Promise(resolve=>{
   let frame;const began=performance.now(),duration=victim?760:520;
   const finish=()=>{cancelAnimationFrame(frame);this.finishAnimation=null;delete this.container.dataset.animating;this.marks.visible=true;
    for(const [object,original] of originals){object.material.dispose();object.material=original;}
    this.scene.remove(burst);for(const spark of burst.children)spark.geometry.dispose();burst.children[0]?.material.dispose();resolve();};
   this.finishAnimation=finish;
   const tick=now=>{
    const t=Math.min((now-began)/duration,1),travel=Math.min(t/(victim ? 0.72 : 1),1),ease=travel*travel*(3-2*travel);
    moving.position.lerpVectors(start,end,ease);moving.position.y=Math.sin(travel*Math.PI)*(jump?1.15:.16);
    if(rook)rook.position.lerpVectors(rookStart,rookEnd,ease);
    if(victim){const impact=Math.max(0,(t-.55)/.45);victim.scale.setScalar((state.board[capturedSquare]?.type==='p' ? 0.8 : 1)*(1-impact*.9));victim.position.y=-impact*.35;victim.rotation.z=impact*.8;for(const [object] of originals)object.material.opacity=1-impact;
     burst.children.forEach((spark,i)=>{const angle=i*Math.PI*2/12;spark.position.set(Math.cos(angle)*impact*.9,Math.sin(impact*Math.PI)*.45,Math.sin(angle)*impact*.9);spark.material.opacity=impact>0?1-impact:0;});
    }
    this.render();if(t<1)frame=requestAnimationFrame(tick);else finish();
   };frame=requestAnimationFrame(tick);
  });
 }
 update(state,selected,moves){
  for(const m of this.pieceMeshes){this.scene.remove(m);m.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.userData.disposableMaterial)o.material.dispose();});}this.pieceMeshes=[];
  state.board.forEach((p,i)=>{if(!p)return;const m=this.piece(p.type,p.color);m.position.set(...world(i));m.userData.square=i;
   if(state.shield?.square===i){const shell=new THREE.Mesh(new THREE.SphereGeometry(.62,24,16),new THREE.MeshBasicMaterial({color:0x8ad8ff,transparent:true,opacity:.2,depthWrite:false}));shell.position.y=.6;shell.scale.y=1.25;shell.userData.disposableMaterial=true;m.add(shell);}
   this.scene.add(m);this.pieceMeshes.push(m);});
  for(const m of [...this.marks.children]){m.geometry.dispose();m.material.dispose();this.marks.remove(m);}
  const tile=(i,color,opacity)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.96,.96),new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(...world(i));m.position.y=.01;this.marks.add(m);};
  if(state.lastMove){tile(state.lastMove.from,0xd7bc71,.25);tile(state.lastMove.to,0xd7bc71,.32);}
  if(selected!==null)tile(selected,0xe6bd64,.65);
  for(const to of new Set(moves.map(m=>m.to))){
   const capture=!!state.board[to],power=moves.some(move=>move.to===to&&isHeroPowerMove(state,move));const m=new THREE.Mesh(capture?new THREE.RingGeometry(.36,.42,48):power?new THREE.RingGeometry(.12,.2,32):new THREE.CircleGeometry(.105,32),new THREE.MeshBasicMaterial({color:power?0x27a8ff:capture?0xf0d48d:0x234c37,transparent:true,opacity:.82,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(...world(to));m.position.y=.025;this.marks.add(m);
  }
  this.render();
 }
 render(){this.renderer.render(this.scene,this.camera);}
}
