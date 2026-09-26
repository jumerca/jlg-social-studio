let deferredPrompt=null;
const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent);
const installButtons=()=>[...document.querySelectorAll('[data-install-app]')];
const installStates=()=>[...document.querySelectorAll('[data-install-state]')];
function setState(text){installStates().forEach(el=>el.textContent=text)}
function showInstallButtons(){installButtons().forEach(b=>{b.hidden=false;b.disabled=false})}
function hideInstallButtons(){installButtons().forEach(b=>b.hidden=true)}
function updateInstallUI(){if(isStandalone()){showInstallButtons();installButtons().forEach(b=>{b.disabled=true;b.textContent='JLG Studio installé'});setState('✓ JLG Studio est installé sur cet appareil.');document.documentElement.classList.add('pwa-installed');return}showInstallButtons();installButtons().forEach(b=>{b.disabled=false;if(b.classList.contains('mobileInstallAction'))b.textContent='Installer JLG Studio sur ce téléphone';else if(b.classList.contains('sideInstall')||b.classList.contains('loginInstall'))b.textContent='Installer JLG Studio'});if(isIOS())setState('Sur iPhone/iPad : Partager → Ajouter à l’écran d’accueil.');else if(deferredPrompt)setState('Installation disponible en un clic sur cet appareil.');else setState('Sur Android : menu du navigateur → Installer JLG Studio / Ajouter à l’écran d’accueil.')}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;updateInstallUI()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;updateInstallUI()});
document.addEventListener('click',async e=>{const btn=e.target.closest('[data-install-app]');if(!btn)return;if(isStandalone())return updateInstallUI();if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice.catch(()=>null);if(choice?.outcome==='accepted')setState('Installation lancée…');deferredPrompt=null;updateInstallUI();return}alert(isIOS()?'Sur iPhone/iPad : appuyez sur Partager, puis « Ajouter à l’écran d’accueil ».':'Dans Chrome ou Edge : ouvrez le menu ⋮ puis choisissez « Installer JLG Studio » ou « Ajouter à l’écran d’accueil ».')});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{}))}
document.addEventListener('jlg:rendered',updateInstallUI);
updateInstallUI();