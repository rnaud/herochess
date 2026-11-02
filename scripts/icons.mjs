// Render the existing vector identity into Android launcher icons.
import {chromium} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:512,height:512},deviceScaleFactor:1});
const svg=await readFile('public/favicon.svg','utf8');
for(const [name,size,inset] of [['icon-192',192,0],['icon-512',512,0],['maskable-512',512,110]]){
 await page.setViewportSize({width:size,height:size});await page.setContent(`<style>body{margin:0;background:#172824;display:grid;place-items:center;width:100vw;height:100vh}svg{width:${size-inset*2}px;height:${size-inset*2}px}</style>${svg}`);await page.screenshot({path:`public/icons/${name}.png`});
}await browser.close();
