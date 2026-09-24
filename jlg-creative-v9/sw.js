const VERSION='jlg-creative-v9-3';
const STATIC_CACHE=VERSION+'-static';
const PAGE_CACHE=VERSION+'-pages';
const BASE=self.location.pathname;
const A=q=>BASE+'?'+q;
const STATIC_ASSETS=[BASE,A('page=home'),A('page=studio'),A('page=client'),A('page=legal'),A('asset=manifest'),A('asset=styles'),A('asset=public'),A('asset=studio'),A('asset=client'),A('asset=pwa'),A('asset=logo'),A('asset=icon-192'),A('asset=icon-512'),A('asset=offline')];
self.addEventListener('install',event=>{event.waitUntil(caches.open(STATIC_CACHE).then(cache=>Promise.all(STATIC_ASSETS.map(u=>cache.add(u).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>!k.startsWith(VERSION)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{const req=event.request;if(req.method!=='GET')return;const url=new URL(req.url);if(url.origin!==self.location.origin||url.pathname!==BASE)return;if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(PAGE_CACHE).then(c=>c.put(req,copy))}return res}).catch(async()=>await caches.match(req)||await caches.match(A('asset=offline'))));return}event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{if(res.ok){const copy=res.clone();caches.open(STATIC_CACHE).then(c=>c.put(req,copy))}return res})))});
