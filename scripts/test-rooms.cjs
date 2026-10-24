'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const catalog=require('../catalog.js');
const nodes={},element=id=>nodes[id]??={id,hidden:false,disabled:false,value:'',textContent:'',src:'',children:[],events:{},classList:{add(){},remove(){}},setAttribute(){},removeAttribute(){},focus(){},append(...children){this.children.push(...children)},prepend(child){this.children.unshift(child)},replaceChildren(...children){this.children=children},addEventListener(name,fn){this.events[name]=fn}};
class AudioStub{constructor(src){this.src=src;this.paused=true;this.currentTime=0}pause(){this.paused=true}async play(){this.paused=false}load(){}addEventListener(){}}
let currentUser;const handlers={};let holdNext=false,releaseRPC;
const owner='00000000-0000-0000-0000-000000000001';
const player=(id,name)=>({user_id:id,name,score:0,stage:0,done:false,correct:false,round_points:0});
let model={code:'ABCDE',host_id:owner,status:'lobby',round:0,match_id:crypto.randomUUID(),server_time:new Date().toISOString(),players:[player(owner,'Bir')],self:player(owner,'Bir'),events:[],answer:null,can_start:false};
currentUser={id:owner};
let soloWrites=0,requestIds=[];const storage=new Map(),timers=[];
const rpc=async(name,{p_action,p_payload})=>{
 assert.equal(name,'duydum_room');
 if(holdNext){holdNext=false;return await new Promise(resolve=>{releaseRPC=resolve;});}
 if(p_action==='start'){model.status='playing';model.round=1;model.song_id='snap-beta-001';model.round_ends_at=new Date(Date.now()+60000).toISOString();}
 if(p_action==='pass'){assert.equal(p_payload.stage,model.self.stage);requestIds.push(p_payload.request_id);model.self.stage++;}
 if(p_action==='guess'){assert.equal(p_payload.stage,model.self.stage);requestIds.push(p_payload.request_id);model.self.done=true;model.self.correct=true;model.self.round_points=850;}
 if(p_action==='close'||p_action==='leave')return{data:{closed:true,code:model.code}};
 return{data:structuredClone(model)};
};
const window={DuydumCatalog:catalog,DuydumAuth:{ready:Promise.resolve(),getUser:()=>currentUser,getClient:()=>({rpc})},DuydumProfile:{finishRound(){soloWrites++}},scrollTo(){},addEventListener(name,fn){handlers[name]=fn}};
const ctx={window,document:{getElementById:element,createElement:()=>element(crypto.randomUUID()),querySelector:()=>element('solo-label'),addEventListener(){},body:{classList:{add(){},remove(){}}}},Audio:AudioStub,crypto,sessionStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},navigator:{clipboard:{async writeText(){}}},setInterval(fn,ms){timers.push({fn,ms})},clearInterval(){},Date,Math,Promise};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);vm.runInContext(fs.readFileSync('rooms.js','utf8'),ctx);
(async()=>{
 element('start-solo').disabled=true;element('start-solo').events.click();assert.equal(window.DuydumRooms.active,false);
 element('open-rooms').events.click();await element('create-room').events.click();assert.equal(element('room-code-display').textContent,'ABCDE');assert(element('start-room-match').disabled);
 model.players.push(player('second','İki'));model.can_start=true;
 await timers.find(timer=>timer.ms===1500).fn();await new Promise(r=>setImmediate(r));
 await element('start-room-match').events.click();assert.equal(element('game-screen').hidden,false);
 await window.DuydumRooms.pass();assert.equal(vm.runInContext('stage',ctx),1);
 await window.DuydumRooms.guess('Snap');assert.equal(element('result').hidden,true);assert(element('guess').disabled);assert.equal(soloWrites,0);
 model.status='results';model.answer={song_id:'snap-beta-001',title:'Snap',artist:'Simitler'};model.next_round_at=new Date(Date.now()+4000).toISOString();
 await timers.find(timer=>timer.ms===1500).fn();await new Promise(r=>setImmediate(r));assert.equal(element('result-title').textContent,'Snap');
 element('room-return').events.click();assert.equal(element('rooms-screen').hidden,false);assert.equal(element('resume-room').hidden,false);
 await timers.find(timer=>timer.ms===1500).fn();await new Promise(r=>setImmediate(r));assert.equal(element('rooms-screen').hidden,false);
 element('resume-room').events.click();assert.equal(element('game-screen').hidden,false);
 await element('close-room').events.click();assert.equal(window.DuydumRooms.active,false);assert.equal(element('room-entry').hidden,false);
 assert.equal(new Set(requestIds).size,2);
 holdNext=true;const stale=element('create-room').events.click();await new Promise(r=>setImmediate(r));currentUser=null;handlers['duydum:account']();releaseRPC({data:structuredClone(model)});await stale;assert.equal(window.DuydumRooms.active,false,'stale account RPC must not reopen room');
 console.log('PASS: solo blocked; create/lobby; 2-player start; own-stage pass; no early answer; no solo writes; results; lobby/resume persists across polling; close.');
})().catch(error=>{console.error(error);process.exitCode=1});
