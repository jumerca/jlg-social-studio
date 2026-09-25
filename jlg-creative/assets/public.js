const API='https://wxurfggrvyggqexvjpqi.supabase.co/functions/v1/jlg-api';
const money=v=>{const n=Number(v||0);return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2}).format(n)};
const root=document.querySelector('#packsRoot'),featuredRoot=document.querySelector('#featuredRoot'),modal=document.querySelector('#modalRoot'),toast=document.querySelector('#toast');

const CLIENT_REQUESTS_KEY='jlg_creative_requests_v2';
const posterTypes=[
  {key:'ville',label:'Ville / voyage'},
  {key:'paysage',label:'Paysage / nature'},
  {key:'patrimoine',label:'Patrimoine / architecture'},
  {key:'sport',label:'Sport'},
  {key:'humour',label:'Humoristique'},
  {key:'pro',label:'Entreprise / activité / lieu'},
  {key:'event',label:'Événement / souvenir'},
  {key:'autre',label:'Autre thème'}
];
const posterFormats=[
  {key:'A5',label:'A5 · 14,8 × 21 cm',price:4.90},
  {key:'A4',label:'A4 · 21 × 29,7 cm',price:6.90},
  {key:'A3',label:'A3 · 29,7 × 42 cm',price:8.90},
  {key:'50x70',label:'50 × 70 cm',price:11.90}
];
const posterStyles=['Vintage minimaliste','Rétro touristique','Illustration moderne','Élégant / premium','Humoristique','Sport dynamique','Nature / paysage','Architecture / patrimoine','Pop / coloré','Épuré / contemporain','Autre — préciser'];
function getTrackedRequests(){try{return JSON.parse(localStorage.getItem(CLIENT_REQUESTS_KEY)||'[]')}catch{return []}}
function setTrackedRequests(rows){localStorage.setItem(CLIENT_REQUESTS_KEY,JSON.stringify(rows.slice(0,12)))}
function trackRequest(j,packName){
  if(!j?.token)return;
  const rows=getTrackedRequests().filter(x=>x.token!==j.token);
  const now=new Date().toISOString();
  rows.unshift({token:j.token,reference:j.reference,packName,createdAt:now,lastSeenAt:now,lastNotifiedAt:now,status:'Nouvelle',updates:[]});
  setTrackedRequests(rows);
}
function clientSystemNotification(title,body){
  if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body,icon:'./assets/icon-192.png'})}catch{}}
}
async function enableClientNotifications(){
  if(!('Notification' in window))return showToast('Les notifications système ne sont pas disponibles sur cet appareil.',true);
  const p=await Notification.requestPermission();
  showToast(p==='granted'?'Notifications activées.':'Notifications non activées.',p!=='granted');
}
async function checkClientUpdates(){
  const rows=getTrackedRequests();
  if(!rows.length){updateClientNotifBadge(0);return rows}
  const checked=await Promise.all(rows.map(async r=>{
    try{
      const d=await fetchJSON(API+'?action=request-status&token='+encodeURIComponent(r.token));
      const updates=d.updates||[];
      const unseen=updates.filter(u=>new Date(u.created_at)>new Date(r.lastSeenAt||r.createdAt||0));
      const unnotified=updates.filter(u=>new Date(u.created_at)>new Date(r.lastNotifiedAt||r.createdAt||0));
      if(unnotified.length){
        const last=unnotified[unnotified.length-1];
        clientSystemNotification(last.title||'JLG Creative',last.message||'Votre demande a été mise à jour.');
        r.lastNotifiedAt=last.created_at;
      }
      return {...r,status:d.order?.status||r.status,updates,unseenCount:unseen.length};
    }catch{return r}
  }));
  setTrackedRequests(checked);
  updateClientNotifBadge(checked.reduce((s,r)=>s+Number(r.unseenCount||0),0));
  return checked;
}
function updateClientNotifBadge(n){
  const badge=document.querySelector('#clientNotifBadge');
  if(!badge)return;
  badge.hidden=!n;badge.textContent=String(n||0);
}
async function showClientNotifications(){
  const rows=await checkClientUpdates();
  const body=rows.length?rows.map(r=>`<article class="clientTrackCard"><div class="trackHead"><div><small>${esc(r.reference||'Demande')}</small><strong>${esc(r.packName||'Projet')}</strong></div><span class="status">${esc(r.status||'En cours')}</span></div><div class="trackTimeline">${(r.updates||[]).map(u=>`<div><b></b><span><strong>${esc(u.title)}</strong><small>${new Date(u.created_at).toLocaleString('fr-FR')}</small><p>${esc(u.message)}</p></span></div>`).join('')||'<p class="muted">Votre demande a bien été envoyée. JLG vous répondra depuis ce suivi.</p>'}</div></article>`).join(''):'<div class="empty">Aucune demande suivie sur cet appareil pour le moment.</div>';
  const {box,close}=mountDialog(`<button class="close" aria-label="Fermer">×</button><div class="trackModalHead"><p class="kicker">VOTRE SUIVI</p><h2>Notifications JLG Creative</h2><p>Les demandes envoyées depuis cet appareil sont regroupées ici.</p></div><div class="trackCards">${body}</div><div class="dialogActions"><button class="secondary" id="enableClientNotif">Activer les notifications système</button><button class="primary" id="trackClose">Fermer</button></div>`);
  box.classList.add('trackModal');
  box.querySelector('.close').onclick=close;box.querySelector('#trackClose').onclick=close;box.querySelector('#enableClientNotif').onclick=enableClientNotifications;
  const now=new Date().toISOString();setTrackedRequests(rows.map(r=>({...r,lastSeenAt:now,unseenCount:0})));updateClientNotifBadge(0);
}

