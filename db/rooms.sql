-- Duydum private friend-room backend. Only public.duydum_room is client-callable.
create schema if not exists duydum_private;
revoke all on schema duydum_private from public,anon,authenticated;
create table duydum_private.room_codes(code text primary key,created_at timestamptz not null default now());
create table duydum_private.songs(id text primary key,title text not null,artist text not null,artists text[] not null);
insert into duydum_private.songs values
('snap-beta-001','Snap','Simitler',array['Simitler']),
('manifest-tralala','TRALALA','manifest',array['manifest']),
('eypio-burak-king-gunah-benim','Günah Benim','Eypio & Burak King',array['Eypio','Burak King','Eypio & Burak King']),
('manifest-zamansizdik','Zamansızdık','manifest',array['manifest']),
('uzi-motive-sarkilar-sokaklara-ait','Şarkılar Sokaklara Ait','UZI & Motive',array['UZI','Motive','UZI & Motive']),
('manifest-toz-pembe','Toz Pembe','manifest',array['manifest']),
('manifest-ruya','RÜYA','manifest',array['manifest']),
('crush-crush','CRUSH!','CRUSH',array['CRUSH']),
('manifest-ajda-pekkan-hileli','Hileli','manifest & Ajda Pekkan',array['manifest','Ajda Pekkan','manifest X Ajda Pekkan','manifest & Ajda Pekkan']),
('murda-motive-karambol','Karambol','Murda feat. Motive',array['Murda','Motive','Murda & Motive','Murda feat. Motive']);
create table duydum_private.rooms(
 id uuid primary key default gen_random_uuid(),code text not null unique references duydum_private.room_codes(code),
 host_id uuid not null references auth.users(id),status text not null default 'lobby' check(status in('lobby','playing','results','finished')),
 round_no integer not null default 0 check(round_no between 0 and 10),match_id uuid not null default gen_random_uuid(),
 deck text[] not null default '{}',round_ends_at timestamptz,next_round_at timestamptz,
 created_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '24 hours')
);
create table duydum_private.members(
 room_id uuid not null references duydum_private.rooms(id) on delete cascade,
 user_id uuid not null unique references auth.users(id) on delete cascade,
 name text not null,avatar text not null default 'green',score integer not null default 0,
 stage smallint not null default 0 check(stage between 0 and 5),done boolean not null default false,
 correct boolean not null default false,round_points integer not null default 0,
 joined_at timestamptz not null default now(),last_seen timestamptz not null default now(),primary key(room_id,user_id)
);
create table duydum_private.events(
 id bigint generated always as identity primary key,room_id uuid not null references duydum_private.rooms(id) on delete cascade,
 round_no integer not null,message text not null,created_at timestamptz not null default now()
);
create index room_events_recent on duydum_private.events(room_id,id desc);
create index room_expiration on duydum_private.rooms(expires_at);
create table duydum_private.requests(
 room_id uuid not null references duydum_private.rooms(id) on delete cascade,user_id uuid not null,
 request_id uuid not null,match_id uuid not null,round_no integer not null,action text not null,
 primary key(room_id,user_id,request_id)
);
alter table duydum_private.room_codes enable row level security;
alter table duydum_private.songs enable row level security;
alter table duydum_private.rooms enable row level security;
alter table duydum_private.members enable row level security;
alter table duydum_private.events enable row level security;
alter table duydum_private.requests enable row level security;
revoke all on all tables in schema duydum_private from public,anon,authenticated;
revoke all on all sequences in schema duydum_private from public,anon,authenticated;

create function duydum_private.normalize(p_value text) returns text language sql immutable set search_path='' as $$
 select regexp_replace(lower(translate(coalesce(p_value,''),'ÇĞİÖŞÜçğıöşüI','cgiosucgiosui')),'[^a-z0-9]','','g');
$$;
create function duydum_private.near(p_a text,p_b text) returns boolean language plpgsql immutable set search_path='' as $$
declare a text:=duydum_private.normalize(p_a);b text:=duydum_private.normalize(p_b);t int;i int;j int;prev int[];cur int[];
begin
 if a=b then return true;end if;
 t:=case when length(b)>=12 then 2 when length(b)>=4 then 1 else 0 end;
 if t=0 or abs(length(a)-length(b))>t or length(a)>200 or length(a)=0 then return false;end if;
 prev:=array_fill(0,array[length(b)+1],array[0]);
 for j in 0..length(b) loop prev[j]:=j;end loop;
 for i in 1..length(a) loop
  cur:=array_fill(0,array[length(b)+1],array[0]);cur[0]:=i;
  for j in 1..length(b) loop
   cur[j]:=least(cur[j-1]+1,prev[j]+1,prev[j-1]+case when substr(a,i,1)=substr(b,j,1) then 0 else 1 end);
  end loop;
  prev:=cur;
 end loop;
 return prev[length(b)]<=t;
