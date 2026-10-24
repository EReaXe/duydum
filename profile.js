/* Private beta practice history. No ranked/leaderboard claims. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id);
 const api=window.DuydumAuth;
 const pending=new Map();
 let revision=0, lastResult=null, savingProfile=false, accountOwner=api.getUser()?.id||null;
 const user=()=>api.getUser();
 const client=()=>api.getClient();
 const message=text=>{$('profile-message').textContent=text;};
 const statsMessage=text=>{$('stats-message').textContent=text;};
 function clearStats(){for(const id of ['stat-played','stat-won','stat-rate','stat-best-streak','stat-total-points'])$(id).textContent='—';$('recent-results').replaceChildren();}
 function fillProfile(){
  const current=user();
  $('profile-email').textContent=current?.email||'';
  $('profile-name').value=current?.user_metadata?.display_name||'Oyuncu';
  const color=current?.user_metadata?.avatar_color;
  $('profile-avatar').value=['pink','green','yellow','purple'].includes(color)?color:'green';
 }
 async function loadStats(){
  const owner=user()?.id, token=++revision;
  clearStats();
  if(!owner){statsMessage('İstatistikler için giriş yap.');return;}
  statsMessage('Sonuçların yükleniyor…');$('stats-retry').disabled=true;
  try{
   const [stats,recent]=await Promise.all([
    client().rpc('get_beta_stats'),
    client().from('beta_solo_results').select('id,song_id,won,stage,points,played_at').eq('user_id',owner).order('played_at',{ascending:false}).order('id',{ascending:false}).limit(5)
   ]);
   if(token!==revision||user()?.id!==owner)return;
   if(stats.error||recent.error)throw Error('load');
   const s=stats.data;
   $('stat-played').textContent=s.played;
   $('stat-won').textContent=s.won;
   $('stat-rate').textContent=s.played?Math.round(s.won/s.played*100)+'%':'0%';
   $('stat-best-streak').textContent=s.best_streak;
   $('stat-total-points').textContent=Number(s.total_points).toLocaleString('tr-TR');
   for(const row of recent.data){
    const item=document.createElement('li');
    const date=new Date(row.played_at).toLocaleString('tr-TR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});
    const song=window.DuydumCatalog?.songs.find(song=>song.id===row.song_id);
    item.textContent=(song? song.artist+' — '+song.title+' · ' : '')+(row.won?'Bildin · '+[1,2,4,7,11,16][row.stage]+' sn':'Bulamadın')+' · +'+row.points+' puan · '+date;
    $('recent-results').append(item);
   }
   statsMessage(s.played?'Yalnız beta deneme sonuçların. Liderliğe sayılmaz.':'Henüz kayıtlı turun yok. Solo ile başla!');
  }catch{if(token===revision)statsMessage('İstatistikler yüklenemedi. Bağlantını kontrol edip yeniden dene.');}
  finally{if(token===revision)$('stats-retry').disabled=false;}
 }
 function resultStatus(record,text,retry=false){
  if(lastResult?.id!==record.id)return;
  $('save-status').textContent=text;
  $('retry-save').hidden=!retry;
 }
 async function saveResult(record){
  if(!record.owner){resultStatus(record,'Misafir turu: hesaba kaydedilmedi.');return;}
  if(user()?.id!==record.owner){resultStatus(record,'Turun başladığı hesaba giriş yaparak tekrar kaydedebilirsin.',true);return;}
  if(record.saving)return;
  record.saving=true;resultStatus(record,'Sonuç hesabına kaydediliyor…');
  try{
   const row={id:record.id,user_id:record.owner,song_id:record.songId,stage:record.stage,won:record.won,played_at:record.playedAt};
   const inserted=await client().from('beta_solo_results').insert(row).select('id').single();
   if(inserted.error){
    if(inserted.error.code!=='23505')throw inserted.error;
    const existing=await client().from('beta_solo_results').select('id').eq('id',record.id).eq('user_id',record.owner).single();
    if(existing.error)throw existing.error;
   }
   pending.delete(record.id);
   if(user()?.id===record.owner){resultStatus(record,'Beta sonucu hesabına kaydedildi.');if($('profile-dialog').open)loadStats();}
  }catch{
   pending.set(record.id,record);
   if(user()?.id===record.owner)resultStatus(record,'Kaydedilemedi. Sayfayı kapatmadan bağlantını kontrol edip tekrar dene.',true);
  }finally{record.saving=false;}
 }
 window.DuydumProfile={
  beginRound(songId){
   const record={id:crypto.randomUUID(),owner:user()?.id||null,songId,playedAt:new Date().toISOString()};
   lastResult=record;$('save-status').textContent='';$('retry-save').hidden=true;
   return record;
  },
  finishRound(record,won,stage){if(!record)return;record.completed=true;record.won=won;record.stage=stage;if(record.owner)pending.set(record.id,record);saveResult(record);}
 };
 $('retry-save').addEventListener('click',()=>{if(lastResult)saveResult(lastResult);});
 $('open-profile').addEventListener('click',async()=>{
  await api.ready;if(!user())return;
  fillProfile();message('');$('profile-dialog').showModal();$('profile-name').focus();loadStats();
 });
 $('profile-close').addEventListener('click',()=>{if(!savingProfile)$('profile-dialog').close();});
 $('profile-dialog').addEventListener('cancel',event=>{if(savingProfile)event.preventDefault();});
 $('stats-retry').addEventListener('click',async()=>{
  await Promise.all([...pending.values()].filter(record=>record.owner===user()?.id).map(saveResult));loadStats();
 });
 $('profile-form').addEventListener('submit',async event=>{
  event.preventDefault();if(savingProfile||!user()||!$('profile-form').reportValidity())return;
  const name=$('profile-name').value.trim(), color=$('profile-avatar').value, owner=user().id;
  if(name.length<2||name.length>30){message('Oyuncu adı 2–30 karakter olmalı.');return;}
  if(!['pink','green','yellow','purple'].includes(color))return;
  savingProfile=true;$('profile-save').disabled=true;$('profile-close').disabled=true;message('Profil kaydediliyor…');
  try{
   const {error}=await client().auth.updateUser({data:{display_name:name,avatar_color:color}});
   if(error)throw error;
   if(user()?.id===owner)message('Profilin güncellendi.');
  }catch{message('Profil kaydedilemedi. Bağlantını kontrol edip yeniden dene.');}
  finally{savingProfile=false;$('profile-save').disabled=false;$('profile-close').disabled=false;}
 });
 window.addEventListener('duydum:account',()=>{
  const nextOwner=user()?.id||null;
  if(nextOwner!==accountOwner){revision++;clearStats();accountOwner=nextOwner;}
  if(lastResult?.owner&&lastResult.completed){
   if(user()?.id===lastResult.owner){
    resultStatus(lastResult,pending.has(lastResult.id)?'Bekleyen sonuç var. Kaydı tekrar deneyebilirsin.':'Beta sonucu hesabına kaydedildi.',pending.has(lastResult.id));
   }else resultStatus(lastResult,'Sonuç kaydı için turun başladığı hesaba giriş yap.');
  }
  if(!user()){
   $('profile-dialog').close();$('profile-email').textContent='';$('profile-name').value='';
   if(lastResult?.owner){$('save-status').textContent='Sonuç kaydı için turun başladığı hesaba giriş yap.';$('retry-save').hidden=true;}
  }else if($('profile-dialog').open){if(!savingProfile)fillProfile();queueMicrotask(loadStats);}
 });
})();