const extras=[['support','Support supplémentaire simple',75],['social','Lot de 5 visuels réseaux supplémentaires',99],['document','Document supplémentaire simple',89],['format','Déclinaison de format supplémentaire',40]];
let packs=[];
let featured=[];
const findPack=id=>packs.find(x=>x.id===id);
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function showToast(t,bad=false){toast.textContent=t;toast.className=bad?'show bad':'show';setTimeout(()=>toast.className='',2800);}
async function fetchJSON(url,opts={}){const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),15000);try{const r=await fetch(url,{...opts,signal:ctrl.signal});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'Erreur');return j}finally{clearTimeout(timer)}}
async function load(){try{const j=await fetchJSON(API+'?action=catalog');packs=(j.packs||[]).filter(p=>p.active!==false);featured=packs.filter(p=>p.featured).sort((a,b)=>Number(a.featured_order||100)-Number(b.featured_order||100));renderFeatured();renderPacks();}catch(e){featuredRoot.innerHTML='<div class="empty emptyLarge">Les offres ne peuvent pas être chargées pour le moment.</div>';root.innerHTML='';}}
function featuredCard(p,i){return `<article class="featuredCard"><div class="featuredTop"><span class="featuredIcon">${i===0?'◉':i===1?'✦':'▤'}</span><span class="pill">${esc(p.category||'Offre')}</span></div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><div class="featuredDelay"><small>Délai indicatif</small><strong>${esc(p.delay||'À définir')}</strong></div><div class="featuredPrice"><small>À partir de</small><strong>${money(p.price)}</strong></div><div class="featuredActions"><button class="secondary" data-detail="${p.id}">Détails</button><button class="primary" data-order="${p.id}">Demander</button></div></article>`;}
function renderFeatured(){if(!featured.length){featuredRoot.innerHTML='<div class="empty emptyLarge">Les offres phares sont en cours de préparation.</div>';return}featuredRoot.innerHTML=featured.map(featuredCard).join('');}
function renderPacks(){const others=packs.filter(p=>!p.featured);if(!others.length){root.innerHTML='<div class="empty emptyLarge">Les offres métiers sont en cours de préparation.</div>';return}root.innerHTML=others.map(p=>`<article class="sectorCard"><div><span class="pill">${esc(p.category||'Pack')}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p></div><div class="sectorMeta"><span><small>Délai</small><strong>${esc(p.delay||'À définir')}</strong></span><span><small>À partir de</small><strong>${money(p.price)}</strong></span></div><div class="sectorActions"><button class="secondary" data-detail="${p.id}">Voir le détail</button><button class="primary" data-order="${p.id}">Demander</button></div></article>`).join('');}
function mountDialog(html){modal.innerHTML=`<div class="overlay"><section class="modal" role="dialog" aria-modal="true">${html}</section></div>`;const box=modal.querySelector('.modal');setTimeout(()=>box?.querySelector('button,input,textarea,select')?.focus(),20);const close=()=>{modal.innerHTML=''};modal.querySelector('.overlay').addEventListener('mousedown',e=>{if(e.target.classList.contains('overlay'))close()});const escClose=e=>{if(e.key==='Escape'){close();document.removeEventListener('keydown',escClose)}};document.addEventListener('keydown',escClose);return {box,close};}
function listRows(items=[],type='yes'){if(!items?.length)return '<p class="muted">À préciser selon le projet.</p>';return `<div class="detailList ${type}">${items.map(x=>`<div><span aria-hidden="true">${type==='no'?'×':'✓'}</span><span>${esc(x)}</span></div>`).join('')}</div>`;}
function processRows(items=[]){if(!items?.length)return '';return `<ol class="detailProcess">${items.map(x=>`<li><span>${esc(x)}</span></li>`).join('')}</ol>`;}
function detail(p){const {box,close}=mountDialog(`<button class="close" aria-label="Fermer">×</button>
<div class="modalHero"><span class="pill">${esc(p.category||'Pack')}</span><h2>${esc(p.name)}</h2><p>${esc(p.description||'')}</p></div>
<div class="meta"><div><small>Délai indicatif</small><strong>${esc(p.delay||'À définir')}</strong></div><div><small>Budget indicatif</small><strong>${p.price?money(p.price):'Sur devis'}</strong></div></div>
<div class="detailBody">
  <section class="detailBlock highlight"><h3>Pour qui ?</h3><p>${esc(p.ideal_for||'Cette offre est ajustée selon votre activité et votre besoin.')}</p></section>
  <section class="detailBlock"><h3>Ce qui est inclus</h3>${listRows(p.deliverables||[],'yes')}</section>
  <section class="detailBlock"><h3>Ce que vous recevez</h3><p>${esc(p.delivery_format||'Les fichiers finaux prêts à utiliser sont livrés à la fin de la prestation.')}</p></section>
  <section class="detailBlock"><h3>Comment ça se passe</h3>${processRows(p.process||[])}</section>
  <section class="detailBlock"><h3>Ce qui n’est pas inclus</h3>${listRows(p.not_included||[],'no')}</section>
  <section class="detailBlock"><h3>Corrections</h3><p>${esc(p.revisions||'Une série de corrections groupées est incluse.')}</p></section>
  <div class="turnkeyModal"><strong>Prestation terminée à la livraison</strong><span>Le délai commence lorsque tous les éléments nécessaires ont été reçus. Après livraison, vous utilisez les supports en autonomie. Toute nouvelle demande ou mise à jour ultérieure fait l’objet d’un nouveau devis.</span></div>
</div>
<button class="primary full" data-order="${p.id}">Demander ce pack →</button>`);
box.querySelector('.close').onclick=close;box.querySelector('[data-order]').onclick=()=>{close();order(p)}}
function validEmail(v){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())}
function order(pack){let step=1,opts=[];const state={name:'',company:'',email:'',phone:'',city:'',objective:'',deadline:'',budget:'',style:'',notes:'',targetAudience:'',keyMessage:'',existingAssets:'',contentStatus:'',constraints:'',inspiration:'',requestedSupports:'',website:'',contactPreference:'Email'};let dialog=null;function capture(){dialog?.box.querySelectorAll('input,textarea,select').forEach(el=>{if(el.name)state[el.name]=el.value})}function draw(){const estimate=Number(pack.price||0)+opts.reduce((s,k)=>s+(extras.find(x=>x[0]===k)?.[2]||0),0);let body='';if(step===1)body=`<h3>Vos coordonnées</h3><p>Pour préparer le devis et vous recontacter.</p><div class="formGrid"><label>Nom / prénom *<input name="name" required autocomplete="name" value="${esc(state.name)}"></label><label>Structure<input name="company" autocomplete="organization" value="${esc(state.company)}"></label><label>E-mail *<input name="email" required type="email" autocomplete="email" value="${esc(state.email)}"></label><label>Téléphone<input name="phone" autocomplete="tel" value="${esc(state.phone)}"></label><label>Ville<input name="city" autocomplete="address-level2" value="${esc(state.city)}"></label><label class="hp" aria-hidden="true">Site web<input name="website" tabindex="-1" autocomplete="off"></label><label>Contact préféré<select name="contactPreference"><option>Email</option><option ${state.contactPreference==='Téléphone'?'selected':''}>Téléphone</option></select></label></div>`;if(step===2)body=`<h3>Votre besoin</h3><p>Donnez-nous l’essentiel. Les précisions supplémentaires restent facultatives.</p><div class="formGrid"><label class="wide">Objectif du projet *<textarea name="objective" required rows="4" placeholder="Ex. lancer mon activité, préparer un événement, refaire ma communication…">${esc(state.objective)}</textarea></label><label>Date souhaitée<input name="deadline" type="date" value="${esc(state.deadline)}"></label><label>Budget envisagé<input name="budget" value="${esc(state.budget)}" placeholder="Ex. 500 à 800 €"></label><label class="wide">Style / ambiance<input name="style" value="${esc(state.style)}" placeholder="Moderne, chaleureux, premium, sportif…"></label></div><details class="briefExtras"><summary>Ajouter des précisions utiles <small>facultatif</small></summary><div class="formGrid briefExtrasGrid"><label class="wide">À qui vous adressez-vous ?<input name="targetAudience" value="${esc(state.targetAudience)}" placeholder="Ex. familles, entreprises locales, licenciés du club…"></label><label class="wide">Message principal à faire passer<input name="keyMessage" value="${esc(state.keyMessage)}" placeholder="Ce que le public doit comprendre ou retenir"></label><label class="wide">Supports que vous imaginez<textarea name="requestedSupports" rows="3" placeholder="Ex. flyer A5, affiche, dossier PDF, visuels Instagram…">${esc(state.requestedSupports)}</textarea></label><label class="wide">Éléments déjà disponibles<textarea name="existingAssets" rows="3" placeholder="Logo, photos, textes, ancienne brochure, charte…">${esc(state.existingAssets)}</textarea></label><label>État des contenus<select name="contentStatus"><option value="">Non précisé</option><option ${state.contentStatus==='Tout est prêt'?'selected':''}>Tout est prêt</option><option ${state.contentStatus==='Une partie est prête'?'selected':''}>Une partie est prête</option><option ${state.contentStatus==='J’ai surtout les informations brutes'?'selected':''}>J’ai surtout les informations brutes</option></select></label><label>Références / inspirations<input name="inspiration" value="${esc(state.inspiration)}" placeholder="Styles ou exemples appréciés"></label><label class="wide">Contraintes / choses à éviter<textarea name="constraints" rows="3" placeholder="Couleurs interdites, mentions obligatoires, contraintes de format…">${esc(state.constraints)}</textarea></label><label class="wide">Autres précisions<textarea name="notes" rows="3">${esc(state.notes)}</textarea></label></div></details>`;if(step===3)body=`<h3>Options utiles</h3><p>Facultatives. Elles servent uniquement à affiner votre demande.</p><div class="options">${extras.map(([k,l,p])=>`<button type="button" class="option ${opts.includes(k)?'active':''}" data-opt="${k}"><b>${opts.includes(k)?'✓':'+'}</b><span><strong>${l}</strong><small>+ ${money(p)}</small></span></button>`).join('')}</div>`;if(step===4)body=`<h3>Récapitulatif</h3><div class="summary"><div><small>Offre</small><strong>${esc(pack.name)}</strong></div><div><small>Demandeur</small><strong>${esc(state.name)}${state.company?' · '+esc(state.company):''}</strong></div><div><small>Objectif</small><strong>${esc(state.objective)}</strong></div><div><small>Estimation indicative</small><strong>${estimate?money(estimate):'Sur devis'}</strong></div><div><small>Options</small><strong>${opts.length?opts.map(k=>esc(extras.find(x=>x[0]===k)?.[1])).join(', '):'Aucune'}</strong></div></div><div class="info successInfo">Aucun paiement n’est demandé. Cette demande donnera lieu à un devis avant engagement.</div><p class="privacyNote">En envoyant votre demande, vous autorisez JLG Creative à utiliser ces informations pour vous répondre et préparer votre projet. <a href="./legal.html" target="_blank" rel="noopener">Confidentialité</a>.</p>`;if(dialog)dialog.close();dialog=mountDialog(`<button class="close" aria-label="Fermer">×</button><div class="orderHead"><div><span class="pill">${esc(pack.category||'Projet')}</span><h2>${esc(pack.name)}</h2></div><div class="dots" aria-label="Étape ${step} sur 4">${[1,2,3,4].map(n=>`<b class="${step>=n?'on':''}">${n}</b>`).join('')}</div></div><div class="orderBody">${body}</div><div class="orderNav">${step>1?'<button class="secondary" id="back">← Retour</button>':'<span></span>'}${step<4?'<button class="primary" id="next">Continuer →</button>':'<button class="primary" id="send">Envoyer ma demande</button>'}</div>`);dialog.box.classList.add('orderModal');dialog.box.querySelector('.close').onclick=dialog.close;dialog.box.querySelectorAll('input,textarea,select').forEach(el=>el.addEventListener('input',()=>state[el.name]=el.value));dialog.box.querySelectorAll('[data-opt]').forEach(btn=>btn.onclick=()=>{capture();const k=btn.dataset.opt;opts=opts.includes(k)?opts.filter(x=>x!==k):[...opts,k];draw()});dialog.box.querySelector('#back')?.addEventListener('click',()=>{capture();step--;draw()});dialog.box.querySelector('#next')?.addEventListener('click',()=>{capture();if(step===1&&(!state.name.trim()||!validEmail(state.email)))return showToast('Nom et e-mail valide sont obligatoires.',true);if(step===2&&!state.objective.trim())return showToast('Décrivez l’objectif du projet.',true);step++;draw()});dialog.box.querySelector('#send')?.addEventListener('click',async e=>{capture();const send=e.currentTarget;send.disabled=true;send.textContent='Envoi…';const payload={packId:String(pack.id||'').startsWith('featured-')?'':(pack.id||''),packName:pack.name,packPrice:Number(pack.price||0),estimate,options:opts.map(k=>{const x=extras.find(e=>e[0]===k);return {key:x[0],label:x[1],price:x[2]}}),...state};try{const j=await fetchJSON(API+'?action=order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});trackRequest(j,pack.name);dialog.close();dialog=mountDialog(`<div class="successModal"><div class="check">✓</div><h2>Demande envoyée</h2><p>Votre demande a bien été transmise.</p><div class="ref"><small>Référence</small><strong>${esc(j.reference)}</strong></div><p class="muted">Vous pourrez suivre ici l’accusé de réception et les prochaines mises à jour.</p><div class="dialogActions"><button class="secondary" id="successTrack">Voir mon suivi</button><button class="primary closeFinal">Terminer</button></div></div>`);dialog.box.querySelector('.closeFinal').onclick=dialog.close;dialog.box.querySelector('#successTrack').onclick=()=>{dialog.close();showClientNotifications()};checkClientUpdates()}catch(e){showToast(e.name==='AbortError'?'Le serveur met trop de temps à répondre.':e.message||'Erreur lors de l’envoi',true);send.disabled=false;send.textContent='Envoyer ma demande'}})}draw()}

function posterOrder(){
  let step=1;
  const state={name:'',company:'',email:'',phone:'',city:'',contactPreference:'Email',type:'ville',subject:'',style:'Vintage minimaliste',otherStyle:'',format:'A4',orientation:'Portrait',title:'',subtitle:'',colors:'',elementsInclude:'',elementsAvoid:'',usage:'Décoration / souvenir',deadline:'',notes:'',website:''};
  let dialog=null;
  const currentType=()=>posterTypes.find(x=>x.key===state.type)||posterTypes[0];
  const currentFormat=()=>posterFormats.find(x=>x.key===state.format)||posterFormats[1];
  function capture(){dialog?.box.querySelectorAll('input,textarea,select').forEach(el=>{if(el.name)state[el.name]=el.value})}
  function draw(){
    const type=currentType(),fmt=currentFormat();
    let body='';
    if(step===1)body=`<h3>Vos coordonnées</h3><p>Pour préparer la proposition et vous recontacter.</p><div class="formGrid"><label>Nom / prénom *<input name="name" required value="${esc(state.name)}"></label><label>Structure<input name="company" value="${esc(state.company)}"></label><label>E-mail *<input name="email" type="email" required value="${esc(state.email)}"></label><label>Téléphone<input name="phone" value="${esc(state.phone)}"></label><label>Ville<input name="city" value="${esc(state.city)}"></label><label class="hp">Site web<input name="website" tabindex="-1"></label><label>Contact préféré<select name="contactPreference"><option>Email</option><option ${state.contactPreference==='Téléphone'?'selected':''}>Téléphone</option></select></label></div>`;
    if(step===2)body=`<h3>Votre affiche</h3><p>Plus les indications sont précises, plus la première proposition sera proche de votre idée.</p><div class="formGrid posterFormGrid">
      <label class="wide">Type d’affiche<select name="type">${posterTypes.map(x=>`<option value="${x.key}" ${state.type===x.key?'selected':''}>${x.label}</option>`).join('')}</select></label>
      <label class="wide">Ville, lieu, sport, thème ou sujet *<input name="subject" required value="${esc(state.subject)}" placeholder="Ex. Toulon, stade Mayol, rugby, bord de mer…"></label>
      <label>Style<select name="style">${posterStyles.map(x=>`<option ${state.style===x?'selected':''}>${x}</option>`).join('')}</select></label>
      <label class="${state.style==='Autre — préciser'?'':'posterOtherHidden'}">Autre style à préciser<input name="otherStyle" value="${esc(state.otherStyle)}" placeholder="Décrivez l’ambiance souhaitée"></label>
      <label>Format<select name="format">${posterFormats.map(x=>`<option value="${x.key}" ${state.format===x.key?'selected':''}>${x.label} — ${money(x.price)}</option>`).join('')}</select></label>
      <label>Orientation<select name="orientation"><option ${state.orientation==='Portrait'?'selected':''}>Portrait</option><option ${state.orientation==='Paysage'?'selected':''}>Paysage</option></select></label>
      <label class="wide">Titre à afficher<input name="title" value="${esc(state.title)}" placeholder="Ex. TOULON"></label>
      <label class="wide">Sous-titre / phrase<input name="subtitle" value="${esc(state.subtitle)}" placeholder="Facultatif"></label>
      <label class="wide">Couleurs souhaitées<input name="colors" value="${esc(state.colors)}" placeholder="Ex. bleu marine, rouge, tons pastel…"></label>
      <label class="wide">Éléments à faire apparaître<textarea name="elementsInclude" rows="3" placeholder="Monuments, paysage, personnage, objet, ambiance…">${esc(state.elementsInclude)}</textarea></label>
      <label class="wide">Éléments à éviter<textarea name="elementsAvoid" rows="2">${esc(state.elementsAvoid)}</textarea></label>
      <label>Usage<select name="usage"><option ${state.usage==='Décoration / souvenir'?'selected':''}>Décoration / souvenir</option><option ${state.usage==='Cadeau'?'selected':''}>Cadeau</option><option ${state.usage==='Communication professionnelle'?'selected':''}>Communication professionnelle</option><option ${state.usage==='Événement'?'selected':''}>Événement</option></select></label>
      <label>Date souhaitée<input name="deadline" type="date" value="${esc(state.deadline)}"></label>
      <label class="wide">Autres précisions<textarea name="notes" rows="3">${esc(state.notes)}</textarea></label>
    </div>`;
    if(step===3)body=`<h3>Récapitulatif</h3><div class="summary posterSummary"><div><small>Type</small><strong>${esc(type.label)}</strong></div><div><small>Sujet</small><strong>${esc(state.subject)}</strong></div><div><small>Style</small><strong>${esc(state.style==='Autre — préciser'?(state.otherStyle||'Autre'):state.style)}</strong></div><div><small>Format</small><strong>${esc(fmt.label)} · ${esc(state.orientation)}</strong></div><div><small>Tarif</small><strong>${money(fmt.price)}</strong></div><div><small>Livraison</small><strong>1 fichier numérique HD · 1 correction légère</strong></div></div><div class="info successInfo">Aucun paiement immédiat. JLG vérifie votre demande et vous confirme le projet avant création.</div>`;
    if(dialog)dialog.close();
    dialog=mountDialog(`<button class="close" aria-label="Fermer">×</button><div class="orderHead"><div><span class="pill">Affiche personnalisée</span><h2>Créer votre affiche</h2></div><div class="dots">${[1,2,3].map(n=>`<b class="${step>=n?'on':''}">${n}</b>`).join('')}</div></div><div class="orderBody">${body}</div><div class="orderNav">${step>1?'<button class="secondary" id="back">← Retour</button>':'<span></span>'}${step<3?'<button class="primary" id="next">Continuer →</button>':'<button class="primary" id="send">Envoyer ma demande</button>'}</div>`);
    dialog.box.classList.add('orderModal','posterOrderModal');
    dialog.box.querySelector('.close').onclick=dialog.close;
    dialog.box.querySelectorAll('input,textarea,select').forEach(el=>el.addEventListener('input',()=>{state[el.name]=el.value;if(el.name==='style'||el.name==='type'){capture();draw()}}));
    dialog.box.querySelector('#back')?.addEventListener('click',()=>{capture();step--;draw()});
    dialog.box.querySelector('#next')?.addEventListener('click',()=>{capture();if(step===1&&(!state.name.trim()||!validEmail(state.email)))return showToast('Nom et e-mail valide sont obligatoires.',true);if(step===2&&!state.subject.trim())return showToast('Précisez le sujet de l’affiche.',true);step++;draw()});
    dialog.box.querySelector('#send')?.addEventListener('click',async e=>{
      capture();const btn=e.currentTarget;btn.disabled=true;btn.textContent='Envoi…';const t=currentType(),f=currentFormat();
      const posterDetails={type:t.label,subject:state.subject,style:state.style,otherStyle:state.otherStyle,format:f.label,orientation:state.orientation,title:state.title,subtitle:state.subtitle,colors:state.colors,elementsInclude:state.elementsInclude,elementsAvoid:state.elementsAvoid,usage:state.usage,signature:true};
      const payload={packId:'',packName:'Affiche personnalisée · '+f.label+' · '+t.label,packPrice:f.price,estimate:f.price,name:state.name,company:state.company,email:state.email,phone:state.phone,city:state.city,contactPreference:state.contactPreference,objective:'Création d’une affiche personnalisée : '+state.subject,deadline:state.deadline,budget:money(f.price),style:state.style==='Autre — préciser'?state.otherStyle:state.style,notes:state.notes,requestedSupports:f.label+' · '+state.orientation,targetAudience:'',keyMessage:state.title,existingAssets:'',contentStatus:'',constraints:state.elementsAvoid,inspiration:'',website:state.website,options:[],posterDetails};
      try{
        const j=await fetchJSON(API+'?action=order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        trackRequest(j,payload.packName);dialog.close();
        dialog=mountDialog(`<div class="successModal"><div class="check">✓</div><h2>Demande d’affiche envoyée</h2><p>JLG a reçu votre brief détaillé.</p><div class="ref"><small>Référence</small><strong>${esc(j.reference)}</strong></div><p class="muted">Vous pourrez suivre l’accusé de réception directement dans JLG Creative.</p><div class="dialogActions"><button class="secondary" id="posterTrack">Voir mon suivi</button><button class="primary closeFinal">Terminer</button></div></div>`);
        dialog.box.querySelector('.closeFinal').onclick=dialog.close;dialog.box.querySelector('#posterTrack').onclick=()=>{dialog.close();showClientNotifications()};checkClientUpdates();
      }catch(err){showToast(err.message||'Erreur lors de l’envoi',true);btn.disabled=false;btn.textContent='Envoyer ma demande'}
    });
  }
  draw();
}

document.addEventListener('click',e=>{const detailBtn=e.target.closest('[data-detail]'),orderBtn=e.target.closest('[data-order]'),custom=e.target.closest('[data-custom]'),poster=e.target.closest('[data-poster-order]');if(detailBtn){const p=findPack(detailBtn.dataset.detail);if(p)detail(p)}if(orderBtn){const p=findPack(orderBtn.dataset.order);if(p)order(p)}if(custom)order({id:'',name:'Création sur mesure',category:'Sur mesure',description:'Création ponctuelle livrée sous forme de fichiers ou supports prêts à utiliser.',price:0,delay:'À définir',deliverables:[]});if(poster)posterOrder()});
const menuBtn=document.querySelector('#menuBtn'),nav=document.querySelector('#mainNav');menuBtn.onclick=()=>{const open=nav.classList.toggle('open');menuBtn.setAttribute('aria-expanded',String(open));menuBtn.textContent=open?'×':'☰'};nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');menuBtn.textContent='☰'}));
const clientNotifBtn=document.querySelector('#clientNotifBtn');if(clientNotifBtn)clientNotifBtn.onclick=showClientNotifications;
setTimeout(()=>checkClientUpdates(),800);setInterval(()=>{if(!document.hidden)checkClientUpdates()},60000);
const shareSite=document.querySelector('#shareSite');if(shareSite)shareSite.onclick=async()=>{const payload={title:'JLG Creative',text:'Découvrez JLG Creative : communication, design, supports professionnels et affiches personnalisées.',url:new URL('./index.html',location.href).href};try{if(navigator.share)await navigator.share(payload);else{await navigator.clipboard.writeText(payload.url);showToast('Lien JLG Creative copié.')}}catch(e){if(e?.name!=='AbortError')showToast('Impossible de partager pour le moment.',true)}};
load();
