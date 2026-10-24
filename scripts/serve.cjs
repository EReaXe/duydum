'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const allowed=new Set(['index.html','style.css','app.js','auth.js','profile.js','catalog.js','rooms.js','config.js']);
const server=http.createServer((req,res)=>{
  let relative;
  try{relative=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/+/, '')||'index.html';}catch{res.writeHead(400).end();return;}
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep)||(!allowed.has(relative)&&!relative.startsWith('assets/'))||!types[path.extname(file)]){res.writeHead(404).end();return;}
  fs.stat(file,(error,stat)=>{
    if(error||!stat.isFile()){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',types[path.extname(file)]);res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control','no-cache');
    res.setHeader('Referrer-Policy','no-referrer');
    if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405).end();return;}
    if(req.method==='HEAD'){res.end();return;}
    const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);
  });
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'3000 portu kullanımda. Açık sunucuyu kontrol et.':error.message);process.exitCode=1;});
server.listen(3000,'127.0.0.1',()=>console.log('Duydum! http://localhost:3000 — Durdurmak için Ctrl+C'));
