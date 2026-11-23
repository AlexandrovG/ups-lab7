/** Native PWA implementation without extra runtime dependencies.
 * Builds a scoped manifest and an offline-first SW with versioned precache of
 * the actual Vite-produced JS/CSS and the five mock pictures.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const dist = path.resolve('dist');
if (!fs.existsSync(path.join(dist, 'index.html'))) throw new Error('Run vite build before postbuild-pwa');
let base = process.env.VITE_BASE_PATH || '/';
if (!base.startsWith('/')) base = '/' + base;
if (!base.endsWith('/')) base += '/';
const list = (dir, prefix='') => fs.readdirSync(dir, {withFileTypes:true}).flatMap(ent=> {
  const relative = path.posix.join(prefix, ent.name);
  return ent.isDirectory() ? list(path.join(dir,ent.name),relative) : [relative];
});
const files = list(dist);
const resources = files.filter(f => f==='index.html' || f.startsWith('assets/') || /^(?:pwa-(?:192|512)\.png|favicon\.svg|1\.jpg|default\.png|no-image\.png|nas\.jpg)$/.test(f));
const urls = resources.map(f=>base+f);
const version = crypto.createHash('sha256').update(urls.join('|') + fs.readFileSync(path.join(dist,'index.html'))).digest('hex').slice(0,12);
const manifest = {
  id:base, name:'Каталог ИБП — Лабораторная 7', short_name:'Каталог ИБП',
  description:'Источники бесперебойного питания для офиса',
  start_url:base, scope:base, display:'standalone', orientation:'any',
  lang:'ru', theme_color:'#1F2429', background_color:'#FFFFFF',
  icons:[
    {src:base+'pwa-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
    {src:base+'pwa-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'}
  ]
};
fs.writeFileSync(path.join(dist,'manifest.webmanifest'),JSON.stringify(manifest,null,2),'utf8');
// Explicitly scope all cached resources; NEVER cache /api or /s3 responses (JWT/personal data).
const worker = `const CACHE='ups-lab7-${version}';\nconst BASE=${JSON.stringify(base)};\nconst FILES=${JSON.stringify([...urls,base+'manifest.webmanifest'])};\nself.addEventListener('install', e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));\nself.addEventListener('activate',e=>e.waitUntil((async()=>{for(const name of await caches.keys()){if(name.startsWith('ups-lab7-')&&name!==CACHE)await caches.delete(name)}await self.clients.claim()})()));\nself.addEventListener('fetch',e=>{const req=e.request;if(req.method!=='GET')return;const u=new URL(req.url);if(u.origin!==self.location.origin||!u.pathname.startsWith(BASE))return;const logical=u.pathname.slice(BASE.length);if(logical.startsWith('api/')||logical.startsWith('s3/'))return;if(req.mode==='navigate'){e.respondWith(fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(BASE+'index.html',copy));}return r}).catch(()=>caches.match(BASE+'index.html')));return;}e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r})));});\n`;
fs.writeFileSync(path.join(dist,'sw.js'),worker,'utf8');
console.log(`PWA built: base=${base}, precached files=${resources.length}, offline shell ready`);
