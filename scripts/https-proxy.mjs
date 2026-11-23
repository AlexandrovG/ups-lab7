/** HTTPS reverse-proxy on the laptop: HTTPS phone -> Node -> Go / MinIO.
 * All frontend requests remain same-origin /api and /s3; no backend CORS edits.
 */
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const root=path.resolve('dist');
const keyFile=process.env.LAB7_TLS_KEY || path.resolve('certs/lab7-key.pem');
const certFile=process.env.LAB7_TLS_CERT || path.resolve('certs/lab7.pem');
const port=Number(process.env.LAB7_PORT||8443);
const apiTarget=process.env.LAB7_API_TARGET || 'http://[::1]:8080';
const s3Target=process.env.LAB7_S3_TARGET || 'http://127.0.0.1:9000';
if(!fs.existsSync(path.join(root,'index.html'))) throw new Error('Missing dist/index.html: first run npm run build:lan');
if(!fs.existsSync(keyFile)||!fs.existsSync(certFile)) throw new Error('Missing TLS certificate: see LAB7_WINDOWS_ИНСТРУКЦИЯ.md (mkcert)');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.mp4':'video/mp4'};
function serve(res,p){try{
  const stat=fs.statSync(p);
  if(!stat.isFile()){res.writeHead(404);res.end('Not Found');return;}
  const ext=path.extname(p).toLowerCase();
  res.setHeader('Content-Type',types[ext]||'application/octet-stream');
  res.setHeader('Cache-Control',ext==='.html'||p.endsWith('sw.js')||ext==='.webmanifest'?'no-cache':'public, max-age=3600');
  res.writeHead(200);fs.createReadStream(p).pipe(res);
}catch{res.writeHead(404);res.end('Not Found')}}
function proxy(req,res,target,rewrite){
  const u=new URL(target);const route=rewrite?req.url.replace(/^\/s3(?=\/|\?|$)/,''):req.url;
  const headers={...req.headers,host:u.host,'x-forwarded-proto':'https'};
  delete headers.connection;
  const upstream=http.request({hostname:u.hostname.replace(/^\[|\]$/g,''),port:u.port||80,method:req.method,path:route,headers},r=>{
    const outHeaders={...r.headers};delete outHeaders.connection;
    res.writeHead(r.statusCode||502,outHeaders);r.pipe(res);
  });
  upstream.on('error',err=>{console.error('Proxy failed:',target,err.message);if(!res.headersSent)res.writeHead(502,{'Content-Type':'text/plain; charset=utf-8'});res.end('Upstream unavailable');});
  req.pipe(upstream);
}
const server=https.createServer({key:fs.readFileSync(keyFile),cert:fs.readFileSync(certFile)},(req,res)=>{
  let u;try{u=new URL(req.url,'https://localhost')}catch{res.writeHead(400);res.end();return;}
  if(u.pathname.startsWith('/api/'))return proxy(req,res,apiTarget,false);
  if(u.pathname.startsWith('/s3/'))return proxy(req,res,s3Target,true);
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  if(u.pathname==='/'||u.pathname==='/index.html')return serve(res,path.join(root,'index.html'));
  let filename;try{filename=decodeURIComponent(u.pathname)}catch{res.writeHead(400);res.end();return;}
  const target=path.resolve(root,'.'+filename);
  if(!target.startsWith(root+path.sep) && target!==root){res.writeHead(403);res.end();return;}
  if(fs.existsSync(target)&&fs.statSync(target).isFile())return serve(res,target);
  if((req.headers.accept||'').includes('text/html'))return serve(res,path.join(root,'index.html'));
  res.writeHead(404);res.end('Not Found');
});
server.listen(port,'0.0.0.0',()=>{
  console.log(`HTTPS proxy listening on port ${port}`);
  for(const vals of Object.values(os.networkInterfaces()))for(const nic of vals||[]){if(nic.family==='IPv4'&&!nic.internal)console.log(`Phone: https://${nic.address}:${port}/grid`);}
  console.log(`Backend: ${apiTarget} (path /api) | S3: ${s3Target} (path /s3)`);
});
