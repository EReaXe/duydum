/* Closed beta rooms: authenticated RPC, server-owned clock and match state. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),auth=window.DuydumAuth;
 let roomRevision=0;
 let state=null,busy=false,actionBusy=false,inFlight=Promise.resolve(),viewLobby=false,pendingIntent=null,lastKey=null,lastStage=-1,clockOffset=0,lastUser=auth.getUser()?.id||null,playingRequest=0;
 const audio=new Audio();audio.preload='metadata';
 const roomError={AUTH_REQUIRED:'Odaya girmek için önce giriş yap.',ROOM_NOT_FOUND:'Oda kapatılmış veya kod geçersiz.',NOT_MEMBER:'Bu odada değilsin. Kodla tekrar katıl.',HOST_ONLY:'Bu işlemi yalnız oda sahibi yapabilir.',NEED_PLAYERS:'Başlamak için en az 2 oyuncu gerekiyor.',ROOM_FULL:'Oda dolu. En fazla 8 oyuncu katılabilir.',ALREADY_IN_ROOM:'Önce bulunduğun odadan ayrıl. Oda oluştur düğmesiyle mevcut odana dönebilirsin.',CODE_GENERATION_FAILED:'Kod oluşturulamadı. Tekrar dene.',ROOM_IN_PROGRESS:'Maç sürüyor. Yeni maç için lobiyi bekle.',STAGE_CHANGED:'Dinleme aşaması başka sekmede değişti. Ekran güncelleniyor.',ROUND_CHANGED:'Tur değişti, ekran güncelleniyor.',ROUND_NOT_PLAYING:'Tur henüz başlamadı veya bitti.',PLAYER_DONE:'Bu turdaki hakların tamamlandı.',INVALID_REQUEST:'İşlem geçersiz. Tekrar dene.'};
 function say(text){$('rooms-message').textContent=text;$('room-waiting').textContent=state?text:'';if(state)$('status').textContent=text;}
 function remember(code){try{const id=auth.getUser()?.id;if(id){if(code)sessionStorage.setItem('duydum-room-'+id,code);else sessionStorage.removeItem('duydum-room-'+id);}}catch{}}
 function stopRoomAudio(){playingRequest++;audio.pause();$('play').classList.remove('is-playing');$('play').setAttribute('aria-label','Kesiti dinle');document.body.classList.remove('playing');}
 function resetRoom(){roomRevision++;stopRoomAudio();state=null;pendingIntent=null;lastKey=null;lastStage=-1;remember(null);window.DuydumRooms.active=false;$('room-scoreboard').hidden=true;$('room-return').hidden=true;$('back-home').hidden=false;$('room-waiting').textContent='';closeSuggestions();}
 function entry(){
  $('home-screen').hidden=true;$('game-screen').hidden=true;$('rooms-screen').hidden=false;
  $('room-entry').hidden=false;$('room-lobby').hidden=true;window.scrollTo({top:0,behavior:'instant'});
 }
 function listPlayers(target,players,ranked=false){
  target.replaceChildren();
  const sorted=ranked?[...players].sort((a,b)=>b.score-a.score):players;
  sorted.forEach((player,index)=>{
   const item=document.createElement('li'),name=document.createElement('strong'),detail=document.createElement('span');
   name.textContent=(ranked?(index+1)+'. ':'')+player.name+(player.user_id===state.host_id?' · Oda sahibi':'')+(player.user_id===auth.getUser()?.id?' · Sen':'');
   detail.textContent=ranked?player.score+' puan':state.status==='lobby'?'Hazır':player.score+' puan'+(player.done?(player.correct?' · Bildi':' · Tamamladı'):' · Dinliyor');
   item.append(name,detail);target.append(item);
  });
 }
 function renderRoom(next){
  if(next.closed){resetRoom();entry();say('Oda kapandı. Kod artık kullanılamaz.');return;}
  state=next;window.DuydumRooms.active=true;
  if(pendingIntent&&(pendingIntent.payload.match_id!==state.match_id||pendingIntent.payload.round!==state.round||pendingIntent.stage!==state.self.stage||state.self.done))pendingIntent=null;remember(state.code);
  clockOffset=Date.parse(state.server_time)-Date.now();if(!Number.isFinite(clockOffset))clockOffset=0;
  const host=state.host_id===auth.getUser()?.id;
  $('room-code-display').textContent=state.code;
  $('room-lobby').hidden=false;$('room-entry').hidden=true;
  $('close-room').hidden=!host;$('start-room-match').hidden=!host||state.status!=='lobby';
  $('start-room-match').disabled=actionBusy||!state.can_start;
  $('replay-room').hidden=!host||state.status!=='finished';$('replay-room').disabled=actionBusy||state.players.length<2;
  $('room-match-summary').hidden=state.status!=='finished';
  listPlayers($('room-players'),state.players);listPlayers($('room-ranking'),state.players,true);
  $('room-state-text').textContent=state.status==='finished'?'Maç bitti. Aynı kodla yeniden oynayabilirsiniz.':state.status==='lobby'?(state.players.length<2?'Bir arkadaşını davet et. Başlamak için en az 2 kişi gerekiyor.':host?'Arkadaşların geldi. Hazırsanız maçı başlat.':'Oda sahibinin maçı başlatması bekleniyor.'):'Maç devam ediyor.';
  const activeMatch=state.status==='playing'||state.status==='results';
  const inGame=activeMatch&&!viewLobby;
  $('resume-room').hidden=!activeMatch;
  $('room-waiting').hidden=!inGame;
  $('room-scoreboard-panel').hidden=!inGame;
  $('home-screen').hidden=true;$('rooms-screen').hidden=inGame;$('game-screen').hidden=!inGame;
  $('room-return').hidden=!inGame;$('back-home').hidden=true;
  $('room-scoreboard').hidden=!inGame;
  $('room-round-info').textContent='ODA '+state.code+' · TUR '+state.round+'/10';
  if(!inGame){stopRoomAudio();closeSuggestions();return;}
  const key=state.match_id+':'+state.round,song=window.DuydumCatalog.songs.find(song=>song.id===state.song_id);
  if(key!==lastKey){
   stopRoomAudio();closeSuggestions();lastKey=key;lastStage=-1;
   $('guess').value='';$('status').textContent='';$('save-status').textContent='';$('retry-save').hidden=true;
   $('result-title').textContent='';$('result-artist').textContent='';$('result-cover').src='assets/covers/fallback.svg';
   if(song){audio.src=song.audio;audio.load();}
  }
  stage=state.self.stage;started=true;finished=state.status!=='playing'||state.self.done;
  if(stage!==lastStage||finished){stopRoomAudio();closeSuggestions();lastStage=stage;}
  render();$('round').textContent=state.round+'/10';$('total').textContent=state.players.find(p=>p.user_id===auth.getUser()?.id)?.score||0;
  document.querySelector('.solo-label').textContent='ARKADAŞLAR';
  $('restart').hidden=true;
  document.querySelector('.result-note').textContent='Maç bitince aynı odada Tekrar oyna ile yeni bir maç başlatabilirsiniz.';
  const results=state.status==='results';
  $('result').hidden=!results;$('play-area').hidden=results;
  for(const id of ['guess','submit','pass','play'])$(id).disabled=actionBusy||finished;
  if(results&&state.answer){
   const revealed=window.DuydumCatalog.songs.find(song=>song.id===state.answer.song_id);
   $('result-title').textContent=state.answer.title;$('result-artist').textContent=state.answer.artist;
   $('result-cover').src=revealed?.cover||'assets/covers/fallback.svg';$('result-cover').alt=state.answer.artist+' — '+state.answer.title+' kapağı';
   $('result-label').textContent=state.self.correct?'DUYDUN!':'ŞARKI BUYDU';
   $('result-detail').textContent=state.self.correct?[1,2,4,7,11,16][state.self.stage]+' saniyelik kesitte bildin':'Bu turdan puan alamadın';
   $('result-points').textContent='+'+state.self.round_points+' puan';
   $('save-status').textContent='Arkadaş maçı · Ranked ve solo deneme puanını etkilemez.';
  }
  $('hint').textContent=state.self.done?'Senin turun bitti. Diğer oyuncular bekleniyor.':'Kesiti dinle, tahminini yaz veya Pas geç.';
  listPlayers($('room-scoreboard'),state.players,true);
  $('feed').replaceChildren();
  for(const event of [...state.events].reverse().slice(0,30)){const item=document.createElement('li');item.textContent=event.message;$('feed').append(item);}
  tick();
 }
 async function request(action,payload={},code=state?.code){
  if(busy){if(action==='state')return;await inFlight;}
  await auth.ready;
  if(busy)return;
  if(!auth.getUser()){entry();say('Oda oluşturmak veya katılmak için üst menüden giriş yap.');return;}
  const requestOwner=auth.getUser().id,epoch=roomRevision;
  busy=true;actionBusy=action!=='state';let release;inFlight=new Promise(resolve=>{release=resolve;});
  if(actionBusy)for(const id of ['create-room','join-room','start-room-match','replay-room','leave-room','close-room','submit','pass'])$(id).disabled=true;
  try{
   const {data,error}=await auth.getClient().rpc('duydum_room',{p_action:action,p_code:code||null,p_payload:payload});
   if(requestOwner!==auth.getUser()?.id||epoch!==roomRevision)return;
   if(error)throw error;
   if(['create','join','start','replay'].includes(action)){viewLobby=false;window.scrollTo({top:0,behavior:'instant'});}
   if(data.closed){resetRoom();entry();say(action==='leave'?'Odadan ayrıldın.':'Oda kapandı. Kod artık kullanılamaz.');return;}
   if(action==='guess'||action==='pass')pendingIntent=null;
   say('');renderRoom(data);
  }catch(error){
   if(requestOwner!==auth.getUser()?.id||epoch!==roomRevision)return;
   const key=Object.keys(roomError).find(key=>(error.message||'').includes(key));
   if(['STAGE_CHANGED','ROUND_CHANGED','PLAYER_DONE','ROUND_NOT_PLAYING'].includes(key))pendingIntent=null;
   if(key==='ROOM_NOT_FOUND'||key==='NOT_MEMBER'){resetRoom();entry();}
   say(roomError[key]||'Bağlantı kurulamadı. Tekrar deneniyor; internetini kontrol et.');
  }finally{
   busy=false;actionBusy=false;release();
   for(const id of ['create-room','join-room','leave-room','close-room'])$(id).disabled=false;
   if(state){$('start-room-match').disabled=!state.can_start;$('replay-room').disabled=state.players.length<2;
    for(const id of ['guess','submit','pass','play'])$(id).disabled=state.status!=='playing'||state.self.done;
   }
  }
 }
 function act(action,guess){
  if(!state||state.status!=='playing'||state.self.done||actionBusy)return;
  stopRoomAudio();closeSuggestions();
  if(!pendingIntent)pendingIntent={action,stage:state.self.stage,payload:{request_id:crypto.randomUUID(),match_id:state.match_id,round:state.round,stage:state.self.stage,...(guess?{guess}:{})}};
  return request(pendingIntent.action,pendingIntent.payload);
 }
 function tick(){
  if(!state)return;
  const now=Date.now()+clockOffset;
  if(state.status==='playing'){
   const seconds=Math.max(0,Math.ceil((Date.parse(state.round_ends_at)-now)/1000));
   $('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
   $('room-waiting').textContent=state.self.done?'Senin turun bitti. Herkes tamamlayınca sonraki şarkıya geçilecek.':'';
   if(seconds===0){stopRoomAudio();for(const id of ['guess','submit','pass','play'])$(id).disabled=true;}
  }else if(state.status==='results'){
   const seconds=Math.max(0,Math.ceil((Date.parse(state.next_round_at)-now)/1000));
   $('room-waiting').textContent=state.round===10?'Maç sonuçları açılıyor…':'Sonraki şarkı '+seconds+' saniye içinde…';
  }
 }
 window.DuydumRooms={active:false,
  async play(){
   if(actionBusy||!state||state.status!=='playing'||state.self.done)return;
   if(!audio.paused){stopRoomAudio();return;}
   const key=lastKey,requestId=++playingRequest;
   try{audio.currentTime=0;await audio.play();
    if(requestId!==playingRequest||key!==lastKey||state.self.done){stopRoomAudio();return;}
    $('play').classList.add('is-playing');$('play').setAttribute('aria-label','Kesiti durdur');document.body.classList.add('playing');
   }catch{say('Ses açılamadı. Oynat düğmesine tekrar bas.');}
  },pass:()=>act('pass'),guess:value=>act('guess',value)
 };
 audio.addEventListener('ended',stopRoomAudio);
 setInterval(()=>{if(!audio.paused&&audio.currentTime>=[1,2,4,7,11,16][state?.self.stage||0])stopRoomAudio();tick();},80);
 setInterval(()=>{if(state&&!busy)request('state');},1500);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopRoomAudio();else if(state&&!busy)request('state');});
 $('open-rooms').addEventListener('click',()=>{entry();if(state)renderRoom(state);else say(auth.getUser()?'Odanı oluştur veya arkadaşının 5 haneli kodunu gir.':'Önce üst menüden giriş yap.');});
 $('create-room').addEventListener('click',()=>request('create',{},null));
 $('join-room-form').addEventListener('submit',event=>{event.preventDefault();const code=$('room-code').value.trim().toUpperCase();if(!/^[A-Z0-9]{5}$/.test(code)){say('5 haneli oda kodunu yaz.');return;}request('join',{},code);});
 $('room-code').addEventListener('input',()=>{$('room-code').value=$('room-code').value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,5);});
 $('copy-room-code').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(state.code);say('Oda kodu kopyalandı.');}catch{say('Kod: '+state.code+' — seçip kopyalayabilirsin.');}});
 $('start-room-match').addEventListener('click',()=>request('start'));
 $('replay-room').addEventListener('click',()=>request('replay'));
 $('leave-room').addEventListener('click',()=>request('leave'));
 $('close-room').addEventListener('click',()=>request('close'));
 $('room-return').addEventListener('click',()=>{viewLobby=true;stopRoomAudio();renderRoom(state);say('Tur saati devam ediyor. Maça dön veya odadan ayrıl.');});
 $('resume-room').addEventListener('click',()=>{viewLobby=false;renderRoom(state);});
 $('rooms-back').addEventListener('click',()=>{if(state){say('Önce odadan ayrıl veya odayı kapat.');return;}$('rooms-screen').hidden=true;$('home-screen').hidden=false;});
 window.addEventListener('duydum:account',()=>{
  const id=auth.getUser()?.id||null;
  if(lastUser&&id!==lastUser){resetRoom();entry();say('Hesap değişti. Odaya tekrar katılmalısın.');}
  lastUser=id;
 });
 auth.ready.then(()=>{
  try{const id=auth.getUser()?.id,code=id&&sessionStorage.getItem('duydum-room-'+id);if(code)request('state',{},code);}catch{}
 });
})();
