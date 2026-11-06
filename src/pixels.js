import {PIXEL_PIECES,PIXEL_PALETTES,PIXEL_SIZE} from './pixel-pieces.js';
import {pieceArtUrl,pieceArtCanvas} from './piece-art.js';

const canvases=new Map();

export function pixelCanvas(type,color){
 const art=pieceArtCanvas(type,color);if(art)return art;
 const key=color+type;if(canvases.has(key))return canvases.get(key);
 const rows=PIXEL_PIECES[color][type],palette=PIXEL_PALETTES[color];
 const canvas=document.createElement('canvas');canvas.width=PIXEL_SIZE;canvas.height=PIXEL_SIZE;
 const ctx=canvas.getContext('2d');
 for(let y=0;y<PIXEL_SIZE;y++)for(let x=0;x<PIXEL_SIZE;x++){
  const ch=rows[y][x];if(ch==='.')continue;
  const index=ch==='o'?0:ch==='g'?6:Number(ch)+1;
  ctx.fillStyle=palette[index];ctx.fillRect(x,y,1,1);
 }
 canvases.set(key,canvas);return canvas;
}

export function pixelUrl(type,color){return pieceArtUrl(type,color,'pixel');}
