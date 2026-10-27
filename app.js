/* Math race UI. Server state is authoritative for signed-in games. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),auth=window.DuydumAuth;
let practice=null,state=null,active=false,queued=false,busy=false,polling=false,epoch=0,offset=0,period='weekly',boardEpoch=0,profileEpoch=0,owner=null,requestPending=null,mutation=0,feedbackKey=null,waitingStart=false,publicProfileEpoch=0,publicProfileOpener=null;
const user=()=>auth.getUser(),message=t=>{$('global-message').textContent=t;};
function view(id){const changed=$(id).hidden;if(changed&&typeof window.scrollTo==='function')window.scrollTo(0,0);for(const name of ['home-screen','game-screen','result-screen'])$(name).hidden=name!==id;}
function storageGet(){try{return JSON.parse(sessionStorage.getItem('math-session')||'null');}catch{return null;}}
function remember(){try{if(active&&state?.session_id)sessionStorage.setItem('math-session',JSON.stringify({id:state.session_id,owner:user()?.id}));else sessionStorage.removeItem('math-session');}catch{}}
function rank(elo){return elo>=1800?'Dâhi':elo>=1600?'Üstat':elo>=1400?'Stratejist':elo>=1200?'Çözücü':elo>=1000?'Hesapçı':'Çırak';}
async function rpc(action,payload={}){const client=auth.getClient();if(!client)throw Error('Hesap bağlantısı kurulamadı.');const {data,error}=await client.rpc('math_game',{p_action:action,p_payload:payload});if(error)throw error;return data;}
function errorText(error){const text=String(error?.message||'');if(/START_RATE_LIMITED/.test(text))return 'Kısa sürede çok fazla oyun başlatıldı. Biraz bekleyip yeniden dene.';if(/RATE_LIMITED/.test(text))return 'Çok sık istek gönderildi. Kısa bir süre bekleyip yeniden dene.';if(/AUTH|JWT|login/i.test(text))return 'Bu işlem için yeniden giriş yap.';if(/STALE|ROUND|STAGE/i.test(text))return 'Soru değişti. Güncel soru yükleniyor.';if(/COOLDOWN/i.test(text))return 'Tekrar denemeden önce kısa bekleme süresini tamamla.';return 'Sunucuya ulaşılamadı. Bağlantını kontrol et; yeniden deneyebilirsin.';}
function render(next){
 const previous=state;state=next;if(next.server_time)offset=Date.parse(next.server_time)-Date.now();queued=next.status==='queued';$('start-solo').disabled=queued;$('start-ranked').disabled=queued;$('cancel-queue').hidden=!queued;$('queue-status').textContent=queued?'Eşdeğer bir rakip aranıyor… Bu sayfada kal.':'';
 if(queued){view('home-screen');return;}
 if(next.status==='idle'){active=false;remember();view('home-screen');return;}
 active=true;remember();
 const self=next.self||{},opponent=(next.players||[]).find(p=>p.user_id!==self.user_id);
 if(next.status==='finished'){
  active=false;remember();view('result-screen');$('result-title').textContent=next.mode==='ranked'?(next.outcome==='win'?'Düelloyu kazandın!':next.outcome==='loss'?'Bu kez rakibin kazandı.':next.outcome==='draw'?'Berabere!':'Maç tamamlandı!'):'Koşu tamamlandı!';
  $('result-score-label').textContent=next.mode==='ranked'?'DOĞRU CEVAP':'SOLO PUANI';$('result-score').textContent=next.mode==='ranked'?(self.correct||0):(self.score||0);$('result-detail').textContent=next.mode==='ranked'?`${self.correct||0} doğru · ${next.finish_reason==='timeout'?(next.outcome==='win'?'Rakibinin süresi doldu.':next.outcome==='loss'?'Süren doldu.':'Saatler aynı anda doldu.'):next.finish_reason==='double_disconnect'?'Bağlantılar kesildi; Elo değişmedi.':next.finish_reason==='disconnect'?'Bağlantı kesilmesiyle maç sona erdi.':next.finish_reason==='forfeit'?'Maçtan ayrılma nedeniyle sonuçlandı.':'Ranked düello'}`:`${self.correct||0} doğru · ${Math.max(0,next.round-1)} soru tamamlandı · Solo koşu`;
  $('result-elo').textContent=next.mode==='ranked'?`${Number(self.elo_delta)>=0?'+':''}${self.elo_delta||0} Elo · ${self.elo||1000} Elo · ${rank(self.elo||1000)}`:practice?'Misafir koşusu: sonuç yalnız bu cihazdaki geçmişinde.':'Solo puanın liderlik tablosuna kaydedildi. Elo değişmedi.';
  if(previous?.status!=='finished'){$('result-home').focus();if(practice)saveLocal(self);loadBoard();}return;
 }
 view('game-screen');$('leave-game').textContent=next.mode==='ranked'?'Ayrıl (hükmen yenilgi)':'← Oyundan ayrıl';$('game-mode').textContent=next.mode==='ranked'?'RANKED · DÜELLO':practice?'SOLO · MİSAFİR':'SOLO · LİDERLİK';$('question-counter').textContent=next.total_rounds===null?`SORU ${next.round}`:`SORU ${next.round} / 10`;$('game-progress').hidden=next.total_rounds===null||next.mode==='solo';$('game-progress').value=next.round-1;$('question-category').textContent=next.question?.category||'CEVAP SENDE';
 $('question-text').textContent=next.question?.text||'Soru hazırlanıyor…';$('game-score-label').textContent=next.mode==='ranked'?'DOĞRU CEVABIN':'SOLO PUANIN';$('game-score').textContent=next.mode==='ranked'?(self.correct||0):(self.score||0);$('opponent-panel').hidden=next.mode!=='ranked';$('opponent-name').textContent=opponent?.name||'Rakip';$('opponent-score').textContent=opponent?.correct||0;
 const changed=previous?.round!==next.round||previous?.session_id!==next.session_id||(!previous?.question&&!!next.question);
 if(changed){$('answer-input').value='';$('answer-feedback').textContent='';$('answer-feedback').classList.remove('time-bonus');requestPending=null;}
 if(next.status==='reveal')$('answer-feedback').textContent=`Doğru cevap: ${next.answer}. Sonraki soru hazırlanıyor…`;
 else if(self.answered)$('answer-feedback').textContent='Doğru! Rakibin bekleniyor…';
 else if(practice?.feedback)$('answer-feedback').textContent=practice.feedback;
 const feedback=next.last_feedback;const key=feedback?`${next.session_id||'guest'}:${feedback.round}:${feedback.correct}:${feedback.skipped}`:null;if(feedback&&key!==feedbackKey){feedbackKey=key;if(feedback.correct){$('answer-feedback').textContent=next.mode==='ranked'?'Doğru! Kendi saatine +5 saniye':'Doğru! +100 puan · +5 saniye';$('answer-feedback').classList.add('time-bonus');}else if(feedback.skipped){$('answer-feedback').textContent=`Geçilen sorunun cevabı: ${feedback.answer}. Süre eklenmedi.`;$('answer-feedback').classList.remove('time-bonus');}}
 $('skip-question').hidden=next.mode==='ranked';$('next-question').hidden=true;
 controls();if(changed)$('answer-input').focus({preventScroll:true});
}
function controls(){
 if(!state||!active)return;
 const now=Date.now()+offset,start=state.starts_at?Date.parse(state.starts_at):0,untilStart=Math.max(0,Math.ceil((start-now)/1000));
 const ownDeadline=Date.parse(state.self?.deadline||state.deadline),remaining=Math.max(0,Math.ceil((ownDeadline-Math.max(now,start||0))/1000));
 const opponent=(state.players||[]).find(p=>p.user_id!==state.self?.user_id),opponentDeadline=Date.parse(opponent?.deadline||'');
 const rivalRemaining=Number.isFinite(opponentDeadline)?Math.max(0,Math.ceil((opponentDeadline-Math.max(now,start||0))/1000)):null;
 $('timer').textContent=String(remaining).padStart(2,'0');$('opponent-timer').textContent=rivalRemaining===null?'—':String(rivalRemaining).padStart(2,'0');
 $('game-start-message').textContent=untilStart>0?'Düello '+untilStart+' saniye içinde başlıyor. İki saat birlikte başlayacak.':remaining===0||rivalRemaining===0?'Süre doldu. Maç sonucu doğrulanıyor…':'';
 const cooldown=state.self?.cooldown_until?Date.parse(state.self.cooldown_until):0;const wait=Math.max(0,Math.ceil((cooldown-now)/1000));
 const locked=busy||state.status!=='playing'||!state.question||!!state.self?.answered||remaining===0||rivalRemaining===0||untilStart>0||wait>0;
 $('answer-input').disabled=locked;$('answer-submit').disabled=locked;$('skip-question').disabled=locked;
 if(wait)$('answer-feedback').textContent='Yanlış cevap. '+wait+' saniye sonra tekrar dene.';
 else if(state.status==='playing'&&!state.self?.answered&&/saniye sonra/.test($('answer-feedback').textContent)){$('answer-feedback').textContent='Tekrar deneyebilirsin.';if(!locked)$('answer-input').focus({preventScroll:true});}
 if(waitingStart&&untilStart===0&&!locked)$('answer-input').focus({preventScroll:true});waitingStart=untilStart>0;
}

function saveLocal(self){try{const history=JSON.parse(localStorage.getItem('math-practice-v1')||'[]');history.unshift({at:new Date().toISOString(),score:self.score,correct:self.correct});localStorage.setItem('math-practice-v1',JSON.stringify(history.slice(0,30)));}catch{}}
async function start(mode){if(busy||active||queued)return;busy=true;const token=++epoch;message('');try{await auth.ready;if(token!==epoch)return;if(mode==='ranked'&&!user()){message('Ranked için hesabına giriş yap.');$('open-login').click();return;}practice=null;state=null;feedbackKey=null;owner=user()?.id||null;if(mode==='solo'&&!user()){practice=new MathRace.Practice().start();render(practice.state());}else{const next=await rpc(mode==='solo'?'solo_start':'queue');if(token!==epoch)return;render(next);}}catch(error){if(token===epoch)message(errorText(error));}finally{busy=false;controls();if(active&&state?.status==='playing'&&!state.self?.answered)$('answer-input').focus();}}
async function answer(event){event.preventDefault();if(busy||!active||state?.status!=='playing')return;controls();if($('answer-submit').disabled)return;if(state.starts_at&&Date.now()+offset<Date.parse(state.starts_at))return;const raw=$('answer-input').value;if(MathRace.parse(raw)===null){$('answer-feedback').textContent='Cevabını tam sayı olarak yaz.';return;}if(practice){practice.answer(raw);render(practice.state());return;}busy=true;mutation++;const token=epoch;const round=state.round;
 if(!requestPending||requestPending.round!==round||requestPending.answer!==raw)requestPending={session_id:state.session_id,round,answer:raw,request_id:crypto.randomUUID()};controls();
 try{const next=await rpc(state.mode==='solo'?'solo_answer':'answer',requestPending);if(token!==epoch)return;requestPending=null;render(next);}catch(error){if(token===epoch)$('answer-feedback').textContent=errorText(error);}finally{busy=false;controls();if(token===epoch&&state?.round!==round&&state?.status==='playing')$('answer-input').focus({preventScroll:true});}}
async function poll(){if(polling||busy||(!active&&!queued)||practice)return;polling=true;const token=epoch,version=mutation;try{const next=await rpc('state',{session_id:state?.session_id});if(token===epoch&&version===mutation&&!busy){render(next);message('');}}catch(error){if(token===epoch)message(errorText(error));}finally{polling=false;}}
async function leave(){if(busy)return;if(!active&&!queued){view('home-screen');return;}busy=true;const token=epoch;try{if(!practice)await rpc('cancel',{session_id:state?.session_id});if(token!==epoch)return;epoch++;active=false;queued=false;practice=null;state=null;remember();$('cancel-queue').hidden=true;$('start-solo').disabled=false;$('start-ranked').disabled=false;$('queue-status').textContent='';view('home-screen');$('start-solo').focus();loadBoard();}catch(error){message(errorText(error));}finally{busy=false;}}
function avatarColor(value){return ['pink','green','yellow','purple'].includes(value)?value:'green';}
function rankLevel(elo){return elo>=1800?5:elo>=1600?4:elo>=1400?3:elo>=1200?2:elo>=1000?1:0;}
async function openPlayerProfile(id,opener){
 const token=++publicProfileEpoch;publicProfileOpener=opener;
 $('player-name').textContent='Oyuncu profili';$('player-avatar').textContent='?';$('player-avatar').dataset.avatar='green';$('player-rank').textContent='—';$('player-elo').textContent='';$('player-summary').textContent='';$('player-message').textContent='Profil yükleniyor…';
 if(!$('player-dialog').open)$('player-dialog').showModal();$('player-name').focus();
 try{const p=await rpc('public_profile',{user_id:id});if(token!==publicProfileEpoch||!$('player-dialog').open)return;
  $('player-name').textContent=p.name;$('player-avatar').textContent=String(p.name||'O').charAt(0).toLocaleUpperCase('tr');$('player-avatar').dataset.avatar=avatarColor(p.avatar_color);
  $('player-rank').textContent=rank(Number(p.elo));$('player-rank').dataset.rank=rankLevel(Number(p.elo));$('player-elo').textContent=Number(p.elo).toLocaleString('tr-TR')+' Elo';
  $('player-summary').textContent='Solo: '+Number(p.solo_played).toLocaleString('tr-TR')+' koşu · '+Number(p.solo_points).toLocaleString('tr-TR')+' puan.\nRanked: '+Number(p.ranked_played).toLocaleString('tr-TR')+' maç · '+Number(p.ranked_won).toLocaleString('tr-TR')+' galibiyet.';$('player-message').textContent='';
 }catch(error){if(token===publicProfileEpoch&&$('player-dialog').open)$('player-message').textContent=/PROFILE_NOT_FOUND/.test(String(error?.message))?'Bu oyuncunun profili bulunamadı.':'Profil yüklenemedi. Bağlantını kontrol edip tekrar aç.';}
}
async function loadBoard(){
 const token=++boardEpoch;$('leaderboard-message').textContent='Sıralama yükleniyor…';$('leaderboard-list').replaceChildren();
 $('period-week').setAttribute('aria-pressed',String(period==='weekly'));$('period-month').setAttribute('aria-pressed',String(period==='monthly'));
 try{await auth.ready;const data=await rpc('leaderboard',{period});if(token!==boardEpoch)return;
  for(const row of data.rows||[]){
   const li=document.createElement('li');li.className='leaderboard-row';const player=document.createElement('button');player.type='button';player.className='leaderboard-player';player.setAttribute('aria-label',row.name+' oyuncu profilini görüntüle');
   const place=document.createElement('span');place.className='leaderboard-position';place.textContent=row.position;
   const avatar=document.createElement('span');avatar.className='avatar leaderboard-avatar';avatar.dataset.avatar=avatarColor(row.avatar_color);avatar.textContent=String(row.name||'O').charAt(0).toLocaleUpperCase('tr');avatar.setAttribute('aria-hidden','true');
   const identity=document.createElement('span');identity.className='leaderboard-identity';const name=document.createElement('strong');name.textContent=row.name;
   const badge=document.createElement('span');badge.className='rank-pill';const elo=Number(row.elo??1000);badge.dataset.rank=rankLevel(elo);badge.textContent=rank(elo);
   const rating=document.createElement('small');rating.textContent=elo.toLocaleString('tr-TR')+' Elo';identity.append(name,badge,rating);player.append(place,avatar,identity);player.addEventListener('click',()=>openPlayerProfile(row.user_id,player));
   const points=document.createElement('span');points.className='leaderboard-points';const score=document.createElement('strong');score.textContent=Number(row.score).toLocaleString('tr-TR');const unit=document.createElement('small');unit.textContent='puan';points.append(score,unit);li.append(player,points);$('leaderboard-list').append(li);
  }
  $('leaderboard-message').textContent=data.rows?.length?'Oyuncunun profili için adına dokun.':'Bu dönemde henüz tamamlanmış Solo koşusu yok. İlk sırayı sen al!';
 }catch{if(token!==boardEpoch)return;$('leaderboard-message').textContent='Canlı sıralama yüklenemedi. Misafir olarak Solo oynayabilirsin.';}
}

async function openProfile(){await auth.ready;if(!user())return;const token=++profileEpoch,who=user().id;$('profile-email').textContent=user().email;$('profile-name').value=user().user_metadata?.display_name||'Oyuncu';$('profile-avatar').value=user().user_metadata?.avatar_color||'green';$('profile-message').textContent='';$('profile-dialog').showModal();$('profile-name').focus();$('profile-stats-text').textContent='İstatistikler yükleniyor…';$('profile-elo').textContent='—';try{const p=await rpc('profile');if(token!==profileEpoch||user()?.id!==who)return;$('profile-elo').textContent=`${p.elo} Elo · ${rank(p.elo)}`;$('profile-stats-text').textContent=`Solo: ${p.solo_played} koşu · ${p.solo_points} puan. Ranked: ${p.ranked_played} maç · ${p.ranked_won} galibiyet.`;}catch{if(token===profileEpoch)$('profile-stats-text').textContent='İstatistikler yüklenemedi.';}}
$('start-solo').addEventListener('click',()=>start('solo'));$('start-ranked').addEventListener('click',()=>start('ranked'));$('answer-form').addEventListener('submit',answer);$('skip-question').addEventListener('click',async()=>{if(busy||state?.mode==='ranked')return;if(practice){practice.skip();render(practice.state());}else if(active){busy=true;mutation++;const token=epoch;try{const next=await rpc('solo_answer',{session_id:state.session_id,round:state.round,skip:true,request_id:crypto.randomUUID()});if(token===epoch)render(next);}catch(error){message(errorText(error));}finally{busy=false;controls();}}});
$('leave-game').addEventListener('click',leave);$('cancel-queue').addEventListener('click',leave);$('result-home').addEventListener('click',()=>{state=null;practice=null;view('home-screen');$('start-solo').focus();});$('result-replay').addEventListener('click',()=>start(state?.mode||'solo'));
$('period-week').addEventListener('click',()=>{period='weekly';loadBoard();});$('period-month').addEventListener('click',()=>{period='monthly';loadBoard();});
$('player-close').addEventListener('click',()=>{publicProfileEpoch++;$('player-dialog').close();if(publicProfileOpener?.isConnected)publicProfileOpener.focus();});$('player-dialog').addEventListener('cancel',()=>{publicProfileEpoch++;});$('player-dialog').addEventListener('close',()=>{publicProfileEpoch++;if(publicProfileOpener?.isConnected)publicProfileOpener.focus();});
$('open-profile').addEventListener('click',openProfile);$('profile-close').addEventListener('click',()=>{$('profile-dialog').close();profileEpoch++;});
$('profile-form').addEventListener('submit',async e=>{e.preventDefault();if(!user()||!$('profile-form').reportValidity())return;const who=user().id;$('profile-save').disabled=true;try{const {error}=await auth.getClient().auth.updateUser({data:{display_name:$('profile-name').value.trim(),avatar_color:$('profile-avatar').value}});if(error)throw error;if(user()?.id===who)$('profile-message').textContent='Profilin güncellendi.';}catch{$('profile-message').textContent='Profil kaydedilemedi. Tekrar dene.';}finally{$('profile-save').disabled=false;}});
window.addEventListener('duydum:account',()=>{profileEpoch++;const id=user()?.id||null;if(owner&&id!==owner){epoch++;active=false;queued=false;state=null;practice=null;remember();view('home-screen');$('cancel-queue').hidden=true;$('queue-status').textContent='';$('profile-dialog').close();message('Hesap değişti. Oyun oturumu kapatıldı.');}owner=id;loadBoard();});
setInterval(()=>{if(practice&&active)render(practice.state());else controls();},150);setInterval(poll,1000);
(async()=>{await auth.ready;owner=user()?.id||null;const saved=storageGet();if(saved&&saved.owner===owner&&owner){const token=epoch,who=owner;try{const next=await rpc('state',{session_id:saved.id});if(token===epoch&&user()?.id===who)render(next);}catch{if(token===epoch)remember();}}loadBoard();})();
})();
