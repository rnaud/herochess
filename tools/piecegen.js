import * as THREE from 'three';
import {createPiece,createPieceMaterials} from '../src/piece-model.js';

const S=32, SS=192;
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
renderer.setPixelRatio(1);renderer.setSize(SS,SS,false);renderer.setClearColor(0,0);
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
const scene=new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xfff4df,0x3a3540,1.15));
const key=new THREE.DirectionalLight(0xffe8c8,3.6);key.position.set(-3,5,4);scene.add(key);
const rim=new THREE.DirectionalLight(0xcfe0ff,1.5);rim.position.set(3,1.5,2);scene.add(rim);
const back=new THREE.DirectionalLight(0xffd7a0,.9);back.position.set(-2,3,-3);scene.add(back);
const camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,100);
const materials=createPieceMaterials();
materials.white=new THREE.MeshStandardMaterial({color:0xe3d9bd,roughness:.72,metalness:0});
materials.black=new THREE.MeshStandardMaterial({color:0x44525d,roughness:.62,metalness:.08});
materials.gold=new THREE.MeshStandardMaterial({color:0xd6b876,roughness:.4,metalness:.25});

const whitePal=['#6f5b40','#a8926b','#cdbb95','#e9ddc2','#fff8e8'];
const blackPal=['#141c23','#24313a','#3a4a55','#5c6d77','#93a5ac'];
const gold='#d8b46a',outline='#1b1512';
const hex=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)];
const palettes={w:[outline,...whitePal,gold],b:[outline,...blackPal,gold]};
const chars={w:['o','0','1','2','3','4','g'],b:['o','0','1','2','3','4','g']};
const parse=p=>p.map(hex);

function quantize(data,color){
 const small=document.createElement('canvas');small.width=S;small.height=S;
 const ctx=small.getContext('2d');ctx.imageSmoothingEnabled=true;ctx.drawImage(data,0,0,S,S);
 const img=ctx.getImageData(0,0,S,S),d=img.data;
 const out=new Uint8ClampedArray(d.length);
 const grid=new Array(S*S).fill('.');
 for(let i=0;i<d.length;i+=4){
  const a=d[i+3],r=d[i],g=d[i+1],b=d[i+2];if(a<100||r+g+b<12){out[i+3]=0;continue;}
  let idx;
  if(r-b>60&&g-b>40&&r>120)idx=6;
  else{const lum=(.2126*r+.7152*g+.0722*b)/255;
   const p=color==='b'?(lum<.08?1:lum<.16?2:lum<.28?3:lum<.42?4:5):(lum<.18?1:lum<.36?2:lum<.58?3:lum<.8?4:5);idx=p;}
  const [R,G,B]=parse(palettes[color])[idx];
  out[i]=R;out[i+1]=G;out[i+2]=B;out[i+3]=255;
  grid[i/4]=chars[color][idx];
 }
 const frozen=new Uint8Array(S*S);for(let i=0;i<S*S;i++)frozen[i]=out[i*4+3]>0?1:0;
 const solid=(x,y)=>x>=0&&x<S&&y>=0&&y<S&&!!frozen[y*S+x];
 const [OR,OG,OB]=hex(outline);
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){
  const i=y*S+x;if(out[i*4+3]>0)continue;
  if(solid(x-1,y)||solid(x+1,y)||solid(x,y-1)||solid(x,y+1)||solid(x-1,y-1)||solid(x+1,y-1)||solid(x-1,y+1)||solid(x+1,y+1)){
   out[i*4]=OR;out[i*4+1]=OG;out[i*4+2]=OB;out[i*4+3]=255;grid[i]='o';
  }
 }
 const result=new ImageData(out,S,S);ctx.putImageData(result,0,0);
 const rows=[];for(let y=0;y<S;y++)rows.push(grid.slice(y*S,y*S+S).join(''));
 return {canvas:small,rows};
}

window.bake=async()=>{
 const sprites={};
 const out=document.getElementById('out');
 for(const color of ['w','b']){
  for(const type of ['p','n','b','r','q','k']){
   const piece=createPiece(type,color,materials);scene.add(piece);
   const box=new THREE.Box3().setFromObject(piece),size=new THREE.Vector3();box.getSize(size);
   const center=new THREE.Vector3();box.getCenter(center);
   const extent=Math.max(size.x,size.y,size.z*.6)*.62;
   camera.left=-extent;camera.right=extent;camera.top=extent;camera.bottom=-extent;camera.near=.01;camera.far=20;
   camera.position.set(center.x,center.y+extent*.35,center.z+4);camera.lookAt(center.x,center.y,center.z);camera.updateProjectionMatrix();
   renderer.render(scene,camera);
   const {canvas:small,rows}=quantize(renderer.domElement,color);
   sprites[`${type}${color}`]={url:small.toDataURL('image/png'),rows};
   // preview: draw the 24px sprite at 8x on the visible canvas
   out.width=S;out.height=S;const oc=out.getContext('2d');oc.clearRect(0,0,S,S);oc.imageSmoothingEnabled=false;oc.drawImage(small,0,0);
   scene.remove(piece);piece.traverse(o=>{if(o.geometry)o.geometry.dispose();});
  }
 }
 return sprites;
};
window.debug=()=>{const gl=renderer.getContext(),px=new Uint8Array(4);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);return {px:[...px],clearAlpha:renderer.getClearAlpha(),alpha:gl.getContextAttributes().alpha};};
window.ready=true;
