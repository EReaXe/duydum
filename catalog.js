/* Manual catalog. Runtime assets are local; no fetch/CDN required for guest play. */
(function(root){
 'use strict';
 const songs=[
  {id:'snap-beta-001',title:'Snap',artist:'Simitler',audio:'assets/track-001.mp3',cover:'assets/covers/fallback.svg'},
  {id:'manifest-tralala',title:'TRALALA',artist:'manifest'},
  {id:'eypio-burak-king-gunah-benim',title:'Günah Benim',artist:'Eypio & Burak King',artistAliases:['Eypio','Burak King']},
  {id:'manifest-zamansizdik',title:'Zamansızdık',artist:'manifest'},
  {id:'uzi-motive-sarkilar-sokaklara-ait',title:'Şarkılar Sokaklara Ait',artist:'UZI & Motive',artistAliases:['UZI','Motive']},
  {id:'manifest-toz-pembe',title:'Toz Pembe',artist:'manifest'},
  {id:'manifest-ruya',title:'RÜYA',artist:'manifest'},
  {id:'crush-crush',title:'CRUSH!',artist:'CRUSH',aliases:['Crush']},
  {id:'manifest-ajda-pekkan-hileli',title:'Hileli',artist:'manifest & Ajda Pekkan',artistAliases:['manifest','Ajda Pekkan','manifest X Ajda Pekkan']},
  {id:'murda-motive-karambol',title:'Karambol',artist:'Murda feat. Motive',artistAliases:['Murda','Motive','Murda & Motive']}
 ].map(song=>Object.freeze({audio:`assets/audio/${song.id}.mp3`,cover:`assets/covers/${song.id}.jpg`,...song}));
 function normalize(value){return String(value).trim().toLocaleLowerCase('tr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');}
 function distance(a,b){
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const row=[i];
   for(let j=1;j<=b.length;j++)row[j]=Math.min(row[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1));
   previous=row;
  }
  return previous[b.length];
 }
 function matches(song,value){
  const guess=normalize(value);if(!guess||guess.length>200)return false;
  const titles=[song.title,...(song.aliases||[])].map(normalize);
  const artists=[song.artist,...(song.artistAliases||[])].map(normalize);
  for(const title of titles){
   if(guess===title||artists.some(artist=>guess===artist+title||guess===title+artist))return true;
   const tolerance=title.length>=12?2:title.length>=4?1:0;
   if(tolerance&&Math.abs(guess.length-title.length)<=tolerance&&distance(guess,title)<=tolerance)return true;
  }
  return false;
 }
 function suggest(value,limit=3){
  const query=normalize(value);if(!query||query.length>200)return [];
  return songs.map((song,index)=>{
   const titles=[song.title,...(song.aliases||[])].map(normalize);
   const artist=normalize(song.artist);
   const rank=titles.some(title=>title.startsWith(query))?0:titles.some(title=>title.includes(query))?1:artist.includes(query)?2:3;
   return {song,index,rank};
  }).filter(item=>item.rank<3).sort((a,b)=>a.rank-b.rank||a.index-b.index).slice(0,Math.max(0,Math.min(3,limit))).map(item=>item.song);
 }
 function createDeck(items=songs,random=Math.random){
  if(!items.length)throw Error('Katalog boş.');
  let bag=[],lastId=null,cycle=0;
  return {next(){
   if(!bag.length){
    bag=[...items];cycle++;
    for(let i=bag.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]];}
    if(bag.length>1&&bag[0].id===lastId)[bag[0],bag[1]]=[bag[1],bag[0]];
   }
   const song=bag.shift();lastId=song.id;return {song,cycle,remaining:bag.length};
  }};
 }
 const api=Object.freeze({songs:Object.freeze(songs),normalize,matches,suggest,createDeck});
 root.DuydumCatalog=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
