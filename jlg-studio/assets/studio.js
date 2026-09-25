const API='https://wxurfggrvyggqexvjpqi.supabase.co/functions/v1/jlg-api';
const root=document.querySelector('#studioRoot');
let token=sessionStorage.getItem('jlg_token')||'';
let data=null;
let view='dashboard';
let studioPollTimer=null;
const STUDIO_SEEN_KEY='jlg_studio_seen_orders_v1';
const money=v=>{const n=Number(v||0);return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',minimumFractionDigits:Number.isInteger(n)?0:2,maximumFractionDigits:2}).format(n)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>String(Date.now()).slice(-6);
const byId=(rows,id)=>rows?.find(x=>x.id===id);
const clientName=id=>byId(data?.clients,id)?.name||'Sans client';
const projectName=id=>byId(data?.projects,id)?.name||'Sans projet';
function toast(msg,bad=false){let t=document.querySelector('#studioToast');if(!t){t=document.createElement('div');t.id='studioToast';document.body.appendChild(t)}t.textContent=msg;t.className=bad?'show bad':'show';setTimeout(()=>t.className='',2600)}
async function api(action,opts={}){const r=await fetch(`${API}?action=${encodeURIComponent(action)}`,{...opts,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`,...(opts.headers||{})}});const j=await r.json().catch(()=>({}));if(r.status===401){token='';sessionStorage.removeItem('jlg_token');renderLogin();throw Error(j.error||'Session expirée')}if(!r.ok)throw Error(j.error||'Erreur');return j}
function logout(){token='';sessionStorage.removeItem('jlg_token');data=null;renderLogin()}
function seenStudioOrders(){try{return new Set(JSON.parse(localStorage.getItem(STUDIO_SEEN_KEY)||'[]'))}catch{return new Set()}}
function saveSeenStudioOrders(ids){localStorage.setItem(STUDIO_SEEN_KEY,JSON.stringify([...new Set(ids)].slice(-300)))}
function studioSystemNotification(title,body){if('Notification' in window&&Notification.permission==='granted'){try{new Notification(title,{body,icon:'./assets/icon-192.png'})}catch{}}}
async function enableStudioNotifications(){if(!('Notification' in window))return toast('Notifications système non disponibles sur cet appareil.',true);const p=await Notification.requestPermission();toast(p==='granted'?'Notifications système activées.':'Notifications non activées.',p!=='granted')}
function announceNewOrders(rows,initial=false){const seen=seenStudioOrders(),allIds=rows.map(o=>o.id);if(!seen.size&&initial){saveSeenStudioOrders(allIds);return}const fresh=rows.filter(o=>!seen.has(o.id));fresh.forEach(o=>{toast('Nouvelle demande : '+o.pack_name);studioSystemNotification('Nouvelle demande JLG',o.name+' · '+o.pack_name)});if(fresh.length)saveSeenStudioOrders([...seen,...allIds])}
function updateStudioNotifBadge(){const b=document.querySelector('#studioNotifCount');if(!b)return;const n=(data?.orders||[]).filter(o=>o.status==='Nouvelle').length;b.hidden=!n;b.textContent=String(n)}
async function checkStudioOrders(){if(!token||document.hidden||document.querySelector('.overlay'))return;try{const next=await api('bootstrap');announceNewOrders(next.orders||[],false);data=next;if(view==='dashboard'||view==='orders')render();else updateStudioNotifBadge()}catch{}}
function startStudioPolling(){if(studioPollTimer)clearInterval(studioPollTimer);studioPollTimer=setInterval(checkStudioOrders,45000)}
function renderLogin(){root.innerHTML=`<div class="loginPage"><section class="loginCard"><div class="studioLoginBrand"><img src="./assets/brand-mark.png" alt=""><span class="studioBrandDivider"></span><span><strong>JLG</strong><small>STUDIO</small></span></div><p>ESPACE PRIVÉ</p><h1>Pilotage & production</h1><label>Mot de passe<input id="pwd" type="password" autocomplete="current-password" autofocus></label><button class="primary full" id="login">Se connecter</button><a href="../jlg-creative/">← Retour à JLG Creative</a><div id="loginErr" role="alert"></div></section></div>`;const go=async()=>{const password=document.querySelector('#pwd').value;const btn=document.querySelector('#login');btn.disabled=true;btn.textContent='Connexion…';try{const r=await fetch(API+'?action=login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const j=await r.json().catch(()=>({}));if(!r.ok)throw Error(j.error||'Erreur');token=j.token;sessionStorage.setItem('jlg_token',token);await load();}catch(e){document.querySelector('#loginErr').textContent=e.message;btn.disabled=false;btn.textContent='Se connecter'}};document.querySelector('#login').onclick=go;document.querySelector('#pwd').onkeydown=e=>{if(e.key==='Enter')go()}}
async function load(){data=await api('bootstrap');announceNewOrders(data.orders||[],true);render();startStudioPolling()}
const labels={dashboard:'Tableau de bord',orders:'Commandes & demandes',packs:'Toutes mes offres',clients:'Clients',projects:'Projets',tasks:'Production',quotes:'Devis',invoices:'Finance',settings:'Réglages'};
function nav(){return `<aside class="studioSide"><div class="studioBrand studioBrandV15"><img src="./assets/brand-mark.png" alt=""><div><strong>Studio</strong><span>JLG Creative</span></div></div><nav>${[['dashboard','Tableau de bord'],['orders','Commandes'],['packs','Toutes mes offres'],['clients','Clients'],['projects','Projets'],['tasks','Production'],['quotes','Devis'],['invoices','Finance'],['settings','Réglages']].map(([k,l])=>`<button data-view="${k}" class="${view===k?'active':''}">${l}</button>`).join('')}</nav><div class="sideFooter"><a href="../jlg-creative/">Voir JLG Creative ↗</a><button id="logout" class="sideLogout">Déconnexion</button></div></aside>`}
function createButton(){if(['clients','projects','tasks','quotes','invoices','packs'].includes(view))return `<button class="primary" id="createRecord">+ Nouveau</button>`;return ''}
function render(){root.innerHTML=`<div class="studioShell">${nav()}<main class="studioMain"><header class="studioTop"><div><p>JLG STUDIO</p><h1>${labels[view]}</h1></div><div class="studioTopActions">${createButton()}<button class="studioNotifToggle" id="studioNotifToggle" title="Notifications">🔔<b id="studioNotifCount" hidden>0</b></button><button class="secondary" id="refresh">Actualiser</button></div></header><section id="viewRoot"></section></main></div>`;document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{view=b.dataset.view;render()});document.querySelector('#refresh').onclick=()=>load().catch(e=>toast(e.message,true));document.querySelector('#studioNotifToggle').onclick=async()=>{await enableStudioNotifications();view='orders';render()};updateStudioNotifBadge();document.querySelector('#logout').onclick=logout;document.querySelector('#createRecord')?.addEventListener('click',()=>createForView());renderView()}
function renderView(){const v=document.querySelector('#viewRoot');if(view==='dashboard')return renderDashboard(v);if(view==='orders')return renderOrders(v);if(view==='packs')return renderPacks(v);if(view==='clients')return renderClients(v);if(view==='projects')return renderProjects(v);if(view==='tasks')return renderTasks(v);if(view==='quotes')return renderQuotes(v);if(view==='invoices')return renderInvoices(v);if(view==='settings')return renderSettings(v)}
function empty(text){return `<div class="empty emptyLarge">${esc(text)}</div>`}
function modal(title,body,actions=''){const overlay=document.createElement('div');overlay.className='overlay';overlay.innerHTML=`<section class="modal adminModal" role="dialog" aria-modal="true"><button class="close" aria-label="Fermer">×</button><div class="adminModalHead"><h2>${title}</h2></div>${body}<div class="dialogActions">${actions}</div></section>`;document.body.appendChild(overlay);const close=()=>overlay.remove();overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.close'))close()});document.addEventListener('keydown',function escClose(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',escClose)}});return overlay}
async function record(table,method,payload={}){return api('records',{method,body:JSON.stringify({table,...payload})})}
function opts(rows,value,label='name'){return `<option value="">—</option>`+(rows||[]).map(r=>`<option value="${esc(r.id)}" ${r.id===value?'selected':''}>${esc(r[label]||r.name||r.reference)}</option>`).join('')}
function createForView(){if(view==='packs')return editPack(null);if(view==='clients')return editClient(null);if(view==='projects')return editProject(null);if(view==='tasks')return editTask(null);if(view==='quotes')return editQuote(null);if(view==='invoices')return editInvoice(null)}
function renderDashboard(v){
  const orders=data.orders||[], projects=data.projects||[], tasks=data.tasks||[], invoices=data.invoices||[], quotes=data.quotes||[];
  const newOrders=orders.filter(o=>o.status==='Nouvelle').length;
  const activeProjects=projects.filter(p=>!['Livré','Terminé','Archivé'].includes(p.status)).length;
  const openTasks=tasks.filter(t=>t.status!=='Terminé').length;
  const paid=invoices.reduce((s,i)=>s+Number(i.paid_amount||0),0);
  const outstanding=invoices.reduce((s,i)=>s+Math.max(0,Number(i.total||0)-Number(i.paid_amount||0)),0);
  const overdue=invoices.filter(i=>i.status==='Échue'||(i.due_date&&i.due_date<today()&&Number(i.paid_amount||0)<Number(i.total||0))).length;
  const accepted=quotes.filter(q=>q.status==='Accepté').length;
  const priority=tasks.filter(t=>t.status!=='Terminé'&&t.priority==='Haute').slice(0,5);
  const recentOrders=orders.slice(0,5);
  const activeList=projects.filter(p=>!['Livré','Terminé','Archivé'].includes(p.status)).slice(0,5);
  v.innerHTML=`<section class="dashboardHero"><div><p class="eyebrow">PILOTAGE JLG CREATIVE</p><h2>Tout ce qui mérite ton attention, au même endroit.</h2><p>Demandes entrantes, production, encaissements et prochaines actions : le Studio te montre d’abord ce qui fait avancer l’activité.</p></div><div class="dashSignal"><small>À traiter maintenant</small><strong>${newOrders+overdue+priority.length}</strong><span>${newOrders} commande${newOrders!==1?'s':''} · ${overdue} facture${overdue!==1?'s':''} échue${overdue!==1?'s':''} · ${priority.length} tâche${priority.length!==1?'s':''} prioritaire${priority.length!==1?'s':''}</span></div></section>
  <div class="metrics"><article class="metric"><span>Nouvelles demandes</span><strong>${newOrders}</strong><small>À qualifier</small></article><article class="metric"><span>Projets actifs</span><strong>${activeProjects}</strong><small>${openTasks} tâche${openTasks!==1?'s':''} ouverte${openTasks!==1?'s':''}</small></article><article class="metric"><span>Encaissé</span><strong>${money(paid)}</strong><small>${accepted} devis accepté${accepted!==1?'s':''}</small></article><article class="metric"><span>À encaisser</span><strong>${money(outstanding)}</strong><small>${overdue} facture${overdue!==1?'s':''} échue${overdue!==1?'s':''}</small></article></div>
  <div class="dashGrid"><section class="dashPanel"><h3>Dernières demandes</h3><div class="dashList">${recentOrders.length?recentOrders.map(o=>`<div><span><strong>${esc(o.pack_name)}</strong><span>${esc(o.name)}${o.company?' · '+esc(o.company):''}</span></span><b>${esc(o.status)}</b></div>`).join(''):'<div><span>Aucune demande pour le moment.</span></div>'}</div></section><section class="dashPanel"><h3>Projets en cours</h3><div class="dashList">${activeList.length?activeList.map(p=>`<div><span><strong>${esc(p.name)}</strong><span>${clientName(p.client_id)} · ${esc(p.status)}</span><div class="dashProgress"><i style="width:${Math.max(0,Math.min(100,Number(p.progress||0)))}%"></i></div></span><b>${Number(p.progress||0)}%</b></div>`).join(''):'<div><span>Aucun projet actif.</span></div>'}</div></section><section class="dashPanel"><h3>Priorités production</h3><div class="dashList">${priority.length?priority.map(t=>`<div><span><strong>${esc(t.title)}</strong><span>${projectName(t.project_id)} · ${esc(t.category)}</span></span><b>${esc(t.due_label||'À faire')}</b></div>`).join(''):'<div><span>Aucune tâche haute priorité.</span></div>'}</div></section><section class="dashPanel"><h3>Finance à surveiller</h3><div class="dashList"><div><span><strong>À encaisser</strong><span>Total restant sur les factures</span></span><b>${money(outstanding)}</b></div><div><span><strong>Factures échues</strong><span>Relances à prévoir</span></span><b>${overdue}</b></div><div><span><strong>Devis acceptés</strong><span>Opportunités confirmées</span></span><b>${accepted}</b></div></div></section></div>`;
}

function orderPack(o){
  const p=(data?.packs||[]).find(p=>p.id===o.pack_id)||(data?.packs||[]).find(p=>p.name===o.pack_name);
  if(p)return p;
  if(o?.poster_details&&Object.keys(o.poster_details).length)return {deliverables:['1 fichier numérique HD prêt à imprimer au format choisi','Portrait ou paysage','1 correction légère','Signature JLG discrète'],not_included:['Impression, cadre et expédition','Formats supplémentaires','Retouches illimitées','Nouvelles versions après livraison'],delivery_format:'1 fichier numérique HD au format et à l’orientation prévus dans la demande.',revisions:'1 correction légère incluse.'};
  return null;
}
function posterFieldsHtml(o){
  const p=o?.poster_details||{};if(!Object.keys(p).length)return '';
  const f=(l,v)=>String(v||'').trim()?'<div class="briefField"><small>'+l+'</small><strong>'+esc(v)+'</strong></div>':'';
  return '<section class="requestSection posterRequestSection"><h3>Affiche personnalisée</h3><div class="briefFields">'+f('Type',p.type)+f('Sujet / lieu',p.subject)+f('Style',p.style==='Autre — préciser'?(p.other_style||p.style):p.style)+f('Format',p.format)+f('Orientation',p.orientation)+f('Titre',p.title)+f('Sous-titre',p.subtitle)+f('Couleurs',p.colors)+f('À faire apparaître',p.elements_include)+f('À éviter',p.elements_avoid)+f('Usage',p.usage)+f('Signature',p.signature===false?'Non':'Oui · JLG discrète')+'</div></section>';
}
function briefScore(o){
  const pd=o?.poster_details||{};
  if(Object.keys(pd).length){
    const fields=[pd.subject,pd.type,pd.style,pd.format,pd.orientation,pd.usage,o.name,o.email,o.deadline,pd.title,pd.colors,pd.elements_include];
    const filled=fields.filter(v=>String(v||'').trim()).length;
    return Math.round((filled/fields.length)*100);
  }
  const fields=[o.objective,o.target_audience,o.key_message,o.requested_supports,o.existing_assets,o.content_status,o.style,o.inspiration,o.constraints,o.budget,o.deadline,o.notes];
  const filled=fields.filter(v=>String(v||'').trim()).length;
  return Math.round((filled/fields.length)*100);
}
function cleanLine(label,value){return String(value||'').trim()?label+' : '+String(value).trim():''}
function buildBriefText(o){
  const p=orderPack(o);
  const options=(o.options||[]).map(x=>`- ${x.label} (+ ${money(x.price)})`).join('\n')||'- Aucune option';
  const included=(p?.deliverables||[]).map(x=>'- '+x).join('\n')||'- À confirmer au devis';
  const excluded=(p?.not_included||[]).map(x=>'- '+x).join('\n')||'- À confirmer au devis';
  const pd=o.poster_details||{};
  const poster=Object.keys(pd).length?[
    '','AFFICHE PERSONNALISÉE',cleanLine('Type',pd.type),cleanLine('Sujet / lieu',pd.subject),cleanLine('Style',pd.style==='Autre — préciser'?(pd.other_style||pd.style):pd.style),cleanLine('Format',pd.format),cleanLine('Orientation',pd.orientation),cleanLine('Titre',pd.title),cleanLine('Sous-titre',pd.subtitle),cleanLine('Couleurs',pd.colors),cleanLine('À faire apparaître',pd.elements_include),cleanLine('À éviter',pd.elements_avoid),cleanLine('Usage',pd.usage),cleanLine('Signature',pd.signature===false?'Non':'JLG discrète')
  ].filter(Boolean).join('\n'):'';
  return [
    `DEMANDE ${o.reference}`,
    `Date : ${new Date(o.created_at).toLocaleString('fr-FR')}`,
    `Statut : ${o.status}`,
    '',
    'CLIENT',
    cleanLine('Nom',o.name),cleanLine('Structure',o.company),cleanLine('E-mail',o.email),cleanLine('Téléphone',o.phone),cleanLine('Ville',o.city),cleanLine('Contact préféré',o.contact_preference),
    '',
    'OFFRE',
    cleanLine('Offre',o.pack_name),cleanLine('Prix de base',o.pack_price?money(o.pack_price):''),cleanLine('Estimation',o.estimate?money(o.estimate):''),cleanLine('Délai souhaité',o.deadline),cleanLine('Budget client',o.budget),
    '',
    'BRIEF',
    cleanLine('Objectif',o.objective),cleanLine('Public cible',o.target_audience),cleanLine('Message principal',o.key_message),cleanLine('Supports souhaités',o.requested_supports),cleanLine('Éléments disponibles',o.existing_assets),cleanLine('État des contenus',o.content_status),cleanLine('Style / ambiance',o.style),cleanLine('Inspirations',o.inspiration),cleanLine('Contraintes / à éviter',o.constraints),cleanLine('Autres précisions',o.notes),
    poster,
    '',
    'OPTIONS',options,
    '',
    'PÉRIMÈTRE DE L’OFFRE — INCLUS',included,
    '',
    'LIVRAISON',p?.delivery_format||'À confirmer au devis',
    '',
    'CORRECTIONS',p?.revisions||'À confirmer au devis',
    '',
    'NON INCLUS',excluded,
    '',
    'RÈGLE JLG',
    'La prestation est terminée à la livraison. Toute nouvelle demande ou mise à jour ultérieure fait l’objet d’un nouveau devis.'
  ].filter(x=>x!==undefined&&x!==null&&x!=='').join('\n');
}
async function copyOrderBrief(o){try{await navigator.clipboard.writeText(buildBriefText(o));toast('Récapitulatif copié.')}catch(e){toast('Copie impossible.',true)}}
function printOrderBrief(o){
  const p=orderPack(o), score=briefScore(o);
  const logo=new URL('./assets/brand-mark.png',location.href).href;
  const options=(o.options||[]).length
    ? (o.options||[]).map(x=>`<tr><td>${esc(x.label)}</td><td>${money(x.price)}</td></tr>`).join('')
    : '<tr><td colspan="2" class="mutedCell">Aucune option demandée</td></tr>';
  const list=(arr=[],negative=false)=>arr?.length
    ? `<ul class="${negative?'negative':''}">${arr.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`
    : '<p class="muted">À confirmer au devis.</p>';
  const field=(label,value,wide=false)=>String(value||'').trim()
    ? `<div class="field ${wide?'wide':''}"><span>${label}</span><strong>${esc(value)}</strong></div>`
    : '';
  const created=new Date(o.created_at).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'});
  const pd=o.poster_details||{};
  const posterPrint=Object.keys(pd).length?'<section class="section"><div class="sectionTitle"><b>★</b><h2>Affiche personnalisée</h2></div><div class="fields">'+field('Type',pd.type)+field('Sujet / lieu',pd.subject)+field('Style',pd.style==='Autre — préciser'?(pd.other_style||pd.style):pd.style)+field('Format',pd.format)+field('Orientation',pd.orientation)+field('Titre',pd.title)+field('Sous-titre',pd.subtitle)+field('Couleurs',pd.colors)+field('À faire apparaître',pd.elements_include,true)+field('À éviter',pd.elements_avoid,true)+field('Usage',pd.usage)+field('Signature',pd.signature===false?'Non':'JLG discrète')+'</div></section>':'';
  const w=window.open('','_blank','width=1050,height=900');
  if(!w)return toast('Autorisez les fenêtres pour imprimer.',true);
  w.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(o.reference)} — Fiche brief JLG</title>
<style>
@page{size:A4;margin:10mm}
*{box-sizing:border-box}
body{margin:0;background:#e9edef;color:#173042;font-family:Arial,Helvetica,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.toolbar{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:8px;padding:10px;background:#071a2a}
.toolbar button{border:0;border-radius:9px;padding:9px 14px;font-weight:800;cursor:pointer}
.toolbar .print{background:#d1a856;color:#0a2638}.toolbar .close{background:#fff;color:#173042}
.sheet{width:210mm;min-height:277mm;margin:16px auto;background:#fff;box-shadow:0 18px 45px rgba(14,32,44,.16);overflow:hidden}
.header{background:linear-gradient(135deg,#061522,#123b55);color:#fff;padding:18mm 14mm 11mm;display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
.brand{display:flex;align-items:center;gap:10px}.brand img{width:48px;height:48px;border-radius:50%;object-fit:cover}.brandText{display:grid;line-height:1}.brandText strong{font-family:Georgia,serif;font-size:24px;font-weight:500;letter-spacing:.05em}.brandText small{margin-top:4px;font-size:8px;letter-spacing:.28em;color:#e4c77e;font-weight:900}
.docTitle{text-align:right}.docTitle small{display:block;font-size:8px;letter-spacing:.12em;color:#bdcbd3;font-weight:900}.docTitle h1{font-family:Georgia,serif;font-size:24px;font-weight:500;margin:4px 0}.docTitle strong{display:block;color:#e3c57d;font-size:11px}.docTitle span{display:block;color:#c4d0d6;font-size:9px;margin-top:4px}
.body{padding:10mm 14mm 12mm}
.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-top:-17mm;margin-bottom:8mm}
.kpi{background:#fff;border:1px solid #dfe5e7;border-radius:11px;padding:10px 11px;box-shadow:0 7px 20px rgba(16,36,48,.06)}
.kpi span,.kpi strong{display:block}.kpi span{font-size:7px;text-transform:uppercase;letter-spacing:.07em;color:#7e8b92;font-weight:900}.kpi strong{font-family:Georgia,serif;font-size:16px;margin-top:3px;color:#17364b}
.scoreBar{height:4px;background:#e7ecee;border-radius:99px;overflow:hidden;margin-top:5px}.scoreBar i{display:block;height:100%;background:linear-gradient(90deg,#c69b48,#5f879f)}
.section{margin-top:8mm}.sectionTitle{display:flex;align-items:center;gap:8px;margin-bottom:4mm}.sectionTitle b{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:#0b2f47;color:#fff;font-size:9px}.sectionTitle h2{font-family:Georgia,serif;font-size:16px;font-weight:500;margin:0}.sectionTitle:after{content:"";height:1px;background:#dfe5e7;flex:1}
.twoCol{display:grid;grid-template-columns:1fr 1fr;gap:8px}.card{border:1px solid #dfe5e7;border-radius:11px;padding:11px;background:#fff}.card h3{font-family:Georgia,serif;font-size:13px;margin:0 0 7px}.card p{margin:3px 0;font-size:9px;line-height:1.45;color:#53656f}.card p strong{color:#173042}
.objective{background:#f6efe2;border:1px solid #e0d2b9;border-radius:11px;padding:11px;margin-bottom:7px}.objective span{display:block;font-size:7px;text-transform:uppercase;color:#8d692b;font-weight:900;letter-spacing:.07em}.objective strong{display:block;margin-top:4px;font-family:Georgia,serif;font-size:13px;line-height:1.4;font-weight:500}
.fields{display:grid;grid-template-columns:1fr 1fr;gap:6px}.field{background:#f7f8f8;border-radius:9px;padding:8px;min-width:0}.field.wide{grid-column:1/-1}.field span,.field strong{display:block}.field span{font-size:7px;text-transform:uppercase;color:#849198;font-weight:900;letter-spacing:.05em}.field strong{font-size:9px;line-height:1.4;margin-top:3px;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;font-size:9px}th,td{padding:7px 8px;border-bottom:1px solid #e5e9ea;text-align:left}th{background:#f5f7f7;font-size:7px;text-transform:uppercase;color:#7c8990;letter-spacing:.05em}td:last-child,th:last-child{text-align:right}.mutedCell{text-align:center!important;color:#8a969c;font-style:italic}
.scope{display:grid;grid-template-columns:1fr 1fr;gap:8px}.scopeBox{border-radius:11px;padding:10px;border:1px solid #dfe5e7}.scopeBox.included{background:#f7faf8}.scopeBox.excluded{background:#fcf8f8}.scopeBox h3{font-family:Georgia,serif;font-size:12px;margin:0 0 6px}.scopeBox ul{margin:0;padding:0;list-style:none;display:grid;gap:4px}.scopeBox li{font-size:8.5px;line-height:1.35;padding-left:14px;position:relative}.scopeBox li:before{position:absolute;left:0;top:0}.scopeBox ul:not(.negative) li:before{content:"✓";color:#3e7357;font-weight:900}.scopeBox ul.negative li:before{content:"×";color:#984b4b;font-weight:900}
.delivery{display:grid;grid-template-columns:1fr 1fr;gap:8px}.delivery .card{background:#f8f9f9}
.next{background:#0b2d43;color:#fff;border-radius:11px;padding:11px}.next h3{font-family:Georgia,serif;font-size:13px;font-weight:500;margin:0 0 7px;color:#e2c57c}.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.step{display:grid;grid-template-columns:22px 1fr;gap:6px;align-items:start}.step b{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:#d0a753;color:#0b2b3f;font-size:8px}.step span{font-size:8px;line-height:1.35;color:#c7d3d9}
.footer{margin-top:9mm;padding-top:5mm;border-top:1px solid #dfe5e7;display:flex;justify-content:space-between;gap:10px;color:#819097;font-size:7px}
.muted{color:#89969c;font-size:8px}.posterPrint{margin-top:7mm;padding-top:5mm;border-top:1px dashed #d7dee1}.posterPrint h3{font-family:Georgia,serif;font-size:13px;font-weight:500;margin:0 0 4mm}
@media print{
  body{background:#fff}
  .toolbar{display:none}
  .sheet{width:auto;min-height:auto;margin:0;box-shadow:none}
  .section,.card,.scopeBox,.objective{break-inside:avoid}
}
</style>
</head>
<body>
<div class="toolbar"><button class="print" onclick="window.print()">Imprimer / enregistrer en PDF</button><button class="close" onclick="window.close()">Fermer</button></div>
<main class="sheet">
  <header class="header">
    <div class="brand"><img src="${logo}" alt=""><div class="brandText"><strong>JLG</strong><small>STUDIO</small></div></div>
    <div class="docTitle"><small>FICHE BRIEF CLIENT</small><h1>${esc(o.pack_name)}</h1><strong>${esc(o.reference)}</strong><span>Reçue le ${created}</span></div>
  </header>
  <div class="body">
    <section class="kpis">
      <div class="kpi"><span>Statut</span><strong>${esc(o.status)}</strong></div>
      <div class="kpi"><span>Brief complété</span><strong>${score}%</strong><div class="scoreBar"><i style="width:${score}%"></i></div></div>
      <div class="kpi"><span>Estimation</span><strong>${o.estimate?money(o.estimate):'Sur devis'}</strong></div>
      <div class="kpi"><span>Date souhaitée</span><strong>${esc(o.deadline||'À définir')}</strong></div>
    </section>

    <section class="section">
      <div class="sectionTitle"><b>1</b><h2>Client & demande</h2></div>
      <div class="twoCol">
        <div class="card"><h3>Coordonnées</h3><p><strong>${esc(o.name)}</strong>${o.company?'<br>'+esc(o.company):''}</p><p>${esc(o.email)}</p><p>${esc(o.phone||'Téléphone non renseigné')}</p><p>${esc(o.city||'Ville non renseignée')}</p><p>Contact préféré : <strong>${esc(o.contact_preference||'Email')}</strong></p></div>
        <div class="card"><h3>Cadre commercial</h3><p>Offre : <strong>${esc(o.pack_name)}</strong></p><p>Prix de base : <strong>${o.pack_price?money(o.pack_price):'Sur devis'}</strong></p><p>Budget client : <strong>${esc(o.budget||'Non précisé')}</strong></p><p>Options : <strong>${(o.options||[]).length}</strong></p></div>
      </div>
    </section>

    <section class="section">
      <div class="sectionTitle"><b>2</b><h2>Brief client</h2></div>
      <div class="objective"><span>Objectif principal</span><strong>${esc(o.objective)}</strong></div>
      <div class="fields">
        ${field('Public cible',o.target_audience)}
        ${field('Message principal',o.key_message)}
        ${field('Supports souhaités',o.requested_supports,true)}
        ${field('Éléments disponibles',o.existing_assets,true)}
        ${field('État des contenus',o.content_status)}
        ${field('Style / ambiance',o.style)}
        ${field('Inspirations',o.inspiration)}
        ${field('Contraintes / à éviter',o.constraints)}
        ${field('Autres précisions',o.notes,true)}
      </div>
      ${Object.keys(o.poster_details||{}).length?`<div class="posterPrint"><h3>Détails de l’affiche</h3><div class="fields">${field('Type',o.poster_details.type)}${field('Sujet / lieu',o.poster_details.subject)}${field('Style',o.poster_details.style==='Autre — préciser'?(o.poster_details.other_style||'Autre'):o.poster_details.style)}${field('Format',o.poster_details.format)}${field('Orientation',o.poster_details.orientation)}${field('Titre',o.poster_details.title)}${field('Sous-titre',o.poster_details.subtitle)}${field('Couleurs',o.poster_details.colors)}${field('À faire apparaître',o.poster_details.elements_include,true)}${field('À éviter',o.poster_details.elements_avoid,true)}${field('Usage',o.poster_details.usage)}${field('Signature',o.poster_details.signature===false?'Non':'JLG discrète')}</div></div>`:''}
    </section>

    <section class="section">
      <div class="sectionTitle"><b>3</b><h2>Options demandées</h2></div>
      <table><thead><tr><th>Option</th><th>Montant indicatif</th></tr></thead><tbody>${options}</tbody></table>
    </section>

    <section class="section">
      <div class="sectionTitle"><b>4</b><h2>Périmètre de l’offre</h2></div>
      <div class="scope">
        <div class="scopeBox included"><h3>Inclus</h3>${list(p?.deliverables||[],false)}</div>
        <div class="scopeBox excluded"><h3>Non inclus</h3>${list(p?.not_included||[],true)}</div>
      </div>
    </section>

    <section class="section">
      <div class="sectionTitle"><b>5</b><h2>Livraison & corrections</h2></div>
      <div class="delivery">
        <div class="card"><h3>Livraison prévue</h3><p>${esc(p?.delivery_format||'À confirmer au devis.')}</p></div>
        <div class="card"><h3>Corrections prévues</h3><p>${esc(p?.revisions||'À confirmer au devis.')}</p></div>
      </div>
    </section>

    <section class="section next">
      <h3>Prochaines actions JLG</h3>
      <div class="steps"><div class="step"><b>1</b><span>Vérifier les éléments manquants et les contenus fournis.</span></div><div class="step"><b>2</b><span>Confirmer précisément périmètre, livrables et délai.</span></div><div class="step"><b>3</b><span>Préparer puis envoyer le devis détaillé.</span></div></div>
    </section>

    <footer class="footer"><span>Document interne généré depuis JLG Studio</span><span>Prestation terminée à la livraison · Toute demande ultérieure = nouveau devis</span></footer>
  </div>
</main>
</body></html>`);
  w.document.close();
}

function acknowledgeOrderModal(o){
  const defaultMessage='Bonjour '+(o.name||'')+', j’accuse réception de votre demande concernant « '+(o.pack_name||'votre projet')+' ». Je l’étudie actuellement et je reviens vers vous rapidement avec un retour ou un devis adapté. Merci pour votre confiance. — JLG Creative';
  const body='<div class="ackIntro"><span class="pill">'+esc(o.reference)+'</span><p>Ce message apparaîtra dans le suivi JLG Creative du client.</p></div><label class="ackLabel">Message au client<textarea id="ackMessage" rows="7">'+esc(o.ack_message||defaultMessage)+'</textarea></label>';
  const ov=modal('Accuser réception',body,'<button class="secondary" id="ackCancel">Annuler</button><button class="primary" id="ackSend">Envoyer l’accusé de réception</button>');
  ov.querySelector('#ackCancel').onclick=()=>ov.remove();
  ov.querySelector('#ackSend').onclick=async()=>{const btn=ov.querySelector('#ackSend'),message=ov.querySelector('#ackMessage').value.trim();if(!message)return toast('Le message ne peut pas être vide.',true);btn.disabled=true;btn.textContent='Envoi…';try{await api('acknowledge-order',{method:'POST',body:JSON.stringify({id:o.id,message})});ov.remove();toast('Accusé de réception envoyé au client.');await load()}catch(e){toast(e.message,true);btn.disabled=false;btn.textContent='Envoyer l’accusé de réception'}};
}
function renderOrders(v){
  const fresh=data.orders.filter(o=>o.status==='Nouvelle').length;
  const complete=data.orders.filter(o=>briefScore(o)>=60).length;
  v.innerHTML=`<div class="studioIntro requestIntro"><div><strong>Demandes clients</strong><p>Chaque demande devient un brief exploitable pour préparer le devis sans rechercher les informations ailleurs.</p></div><div class="requestIntroStats"><span><b>${fresh}</b><small>nouvelles</small></span><span><b>${complete}</b><small>briefs ≥ 60%</small></span></div></div><div class="orders">${data.orders.length?data.orders.map(o=>{const score=briefScore(o);return `<article class="orderRow orderRowV2"><button class="orderOpen" data-order="${o.id}" aria-label="Ouvrir ${esc(o.reference)}"><small>${esc(o.reference)} · ${new Date(o.created_at).toLocaleDateString('fr-FR')}</small><strong>${esc(o.pack_name)}</strong><span>${esc(o.name)}${o.company?' · '+esc(o.company):''}</span><p>${esc(o.objective)}</p></button><div class="briefScore"><small>Brief</small><strong>${score}%</strong><i><b style="width:${score}%"></b></i></div><span class="status">${esc(o.status)}</span><div class="orderQuickActions"><button class="ackBtn mini" data-ack-order="${o.id}" data-status="${esc(o.status)}">Accuser réception</button><button class="secondary mini" data-copy-order="${o.id}">Copier</button><button class="secondary mini" data-print-order="${o.id}">PDF</button>${o.status!=='Convertie'? `<button class="primary mini" data-convert="${o.id}">Convertir</button>`:'<b class="doneText">✓ Projet créé</b>'}</div></article>`}).join(''):empty('Aucune demande pour le moment.')}</div>`;
  document.querySelectorAll('[data-order]').forEach(b=>b.onclick=()=>orderDetail(byId(data.orders,b.dataset.order)));
  document.querySelectorAll('[data-copy-order]').forEach(b=>b.onclick=()=>copyOrderBrief(byId(data.orders,b.dataset.copyOrder)));
  document.querySelectorAll('[data-print-order]').forEach(b=>b.onclick=()=>printOrderBrief(byId(data.orders,b.dataset.printOrder)));
  document.querySelectorAll('[data-ack-order]').forEach(b=>{if(b.dataset.status!=='Nouvelle')b.hidden=true;else b.onclick=()=>acknowledgeOrderModal(byId(data.orders,b.dataset.ackOrder))});
  document.querySelectorAll('[data-convert]').forEach(b=>b.onclick=async()=>{b.disabled=true;b.textContent='Conversion…';try{await api('convert-order',{method:'POST',body:JSON.stringify({id:b.dataset.convert})});toast('Client et projet créés avec le brief complet.');await load()}catch(e){toast(e.message,true);b.disabled=false;b.textContent='Convertir'}});
}
function orderDetail(o){
  if(!o)return;
  const p=orderPack(o),score=briefScore(o);
  const options=(o.options||[]).map(x=>`<div class="briefLine"><span>${esc(x.label)}</span><strong>+ ${money(x.price)}</strong></div>`).join('')||'<p class="muted">Aucune option.</p>';
  const rows=(arr=[],type='yes')=>arr.length?`<div class="scopeList ${type}">${arr.map(x=>`<div><b>${type==='no'?'×':'✓'}</b><span>${esc(x)}</span></div>`).join('')}</div>`:'<p class="muted">À confirmer au devis.</p>';
  const field=(label,value)=>String(value||'').trim()?`<div class="briefField"><small>${label}</small><strong>${esc(value)}</strong></div>`:'';
  const actions=`<button class="secondary" data-modal-copy="${o.id}">Copier le brief</button><button class="secondary" data-modal-print="${o.id}">Imprimer / PDF</button><button class="ackBtn" data-modal-ack="${o.id}" data-status="${esc(o.status)}">Accuser réception</button>${o.status!=='Convertie'?`<button class="primary" data-modal-convert="${o.id}">Créer client + projet</button>`:''}`;
  const ov=modal(`<span class="eyebrow">${esc(o.reference)}</span>${esc(o.pack_name)}`,
  `<section class="requestHero"><div><span class="status">${esc(o.status)}</span><h3>${esc(o.name)}${o.company?' · '+esc(o.company):''}</h3><p>${esc(o.objective)}</p></div><div class="requestScore"><small>BRIEF COMPLET</small><strong>${score}%</strong><i><b style="width:${score}%"></b></i></div></section>
  <div class="requestKpis"><div><small>Estimation</small><strong>${o.estimate?money(o.estimate):'Sur devis'}</strong></div><div><small>Date souhaitée</small><strong>${esc(o.deadline||'Non précisée')}</strong></div><div><small>Budget client</small><strong>${esc(o.budget||'Non précisé')}</strong></div><div><small>Contact</small><strong>${esc(o.contact_preference||'Email')}</strong></div></div>
  <div class="requestColumns">
    <section class="requestSection"><h3>Contact</h3><div class="briefFields">${field('Nom',o.name)}${field('Structure',o.company)}${field('E-mail',o.email)}${field('Téléphone',o.phone)}${field('Ville',o.city)}</div></section>
    <section class="requestSection requestBriefMain"><h3>Brief client</h3><div class="briefFields">${field('Objectif',o.objective)}${field('Public cible',o.target_audience)}${field('Message principal',o.key_message)}${field('Supports souhaités',o.requested_supports)}${field('Éléments disponibles',o.existing_assets)}${field('État des contenus',o.content_status)}${field('Style / ambiance',o.style)}${field('Inspirations',o.inspiration)}${field('Contraintes / à éviter',o.constraints)}${field('Autres précisions',o.notes)}</div></section>
  </div>
  ${posterFieldsHtml(o)}
  <section class="requestSection"><h3>Options demandées</h3>${options}</section>
  <section class="requestScope"><div><h3>Ce que le client a choisi</h3>${rows(p?.deliverables||[],'yes')}</div><div><h3>Ce qui n’est pas inclus</h3>${rows(p?.not_included||[],'no')}</div></section>
  <section class="requestSection scopeMeta"><div><small>Livraison prévue</small><p>${esc(p?.delivery_format||'À confirmer dans le devis.')}</p></div><div><small>Corrections prévues</small><p>${esc(p?.revisions||'À confirmer dans le devis.')}</p></div></section>
  <section class="nextActions"><h3>Prochaines actions conseillées</h3><div><span>1</span><p>Vérifier les éléments manquants du brief.</p></div><div><span>2</span><p>Confirmer le périmètre et les livrables avec le client.</p></div><div><span>3</span><p>Préparer le devis avec délai et conditions.</p></div></section>`,actions);
  ov.querySelector('[data-modal-copy]')?.addEventListener('click',()=>copyOrderBrief(o));
  ov.querySelector('[data-modal-print]')?.addEventListener('click',()=>printOrderBrief(o));
  const ack=ov.querySelector('[data-modal-ack]');if(ack){if(ack.dataset.status!=='Nouvelle')ack.hidden=true;else ack.onclick=()=>{ov.remove();acknowledgeOrderModal(o)}};
  const btn=ov.querySelector('[data-modal-convert]');
  if(btn)btn.onclick=async()=>{btn.disabled=true;try{await api('convert-order',{method:'POST',body:JSON.stringify({id:o.id})});ov.remove();toast('Client et projet créés avec le brief complet.');await load()}catch(e){toast(e.message,true);btn.disabled=false}};
}
function renderPacks(v){
  const packs=data.packs||[], services=data.services||[];
  const categories=[...new Set(packs.map(p=>p.category).filter(Boolean))];
  const serviceCats=[...new Set(services.map(s=>s.category).filter(Boolean))];
  v.innerHTML=`
    <div class="studioIntro offersIntro">
      <div><strong>Toutes mes offres</strong><p>Ton référentiel commercial : prix, délai, cible, livrables, déroulement, livraison et limites de chaque offre.</p></div>
      <div class="requestIntroStats"><span><b>${packs.length}</b><small>offres</small></span><span><b>${services.length}</b><small>prestations devis</small></span></div>
    </div>
    <div class="offerTools">
      <input id="offerSearch" type="search" placeholder="Rechercher une offre, un secteur, un livrable…">
      <div class="offerFilters"><button class="active" data-offer-filter="">Toutes</button>${categories.map(c=>`<button data-offer-filter="${esc(c)}">${esc(c)}</button>`).join('')}</div>
    </div>
    <div id="offerDirectory" class="offerDirectory">
      ${packs.map(p=>`<details class="offerMemo" data-offer-text="${esc([p.name,p.category,p.description,p.ideal_for,(p.deliverables||[]).join(' ')].join(' ').toLowerCase())}" data-offer-category="${esc(p.category||'')}">
        <summary>
          <div><span class="pill">${esc(p.category||'Offre')}</span><strong>${esc(p.name)}</strong><small>${esc(p.description||'')}</small></div>
          <div class="offerMemoMeta"><b>${money(p.price)}</b><span>${esc(p.delay||'À définir')}</span></div>
        </summary>
        <div class="offerMemoBody">
          <section class="offerMemoBlock highlight"><h4>Pour qui ?</h4><p>${esc(p.ideal_for||'À préciser.')}</p></section>
          <section class="offerMemoBlock"><h4>Ce qui est inclus</h4><div class="memoList">${(p.deliverables||[]).map(x=>`<span>✓ ${esc(x)}</span>`).join('')}</div></section>
          <section class="offerMemoBlock"><h4>Ce que le client reçoit</h4><p>${esc(p.delivery_format||'À préciser.')}</p></section>
          <section class="offerMemoBlock"><h4>Déroulement</h4><ol>${(p.process||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>
          <section class="offerMemoBlock negative"><h4>Non inclus</h4><div class="memoList">${(p.not_included||[]).map(x=>`<span>× ${esc(x)}</span>`).join('')}</div></section>
          <section class="offerMemoBlock"><h4>Corrections</h4><p>${esc(p.revisions||'À préciser.')}</p></section>
          <div class="cardActions"><button class="secondary" data-editpack="${p.id}">Modifier l’offre</button></div>
        </div>
      </details>`).join('')}
    </div>
    <details class="serviceDirectory">
      <summary><div><strong>Prestations unitaires utilisées dans les devis</strong><small>Ouvre pour retrouver rapidement les tarifs de base.</small></div><span>${services.length} lignes</span></summary>
      <div class="serviceDirectoryBody">
        ${serviceCats.map(cat=>`<section><h4>${esc(cat)}</h4>${services.filter(s=>s.category===cat).map(s=>`<div class="serviceMemo"><div><strong>${esc(s.name)}</strong><small>${esc(s.description||'')}</small></div><span>${money(s.price)} / ${esc(s.unit||'unité')}</span></div>`).join('')}</section>`).join('')}
      </div>
    </details>
  `;
  const cards=[...v.querySelectorAll('.offerMemo')];
  const search=v.querySelector('#offerSearch');
  let filter='';
  const apply=()=>{const q=(search.value||'').trim().toLowerCase();cards.forEach(c=>{const okCat=!filter||c.dataset.offerCategory===filter;const okQ=!q||(c.dataset.offerText||'').includes(q);c.hidden=!(okCat&&okQ)})};
  search.oninput=apply;
  v.querySelectorAll('[data-offer-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.offerFilter||'';v.querySelectorAll('[data-offer-filter]').forEach(x=>x.classList.toggle('active',x===b));apply()});
  v.querySelectorAll('[data-editpack]').forEach(b=>b.onclick=e=>{e.preventDefault();editPack(byId(data.packs,b.dataset.editpack))});
}
function editPack(p){
  const isNew=!p;
  const o=modal(isNew?'Créer une offre':'Modifier l’offre',`<div class="formGrid packEditGrid">
  <label>Nom *<input name="name" value="${esc(p?.name||'')}"></label>
  <label>Catégorie<input name="category" value="${esc(p?.category||'')}"></label>
  <label>Prix indicatif (€)<input name="price" type="number" min="0" value="${Number(p?.price||0)}"></label>
  <label>Délai<input name="delay" value="${esc(p?.delay||'')}"></label>
  <label class="wide">Description<textarea name="description" rows="3">${esc(p?.description||'')}</textarea></label>
  <label class="wide">Pour qui ?<textarea name="ideal_for" rows="3">${esc(p?.ideal_for||'')}</textarea></label>
  <label class="wide">Livrables · un par ligne<textarea name="deliverables" rows="6">${esc((p?.deliverables||[]).join('\n'))}</textarea></label>
  <label class="wide">Ce que le client reçoit<textarea name="delivery_format" rows="3">${esc(p?.delivery_format||'')}</textarea></label>
  <label class="wide">Déroulement · une étape par ligne<textarea name="process" rows="5">${esc((p?.process||[]).join('\n'))}</textarea></label>
  <label class="wide">Ce qui n’est pas inclus · un par ligne<textarea name="not_included" rows="5">${esc((p?.not_included||[]).join('\n'))}</textarea></label>
  <label class="wide">Règle de corrections<textarea name="revisions" rows="2">${esc(p?.revisions||'')}</textarea></label>
  <label>Offre phare<select name="featured"><option value="false" ${!p?.featured?'selected':''}>Non</option><option value="true" ${p?.featured?'selected':''}>Oui</option></select></label>
  <label>Ordre phare<input name="featured_order" type="number" value="${Number(p?.featured_order||100)}"></label>
  </div>`,`<button class="primary" id="savePack">Enregistrer l’offre</button>`);
  o.querySelector('#savePack').onclick=async()=>{
    const q=n=>o.querySelector(`[name="${n}"]`).value;
    const lines=n=>q(n).split('\n').map(x=>x.trim()).filter(Boolean);
    const payload={name:q('name'),category:q('category'),price:Number(q('price')),delay:q('delay'),description:q('description'),ideal_for:q('ideal_for'),deliverables:lines('deliverables'),delivery_format:q('delivery_format'),process:lines('process'),not_included:lines('not_included'),revisions:q('revisions'),featured:q('featured')==='true',featured_order:Number(q('featured_order')||100),active:true};
    if(!payload.name.trim())return toast('Le nom est obligatoire.',true);
    try{await api('pack',{method:isNew?'POST':'PATCH',body:JSON.stringify(isNew?payload:{id:p.id,...payload})});o.remove();toast('Offre enregistrée et synchronisée.');await load()}catch(e){toast(e.message,true)}
  }
}

async function deletePack(p){if(!p||!confirm(`Supprimer le pack « ${p.name} » ?`))return;try{await api('pack',{method:'DELETE',body:JSON.stringify({id:p.id})});toast('Pack supprimé.');await load()}catch(e){toast(e.message,true)}}
function renderClients(v){v.innerHTML=`<div class="simpleList richList">${data.clients.length?data.clients.map(c=>`<article><div><strong>${esc(c.name)}</strong><small>${esc(c.activity||'Activité non précisée')}</small></div><span>${esc(c.email||'—')}</span><span>${esc(c.phone||'—')}</span><span class="status">${esc(c.status||'Actif')}</span><div class="listActions"><button class="secondary" data-editclient="${c.id}">Modifier</button><button class="dangerBtn" data-deleteclient="${c.id}">Supprimer</button></div></article>`).join(''):empty('Aucun client.')}</div>`;document.querySelectorAll('[data-editclient]').forEach(b=>b.onclick=()=>editClient(byId(data.clients,b.dataset.editclient)));document.querySelectorAll('[data-deleteclient]').forEach(b=>b.onclick=()=>removeRecord('clients',byId(data.clients,b.dataset.deleteclient),'client'))}
function editClient(c){const isNew=!c;const o=modal(isNew?'Nouveau client':'Modifier le client',`<div class="formGrid"><label>Nom / structure *<input name="name" value="${esc(c?.name||'')}"></label><label>Activité<input name="activity" value="${esc(c?.activity||'')}"></label><label>E-mail<input name="email" type="email" value="${esc(c?.email||'')}"></label><label>Téléphone<input name="phone" value="${esc(c?.phone||'')}"></label><label>Ville<input name="city" value="${esc(c?.city||'')}"></label><label>Statut<select name="status"><option>Actif</option><option ${c?.status==='Prospect'?'selected':''}>Prospect</option><option ${c?.status==='Inactif'?'selected':''}>Inactif</option></select></label><label class="wide">Notes<textarea name="notes" rows="5">${esc(c?.notes||'')}</textarea></label></div>`,`<button class="primary" id="save">Enregistrer</button>`);o.querySelector('#save').onclick=()=>saveForm(o,'clients',c,['name','activity','email','phone','city','status','notes'])}
function renderProjects(v){v.innerHTML=`<div class="simpleList richList">${data.projects.length?data.projects.map(p=>`<article><div><strong>${esc(p.name)}</strong><small>${esc(clientName(p.client_id))}</small></div><span>${esc(p.status)}</span><span>${money(p.budget)}</span><span>${esc(p.deadline||'—')}</span><div class="listActions"><button class="secondary" data-share="${p.id}">Lien client</button><button class="secondary" data-editproject="${p.id}">Modifier</button><button class="dangerBtn" data-deleteproject="${p.id}">Supprimer</button></div></article>`).join(''):empty('Aucun projet.')}</div>`;document.querySelectorAll('[data-share]').forEach(b=>b.onclick=()=>shareProject(b.dataset.share));document.querySelectorAll('[data-editproject]').forEach(b=>b.onclick=()=>editProject(byId(data.projects,b.dataset.editproject)));document.querySelectorAll('[data-deleteproject]').forEach(b=>b.onclick=()=>removeRecord('projects',byId(data.projects,b.dataset.deleteproject),'projet'))}
async function shareProject(id){try{const r=await api('share-project',{method:'POST',body:JSON.stringify({id})});const link=new URL('../jlg-creative/client.html?token='+encodeURIComponent(r.token),location.href).href;try{await navigator.clipboard.writeText(link);toast('Lien client copié.')}catch{prompt('Lien client :',link)}}catch(e){toast(e.message,true)}}
function editProject(p){const isNew=!p;const o=modal(isNew?'Nouveau projet':'Modifier le projet',`<div class="formGrid"><label class="wide">Nom du projet *<input name="name" value="${esc(p?.name||'')}"></label><label>Client<select name="client_id">${opts(data.clients,p?.client_id)}</select></label><label>Budget (€)<input name="budget" type="number" min="0" value="${Number(p?.budget||0)}"></label><label>Statut<select name="status">${['Brief','À produire','En cours','À valider','Corrections','Livré'].map(x=>`<option ${p?.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Progression (%)<input name="progress" type="number" min="0" max="100" value="${Number(p?.progress||0)}"></label><label>Date limite<input name="deadline" type="date" value="${esc(p?.deadline||'')}"></label><label class="wide">Objectif<textarea name="objective" rows="4">${esc(p?.objective||'')}</textarea></label><label class="wide">Brief<textarea name="brief" rows="6">${esc(p?.brief||'')}</textarea></label></div>`,`<button class="primary" id="save">Enregistrer</button>`);o.querySelector('#save').onclick=()=>saveForm(o,'projects',p,['name','client_id','budget','status','progress','deadline','objective','brief'],['budget','progress'])}
function renderTasks(v){const groups=['À faire','En cours','En validation','Terminé'];v.innerHTML=`<div class="taskBoard">${groups.map(g=>`<section><h3>${g}<span>${data.tasks.filter(t=>t.status===g).length}</span></h3><div>${data.tasks.filter(t=>t.status===g).map(t=>`<article class="taskCard"><span class="priority">${esc(t.priority)}</span><strong>${esc(t.title)}</strong><small>${esc(projectName(t.project_id))}</small><p>${esc(t.category)} · ${esc(t.due_label||'Sans échéance')}</p><div class="cardActions"><button class="secondary" data-edittask="${t.id}">Modifier</button><button class="dangerBtn" data-deletetask="${t.id}">Supprimer</button></div></article>`).join('')||'<p class="muted">Aucune tâche.</p>'}</div></section>`).join('')}</div>`;document.querySelectorAll('[data-edittask]').forEach(b=>b.onclick=()=>editTask(byId(data.tasks,b.dataset.edittask)));document.querySelectorAll('[data-deletetask]').forEach(b=>b.onclick=()=>removeRecord('tasks',byId(data.tasks,b.dataset.deletetask),'tâche'))}
function editTask(t){const isNew=!t;const o=modal(isNew?'Nouvelle tâche':'Modifier la tâche',`<div class="formGrid"><label class="wide">Titre *<input name="title" value="${esc(t?.title||'')}"></label><label>Projet<select name="project_id">${opts(data.projects,t?.project_id)}</select></label><label>Statut<select name="status">${['À faire','En cours','En validation','Terminé'].map(x=>`<option ${t?.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Priorité<select name="priority">${['Basse','Normale','Haute','Urgente'].map(x=>`<option ${t?.priority===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Catégorie<input name="category" value="${esc(t?.category||'Admin')}"></label><label class="wide">Échéance / repère<input name="due_label" value="${esc(t?.due_label||'')}"></label></div>`,`<button class="primary" id="save">Enregistrer</button>`);o.querySelector('#save').onclick=()=>saveForm(o,'tasks',t,['title','project_id','status','priority','category','due_label'])}

function futureDate(days=30){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
function normalizeQuoteItems(items=[]){return (items||[]).map((x,i)=>({id:x.id||('line-'+i+'-'+uid()),label:x.label||'',description:x.description||'',category:x.category||'',unit:x.unit||'unité',qty:Number(x.qty||1),unit_price:Number(x.unit_price??x.price??0),total:Number(x.total??(Number(x.qty||1)*Number(x.unit_price??x.price??0)))}))}
function quoteNumbers(items,discountPercent=0,depositPercent=30){
  items.forEach(x=>x.total=Math.max(0,Number(x.qty||0))*Math.max(0,Number(x.unit_price||0)));
  const subtotal=items.reduce((s,x)=>s+Number(x.total||0),0);
  const discount=Math.round((subtotal*Math.max(0,Math.min(100,Number(discountPercent||0)))/100)*100)/100;
  const total=Math.max(0,subtotal-discount);
  const deposit=Math.round((total*Math.max(0,Math.min(100,Number(depositPercent||0)))/100)*100)/100;
  return {subtotal,discount,total,deposit};
}
function printQuote(q){
  const client=byId(data.clients,q.client_id), project=byId(data.projects,q.project_id);
  const items=normalizeQuoteItems(q.items);
  const n=quoteNumbers(items,q.discount_percent,q.deposit_percent);
  const rows=items.map(x=>`<tr><td><strong>${esc(x.label)}</strong><small>${esc(x.description||'')}</small></td><td>${esc(x.unit||'')}</td><td>${x.qty}</td><td>${money(x.unit_price)}</td><td>${money(x.total)}</td></tr>`).join('');
  const w=window.open('','_blank','width=1000,height=850');if(!w)return toast('Autorisez les fenêtres pour afficher le devis.',true);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(q.reference)}</title><style>body{font-family:Arial,sans-serif;color:#173042;max-width:900px;margin:32px auto;padding:0 22px}h1,h2{font-family:Georgia,serif}.head{display:flex;justify-content:space-between;gap:30px;border-bottom:3px solid #c79b45;padding-bottom:16px}.muted{color:#6d7b84;font-size:12px}.client{background:#f5f2eb;padding:14px;border-radius:12px;margin:20px 0}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left;vertical-align:top}th{text-transform:uppercase;font-size:9px;color:#78858c}td small{display:block;color:#78858c;margin-top:3px}.totals{margin-left:auto;width:330px;margin-top:18px}.totals div{display:flex;justify-content:space-between;padding:6px}.totals .grand{font-size:19px;font-weight:bold;border-top:2px solid #173042}.note{margin-top:24px;padding:14px;background:#f7f5f0;border-radius:10px;white-space:pre-wrap;font-size:11px;line-height:1.5}@media print{body{margin:0}}</style></head><body>
  <div class="head"><div><h1>JLG Creative</h1><div class="muted">Communication · Design · Supports professionnels</div></div><div><h2>Devis</h2><strong>${esc(q.reference)}</strong><div class="muted">Valable jusqu’au ${esc(q.valid_until||'—')}</div></div></div>
  <div class="client"><strong>${esc(client?.name||'Client à préciser')}</strong><div>${esc(client?.email||'')} ${client?.phone?' · '+esc(client.phone):''}</div>${project?'<div>Projet : '+esc(project.name)+'</div>':''}</div>
  <table><thead><tr><th>Prestation</th><th>Unité</th><th>Qté</th><th>Prix unit.</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals"><div><span>Sous-total</span><strong>${money(n.subtotal)}</strong></div><div><span>Remise (${Number(q.discount_percent||0)}%)</span><strong>- ${money(n.discount)}</strong></div><div class="grand"><span>Total</span><strong>${money(n.total)}</strong></div><div><span>Acompte (${Number(q.deposit_percent||0)}%)</span><strong>${money(n.deposit)}</strong></div></div>
  <div class="note">${esc(q.notes||'')}</div><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close()
}

function renderQuotes(v){
  const total=data.quotes.reduce((s,q)=>s+Number(q.total||0),0);
  const drafts=data.quotes.filter(q=>q.status==='Brouillon').length;
  v.innerHTML=`<div class="studioIntro quoteIntro"><div><strong>Devis détaillés</strong><p>Sélectionne tes prestations, ajuste quantité et prix, puis génère un devis lisible et précis.</p></div><div class="requestIntroStats"><span><b>${data.quotes.length}</b><small>devis</small></span><span><b>${drafts}</b><small>brouillons</small></span></div></div>
  <div class="quoteList">${data.quotes.length?data.quotes.map(q=>`<article class="quoteRow"><div><small>${esc(q.reference)}</small><strong>${esc(clientName(q.client_id))}</strong><span>${q.project_id?esc(projectName(q.project_id)):'Sans projet lié'}</span></div><div class="quoteLines"><b>${(q.items||[]).length}</b><small>ligne${(q.items||[]).length!==1?'s':''}</small></div><span class="status">${esc(q.status)}</span><div class="quoteAmount"><strong>${money(q.total)}</strong><small>Acompte ${money(q.deposit_amount||0)}</small></div><div class="listActions"><button class="secondary" data-printquote="${q.id}">Aperçu / PDF</button><button class="secondary" data-editquote="${q.id}">Modifier</button><button class="primary mini" data-invoicequote="${q.id}">Facturer</button><button class="dangerBtn" data-deletequote="${q.id}">Supprimer</button></div></article>`).join(''):empty('Aucun devis.')}</div>`;
  v.querySelectorAll('[data-editquote]').forEach(b=>b.onclick=()=>editQuote(byId(data.quotes,b.dataset.editquote)));
  v.querySelectorAll('[data-printquote]').forEach(b=>b.onclick=()=>printQuote(byId(data.quotes,b.dataset.printquote)));
  v.querySelectorAll('[data-invoicequote]').forEach(b=>b.onclick=()=>invoiceQuote(b.dataset.invoicequote));
  v.querySelectorAll('[data-deletequote]').forEach(b=>b.onclick=()=>removeRecord('quotes',byId(data.quotes,b.dataset.deletequote),'devis'));
}
function editQuote(q){
  const isNew=!q, services=data.services||[], packs=data.packs||[];
  let items=normalizeQuoteItems(q?.items||[]);
  const o=modal(isNew?'Nouveau devis':'Modifier le devis',`
    <div class="quoteBuilder">
      <section class="quoteSetup">
        <div class="formGrid quoteSetupGrid">
          <label>Référence<input name="reference" value="${esc(q?.reference||'DEV-'+today().slice(2).replaceAll('-','')+'-'+uid())}"></label>
          <label>Statut<select name="status">${['Brouillon','Envoyé','Accepté','Refusé'].map(x=>`<option ${q?.status===x?'selected':''}>${x}</option>`).join('')}</select></label>
          <label>Client<select name="client_id">${opts(data.clients,q?.client_id)}</select></label>
          <label>Projet<select name="project_id">${opts(data.projects,q?.project_id)}</select></label>
          <label>Valable jusqu’au<input name="valid_until" type="date" value="${esc(q?.valid_until||futureDate(30))}"></label>
          <label>Acompte (%)<input name="deposit_percent" type="number" min="0" max="100" value="${Number(q?.deposit_percent??30)}"></label>
          <label>Remise (%)<input name="discount_percent" type="number" min="0" max="100" value="${Number(q?.discount_percent||0)}"></label>
          <label class="wide">Conditions / notes<textarea name="notes" rows="3">${esc(q?.notes||'Prestation terminée à la livraison. Une série de corrections groupées est incluse lorsqu’elle est prévue dans l’offre. Toute demande supplémentaire après validation ou livraison fait l’objet d’un nouveau devis.')}</textarea></label>
        </div>
      </section>
      <div class="quoteWorkspace">
        <aside class="quoteCatalog">
          <div class="quoteCatalogHead"><div><strong>Ajouter des prestations</strong><small>Les prix restent modifiables dans le devis.</small></div><input id="serviceSearch" type="search" placeholder="Rechercher…"></div>
          <div class="quotePackAdder"><select id="packAdder"><option value="">Ajouter une offre complète…</option>${packs.map(p=>`<option value="${p.id}">${esc(p.name)} · ${money(p.price)}</option>`).join('')}</select><button class="secondary" id="addPack">Ajouter</button></div>
          <div id="servicePicker" class="servicePicker"></div>
          <button class="secondary full" id="addCustomLine">+ Ligne libre</button>
        </aside>
        <section class="quoteCart">
          <div class="quoteCartHead"><strong>Contenu du devis</strong><small>Modifie quantité ou prix directement.</small></div>
          <div id="quoteItems" class="quoteItems"></div>
          <div class="quoteTotals">
            <div><span>Sous-total</span><strong id="qSubtotal">0 €</strong></div>
            <div><span>Remise</span><strong id="qDiscount">0 €</strong></div>
            <div class="grand"><span>Total</span><strong id="qTotal">0 €</strong></div>
            <div><span>Acompte</span><strong id="qDeposit">0 €</strong></div>
          </div>
        </section>
      </div>
    </div>`,
    `<button class="secondary" id="previewQuote">Aperçu / PDF</button><button class="primary" id="saveQuote">Enregistrer le devis</button>`
  );
  o.querySelector('.modal').classList.add('quoteBuilderModal');
  const servicePicker=o.querySelector('#servicePicker'), itemRoot=o.querySelector('#quoteItems'), search=o.querySelector('#serviceSearch');
  const discountInput=o.querySelector('[name="discount_percent"]'), depositInput=o.querySelector('[name="deposit_percent"]');
  function renderServices(){
    const qv=(search.value||'').trim().toLowerCase();
    const filtered=services.filter(s=>!qv||[s.name,s.category,s.description].join(' ').toLowerCase().includes(qv));
    const cats=[...new Set(filtered.map(s=>s.category))];
    servicePicker.innerHTML=cats.map(cat=>`<section><h4>${esc(cat)}</h4>${filtered.filter(s=>s.category===cat).map(s=>`<button class="servicePick" data-addservice="${s.id}"><span><strong>${esc(s.name)}</strong><small>${esc(s.description||'')}</small></span><b>${money(s.price)}</b></button>`).join('')}</section>`).join('')||'<p class="muted">Aucune prestation trouvée.</p>';
  }
  function renderItems(){
    if(!items.length)itemRoot.innerHTML='<div class="empty quoteEmpty">Ajoute une prestation ou une offre complète.</div>';
    else itemRoot.innerHTML=items.map((x,i)=>`<article class="quoteItem" data-line="${i}"><div class="quoteItemTitle"><span class="pill">${esc(x.category||'Prestation')}</span><input data-line-label="${i}" value="${esc(x.label)}"><textarea data-line-desc="${i}" rows="2" placeholder="Précision facultative">${esc(x.description||'')}</textarea></div><label>Qté<input data-line-qty="${i}" type="number" min="0" step="1" value="${Number(x.qty||1)}"></label><label>Prix unit.<input data-line-price="${i}" type="number" min="0" step="0.01" value="${Number(x.unit_price||0)}"></label><div class="lineTotal"><small>Total</small><strong>${money(Number(x.qty||0)*Number(x.unit_price||0))}</strong></div><button class="lineRemove" data-remove-line="${i}" aria-label="Supprimer">×</button></article>`).join('');
    calc();
  }
  function calc(){
    const n=quoteNumbers(items,discountInput.value,depositInput.value);
    o.querySelector('#qSubtotal').textContent=money(n.subtotal);
    o.querySelector('#qDiscount').textContent='- '+money(n.discount);
    o.querySelector('#qTotal').textContent=money(n.total);
    o.querySelector('#qDeposit').textContent=money(n.deposit);
    return n;
  }
  search.oninput=renderServices;
  servicePicker.addEventListener('click',e=>{const b=e.target.closest('[data-addservice]');if(!b)return;const s=services.find(x=>x.id===b.dataset.addservice);if(!s)return;items.push({id:s.id+'-'+uid(),label:s.name,description:s.description,category:s.category,unit:s.unit,qty:1,unit_price:Number(s.price),total:Number(s.price)});renderItems()});
  o.querySelector('#addPack').onclick=()=>{const id=o.querySelector('#packAdder').value,p=packs.find(x=>x.id===id);if(!p)return toast('Choisis une offre.',true);items.push({id:'pack-'+p.id+'-'+uid(),label:p.name,description:[p.description,'Inclus : '+(p.deliverables||[]).join(', ')].join('\n'),category:'Offre complète',unit:'pack',qty:1,unit_price:Number(p.price),total:Number(p.price)});renderItems()};
  o.querySelector('#addCustomLine').onclick=()=>{items.push({id:'custom-'+uid(),label:'Prestation personnalisée',description:'',category:'Sur mesure',unit:'prestation',qty:1,unit_price:0,total:0});renderItems()};
  itemRoot.addEventListener('input',e=>{const i=Number(e.target.dataset.lineQty??e.target.dataset.linePrice??e.target.dataset.lineLabel??e.target.dataset.lineDesc);if(!Number.isInteger(i)||!items[i])return;if(e.target.dataset.lineQty!==undefined)items[i].qty=Number(e.target.value||0);if(e.target.dataset.linePrice!==undefined)items[i].unit_price=Number(e.target.value||0);if(e.target.dataset.lineLabel!==undefined)items[i].label=e.target.value;if(e.target.dataset.lineDesc!==undefined)items[i].description=e.target.value;renderItems()});
  itemRoot.addEventListener('click',e=>{const b=e.target.closest('[data-remove-line]');if(!b)return;items.splice(Number(b.dataset.removeLine),1);renderItems()});
  discountInput.oninput=calc;depositInput.oninput=calc;
  function payload(){
    const n=calc(), val=name=>o.querySelector(`[name="${name}"]`).value;
    return {reference:val('reference'),status:val('status'),client_id:val('client_id')||null,project_id:val('project_id')||null,valid_until:val('valid_until')||null,discount_percent:Number(val('discount_percent')||0),discount_amount:n.discount,deposit_percent:Number(val('deposit_percent')||0),deposit_amount:n.deposit,subtotal:n.subtotal,total:n.total,notes:val('notes'),items};
  }
  o.querySelector('#previewQuote').onclick=()=>printQuote(payload());
  o.querySelector('#saveQuote').onclick=async()=>{if(!items.length)return toast('Ajoute au moins une prestation au devis.',true);const btn=o.querySelector('#saveQuote');btn.disabled=true;try{const p=payload();await record('quotes',isNew?'POST':'PATCH',isNew?{record:p}:{id:q.id,record:p});o.remove();toast('Devis enregistré.');await load()}catch(e){toast(e.message,true);btn.disabled=false}};
  renderServices();renderItems();
}

async function invoiceQuote(id){try{const r=await api('quote-to-invoice',{method:'POST',body:JSON.stringify({id})});toast(r.existing?'Facture déjà créée.':'Facture créée.');view='invoices';await load()}catch(e){toast(e.message,true)}}
function renderInvoices(v){const billed=data.invoices.reduce((s,i)=>s+Number(i.total||0),0),paid=data.invoices.reduce((s,i)=>s+Number(i.paid_amount||0),0);v.innerHTML=`<div class="financeKpis"><div><span>Facturé</span><strong>${money(billed)}</strong></div><div><span>Encaissé</span><strong>${money(paid)}</strong></div><div><span>À encaisser</span><strong>${money(Math.max(0,billed-paid))}</strong></div></div><div class="simpleList richList">${data.invoices.length?data.invoices.map(i=>`<article><div><strong>${esc(i.reference)}</strong><small>${esc(clientName(i.client_id))}${i.project_id?' · '+esc(projectName(i.project_id)):''}</small></div><span class="status">${esc(i.status)}</span><span>${money(i.total)}</span><span>Payé ${money(i.paid_amount)}</span><div class="listActions"><button class="secondary" data-editinvoice="${i.id}">Modifier</button>${Number(i.paid_amount||0)<Number(i.total||0)?`<button class="primary mini" data-paidinvoice="${i.id}">Marquer payée</button>`:''}<button class="dangerBtn" data-deleteinvoice="${i.id}">Supprimer</button></div></article>`).join(''):empty('Aucune facture.')}</div>`;document.querySelectorAll('[data-editinvoice]').forEach(b=>b.onclick=()=>editInvoice(byId(data.invoices,b.dataset.editinvoice)));document.querySelectorAll('[data-paidinvoice]').forEach(b=>b.onclick=()=>markPaid(byId(data.invoices,b.dataset.paidinvoice)));document.querySelectorAll('[data-deleteinvoice]').forEach(b=>b.onclick=()=>removeRecord('invoices',byId(data.invoices,b.dataset.deleteinvoice),'facture'))}
function editInvoice(i){const isNew=!i;const o=modal(isNew?'Nouvelle facture':'Modifier la facture',`<div class="formGrid"><label>Référence<input name="reference" value="${esc(i?.reference||'FAC-'+today().slice(2).replaceAll('-','')+'-'+uid())}"></label><label>Statut<select name="status">${['Brouillon','Envoyée','Partiellement payée','Payée','Échue'].map(x=>`<option ${i?.status===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Client<select name="client_id">${opts(data.clients,i?.client_id)}</select></label><label>Projet<select name="project_id">${opts(data.projects,i?.project_id)}</select></label><label>Total (€)<input name="total" type="number" min="0" step="0.01" value="${Number(i?.total||0)}"></label><label>Encaissé (€)<input name="paid_amount" type="number" min="0" step="0.01" value="${Number(i?.paid_amount||0)}"></label><label>Date d'émission<input name="issue_date" type="date" value="${esc(i?.issue_date||today())}"></label><label>Échéance<input name="due_date" type="date" value="${esc(i?.due_date||'')}"></label></div>`,`<button class="primary" id="save">Enregistrer</button>`);o.querySelector('#save').onclick=()=>saveForm(o,'invoices',i,['reference','status','client_id','project_id','total','paid_amount','issue_date','due_date'],['total','paid_amount'])}
async function markPaid(i){if(!i)return;try{await record('invoices','PATCH',{id:i.id,record:{reference:i.reference,status:'Payée',client_id:i.client_id,project_id:i.project_id,total:Number(i.total||0),paid_amount:Number(i.total||0),issue_date:i.issue_date,due_date:i.due_date}});toast('Facture marquée payée.');await load()}catch(e){toast(e.message,true)}}
function renderSettings(v){v.innerHTML=`<div class="settingsGrid"><article><h3>Sécurité du Studio</h3><p>Change le mot de passe temporaire avant la diffusion publique. La modification déconnecte les anciennes sessions.</p><label>Nouveau mot de passe<input id="newPassword" type="password" autocomplete="new-password" placeholder="10 caractères minimum"></label><button class="primary" id="changePassword">Changer le mot de passe</button></article><article><h3>Application</h3><p>JLG Creative utilise Supabase pour les données et une PWA installable pour les clients.</p><button class="secondary" id="settingsLogout">Déconnexion</button></article></div>`;document.querySelector('#settingsLogout').onclick=logout;document.querySelector('#changePassword').onclick=async()=>{const password=document.querySelector('#newPassword').value;if(password.length<10)return toast('10 caractères minimum.',true);try{await api('change-password',{method:'POST',body:JSON.stringify({password})});toast('Mot de passe modifié. Reconnexion nécessaire.');setTimeout(logout,900)}catch(e){toast(e.message,true)}}}
async function saveForm(o,table,current,fields,numeric=[]){const record={};for(const f of fields){const el=o.querySelector(`[name="${f}"]`);record[f]=numeric.includes(f)?Number(el?.value||0):(el?.value||'')}try{await record(table,current?'PATCH':'POST',current?{id:current.id,record}:{record});o.remove();toast('Enregistré.');await load()}catch(e){toast(e.message,true)}}
async function removeRecord(table,row,label){if(!row||!confirm(`Supprimer ce ${label} ?`))return;try{await record(table,'DELETE',{id:row.id});toast('Supprimé.');await load()}catch(e){toast(e.message,true)}}
if(!token)renderLogin();else load().catch(e=>{if(token)toast(e.message,true)});
