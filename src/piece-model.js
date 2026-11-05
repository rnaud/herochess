import * as THREE from 'three';
import {PIECES} from './engine.js';

function addMesh(geometry,material,parent,x=0,y=0,z=0){
 const mesh=new THREE.Mesh(geometry,material);
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
}

export function createPieceMaterials(){
 return {
  white:new THREE.MeshPhysicalMaterial({color:0xe4ddc6,roughness:.24,metalness:.08,clearcoat:.35,clearcoatRoughness:.25}),
  black:new THREE.MeshPhysicalMaterial({color:0x1b2229,roughness:.25,metalness:.3,clearcoat:.4,clearcoatRoughness:.2}),
  gold:new THREE.MeshStandardMaterial({color:0xd6b876,metalness:.65,roughness:.3}),
  whiteHero:new THREE.MeshStandardMaterial({color:0x187be0,metalness:.15,roughness:.34}),
  blackHero:new THREE.MeshStandardMaterial({color:0xec6718,metalness:.15,roughness:.34}),
 };
}

// A single sculpted piece. Kept pure so the sprite baker can reuse it.
export function createPiece(type,color,materials){
 const group=new THREE.Group(),hero=!!PIECES[type].base,baseMat=color==='w'?materials.white:materials.black;
 const mat=hero?(color==='w'?materials.whiteHero:materials.blackHero):baseMat,gold=materials.gold,kind=PIECES[type].base||type;
 const lathe=points=>new THREE.LatheGeometry(new THREE.SplineCurve(points.map(([r,y])=>new THREE.Vector2(r,y))).getPoints(40),40);
 addMesh(lathe([[0,0],[.29,0],[.33,.045],[.33,.09],[.29,.14],[.27,.16],[.27,.2],[.21,.23],[.17,.31],[.13,.48],[.16,.54],[.2,.56],[.2,.61],[0,.61]]),mat,group);
 addMesh(new THREE.TorusGeometry(.276,.018,8,48),hero?gold:mat,group,0,.18).rotation.x=Math.PI/2;
 if(kind==='p'){addMesh(new THREE.SphereGeometry(.2,24,16),mat,group,0,.7);group.scale.setScalar(.8);}
 if(kind==='r'){
  addMesh(new THREE.CylinderGeometry(.25,.2,.27,24),mat,group,0,.73);
  addMesh(new THREE.CylinderGeometry(.29,.25,.08,24),mat,group,0,.89);
  for(let j=0;j<6;j++){const a=j*Math.PI/3;const block=addMesh(new THREE.BoxGeometry(.13,.16,.13),mat,group,Math.sin(a)*.22,1,Math.cos(a)*.22);block.rotation.y=a;}
 }
 if(kind==='b'){
  addMesh(new THREE.SphereGeometry(.22,24,20),mat,group,0,.78).scale.set(1,1.35,1);
  addMesh(new THREE.ConeGeometry(.12,.23,24),mat,group,0,1.02);
  const slit=addMesh(new THREE.BoxGeometry(.025,.28,.065),hero?gold:materials.black,group,.06,.9,.19);slit.rotation.z=-.35;
  addMesh(new THREE.SphereGeometry(.055,16,12),gold,group,0,1.16);
 }
 if(kind==='n'){
  const shape=new THREE.Shape();shape.moveTo(-.22,.57);shape.bezierCurveTo(-.27,.85,-.2,1.08,-.07,1.18);shape.lineTo(-.025,1.32);shape.quadraticCurveTo(.045,1.3,.075,1.15);shape.bezierCurveTo(.18,1.13,.22,1.02,.32,.94);shape.quadraticCurveTo(.42,.86,.33,.77);shape.quadraticCurveTo(.24,.72,.12,.83);shape.quadraticCurveTo(-.01,.91,.03,.66);shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth:.24,bevelEnabled:true,bevelSegments:5,steps:1,bevelSize:.045,bevelThickness:.045});geo.translate(0,0,-.12);addMesh(geo,mat,group);
  for(const z of [-.155,.155])addMesh(new THREE.SphereGeometry(.025,12,8),hero?gold:materials.black,group,.12,1,z);
  group.rotation.y=color==='w'?.15:Math.PI+.15;
 }
 if(kind==='q'){
  addMesh(new THREE.CylinderGeometry(.25,.13,.35,24),mat,group,0,.8);
  addMesh(new THREE.TorusGeometry(.23,.035,8,32),mat,group,0,1).rotation.x=Math.PI/2;
  for(let j=0;j<7;j++){const a=j*Math.PI*2/7;addMesh(new THREE.SphereGeometry(.055,12,8),mat,group,Math.sin(a)*.22,1.1,Math.cos(a)*.22);addMesh(new THREE.ConeGeometry(.045,.16,12),mat,group,Math.sin(a)*.22,1.04,Math.cos(a)*.22);}
  addMesh(new THREE.SphereGeometry(.08,16,12),gold,group,0,1.08);
 }
 if(kind==='k'){
  addMesh(new THREE.CylinderGeometry(.22,.14,.33,24),mat,group,0,.79);addMesh(new THREE.SphereGeometry(.17,24,16),mat,group,0,1);
  addMesh(new THREE.BoxGeometry(.09,.34,.09),gold,group,0,1.24);addMesh(new THREE.BoxGeometry(.27,.08,.09),gold,group,0,1.28);
 }
 if(hero){
  addMesh(new THREE.CylinderGeometry(.334,.334,.105,32),baseMat,group,0,.055);
  addMesh(new THREE.TorusGeometry(.33,.022,10,48),gold,group,0,.07).rotation.x=Math.PI/2;
  addMesh(new THREE.OctahedronGeometry(.075),color==='w'?materials.whiteHero:materials.blackHero,group,0,.33,.165);
 }
 return group;
}
