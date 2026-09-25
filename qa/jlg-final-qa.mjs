import { chromium } from 'playwright';

const CREATIVE='https://jumerca.github.io/jlg-social-studio/jlg-creative/';
const STUDIO='https://jumerca.github.io/jlg-social-studio/jlg-studio/';
const API='https://wxurfggrvyggqexvjpqi.supabase.co/functions/v1/jlg-api';

const results=[]; let failures=0;
function pass(name,detail=''){results.push({status:'PASS',name,detail});}
function fail(name,detail=''){failures++;results.push({status:'FAIL',name,detail});}
async function check(name,fn){try{const d=await fn();pass(name,d||'')}catch(e){fail(name,e?.message||String(e))}}
function assert(c,m='Assertion failed'){if(!c)throw new Error(m)}
async function clearOverlays(page){
  const close=page.locator('.overlay .close');
  while(await close.count()){await close.last().click({force:true}).catch(()=>{});await page.waitForTimeout(10)}
  await page.evaluate(()=>document.querySelectorAll('.overlay').forEach(x=>x.remove()));
}
async function watchErrors(page,label){const e=[];page.on('pageerror',x=>e.push('pageerror: '+x.message));page.on('console',m=>{if(m.type()==='error')e.push('console: '+m.text())});return()=>{if(e.length)throw new Error(label+': '+e.join(' | '))}}

