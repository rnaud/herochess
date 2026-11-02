export function setupInstall(){
 const button=document.getElementById('install-button'),status=document.getElementById('offline-status');let prompt=null;
 const installed=()=>matchMedia('(display-mode: standalone)').matches;
 button.hidden=installed();
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();prompt=event;button.hidden=false;});
 window.addEventListener('appinstalled',()=>{prompt=null;button.hidden=true;});
 button.onclick=async()=>{
  if(prompt){const pending=prompt;prompt=null;await pending.prompt();const result=await pending.userChoice;if(result.outcome==='accepted')button.hidden=true;}
  else document.getElementById('install-dialog').showModal();
 };
 if(import.meta.env.PROD&&'serviceWorker' in navigator){
  status.textContent='Preparing offline play…';
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).then(async registration=>{
   registration.installing?.addEventListener('statechange',event=>{if(event.target.state==='redundant')status.textContent='Offline setup incomplete. Reopen online to retry.';});
   await navigator.serviceWorker.ready;status.textContent=navigator.onLine?'Ready for offline play':'Offline · ready to play';
   const update=()=>{if(registration.waiting)status.textContent='Update ready · close all game windows and reopen to update';};update();registration.addEventListener('updatefound',()=>registration.installing?.addEventListener('statechange',update));
  }).catch(()=>{status.textContent='Offline setup unavailable. Reopen online to retry.';});
  window.addEventListener('offline',()=>{status.textContent=navigator.serviceWorker.controller?'Offline · ready to play':'Offline · open online once to enable offline play';});
  window.addEventListener('online',()=>{status.textContent=navigator.serviceWorker.controller?'Ready for offline play':'Preparing offline play…';});
 }else status.textContent='Offline play becomes available after opening the published game online.';
}
