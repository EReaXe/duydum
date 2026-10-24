'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const nodes={},el=id=>nodes[id]??={textContent:'',value:'',hidden:false,disabled:false,open:false,events:{},addEventListener(t,f){this.events[t]=f},querySelectorAll(){return[]},reset(){},reportValidity(){return true},focus(){},close(){this.open=false},showModal(){this.open=true}};
const person={id:'A',user_metadata:{display_name:'Oyuncu A'}};let change,releaseVerify;
const auth={onAuthStateChange(fn){change=fn},async getSession(){change('INITIAL_SESSION',{user:person});return{data:{session:{user:person}}}},getUser(){return new Promise(resolve=>{releaseVerify=resolve})},async signOut(){change('SIGNED_OUT',null);return{error:null}}};
const window={DUYDUM_CONFIG:{supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test'},supabase:{createClient(){return{auth}}},dispatchEvent(){}};
const context={window,document:{getElementById:el,querySelectorAll(){return[]}},location:{protocol:'https:',hash:''},URLSearchParams,CustomEvent:class{},history:{replaceState(){}},TypeError};
vm.createContext(context);vm.runInContext(fs.readFileSync('auth.js','utf8'),context);
(async()=>{await new Promise(r=>setImmediate(r));assert.equal(window.DuydumAuth.getUser().id,'A');await el('logout').events.click();assert.equal(window.DuydumAuth.getUser(),null);releaseVerify({data:{user:person},error:null});await window.DuydumAuth.ready;assert.equal(window.DuydumAuth.getUser(),null);assert.equal(el('open-profile').hidden,true);console.log('PASS: delayed auth verification cannot restore logged-out user.');})();
for(const base of ['https://ereaxe.github.io/duydum/','https://ereaxe.github.io/duydum/index.html','http://localhost:3000/index.html']){
 const ctx={window:{},location:{protocol:new URL(base).protocol},document:{baseURI:base},URL};vm.runInNewContext(fs.readFileSync('config.js','utf8'),ctx);assert.equal(ctx.window.DUYDUM_CONFIG.authRedirectUrl,new URL('./',base).href);
}
console.log('PASS: Pages and localhost redirect base paths.');