const fakePacks=[
{id:'p1',name:'Pack Essentiel',category:'Communication',price:349,delay:'5 à 7 jours ouvrés',description:'Base de communication',ideal_for:'Petites structures',deliverables:['Direction visuelle','Flyer','5 visuels'],delivery_format:'PDF + PNG/JPG',not_included:['Impression'],process:['Brief','Création','Livraison'],revisions:'1 série',featured:true,featured_order:10,active:true},
{id:'p2',name:'Pack Identité & Visuels',category:'Image de marque',price:590,delay:'7 à 10 jours ouvrés',description:'Identité légère',ideal_for:'Créateurs',deliverables:['Logo','Palette'],delivery_format:'Fichiers finaux',not_included:['Dépôt de marque'],process:['Brief','Création'],revisions:'1 série',featured:true,featured_order:20,active:true},
{id:'p3',name:'Pack Dossier & Présentation Pro',category:'Documents professionnels',price:349,delay:'7 à 10 jours ouvrés',description:'Dossier pro',ideal_for:'Pros',deliverables:['8 à 12 pages'],delivery_format:'PDF',not_included:['Impression'],process:['Brief','Mise en page'],revisions:'1 série',featured:true,featured_order:30,active:true},
{id:'p4',name:'Kit Réseaux Sociaux',category:'Réseaux sociaux',price:349,delay:'5 à 7 jours ouvrés',description:'Kit social',ideal_for:'TPE',deliverables:['10 visuels'],delivery_format:'PNG/JPG',not_included:['Publication'],process:['Brief','Création'],revisions:'1 série',active:true},
{id:'p5',name:'Pack Association',category:'Association',price:349,delay:'7 à 10 jours ouvrés',description:'Pack asso',ideal_for:'Associations',deliverables:['Affiche'],delivery_format:'PDF',not_included:['Impression'],process:['Brief'],revisions:'1 série',active:true},
{id:'p6',name:'Pack Commerce Local',category:'Commerce',price:349,delay:'7 à 10 jours ouvrés',description:'Pack commerce',ideal_for:'Commerces',deliverables:['Flyer'],delivery_format:'PDF',not_included:['Distribution'],process:['Brief'],revisions:'1 série',active:true},
{id:'p7',name:'Pack Club Sportif',category:'Sport',price:490,delay:'8 à 12 jours ouvrés',description:'Pack club',ideal_for:'Clubs',deliverables:['Dossier sponsoring'],delivery_format:'PDF',not_included:['Prospection'],process:['Brief'],revisions:'1 série',active:true},
{id:'p8',name:'Pack Événement',category:'Événementiel',price:590,delay:'10 à 15 jours ouvrés',description:'Pack événement',ideal_for:'Organisateurs',deliverables:['Affiche','Programme'],delivery_format:'PDF',not_included:['Jour J'],process:['Brief'],revisions:'1 série',active:true},
{id:'p9',name:'Pack Restaurant & Menu',category:'Restauration',price:390,delay:'8 à 12 jours ouvrés',description:'Pack restaurant',ideal_for:'Restaurants',deliverables:['Menu'],delivery_format:'PDF',not_included:['Impression'],process:['Brief'],revisions:'1 série',active:true},
{id:'p10',name:'Pack Hôtel & Hébergement',category:'Hôtellerie',price:790,delay:'12 à 18 jours ouvrés',description:'Pack hôtel',ideal_for:'Hôtels',deliverables:['Brochure'],delivery_format:'PDF',not_included:['Site'],process:['Brief'],revisions:'1 série',active:true}
];
const fakeServices=[
{id:'s1',category:'Identité visuelle',name:'Logo simple / évolution de logo',description:'Logo simple',unit:'prestation',price:220,active:true,sort_order:10},
{id:'s2',category:'Supports imprimés',name:'Flyer simple',description:'Flyer',unit:'support',price:90,active:true,sort_order:20},
{id:'s3',category:'Réseaux sociaux',name:'5 visuels réseaux sociaux',description:'5 visuels',unit:'lot',price:99,active:true,sort_order:30},
{id:'s4',category:'Affiches personnalisées',name:'Affiche numérique A4',description:'Fichier HD',unit:'fichier',price:6.9,active:true,sort_order:40}
];
const fakeData={
 orders:[
  {id:'o1',reference:'CMD-QA-001',status:'Nouvelle',pack_id:'p1',pack_name:'Pack Essentiel',pack_price:349,estimate:349,name:'Client QA',company:'Société QA',email:'qa@example.com',phone:'0600000000',city:'Brive',objective:'Tester la demande',deadline:'2026-10-10',budget:'349 €',style:'Moderne',notes:'RAS',target_audience:'Familles',key_message:'Message QA',existing_assets:'Logo',content_status:'Une partie est prête',constraints:'Aucune',inspiration:'Sobre',requested_supports:'Flyer',contact_preference:'Email',options:[],created_at:'2026-09-25T08:00:00Z',poster_details:{}},
  {id:'o2',reference:'CMD-QA-002',status:'Accusée',pack_id:null,pack_name:'Affiche personnalisée · A4 · Ville / voyage',pack_price:6.9,estimate:6.9,name:'Client Affiche',company:'',email:'poster@example.com',phone:'',city:'Toulon',objective:'Affiche Toulon',deadline:'2026-10-12',budget:'6,90 €',style:'Vintage minimaliste',notes:'',target_audience:'',key_message:'TOULON',existing_assets:'',content_status:'',constraints:'',inspiration:'',requested_supports:'A4 · Portrait',contact_preference:'Email',options:[],created_at:'2026-09-25T08:02:00Z',poster_details:{type:'Ville / voyage',subject:'Toulon',style:'Vintage minimaliste',format:'A4 · 21 × 29,7 cm',orientation:'Portrait',title:'TOULON',colors:'Bleu',elements_include:'Port',elements_avoid:'',usage:'Décoration / souvenir',signature:true}}
 ],
 packs:fakePacks,
 clients:[{id:'c1',name:'Client QA',activity:'Commerce',email:'qa@example.com',phone:'0600000000',city:'Brive',status:'Actif',notes:''}],
 projects:[{id:'pr1',name:'Projet QA',client_id:'c1',budget:349,status:'En cours',progress:40,deadline:'2026-10-20',objective:'Objectif QA',brief:'Brief QA',review_token:'review-qa'}],
 tasks:[{id:'t1',title:'Préparer le devis',project_id:'pr1',status:'À faire',priority:'Haute',category:'Commercial',due_label:'Aujourd’hui'},{id:'t2',title:'Créer le flyer',project_id:'pr1',status:'En cours',priority:'Normale',category:'Production',due_label:'Cette semaine'}],
 quotes:[{id:'q1',reference:'DEV-QA-001',status:'Brouillon',client_id:'c1',project_id:'pr1',subtotal:90,discount_percent:0,discount_amount:0,deposit_percent:30,deposit_amount:27,total:90,valid_until:'2026-10-25',notes:'Conditions QA',items:[{id:'li1',label:'Flyer simple',description:'Flyer QA',category:'Supports imprimés',unit:'support',qty:1,unit_price:90,total:90}]}],
 invoices:[{id:'i1',reference:'FAC-QA-001',status:'Envoyée',client_id:'c1',project_id:'pr1',total:90,paid_amount:30,issue_date:'2026-09-25',due_date:'2026-10-25'}],
 prospects:[],content:[],validations:[],deliveries:[],services:fakeServices
};

