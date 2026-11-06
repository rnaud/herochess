// Hand-painted reliquary piece set. The 96 px WebP is a compact painted-pixel
// variant used by the flat board; 256 px versions are used by the 3D table.
const NAMES={w:'ivory',b:'obsidian'};
const TYPES=['p','n','b','r','q','k'];
const loaded=new Map();
const paths=size=>`${import.meta.env.BASE_URL}art/pieces/`;
export function pieceArtUrl(type,color,size='pixel'){
 return `${paths(size)}${NAMES[color]}-${type}-${size==='table'?'256':'96'}.webp`;
}
export function iconArtUrl(type,color){
 return `${paths('pixel')}icon-${NAMES[color]}-${type}-160.webp`;
}
function loadImage(url){
 return new Promise(resolve=>{
  const img=new Image();img.decoding='async';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url;
 });
}
export async function preloadPieceArt(){
 if(loaded.size)return;
 await Promise.all(TYPES.flatMap(type=>['w','b'].map(async color=>{
  const img=await loadImage(pieceArtUrl(type,color,'table'));if(img)loaded.set(`${color}${type}`,img);
 })));
}
export function pieceArtCanvas(type,color){
 const img=loaded.get(`${color}${type}`);if(!img)return null;
 const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
 canvas.getContext('2d').drawImage(img,0,0);return canvas;
}
