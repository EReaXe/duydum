'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const catalog=require('../catalog.js');const {headerAt}=require('./prepare-audio.cjs');
assert.equal(catalog.songs.length,10);
assert.equal(catalog.suggest('manifest').length,3);
assert.equal(catalog.suggest('sarkilar')[0].title,'Şarkılar Sokaklara Ait');
assert.equal(catalog.suggest('GÜNAH')[0].title,'Günah Benim');
assert.equal(catalog.suggest('').length,0);
assert.equal(catalog.suggest('eşleşmeyen metin').length,0);assert.equal(new Set(catalog.songs.map(s=>s.id)).size,10);
let seed=12345;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const deck=catalog.createDeck(catalog.songs,random);let previous;
for(let cycle=0;cycle<100;cycle++){
 const batch=[];for(let i=0;i<10;i++){const next=deck.next();assert.equal(next.cycle,cycle+1);assert.notEqual(next.song.id,previous);previous=next.song.id;batch.push(previous);}
 assert.equal(new Set(batch).size,10);
}
for(const song of catalog.songs){
 assert(catalog.matches(song,song.title));assert(catalog.matches(song,song.title.toLocaleUpperCase('tr')));
 assert(catalog.matches(song,song.artist+' - '+song.title));
 assert(catalog.matches(song,catalog.normalize(song.title)));
 assert(!catalog.matches(song,'bu tamamen ilgisiz bir tahmin'));
 const bytes=fs.readFileSync(song.audio);let offset=0,seconds=0;
 while(offset<bytes.length){const h=headerAt(bytes,offset);assert(h,song.id+' frame');seconds+=h.samples/h.sampleRate;offset+=h.length;}
 assert.equal(offset,bytes.length);assert(seconds<=16,song.id+' duration');
}
const elements={};const el=id=>elements[id]??={hidden:false,value:'',textContent:'',src:'',classList:{add(){},remove(){}},events:{},setAttribute(){},removeAttribute(){},addEventListener(t,f){this.events[t]=f},replaceChildren(){},prepend(){},focus(){}};
class AudioMock{constructor(src){this.src=src;this.currentTime=0;this.paused=true}pause(){this.paused=true}async play(){this.paused=false}load(){}addEventListener(){}}
const saved=[];let startedId;
const context={window:{DuydumCatalog:catalog,DuydumAuth:{ready:Promise.resolve()},DuydumProfile:{beginRound(id){startedId=id;return{songId:id}},finishRound(record,won,stage){saved.push({record,won,stage})}},scrollTo(){}},document:{getElementById:el,createElement:()=>({}),body:{classList:{add(){},remove(){}}},addEventListener(){}},Audio:AudioMock,setInterval(){},clearInterval(){},Date,Math};
vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../app.js'),'utf8'),context);
(async()=>{
 const played=[];el('start-solo').events.click();
 for(let i=0;i<20;i++){
  await el('play').events.click();
  const song=vm.runInContext('currentSong',context);played.push(song.id);assert.equal(startedId,song.id);
  if(i===0){el('guess').value='kesinlikle yanlis';el('guess-form').events.submit({preventDefault(){}});assert.equal(vm.runInContext('stage',context),1);}
  el('guess').value=song.title;el('guess-form').events.submit({preventDefault(){}});
  assert.equal(el('result-title').textContent,song.title);assert.equal(el('result-artist').textContent,song.artist);
  assert.equal(saved.at(-1).record.songId,song.id);assert(saved.at(-1).won);
  el('restart').events.click();
 }
 assert.equal(new Set(played.slice(0,10)).size,10);assert.equal(new Set(played.slice(10)).size,10);assert.notEqual(played[9],played[10]);
 await el('play').events.click();for(let i=0;i<6;i++)el('pass').events.click();assert.equal(saved.at(-1).won,false);assert.equal(el('result-points').textContent,'+0 puan');
 console.log('PASS: 100 shuffled cycles; all titles/artists/normalization; 10 MP3 frame/duration checks; 20 dynamic rounds, song IDs, wrong guess and final Pas.');
})().catch(error=>{console.error(error);process.exitCode=1});