const browser=await chromium.launch({headless:true});

// CREATIVE DESKTOP LIVE
{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}); const errors=await watchErrors(page,'Creative desktop');
 await check('Creative HTTP 200',async()=>{const r=await page.goto(CREATIVE,{waitUntil:'networkidle'});assert(r?.ok(),'HTTP '+r?.status());return page.title()});
 await check('Creative critical static resources',async()=>{for(const p of ['manifest.webmanifest','sw.js','assets/styles.css','assets/public.js','assets/brand-mark.png','legal.html']){const r=await page.request.get(CREATIVE+p);assert(r.ok(),p+' '+r.status())}});
 await check('Creative no duplicate ids',async()=>{const d=await page.evaluate(()=>{const a=[...document.querySelectorAll('[id]')].map(x=>x.id);return [...new Set(a.filter((x,i)=>a.indexOf(x)!==i))]});assert(!d.length,d.join(','))});
 await check('Creative 4 main anchors',async()=>{for(const id of ['packs','process','posters','custom'])assert(await page.locator('#'+id).count()===1,'Missing '+id)});
 await check('Creative live catalog = 10 packs and launch prices',async()=>{const d=await page.evaluate(async api=>fetch(api+'?action=catalog').then(r=>r.json()),API);const p=(d.packs||[]).filter(x=>x.active!==false);assert(p.length===10,'packs '+p.length);const e={'Pack Essentiel':349,'Pack Identité & Visuels':590,'Pack Dossier & Présentation Pro':349,'Kit Réseaux Sociaux':349,'Pack Association':349,'Pack Commerce Local':349,'Pack Club Sportif':490,'Pack Événement':590,'Pack Restaurant & Menu':390,'Pack Hôtel & Hébergement':790};for(const [n,v] of Object.entries(e)){const x=p.find(z=>z.name===n);assert(x,n+' missing');assert(Number(x.price)===v,n+'='+x.price)}});
 await check('Creative renders 3 featured + 7 other offers',async()=>{await page.waitForSelector('.featuredCard');assert(await page.locator('.featuredCard').count()===3,'featured');assert(await page.locator('.sectorCard').count()===7,'other')});
 await check('Creative offer detail modal complete',async()=>{await page.locator('.featuredCard [data-detail]').first().click();const t=await page.locator('.modal').innerText();for(const x of ['Pour qui','Ce qui est inclus','Ce que vous recevez','Comment ça se passe','Ce qui n’est pas inclus','Corrections','Prestation terminée à la livraison'])assert(t.includes(x),'Missing '+x);await page.locator('.modal .close').click()});
 await check('Creative standard order validation and wizard',async()=>{await page.locator('.featuredCard [data-order]').first().click();await page.locator('#next').click();assert(/Nom et e-mail/i.test(await page.locator('#toast').innerText()),'validation');await page.locator('[name=name]').fill('Test QA');await page.locator('[name=email]').fill('qa@example.com');await page.locator('#next').click();assert((await page.locator('.orderModal').innerText()).includes('Votre besoin'),'step2');await page.locator('.orderModal .close').click()});
 await check('Creative poster prices exact',async()=>{const t=await page.locator('#posters').innerText();for(const x of ['4,90 €','6,90 €','8,90 €','11,90 €'])assert(t.includes(x),x);for(const x of ['29 €','35 €','39 €','79 €'])assert(!t.includes(x),'old '+x)});
 await check('Creative poster wizard options and A5 total',async()=>{await page.locator('[data-poster-order]').click();await page.locator('[name=name]').fill('Test QA');await page.locator('[name=email]').fill('qa@example.com');await page.locator('#next').click();assert(await page.locator('[name=format] option').count()===4,'formats');assert(await page.locator('[name=orientation] option').count()===2,'orientation');assert(await page.locator('[name=style] option').count()===11,'styles');await page.locator('[name=subject]').fill('Toulon');await page.locator('[name=format]').selectOption('A5');await page.locator('#next').click();const t=await page.locator('.posterSummary').innerText();assert(t.replace(/\u00a0/g,' ').includes('4,90 €'),'price');assert(t.includes('A5'),'format');await page.locator('.orderModal .close').click()});
 await check('Creative follow-up empty dialog works',async()=>{await page.locator('#clientNotifBtn').click();assert((await page.locator('.trackModal').innerText()).includes('Notifications JLG Creative'),'heading');await page.locator('#trackClose').click()});
 await check('Creative desktop no horizontal overflow',async()=>{const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Creative desktop no runtime errors',async()=>errors());
 await page.close();
}

// CREATIVE CLIENT NOTIFICATION LOGIC WITH MOCK STATUS
{
 const context=await browser.newContext({viewport:{width:390,height:844}});
 await context.addInitScript(()=>{
   const now=Date.now();
   localStorage.setItem('jlg_creative_requests_v2',JSON.stringify([{token:'qa-token',reference:'CMD-QA-NOTIF',packName:'Pack Essentiel',createdAt:new Date(now-60000).toISOString(),lastSeenAt:new Date(now-60000).toISOString(),lastNotifiedAt:new Date(now-60000).toISOString(),status:'Nouvelle',updates:[]}]));
   window.__qaNotifs=[];
   class QANotification{static permission='granted';static requestPermission=async()=> 'granted';constructor(title,opts){window.__qaNotifs.push({title,body:opts?.body})}}
   Object.defineProperty(window,'Notification',{value:QANotification,configurable:true});
   if('ServiceWorkerRegistration' in window){ServiceWorkerRegistration.prototype.showNotification=async function(title,opts){window.__qaNotifs.push({title,body:opts?.body})}}
 });
 const page=await context.newPage();
 await page.route(API+'?action=request-status&token=qa-token',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({order:{reference:'CMD-QA-NOTIF',status:'Accusée',pack_name:'Pack Essentiel'},updates:[{id:'u1',kind:'created',title:'Demande envoyée',message:'Votre demande a été transmise.',created_at:new Date(Date.now()-50000).toISOString()},{id:'u2',kind:'acknowledged',title:'Demande bien reçue',message:'J’accuse réception de votre demande.',created_at:new Date().toISOString()}]})}));
 await page.goto(CREATIVE,{waitUntil:'networkidle'});
 await page.waitForTimeout(1200);
 await check('Creative client notification badge detects update',async()=>{const b=page.locator('#clientNotifBadge');assert(!(await b.isHidden()),'badge hidden');assert(Number(await b.innerText())>=1,'badge count')});
 await check('Creative client system-notification logic fires when permission granted',async()=>{const n=await page.evaluate(()=>window.__qaNotifs||[]);assert(n.some(x=>x.title==='Demande bien reçue'),'notification not fired')});
 await check('Creative follow-up shows acknowledgement message',async()=>{await page.locator('#clientNotifBtn').click();const t=await page.locator('.trackModal').innerText();assert(t.includes('J’accuse réception de votre demande.'),'ack absent');await page.locator('#trackClose').click()});
 await context.close();
}