end $$;
create function duydum_private.emit(p_room uuid,p_round int,p_message text) returns void language sql set search_path='' as $$
 insert into duydum_private.events(room_id,round_no,message) values(p_room,p_round,left(p_message,250));
$$;
create function duydum_private.advance(p_room uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare r duydum_private.rooms%rowtype;
begin
 select * into r from duydum_private.rooms where id=p_room;
 if r.status='playing' and (r.round_ends_at<=p_now or not exists(select 1 from duydum_private.members where room_id=p_room and not done)) then
  update duydum_private.members set done=true where room_id=p_room and not done;
  update duydum_private.rooms set status='results',next_round_at=p_now+interval '4 seconds' where id=p_room;
  perform duydum_private.emit(p_room,r.round_no,'Tur bitti. Şarkı açıklanıyor.');
 elsif r.status='results' and r.next_round_at<=p_now then
  if r.round_no>=10 then
   update duydum_private.rooms set status='finished',next_round_at=null where id=p_room;
   perform duydum_private.emit(p_room,r.round_no,'Maç bitti! Oda açık, tekrar oynayabilirsiniz.');
  else
   update duydum_private.rooms set status='playing',round_no=round_no+1,round_ends_at=p_now+interval '60 seconds',next_round_at=null where id=p_room;
   update duydum_private.members set stage=0,done=false,correct=false,round_points=0 where room_id=p_room;
   perform duydum_private.emit(p_room,r.round_no+1,(r.round_no+1)::text||'. tur başladı.');
  end if;
 end if;
end $$;
create function duydum_private.snapshot(p_room uuid,p_user uuid,p_now timestamptz) returns jsonb language plpgsql set search_path='' as $$
declare r duydum_private.rooms%rowtype;own duydum_private.members%rowtype;answer jsonb:=null;players jsonb;events jsonb;
begin
 select * into r from duydum_private.rooms where id=p_room;
 select * into own from duydum_private.members where room_id=p_room and user_id=p_user;
 if own.user_id is null then raise exception 'NOT_MEMBER';end if;
 if r.status in('results','finished') then
  select jsonb_build_object('song_id',s.id,'title',s.title,'artist',s.artist) into answer from duydum_private.songs s where s.id=r.deck[r.round_no];
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',m.user_id,'name',m.name,'avatar',m.avatar,'score',m.score,'stage',m.stage,'done',m.done,'correct',m.correct,'round_points',m.round_points) order by m.joined_at,m.user_id),'[]') into players from duydum_private.members m where room_id=p_room;
 select coalesce(jsonb_agg(jsonb_build_object('id',e.id,'message',e.message,'round',e.round_no,'created_at',e.created_at) order by e.id),'[]') into events from(select * from duydum_private.events where room_id=p_room order by id desc limit 50)e;
 return jsonb_build_object('code',r.code,'host_id',r.host_id,'status',r.status,'round',r.round_no,'total_rounds',10,'match_id',r.match_id,'song_id',case when r.status='lobby' then null else r.deck[r.round_no] end,'round_ends_at',r.round_ends_at,'next_round_at',r.next_round_at,'server_time',p_now,'players',players,'self',jsonb_build_object('user_id',p_user,'stage',own.stage,'done',own.done,'correct',own.correct,'round_points',own.round_points),'events',events,'answer',answer,'can_start',r.host_id=p_user and r.status in('lobby','finished') and jsonb_array_length(players)>=2);
end $$;

create function public.duydum_room(p_action text,p_code text default null,p_payload jsonb default '{}') returns jsonb
language plpgsql security definer set search_path='' as $$
<<rpc>>
declare
 uid uuid:=auth.uid();ts timestamptz:=clock_timestamp();r duydum_private.rooms%rowtype;m duydum_private.members%rowtype;
 rid uuid;newcode text;alphabet text:='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';i int;attempt int;owner uuid;
 meta jsonb;name text;avatar text;request uuid;req_match uuid;req_round int;req_stage int;guess text;s duydum_private.songs%rowtype;
 won boolean;artist text;points int;clip int;
begin
 if uid is null then raise exception 'AUTH_REQUIRED';end if;
 if p_action not in('create','join','state','heartbeat','start','replay','leave','close','guess','pass') or p_action is null then raise exception 'INVALID_REQUEST';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>2048 then raise exception 'INVALID_REQUEST';end if;
 -- Per-user create/join calls are serialized before taking a room row lock.
 perform pg_advisory_xact_lock(hashtextextended(uid::text,127));
 delete from duydum_private.rooms where expires_at<=ts;
 select raw_user_meta_data into meta from auth.users where id=uid;
 if not found then raise exception 'AUTH_REQUIRED';end if;
 name:=left(coalesce(nullif(trim(meta->>'display_name'),''),'Oyuncu'),30);
 avatar:=case when meta->>'avatar_color' in('pink','green','yellow','purple') then meta->>'avatar_color' else 'green' end;
 if p_action='create' then
  select room_id into rid from duydum_private.members where user_id=uid;
  if rid is not null then
   select * into r from duydum_private.rooms where id=rid for update;
   ts:=clock_timestamp();
   update duydum_private.rooms set expires_at=ts+interval '24 hours' where id=rid;
   update duydum_private.members set last_seen=ts,name=rpc.name,avatar=rpc.avatar where room_id=rid and user_id=uid;
   perform duydum_private.advance(rid,ts);
   return duydum_private.snapshot(rid,uid,ts);
  end if;
  for attempt in 1..20 loop
   newcode:='';for i in 1..5 loop newcode:=newcode||substr(alphabet,1+floor(random()*length(alphabet))::int,1);end loop;
   insert into duydum_private.room_codes(code) values(newcode) on conflict do nothing;
   if found then exit;end if;
   if attempt=20 then raise exception 'CODE_GENERATION_FAILED';end if;
  end loop;
  insert into duydum_private.rooms(code,host_id) values(newcode,uid) returning id into rid;
  insert into duydum_private.members(room_id,user_id,name,avatar,last_seen) values(rid,uid,name,avatar,ts);
  perform duydum_private.emit(rid,0,name||' odayı kurdu.');
  return duydum_private.snapshot(rid,uid,ts);
 end if;
 newcode:=upper(trim(coalesce(p_code,'')));
 if newcode !~ '^[A-Z2-9]{5}$' then raise exception 'ROOM_NOT_FOUND';end if;
 select * into r from duydum_private.rooms where code=newcode for update;
 if not found then raise exception 'ROOM_NOT_FOUND';end if;
 ts:=clock_timestamp();
 rid:=r.id;
 select * into m from duydum_private.members where room_id=rid and user_id=uid;
 if p_action='join' then
  if m.user_id is null then
   if exists(select 1 from duydum_private.members where user_id=uid) then raise exception 'ALREADY_IN_ROOM';end if;
   delete from duydum_private.members where room_id=rid and last_seen<ts-interval '90 seconds';
   if not exists(select 1 from duydum_private.members where room_id=rid) then
    delete from duydum_private.rooms where id=rid;
    return jsonb_build_object('closed',true,'code',newcode);
   end if;
   if r.status not in('lobby','finished') then raise exception 'ROOM_IN_PROGRESS';end if;
   if (select count(*) from duydum_private.members where room_id=rid)>=8 then raise exception 'ROOM_FULL';end if;
   insert into duydum_private.members(room_id,user_id,name,avatar,last_seen) values(rid,uid,name,avatar,ts);
   perform duydum_private.emit(rid,r.round_no,name||' odaya katıldı.');
  end if;
 elsif m.user_id is null then raise exception 'NOT_MEMBER';
 end if;
 update duydum_private.members set last_seen=ts,name=rpc.name,avatar=rpc.avatar where room_id=rid and user_id=uid;
 update duydum_private.rooms set expires_at=ts+interval '24 hours' where id=rid;
 -- Stale players are removed under the room lock. The host is transferred.
 delete from duydum_private.members where room_id=rid and last_seen<ts-interval '90 seconds';
 if not exists(select 1 from duydum_private.members where room_id=rid and user_id=r.host_id) then
  select user_id into owner from duydum_private.members where room_id=rid order by joined_at,user_id limit 1;
  update duydum_private.rooms set host_id=owner where id=rid;
  r.host_id:=owner;
  perform duydum_private.emit(rid,r.round_no,'Oda sahipliği devredildi.');
 end if;
 if p_action='close' then
  if r.host_id<>uid then raise exception 'HOST_ONLY';end if;
  delete from duydum_private.rooms where id=rid;
  return jsonb_build_object('closed',true,'code',newcode);
 end if;
 if p_action='leave' then
  delete from duydum_private.members where room_id=rid and user_id=uid;
  if not exists(select 1 from duydum_private.members where room_id=rid) then
   delete from duydum_private.rooms where id=rid;
  else
   if r.host_id=uid then
    select user_id into owner from duydum_private.members where room_id=rid order by joined_at,user_id limit 1;
    update duydum_private.rooms set host_id=owner where id=rid;
   end if;
   perform duydum_private.emit(rid,r.round_no,name||' odadan ayrıldı.');
   perform duydum_private.advance(rid,ts);
  end if;
  return jsonb_build_object('closed',true,'code',newcode);
 end if;
 perform duydum_private.advance(rid,ts);
 select * into r from duydum_private.rooms where id=rid;
 if p_action in('start','replay') then
  if r.host_id<>uid then raise exception 'HOST_ONLY';end if;
  if (p_action='start' and r.status<>'lobby') or (p_action='replay' and r.status<>'finished') then raise exception 'INVALID_REQUEST';end if;
  if (select count(*) from duydum_private.members where room_id=rid)<2 then raise exception 'NEED_PLAYERS';end if;
  update duydum_private.rooms set deck=(select array_agg(id order by random()) from duydum_private.songs),status='playing',round_no=1,match_id=gen_random_uuid(),round_ends_at=ts+interval '60 seconds',next_round_at=null where id=rid;
  update duydum_private.members set score=0,stage=0,done=false,correct=false,round_points=0 where room_id=rid;
  delete from duydum_private.events where room_id=rid;
  perform duydum_private.emit(rid,1,'Maç başladı! 10 farklı şarkı, 10 tur.');
 elsif p_action in('guess','pass') then
  begin request:=(p_payload->>'request_id')::uuid;req_match:=(p_payload->>'match_id')::uuid;req_round:=(p_payload->>'round')::int;req_stage:=(p_payload->>'stage')::int;
  exception when invalid_text_representation or numeric_value_out_of_range then raise exception 'INVALID_REQUEST';end;
  if request is null or req_match is null or req_round is null or req_stage is null or req_stage not between 0 and 5 then raise exception 'INVALID_REQUEST';end if;
  if exists(select 1 from duydum_private.requests where room_id=rid and user_id=uid and request_id=request) then
   return duydum_private.snapshot(rid,uid,ts);
  end if;
  if req_match<>r.match_id or req_round<>r.round_no then raise exception 'ROUND_CHANGED';end if;
  if r.status<>'playing' then raise exception 'ROUND_NOT_PLAYING';end if;
  select * into m from duydum_private.members where room_id=rid and user_id=uid;
  if req_stage<>m.stage then raise exception 'STAGE_CHANGED';end if;
  if m.done then raise exception 'PLAYER_DONE';end if;
  clip:=(array[1,2,4,7,11,16])[m.stage+1];
  if p_action='guess' then
   guess:=trim(coalesce(p_payload->>'guess',''));
   if length(guess)=0 or length(guess)>200 then raise exception 'INVALID_REQUEST';end if;
   select * into s from duydum_private.songs where id=r.deck[r.round_no];
   won:=duydum_private.near(guess,s.title);
   if not won then
    foreach artist in array s.artists loop
     if duydum_private.normalize(guess) in(duydum_private.normalize(artist||s.title),duydum_private.normalize(s.title||artist)) then won:=true;exit;end if;
    end loop;
   end if;
   perform duydum_private.emit(rid,r.round_no,name||' tahmin yaptı.');
  else won:=false;perform duydum_private.emit(rid,r.round_no,name||' pas geçti.');end if;
  if won then
   points:=(array[1000,850,700,500,300,100])[m.stage+1];
   update duydum_private.members set done=true,correct=true,round_points=points,score=score+points where room_id=rid and user_id=uid;
   perform duydum_private.emit(rid,r.round_no,name||', '||clip::text||' saniyelik kesitte bildi! +'||points::text||' puan.');
  elsif m.stage=5 then
   update duydum_private.members set done=true where room_id=rid and user_id=uid;
   perform duydum_private.emit(rid,r.round_no,name||' şarkıyı bulamadı.');
  else update duydum_private.members set stage=stage+1 where room_id=rid and user_id=uid;
  end if;
  insert into duydum_private.requests(room_id,user_id,request_id,match_id,round_no,action) values(rid,uid,request,req_match,req_round,p_action);
  perform duydum_private.advance(rid,ts);
 end if;
 return duydum_private.snapshot(rid,uid,ts);
end $$;
revoke all on all functions in schema duydum_private from public,anon,authenticated;
revoke all on function public.duydum_room(text,text,jsonb) from public,anon;
grant execute on function public.duydum_room(text,text,jsonb) to authenticated;
