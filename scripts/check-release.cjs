#!/usr/bin/env node
'use strict';
// Release only this allowlist; source, SQL, old media and test fixtures stay out of Pages.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const files=Object.freeze(['index.html','style.css','app.js','auth.js','config.js','math-engine.js','.nojekyll','assets/vendor/supabase-2.118.0.js','assets/vendor/supabase-LICENSE','assets/vendor/manifest.json']);
function check(){
 const read=name=>fs.readFileSync(path.join(root,name),'utf8');
 for(const name of files){const item=fs.lstatSync(path.join(root,name));assert(item.isFile()&&!item.isSymbolicLink(),`Nonregular public file: ${name}`);}
 const html=read('index.html'),ids=[...html.matchAll(/\bid=["']([^"']+)["']/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate DOM IDs');
 const refs=[...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(x=>x[1]);
 const css=read('style.css');for(const match of css.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/g))refs.push(match[1]);
 for(const ref of refs){if(ref.startsWith('#')||ref.startsWith('data:'))continue;assert(!/^(?:[a-z]+:|\/\/|\/)/i.test(ref),`Nonrelative runtime asset: ${ref}`);const local=ref.split(/[?#]/)[0].replace(/^\.\//,'');assert(files.includes(local),`Asset outside public allowlist: ${local}`);assert(fs.existsSync(path.join(root,local)),`Missing asset: ${local}`);}
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(x=>x[1]);
 assert.deepEqual(scripts,['assets/vendor/supabase-2.118.0.js','config.js','auth.js','math-engine.js','app.js'],'Unexpected or old music script loaded');
 assert(!/<script\b(?![^>]*\bsrc=)[^>]*>\s*\S/i.test(html),'Inline script must be reviewed');
 const sensitive=[/sb_secret_[A-Za-z0-9_-]+/,/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{20,}/,/\bgithub_pat_[A-Za-z0-9_]{20,}/,/\bAKIA[0-9A-Z]{16}\b/,/postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i];
 for(const file of files){const body=read(file);for(const pattern of sensitive)assert(!pattern.test(body),`Credential pattern found in ${file}`);for(const token of body.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)||[]){let payload;try{payload=JSON.parse(Buffer.from(token.split('.')[1],'base64url'));}catch{continue;}assert(payload.role!=='service_role',`Service role token in ${file}`);}if(file.endsWith('.js')){const checked=cp.spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});assert.equal(checked.status,0,`JS syntax error: ${file}\n${checked.stderr}`);}}
 const manifest=JSON.parse(read('assets/vendor/manifest.json'));assert.equal(manifest.file,'supabase-2.118.0.js');assert.equal(manifest.license,'supabase-LICENSE');const hash=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/vendor',manifest.file))).digest('hex');assert.equal(hash,manifest.sha256,'Vendor SDK checksum mismatch');
 console.log(`PASS: ${files.length} public files; relative asset allowlist, DOM IDs, active scripts, syntax, credential patterns and vendor checksum.`);
}
function stage(destination){
 const tempRoot=path.resolve(process.env.RUNNER_TEMP||os.tmpdir()),target=path.resolve(destination),relative=path.relative(tempRoot,target);
 assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Stage must be inside the temporary directory');assert(!fs.existsSync(target),'Stage destination must be new');fs.mkdirSync(target,{recursive:true});
 for(const name of files){const to=path.join(target,name);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,name),to);}
 console.log(`Staged ${files.length} allowlisted files in temporary directory.`);
}
if(require.main===module){try{const args=process.argv.slice(2);assert(args.length===0||(args.length===2&&args[0]==='--stage'),'Usage: node scripts/check-release.cjs [--stage TEMP_DIRECTORY]');check();if(args.length)stage(args[1]);}catch(error){console.error(`FAIL: ${error.message}`);process.exitCode=1;}}
module.exports={files,check};
