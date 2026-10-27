/* Offline Solo run. Signed-in scoring and timing are authoritative on server. */
(function(root){
 'use strict';
 const TEMPLATE_COUNT=18;
 function generate(random=Math.random,kind){
  const n=(a,b)=>a+Math.floor(random()*(b-a+1));
  const type=kind??n(0,TEMPLATE_COUNT-1),a=n(2,12),b=n(2,9),c=n(2,12);
  let text,answer,category;
  switch(type){
   case 0:text=`${a} + ${b} × ${c} = ?`;answer=a+b*c;category='İşlem önceliği';break;
   case 1:text=`□ × ${b} = ${a*b}`;answer=a;category='Eksik çarpan';break;
   case 2:text=`${a*2} sayısının yarısının ${b} fazlası?`;answer=a+b;category='Yarısını bul';break;
   case 3:text=`${a}, ${a+b}, ${a+2*b}, □`;answer=a+3*b;category='Artan örüntü';break;
   case 4:text=`(${a*b-c} + ${c}) ÷ ${b} = ?`;answer=a;category='Parantezi çöz';break;
   case 5:text=`${a} × ${b} − ${c} = ?`;answer=a*b-c;category='Çarp ve çıkar';break;
   case 6:text=`${a} + ${b} + □ = ${a+b+c}`;answer=c;category='Eksik toplanan';break;
   case 7:{const p=[10,20,25,50][n(0,3)];text=`${20*a} sayısının %${p}’si kaçtır?`;answer=20*a*p/100;category='Yüzde hesabı';break;}
   case 8:text=`${4*a} sayısının çeyreğinin ${b} fazlası?`;answer=a+b;category='Çeyreğini bul';break;
   case 9:text=`${a} sayısının karesi kaçtır?`;answer=a*a;category='Kare sayılar';break;
   case 10:text=`${a} sayısının 2 katının ${b} eksiği?`;answer=2*a-b;category='İki adımlı işlem';break;
   case 11:text=`Kenarları ${a} ve ${b} cm olan dikdörtgenin çevresi kaç cm?`;answer=2*(a+b);category='Dikdörtgen çevresi';break;
   case 12:text=`${a} ve ${a+2*b} sayılarının ortalaması kaçtır?`;answer=a+b;category='Ortalama';break;
   case 13:{const hours=n(1,3);text=`${hours} saat ${b} dakika toplam kaç dakikadır?`;answer=60*hours+b;category='Zaman dönüşümü';break;}
   case 14:{const metres=n(1,5);text=`${metres} metre ${b} santimetre toplam kaç santimetredir?`;answer=100*metres+b;category='Uzunluk dönüşümü';break;}
   case 15:{const remainder=n(1,b-1);text=`${a*b+remainder} sayısının ${b} ile bölümünden kalan kaçtır?`;answer=remainder;category='Bölümden kalan';break;}
   case 16:text=`${a}, ${2*a}, ${4*a}, □`;answer=8*a;category='Katlanan örüntü';break;
   case 17:text=`□ ÷ ${b} = ${a}`;answer=a*b;category='Eksik bölünen';break;
   default:throw Error('Unknown question type');
  }
  return{text,answer,category,kind:type};
 }
 function parse(value){const s=String(value).trim();return /^-?\d{1,6}$/.test(s)?Number(s):null;}
 class Practice{
  constructor(now=Date.now,random=Math.random){this.now=now;this.random=random;this.round=0;this.score=0;this.correct=0;this.status='idle';this.history=[];this.bag=[];this.lastFeedback=null;}
  start(){if(this.status!=='idle')return this;this.deadline=this.now()+90000;this.status='playing';this.next();return this;}
  next(){
   if(this.status!=='playing')return;
   if(!this.bag.length){this.bag=Array.from({length:TEMPLATE_COUNT},(_,i)=>i);for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];}if(this.question?.kind===this.bag[this.bag.length-1])[this.bag[0],this.bag[this.bag.length-1]]=[this.bag[this.bag.length-1],this.bag[0]];}
   this.question=generate(this.random,this.bag.pop());this.history.push(this.question);if(this.history.length>30)this.history.shift();this.round++;this.cooldown=0;this.feedback='';
  }
  answer(value){
   this.tick();if(this.status!=='playing'||this.now()<this.cooldown)return false;const answer=parse(value);if(answer===null)return false;
   if(answer===this.question.answer){this.lastFeedback={correct:true,answer,bonus_seconds:5,round:this.round};this.score+=100;this.correct++;this.deadline+=5000;this.next();return true;}
   this.cooldown=this.now()+3000;this.lastFeedback={correct:false,bonus_seconds:0,round:this.round};this.feedback='Yanlış cevap. 3 saniye sonra tekrar dene.';return false;
  }
  skip(){this.tick();if(this.status==='playing'&&this.now()>=this.cooldown){this.lastFeedback={correct:false,skipped:true,answer:this.question.answer,bonus_seconds:0,round:this.round};this.next();}}
  tick(){if(this.feedback&&this.now()>=this.cooldown)this.feedback='';if(this.status==='playing'&&this.now()>=this.deadline)this.status='finished';return this;}
  state(){this.tick();return{status:this.status,mode:'solo',format_version:2,round:this.round,total_rounds:null,question:{text:this.question?.text,category:this.question?.category},deadline:this.deadline?new Date(this.deadline).toISOString():null,server_time:new Date(this.now()).toISOString(),last_feedback:this.lastFeedback,answer:this.status==='finished'?this.question?.answer:null,self:{name:'Sen',score:this.score,correct:this.correct,answered:this.status==='finished',cooldown_until:new Date(this.cooldown||0).toISOString()},players:[]};}
 }
 const api={TEMPLATE_COUNT,generate,parse,Practice};root.MathRace=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