// CREATIVE MOBILE LIVE
{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});const errors=await watchErrors(page,'Creative mobile');await page.goto(CREATIVE,{waitUntil:'networkidle'});
 await check('Creative mobile menu',async()=>{await page.locator('#menuBtn').click();assert(await page.locator('#mainNav').evaluate(e=>e.classList.contains('open')),'not open');await page.locator('#mainNav a[href="#packs"]').click();assert(!(await page.locator('#mainNav').evaluate(e=>e.classList.contains('open'))),'not closed')});
 await check('Creative mobile action bar visible',async()=>assert(await page.locator('.mobileActionBar').isVisible(),'hidden'));
 await check('Creative mobile no page overflow',async()=>{const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Creative mobile important tap targets >=38px',async()=>{for(const sel of ['#menuBtn','.mobileActionBar a','.mobileActionBar button','[data-poster-order]']){const x=page.locator(sel).first();if(await x.isVisible()){const b=await x.boundingBox();assert(b?.height>=38,sel+' '+b?.height)}}});
 await check('Creative mobile no runtime errors',async()=>errors());
 await page.close();
}

// NON-MUTATING LIVE API
{
 const page=await browser.newPage();
 await check('API unknown request token returns safe 404',async()=>{const r=await page.request.get(API+'?action=request-status&token=qa-invalid-token');assert(r.status()===404,'status '+r.status());const j=await r.json();assert(/introuvable/i.test(j.error||''),'body')});
 await page.close();
}

// STUDIO LOGIN LIVE
{
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=await watchErrors(page,'Studio login');await page.goto(STUDIO,{waitUntil:'networkidle'});
 await check('Studio HTTP 200 and assets',async()=>{for(const p of ['manifest.webmanifest','sw.js','assets/styles.css','assets/studio.js','assets/icon-192.png']){const r=await page.request.get(STUDIO+p);assert(r.ok(),p+' '+r.status())}});
 await check('Studio wrong password rejected visibly',async()=>{await page.locator('#pwd').fill('QA-WRONG-'+Date.now());await page.locator('#login').click();await page.waitForTimeout(800);assert(/incorrect|tentatives/i.test(await page.locator('#loginErr').innerText()),'no error')});
 await check('Studio login no duplicate ids',async()=>{const d=await page.evaluate(()=>{const a=[...document.querySelectorAll('[id]')].map(x=>x.id);return [...new Set(a.filter((x,i)=>a.indexOf(x)!==i))]});assert(!d.length,d.join(','))});
 await check('Studio login no horizontal overflow',async()=>{const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Studio login no runtime errors',async()=>errors());
 await page.close();
}

// STUDIO AUTHENTICATED FRONTEND WITH MOCKED API
{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.addInitScript(()=>{
   sessionStorage.setItem('jlg_token','qa-token');
   localStorage.setItem('jlg_studio_seen_orders_v1',JSON.stringify(['old-order']));
   window.__qaStudioNotifs=[];
   class QANotification{static permission='granted';static requestPermission=async()=> 'granted';constructor(title,opts){window.__qaStudioNotifs.push({title,body:opts?.body})}}
   Object.defineProperty(window,'Notification',{value:QANotification,configurable:true});
   if('ServiceWorkerRegistration' in window){ServiceWorkerRegistration.prototype.showNotification=async function(title,opts){window.__qaStudioNotifs.push({title,body:opts?.body})}}
 });
 const calls=[];
 const page=await context.newPage(); const errors=await watchErrors(page,'Studio authenticated');
 await page.route(API+'**',async route=>{
   const u=new URL(route.request().url());const a=u.searchParams.get('action');calls.push({action:a,method:route.request().method(),body:route.request().postData()});
   const json=x=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(x)});
   if(a==='bootstrap')return json(fakeData);
   if(a==='acknowledge-order')return json({status:'Accusée',message:'Accusé QA',token:'public-qa'});
   if(a==='convert-order')return json({clientId:'c1',projectId:'pr1',projectName:'Projet QA'});
   if(a==='share-project')return json({token:'review-qa'});
   if(a==='quote-to-invoice')return json({existing:false,id:'i2'});
   if(a==='records'||a==='pack'||a==='change-password')return json({updated:true,id:'qa'});
   return json({});
 });
 await page.goto(STUDIO,{waitUntil:'networkidle'});
 await check('Studio authenticated loads dashboard',async()=>{assert(await page.locator('[data-view=dashboard]').count()===1,'nav');assert((await page.locator('#viewRoot').innerText()).includes('Tout ce qui mérite ton attention'),'dashboard')});
 await check('Studio new-order badge shows count',async()=>{const b=page.locator('#studioNotifCount');assert(!(await b.isHidden()),'hidden');assert(await b.innerText()==='1','count '+await b.innerText())});
 await check('Studio system-notification logic fires for unseen new order',async()=>{const n=await page.evaluate(()=>window.__qaStudioNotifs||[]);assert(n.some(x=>x.title==='Nouvelle demande JLG'),'not fired')});
 const views=[['orders','Demandes clients'],['packs','Toutes mes offres'],['clients','Clients'],['projects','Projets'],['tasks','Production'],['quotes','Devis'],['invoices','Finance'],['settings','Réglages'],['dashboard','Tableau de bord']];
 for(const [key,title] of views){
   await check('Studio tab works: '+title,async()=>{await page.locator('[data-view='+key+']').click();await page.waitForTimeout(30);assert((await page.locator('.studioTop h1').innerText())===title,'title mismatch');assert(await page.locator('#viewRoot').count()===1,'root')});
 }
 await clearOverlays(page); await page.locator('[data-view=orders]').click();
 await check('Studio request detail opens with full brief',async()=>{await page.locator('[data-order=o1]').click();const t=await page.locator('.adminModal').innerText();for(const x of ['Brief client','Périmètre','Prochaines actions'])assert(t.includes(x),'missing '+x);await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await check('Studio poster request detail contains poster specifics',async()=>{await page.locator('[data-order=o2]').click();const t=await page.locator('.adminModal').innerText();assert(t.includes('Affiche personnalisée'),'poster section');assert(t.includes('A4'),'format');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await check('Studio acknowledgement button opens and sends action',async()=>{await page.locator('[data-ack-order=o1]').click();assert((await page.locator('.adminModal').innerText()).includes('Message au client'),'modal');await page.locator('#ackSend').click();await page.waitForTimeout(120);assert(calls.some(x=>x.action==='acknowledge-order'),'no API call')}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=packs]').click();
 await check('Studio offers directory has 10 offers, search and edit work',async()=>{assert(await page.locator('.offerMemo').count()===10,'offers');await page.locator('#offerSearch').fill('Hôtel');const visible=await page.locator('.offerMemo:visible').count();assert(visible===1,'search visible '+visible);await page.locator('#offerSearch').fill('');await page.locator('[data-editpack=p1]').click();assert((await page.locator('.adminModal').innerText()).includes('Ce qui n’est pas inclus'),'edit fields');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=clients]').click();
 await check('Studio Clients new/edit modal works',async()=>{await page.locator('#createRecord').click();assert((await page.locator('.adminModal').innerText()).includes('Nom / structure'),'new client');await page.locator('.adminModal .close').click();await page.locator('[data-editclient=c1]').click();assert(await page.locator('.adminModal [name=email]').count()===1,'email');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=projects]').click();
 await check('Studio Projects new/edit/share controls work',async()=>{await page.locator('#createRecord').click();assert(await page.locator('.adminModal [name=brief]').count()===1,'brief');await page.locator('.adminModal .close').click();await page.locator('[data-editproject=pr1]').click();assert(await page.locator('.adminModal [name=progress]').count()===1,'progress');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=tasks]').click();
 await check('Studio Production new/edit modal works',async()=>{await page.locator('#createRecord').click();assert(await page.locator('.adminModal [name=priority]').count()===1,'priority');await page.locator('.adminModal .close').click();await page.locator('[data-edittask=t1]').click();assert(await page.locator('.adminModal [name=status]').count()===1,'status');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=quotes]').click();
 await check('Studio quote builder opens, services add, totals update and focus stays',async()=>{ await clearOverlays(page);
   await page.locator('#createRecord').click();assert(await page.locator('.quoteBuilderModal').count()===1,'builder');
   const service=page.locator('.servicePick').first();await service.click();assert(await page.locator('.quoteItem').count()===1,'line');
   const price=page.locator('[data-line-price="0"]');await price.focus();await price.fill('100');assert(await price.evaluate(e=>document.activeElement===e),'focus lost');
   assert((await page.locator('#qTotal').innerText()).includes('100'),'total '+await page.locator('#qTotal').innerText());
   await page.locator('#addCustomLine').click();assert(await page.locator('.quoteItem').count()===2,'custom');
   await page.locator('.adminModal .close').click();
 });
 await check('Studio existing quote edit opens with saved line',async()=>{await page.locator('[data-editquote=q1]').click();assert(await page.locator('.quoteItem').count()===1,'existing line');assert((await page.locator('#qTotal').innerText()).includes('90'),'total');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=invoices]').click();
 await check('Studio Finance edit/new invoice controls work',async()=>{await page.locator('#createRecord').click();assert(await page.locator('.adminModal [name=paid_amount]').count()===1,'paid');await page.locator('.adminModal .close').click();await page.locator('[data-editinvoice=i1]').click();assert(await page.locator('.adminModal [name=due_date]').count()===1,'due');await page.locator('.adminModal .close').click()}); await clearOverlays(page);
 await clearOverlays(page); await page.locator('[data-view=settings]').click();
 await check('Studio Settings validation works',async()=>{await page.locator('#newPassword').fill('short');await page.locator('#changePassword').click();assert((await page.locator('#studioToast').innerText()).includes('10 caractères'),'validation')});
 await check('Studio authenticated no duplicate ids in each current view',async()=>{const d=await page.evaluate(()=>{const a=[...document.querySelectorAll('[id]')].map(x=>x.id);return [...new Set(a.filter((x,i)=>a.indexOf(x)!==i))]});assert(!d.length,d.join(','))});
 await check('Studio authenticated desktop no horizontal overflow',async()=>{const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Studio authenticated no runtime errors',async()=>errors());
 await context.close();
}

// STUDIO AUTHENTICATED MOBILE WITH MOCKED API
{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true});
 await context.addInitScript(()=>sessionStorage.setItem('jlg_token','qa-token'));
 const page=await context.newPage();const errors=await watchErrors(page,'Studio mobile auth');
 await page.route(API+'**',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(fakeData)}));
 await page.goto(STUDIO,{waitUntil:'networkidle'});
 await check('Studio mobile authenticated renders all 9 nav actions',async()=>assert(await page.locator('[data-view]').count()===9,'nav count'));
 await check('Studio mobile dashboard no page overflow',async()=>{const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Studio mobile quotes view usable without page overflow',async()=>{await page.locator('[data-view=quotes]').click();const v=await page.evaluate(()=>[document.documentElement.scrollWidth,document.documentElement.clientWidth]);assert(v[0]<=v[1]+2,v.join('/'))});
 await check('Studio mobile key controls >=38px',async()=>{for(const sel of ['#refresh','#studioNotifToggle','[data-view=orders]']){const x=page.locator(sel);if(await x.isVisible()){const b=await x.boundingBox();assert(b?.height>=38,sel+' '+b?.height)}}});
 await check('Studio mobile authenticated no runtime errors',async()=>errors());
 await context.close();
}



// CLIENT PORTAL WITH MOCKED API
{
 const page=await browser.newPage({viewport:{width:1200,height:900}});
 const errors=await watchErrors(page,'Client portal');
 const calls=[];
 const portalData={
   project:{id:'pr1',name:'Projet QA',client_id:'c1',progress:55,status:'En cours'},
   client:{id:'c1',name:'Client QA'},
   validations:[{id:'v1',title:'Flyer V1',version:'V1',status:'À valider',url:'https://example.com/flyer.pdf',comment:''}],
   quotes:[{id:'q1',reference:'DEV-QA-001',status:'Envoyé',total:349}],
   invoices:[{id:'i1',reference:'FAC-QA-001',status:'Envoyée',total:349,paid_amount:100,due_date:'2026-10-20'}],
   deliveries:[{id:'d1',title:'Livraison finale',version:'V1',status:'Disponible',url:'https://example.com/final.zip',delivery_date:'2026-10-10'}]
 };
 await page.route(API+'**',async route=>{
   const u=new URL(route.request().url());const a=u.searchParams.get('action');calls.push({action:a,method:route.request().method(),body:route.request().postData()});
   const body=a==='portal'?portalData:{updated:true,status:a==='portal-quote'?'Accepté':'Validé'};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});
 });
 await check('Client portal loads all four business sections',async()=>{const r=await page.goto(CREATIVE+'client.html?token=qa-review',{waitUntil:'networkidle'});assert(r?.ok(),'HTTP');const t=await page.locator('body').innerText();for(const x of ['Validations','Devis','Factures','Livraisons'])assert(t.includes(x),'missing '+x)});
 await check('Client portal progress and private status visible',async()=>{const t=await page.locator('.clientHero').innerText();assert(t.includes('55%'),'progress');assert(t.includes('ESPACE CLIENT PRIVÉ'),'private')});
 await check('Client validation action calls API',async()=>{page.once('dialog',d=>d.accept());await page.locator('[data-validation=v1][data-status="Validé"]').click();await page.waitForTimeout(80);assert(calls.some(x=>x.action==='portal-validation'&&x.method==='POST'),'no validation call')});
 await check('Client quote acceptance calls API',async()=>{page.once('dialog',d=>d.accept());await page.locator('[data-quote=q1][data-qstatus="Accepté"]').click();await page.waitForTimeout(80);assert(calls.some(x=>x.action==='portal-quote'&&x.method==='POST'),'no quote call')});
 await check('Client portal external delivery links are safe and target blank',async()=>{const a=page.locator('a[href*="example.com"]').first();assert(await a.getAttribute('target')==='_blank','target');assert((await a.getAttribute('rel')||'').includes('noopener'),'noopener')});
 await check('Client portal no runtime errors',async()=>errors());
 await page.close();
}

await browser.close();
console.log('\n=== JLG FINAL QA REPORT ===');
for(const r of results)console.log(`${r.status.padEnd(4)} | ${r.name}${r.detail?' | '+r.detail:''}`);
console.log(`\nTOTAL: ${results.length} checks | PASS: ${results.length-failures} | FAIL: ${failures}`);
if(failures)process.exit(1);
