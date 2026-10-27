'use strict';
/* Offline release checks. Prints only file names/rule labels, never credential values. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),firstParty=['app.js','auth.js','math-engine.js','config.js'];
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate HTML ID');
for(const file of ['app.js','auth.js'])for(const match of read(file).matchAll(/(?:\$|byId)\('([^']+)'\)/g))assert(ids.includes(match[1]),file+' missing DOM ID '+match[1]);
assert(!/\son[a-z]+\s*=/i.test(html),'inline event handler');for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))assert(!match[1].trim(),'inline script');
const scripts=[...html.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]);assert.deepEqual(scripts,['assets/vendor/supabase-2.118.0.js','config.js','auth.js','math-engine.js','app.js']);
for(const file of scripts){assert(!/^(?:[a-z]+:|\/)/i.test(file),'nonrelative script '+file);assert(fs.existsSync(path.join(root,file)),'missing active script '+file);}
for(const file of firstParty)assert(!/\b(?:innerHTML|outerHTML|insertAdjacentHTML|document\.write)\b|\beval\s*\(|new\s+Function\s*\(/.test(read(file)),file+' dynamic HTML/code sink');
assert(!/(?:src|href)="(?:https?:)?\/\//i.test(html),'runtime external HTML asset');assert(!/@import\b|url\(\s*['"]?https?:/i.test(read('style.css')),'external CSS dependency');
const manifest=JSON.parse(read('assets/vendor/manifest.json'));assert.equal(manifest.version,'2.118.0');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/vendor',manifest.file))).digest('hex'),manifest.sha256,'vendor SDK integrity');assert(fs.statSync(path.join(root,'assets/vendor',manifest.license)).size>0,'vendor license');
const cspTag=html.match(/<meta\b[^>]*http-equiv="Content-Security-Policy"[^>]*content="([^"]+)"/i);assert(cspTag,'CSP meta missing');const directives=new Map(cspTag[1].split(';').map(x=>x.trim().split(/\s+/)).filter(x=>x[0]).map(([key,...values])=>[key,values]));
assert.deepEqual(directives.get('script-src'),["'self'"],'script CSP must exclude inline/eval');assert.deepEqual(directives.get('object-src'),["'none'"]);assert.deepEqual(directives.get('base-uri'),["'self'"]);assert.deepEqual(directives.get('form-action'),["'self'"]);assert.deepEqual(directives.get('connect-src'),['https://binissqzmhxnqlftwlnj.supabase.co']);assert(/<meta\b[^>]*name="referrer"[^>]*content="no-referrer"/i.test(html),'no-referrer meta missing');
const sdkTag=html.match(/<script\b[^>]*src="assets\/vendor\/supabase-2\.118\.0\.js"[^>]*>/i)?.[0];const sri=sdkTag?.match(/integrity="([^"]+)"/)?.[1];if(sri)assert.equal(sri,'sha256-'+Buffer.from(manifest.sha256,'hex').toString('base64'),'SDK SRI mismatch');
console.log('PASS: restrictive script/network CSP and referrer policy; SDK SRI matches pinned bytes when present.');
console.log('PASS: active script allowlist, relative assets, unique/complete DOM IDs, no first-party dynamic HTML/code sinks, local SDK SHA-256 and license.');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:30*1024*1024,stdio:['ignore','pipe','pipe']});
const candidates=git('ls-files','--cached','--others','--exclude-standard','-z').split('\0').filter(Boolean);
assert(!candidates.some(p=>p.startsWith('.local-tests/')||/(?:^|\/)\.env(?:\.|$)/.test(p)&&!p.endsWith('.example')),'private local files eligible for commit');
const ignored=git('check-ignore','.local-tests/security-probe.json','.env','.env.local').trim().split(/\r?\n/);assert.equal(ignored.length,3,'credential exclusions');
const secretRules=[['private key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],['Supabase secret',/sb_secret_[A-Za-z0-9_-]{16,}/],['GitHub token',/(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}/],['AWS key',/AKIA[A-Z0-9]{16}/]];
let scanned=0;
function scan(name,body){for(const [rule,re]of secretRules)assert(!re.test(body),name+': possible '+rule+' (value withheld)');for(const m of body.matchAll(/eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g)){let claims;try{claims=JSON.parse(Buffer.from(m[0].split('.')[1],'base64url').toString('utf8'));}catch{continue;}assert(claims.role!=='service_role',name+': privileged JWT (value withheld)');}scanned++;}
const textFile=p=>/\.(?:js|cjs|mjs|json|html|css|md|sql|ya?ml|cmd|txt|toml)$|(?:^|\/)\.gitignore$/.test(p);
for(const file of candidates)if(textFile(file)&&fs.existsSync(path.join(root,file)))scan(file,read(file));
// Audit only history that would be published with main, never the local prototype archive.
const seen=new Set();for(const commit of git('rev-list','main').trim().split(/\r?\n/))for(const line of git('ls-tree','-r',commit).trim().split(/\r?\n/)){const match=line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);if(!match||seen.has(match[1])||!textFile(match[2]))continue;seen.add(match[1]);scan('main-history:'+match[2],git('cat-file','blob',match[1]));}
console.log('PASS: '+scanned+' current/history text blobs scanned for high-confidence credential patterns; .local-tests and environment files excluded. This is not a guarantee against every secret format.');
const workflowPath='.github/workflows/pages.yml';if(fs.existsSync(path.join(root,workflowPath))){const workflow=read(workflowPath);assert(!/upload-pages-artifact@[\w.-]+[\s\S]*?path:\s*["']?\.["']?\s*$/m.test(workflow),'Pages must not upload repository root');console.log('PASS: Pages workflow does not upload the whole repository root.');}
