'use strict';
const stages=[1,2,4,7,11,16], rewards=[1000,850,700,500,300,100];
const $=id=>document.getElementById(id);
const deck=window.DuydumCatalog.createDeck();
let selection=deck.next(), currentSong=selection.song;
const audio=new Audio(currentSong.audio);
audio.preload='metadata';
let stage=0,started=false,finished=false,deadline=0,total=0,round=1,loading=false,clipTimer,roundRecord=null,playRequest=0;
function log(message){const item=document.createElement('li');item.textContent=message;$('feed').prepend(item);}
function stop(){
 playRequest++;audio.pause();clearInterval(clipTimer);
 $('play').classList.remove('is-playing');$('play').setAttribute('aria-label','Kesiti dinle');document.body.classList.remove('playing');
}
function render(){
 $('steps').replaceChildren(...stages.map((s,i)=>{const el=document.createElement('div');el.className='step'+(i<=stage?' active':'');el.textContent=s+' sn';return el;}));
 $('duration').textContent=stages[stage]+' saniye';$('points').textContent=rewards[stage]+' PUAN';
}
function end(won){
 if(finished)return;
 finished=true;stop();closeSuggestions();
 const earned=won?rewards[stage]:0;total+=earned;$('total').textContent=total;
 $('status').textContent=(won?'Doğru! ':'Cevap: ')+currentSong.artist+' — '+currentSong.title+(won?' · +'+earned+' puan':'. Bu tur 0 puan.');
 log(won?'Sen, '+stages[stage]+' saniyelik kesitte bildin! +'+earned+' puan.':'Tur bitti. Şarkı: '+currentSong.title+'.');
 for(const id of ['guess','submit','pass','play'])$(id).disabled=true;
 $('restart').hidden=false;$('play-area').hidden=true;$('result').hidden=false;
 $('result-title').textContent=currentSong.title;$('result-artist').textContent=currentSong.artist;
 $('result-cover').src=currentSong.cover;
 $('result-cover').alt=currentSong.artist+' — '+currentSong.title+' kapağı';
 $('result-label').textContent=won?'DUYDUN!':'ŞARKI BUYDU';
 $('result-detail').textContent=won?stages[stage]+' saniyelik kesitte bildin':'Bu tur şarkıyı bulamadın';
 $('result-points').textContent='+'+earned+' puan';$('restart').focus();
 window.DuydumProfile?.finishRound(roundRecord,won,stage);
 $('hint').textContent='Bir sonraki şarkı hazır.';
}
function advance(){closeSuggestions();stop();if(stage===5){end(false);return;}stage++;render();$('guess').value='';$('hint').textContent='Yeni kesit hazır. Dinlemek için oynat.';}
$('result-cover').addEventListener('error',()=>{
 const fallback='assets/covers/fallback.svg';
 if(!$('result-cover').src.endsWith('/fallback.svg')){$('result-cover').src=fallback;$('result-cover').alt='Şarkı için yedek kapak';}
});
$('play').addEventListener('click',async()=>{
 if(window.DuydumRooms?.active){return window.DuydumRooms.play();}
 if(loading||finished)return;
 if(started&&Date.now()>=deadline){end(false);return;}
 if(!audio.paused){stop();return;}
 loading=true;$('play').disabled=true;const request=++playRequest;
 try{
  await window.DuydumAuth?.ready;
  if(request!==playRequest||$('game-screen').hidden)return;
  audio.currentTime=0;await audio.play();
  if(finished||request!==playRequest||$('game-screen').hidden){stop();return;}
  if(!started){
   roundRecord=window.DuydumProfile?.beginRound(currentSong.id);started=true;deadline=Date.now()+60000;
   for(const id of ['guess','submit','pass'])$(id).disabled=false;
   log('Tur başladı. 60 saniyen var.');
  }
  clipTimer=setInterval(()=>{if(audio.currentTime>=stages[stage])stop();},10);
  $('play').classList.add('is-playing');$('play').setAttribute('aria-label','Kesiti durdur');document.body.classList.add('playing');
  $('hint').textContent='Açılan kesiti dilediğin kadar tekrar dinleyebilirsin.';
 }catch{stop();$('hint').textContent='Ses açılamadı. Yeniden dinlemeyi dene; dosya yüklenmeden tur başlamaz.';}
 finally{loading=false;$('play').disabled=finished;}
});
audio.addEventListener('ended',stop);
audio.addEventListener('timeupdate',()=>{if(audio.currentTime>=stages[stage])stop();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
$('pass').addEventListener('click',()=>{if(window.DuydumRooms?.active){return window.DuydumRooms.pass();}if(finished||!started)return;if(Date.now()>=deadline){end(false);return;}log('Sen pas geçtin.');advance();});
$('guess-form').addEventListener('submit',event=>{
 event.preventDefault();if(window.DuydumRooms?.active){const value=$('guess').value.trim();if(value)return window.DuydumRooms.guess(value);return;}if(finished||!started)return;
 if(Date.now()>=deadline){end(false);return;}
 const guess=$('guess').value.trim();if(!guess){$('guess').focus();return;}
 log('Sen tahmin yaptın.');
 if(window.DuydumCatalog.matches(currentSong,guess))end(true);
 else{$('status').textContent='Bu değil! Bir sonraki kesit açıldı.';advance();}
});
$('restart').addEventListener('click',()=>{
 closeSuggestions();
 if(loading)return;
 stop();selection=deck.next();currentSong=selection.song;
 audio.src=currentSong.audio;audio.load();
 stage=0;started=false;finished=false;roundRecord=null;round++;
 $('round').textContent=String(round).padStart(2,'0');$('timer').textContent='01:00';
 $('status').textContent='';$('guess').value='';$('save-status').textContent='';$('retry-save').hidden=true;
 $('restart').hidden=true;$('play-area').hidden=false;$('result').hidden=true;$('play').disabled=false;
 // Cevap içeriğini yeni turda temizle; kapak yalnız tur sonunda açılır.
 $('result-title').textContent='';$('result-artist').textContent='';$('result-cover').src='assets/covers/fallback.svg';$('result-cover').alt='Yedek şarkı kapağı';
 $('hint').textContent='Başlamak için kesiti dinle.';
 if(selection.remaining===window.DuydumCatalog.songs.length-1&&selection.cycle>1)log('Katalog tamamlandı. Yeni karışık döngü başladı.');
 render();$('play').focus();
});
setInterval(()=>{
 if(window.DuydumRooms?.active||!started||finished)return;
 const remaining=Math.max(0,Math.ceil((deadline-Date.now())/1000));
 $('timer').textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
 if(!remaining)end(false);
},100);
render();
$('start-solo').addEventListener('click',()=>{
 if($('start-solo').disabled)return;
 $('home-screen').hidden=true;$('game-screen').hidden=false;
 if(finished)$('restart').click();
 $('play').focus();window.scrollTo({top:0,behavior:'instant'});
});
$('back-home').addEventListener('click',()=>{
 if(window.DuydumRooms?.active)return;
 closeSuggestions();
 stop();if(started&&!finished)end(false);
 $('game-screen').hidden=true;$('home-screen').hidden=false;
 $('start-solo').focus();window.scrollTo({top:0,behavior:'instant'});
});

// Öneriler yalnız yazılan metne ve genel kataloğa bağlıdır; tur cevabına bakmaz.
let suggestedSongs=[],activeSuggestion=-1;
function closeSuggestions(){
 suggestedSongs=[];activeSuggestion=-1;$('guess-suggestions').replaceChildren();$('guess-suggestions').hidden=true;
 $('guess').setAttribute('aria-expanded','false');$('guess').removeAttribute('aria-activedescendant');$('suggestion-status').textContent='';
}
function chooseSuggestion(index){
 if(!suggestedSongs[index]||finished||!started)return;
 $('guess').value=suggestedSongs[index].title;closeSuggestions();$('guess').focus();
}
function showSuggestions(){
 if(!started||finished||$('guess').disabled){closeSuggestions();return;}
 suggestedSongs=window.DuydumCatalog.suggest($('guess').value);activeSuggestion=-1;
 $('guess-suggestions').replaceChildren();$('guess').removeAttribute('aria-activedescendant');
 suggestedSongs.forEach((song,index)=>{
  const option=document.createElement('button');option.type='button';option.tabIndex=-1;option.id='guess-option-'+index;
  option.className='guess-option';option.setAttribute('role','option');option.setAttribute('aria-selected','false');
  const title=document.createElement('strong');title.textContent=song.title;
  const artist=document.createElement('span');artist.textContent=song.artist;
  option.append(title,artist);
  option.addEventListener('pointerdown',event=>event.preventDefault());
  option.addEventListener('click',()=>chooseSuggestion(index));
  $('guess-suggestions').append(option);
 });
 const open=suggestedSongs.length>0;$('guess-suggestions').hidden=!open;$('guess').setAttribute('aria-expanded',String(open));
 $('suggestion-status').textContent=open?suggestedSongs.length+' öneri. Yukarı aşağı oklarla seç, Enter ile alana ekle.':($('guess').value.trim()?'Eşleşen şarkı yok. Tahminini kendin yazabilirsin.':'');
}
$('guess').addEventListener('input',showSuggestions);
$('guess').addEventListener('focus',showSuggestions);
$('guess').addEventListener('blur',closeSuggestions);
$('guess').addEventListener('keydown',event=>{
 if(event.isComposing)return;
 if(event.key==='Escape'){if(!$('guess-suggestions').hidden){event.preventDefault();closeSuggestions();}return;}
 if(!suggestedSongs.length)return;
 if(event.key==='ArrowDown'||event.key==='ArrowUp'){
  event.preventDefault();
  activeSuggestion=event.key==='ArrowDown'?(activeSuggestion+1)%suggestedSongs.length:(activeSuggestion<=0?suggestedSongs.length-1:activeSuggestion-1);
  [...$('guess-suggestions').children].forEach((option,index)=>option.setAttribute('aria-selected',String(index===activeSuggestion)));
  $('guess').setAttribute('aria-activedescendant','guess-option-'+activeSuggestion);
 }else if(event.key==='Enter'&&activeSuggestion>=0){event.preventDefault();chooseSuggestion(activeSuggestion);}
});
