let deferredPrompt=null;
const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const ios=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const buttons=()=>[...document.querySelectorAll('[data-install-app],[data-install]')];
function update(){buttons().forEach(b=>b.hidden=standalone())}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;update()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;update()});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-install-app],[data-install]');if(!b)return;if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice.catch(()=>null);deferredPrompt=null;update();return}alert(ios()?'Sur iPhone/iPad : Partager → Ajouter à l’écran d’accueil.':'Dans Chrome ou Edge : menu ⋮ → Installer l’application / Ajouter à l’écran d’accueil.')});
if('serviceWorker'in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}))}
update();