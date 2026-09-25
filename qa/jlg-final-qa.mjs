import { chromium } from 'playwright';

const CREATIVE='https://jumerca.github.io/jlg-social-studio/jlg-creative/';
const STUDIO='https://jumerca.github.io/jlg-social-studio/jlg-studio/';
const API='https://wxurfggrvyggqexvjpqi.supabase.co/functions/v1/jlg-api';

const results=[];
let failures=0;
function ok(name, detail=''){results.push({status:'PASS',name,detail});}
function fail(name, detail=''){failures++;results.push({status:'FAIL',name,detail});}
async function check(name, fn){
  try{const detail=await fn();ok(name,detail||'');}
  catch(e){fail(name,e?.message||String(e));}
}
function assert(cond,msg='Assertion failed'){if(!cond)throw new Error(msg)}

const browser=await chromium.launch({headless:true});

async function attachErrors(page,label){
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  return ()=>{if(errors.length)throw new Error(label+' errors: '+errors.join(' | '));};
}

// --- Creative desktop ---
{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const getErrors=await attachErrors(page,'Creative desktop');

  await check('Creative loads with HTTP 200', async()=>{
    const r=await page.goto(CREATIVE,{waitUntil:'networkidle'});
    assert(r && r.ok(),'HTTP '+r?.status());
    return page.title();
  });
  await check('Creative critical assets load', async()=>{
    const paths=['manifest.webmanifest','sw.js','assets/styles.css','assets/public.js','assets/brand-mark.png','legal.html'];
    for(const p of paths){const r=await page.request.get(CREATIVE+p);assert(r.ok(),p+' -> '+r.status())}
    return paths.length+' resources OK';
  });
  await check('Creative has no duplicate DOM ids', async()=>{
    const dups=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return [...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))]});
    assert(!dups.length,'Duplicate ids: '+dups.join(', '));
  });
  await check('Creative navigation anchors exist', async()=>{
    for(const id of ['packs','process','posters','custom']) assert(await page.locator('#'+id).count()===1,'Missing #'+id);
  });
  await check('Creative catalog API has 10 active packs and launch prices', async()=>{
    const data=await page.evaluate(async api=>await fetch(api+'?action=catalog').then(r=>r.json()),API);
    const packs=(data.packs||[]).filter(p=>p.active!==false);
    assert(packs.length===10,'Expected 10 packs, got '+packs.length);
    const expected={
      'Pack Essentiel':349,'Pack Identité & Visuels':590,'Pack Dossier & Présentation Pro':349,
      'Kit Réseaux Sociaux':349,'Pack Association':349,'Pack Commerce Local':349,
      'Pack Club Sportif':490,'Pack Événement':590,'Pack Restaurant & Menu':390,'Pack Hôtel & Hébergement':790
    };
    for(const [name,price] of Object.entries(expected)){
      const p=packs.find(x=>x.name===name);assert(p,name+' missing');assert(Number(p.price)===price,name+' price '+p.price);
    }
    return packs.length+' packs / prices OK';
  });
  await check('Creative renders featured and other offers', async()=>{
    await page.waitForSelector('.featuredCard');
    const featured=await page.locator('.featuredCard').count();
    const sector=await page.locator('.sectorCard').count();
    assert(featured===3,'Featured '+featured);
    assert(sector===7,'Other offers '+sector);
    return featured+' featured + '+sector+' other';
  });
  await check('Offer detail modal opens and contains all contractual sections', async()=>{
    await page.locator('.featuredCard [data-detail]').first().click();
    await page.waitForSelector('.modalHero');
    const txt=await page.locator('.modal').innerText();
    for(const t of ['Pour qui','Ce qui est inclus','Ce que vous recevez','Comment ça se passe','Ce qui n’est pas inclus','Corrections','Prestation terminée à la livraison'])assert(txt.includes(t),'Missing '+t);
    await page.locator('.modal .close').click();
  });
  await check('Standard request wizard validates and advances', async()=>{
    await page.locator('.featuredCard [data-order]').first().click();
    await page.waitForSelector('.orderModal');
    await page.locator('#next').click();
    const toast=await page.locator('#toast').innerText();
    assert(/Nom et e-mail/i.test(toast),'Missing validation toast');
    await page.locator('[name="name"]').fill('Test QA');
    await page.locator('[name="email"]').fill('qa@example.com');
    await page.locator('#next').click();
    assert((await page.locator('.orderModal').innerText()).includes('Votre besoin'),'Did not advance to step 2');
    await page.locator('.orderModal .close').click();
  });
  await check('Poster section shows exact 4 launch prices', async()=>{
    const txt=await page.locator('#posters').innerText();
    for(const p of ['4,90 €','6,90 €','8,90 €','11,90 €'])assert(txt.includes(p),'Missing '+p);
    for(const old of ['29 €','35 €','39 €','79 €'])assert(!txt.includes(old),'Old price present '+old);
  });
  await check('Poster wizard has 4 formats, 2 orientations, 11 styles and correct A5 summary', async()=>{
    await page.locator('[data-poster-order]').click();
    await page.locator('[name="name"]').fill('Test QA');
    await page.locator('[name="email"]').fill('qa@example.com');
    await page.locator('#next').click();
    const formats=await page.locator('[name="format"] option').allTextContents();
    const orientations=await page.locator('[name="orientation"] option').allTextContents();
    const styles=await page.locator('[name="style"] option').allTextContents();
    assert(formats.length===4,'Formats '+formats.length);
    assert(orientations.length===2,'Orientations '+orientations.length);
    assert(styles.length===11,'Styles '+styles.length);
    await page.locator('[name="subject"]').fill('Toulon');
    await page.locator('[name="format"]').selectOption('A5');
    await page.locator('#next').click();
    const summary=await page.locator('.posterSummary').innerText();
    assert(summary.includes('4,90 €'),'A5 price not in summary: '+summary);
    assert(summary.includes('A5'),'A5 label missing');
    await page.locator('.orderModal .close').click();
  });
  await check('Client follow-up dialog opens without a tracked request', async()=>{
    await page.locator('#clientNotifBtn').click();
    await page.waitForSelector('.trackModal');
    const txt=await page.locator('.trackModal').innerText();
    assert(txt.includes('Notifications JLG Creative'),'Follow-up heading missing');
    await page.locator('#trackClose').click();
  });
  await check('Creative has no unintended horizontal page overflow desktop', async()=>{
    const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    assert(v.sw<=v.cw+2,JSON.stringify(v));
  });
  await check('Creative desktop has no JS/console errors', async()=>getErrors());
  await page.close();
}

