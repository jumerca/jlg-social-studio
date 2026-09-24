let deferredPrompt=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const installButtons=()=>[...document.querySelectorAll('[data-install-app]')];
const installState=document.querySelector('#installState');
function setState(text){if(installState)installState.textContent=text}
function showInstallButtons(){installButtons().forEach(b=>{b.hidden=false;b.disabled=false})}
function hideInstallButtons(){installButtons().forEach(b=>b.hidden=true)}
function updateInstallUI(){if(isStandalone()){hideInstallButtons();setState('✓ JLG Creative est installée sur cet appareil.');document.documentElement.classList.add('pwa-installed');return}showInstallButtons();if(isIOS())setState('Sur iPhone/iPad : Partager → Ajouter à l’écran d’accueil.');else if(deferredPrompt)setState('Installation disponible en un clic sur cet appareil.');else setState('Sur Android : menu du navigateur → Installer l’application / Ajouter à l’écran d’accueil.')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateInstallUI()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;updateInstallUI()});
document.addEventListener('click',async e=>{const btn=e.target.closest('[data-install-app]');if(!btn)return;if(isStandalone())return updateInstallUI();if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice.catch(()=>null);if(choice?.outcome==='accepted')setState('Installation lancée…');deferredPrompt=null;updateInstallUI();return}alert(isIOS()?'Sur iPhone/iPad : appuyez sur Partager, puis « Ajouter à l’écran d’accueil ».':'Dans Chrome ou Edge : ouvrez le menu ⋮ puis choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».')});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(location.pathname+'?asset=sw',{scope:location.pathname}).catch(()=>{}))}
updateInstallUI();