// --- Creative mobile ---
{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
  const getErrors=await attachErrors(page,'Creative mobile');
  await page.goto(CREATIVE,{waitUntil:'networkidle'});
  await check('Creative mobile menu opens and closes', async()=>{
    const btn=page.locator('#menuBtn');
    await btn.click();assert(await page.locator('#mainNav').evaluate(el=>el.classList.contains('open')),'Menu did not open');
    await page.locator('#mainNav a[href="#packs"]').click();
    assert(!(await page.locator('#mainNav').evaluate(el=>el.classList.contains('open'))),'Menu did not close');
  });
  await check('Creative mobile action bar visible', async()=>{
    const vis=await page.locator('.mobileActionBar').isVisible();assert(vis,'Not visible');
  });
  await check('Creative mobile poster cards are reachable and body does not overflow', async()=>{
    const cards=page.locator('.posterPriceGrid article');assert(await cards.count()===4,'Poster cards != 4');
    const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    assert(v.sw<=v.cw+2,JSON.stringify(v));
  });
  await check('Creative mobile critical tap targets at least 38px high', async()=>{
    const sels=['#menuBtn','.mobileActionBar a','.mobileActionBar button','[data-poster-order]'];
    for(const sel of sels){const loc=page.locator(sel).first();if(await loc.isVisible()){const b=await loc.boundingBox();assert(b&&b.height>=38,sel+' height '+b?.height)}}
  });
  await check('Creative mobile has no JS/console errors', async()=>getErrors());
  await page.close();
}

// --- Public API non-mutating ---
{
  const page=await browser.newPage();
  await check('request-status rejects unknown token safely', async()=>{
    const r=await page.request.get(API+'?action=request-status&token=qa-invalid-token');
    assert(r.status()===404,'Expected 404, got '+r.status());
    const j=await r.json();assert(/introuvable/i.test(j.error||''),'Unexpected response');
  });
  await page.close();
}

// --- Studio login / public shell ---
{
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const getErrors=await attachErrors(page,'Studio desktop');
  await check('Studio loads with HTTP 200', async()=>{
    const r=await page.goto(STUDIO,{waitUntil:'networkidle'});assert(r&&r.ok(),'HTTP '+r?.status());return page.title();
  });
  await check('Studio critical assets load', async()=>{
    const paths=['manifest.webmanifest','sw.js','assets/styles.css','assets/studio.js','assets/icon-192.png'];
    for(const p of paths){const r=await page.request.get(STUDIO+p);assert(r.ok(),p+' -> '+r.status())}
  });
  await check('Studio login form exists and wrong password is rejected visibly', async()=>{
    const pass=page.locator('input[type="password"]');assert(await pass.count()===1,'Password field missing');
    await pass.fill('QA-WRONG-PASSWORD-'+Date.now());
    const submit=page.locator('button[type="submit"], #loginBtn, form button').first();
    await submit.click();
    await page.waitForTimeout(1200);
    const txt=await page.locator('body').innerText();
    assert(/incorrect|invalide|erreur|mot de passe/i.test(txt),'No visible login error');
  });
  await check('Studio has no duplicate DOM ids on login shell', async()=>{
    const dups=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(x=>x.id);return [...new Set(ids.filter((x,i)=>ids.indexOf(x)!==i))]});
    assert(!dups.length,'Duplicate ids: '+dups.join(', '));
  });
  await check('Studio has no unintended horizontal overflow desktop', async()=>{
    const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    assert(v.sw<=v.cw+2,JSON.stringify(v));
  });
  await check('Studio desktop has no JS/console errors', async()=>getErrors());
  await page.close();
}

// --- Studio mobile login shell ---
{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true});
  const getErrors=await attachErrors(page,'Studio mobile');
  await page.goto(STUDIO,{waitUntil:'networkidle'});
  await check('Studio mobile login has no horizontal overflow', async()=>{
    const v=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth}));
    assert(v.sw<=v.cw+2,JSON.stringify(v));
  });
  await check('Studio mobile login controls are comfortably tappable', async()=>{
    const inputs=page.locator('input,button');const n=await inputs.count();assert(n>=2,'Too few controls');
    for(let i=0;i<n;i++){const loc=inputs.nth(i);if(await loc.isVisible()){const b=await loc.boundingBox();assert(b&&b.height>=38,'Control '+i+' height '+b?.height)}}
  });
  await check('Studio mobile has no JS/console errors', async()=>getErrors());
  await page.close();
}

await browser.close();

console.log('\n=== JLG FINAL QA REPORT ===');
for(const r of results)console.log(`${r.status.padEnd(4)} | ${r.name}${r.detail?' | '+r.detail:''}`);
console.log(`\nTOTAL: ${results.length} checks | PASS: ${results.length-failures} | FAIL: ${failures}`);
if(failures)process.exit(1);
