begin;
do $$
declare u1 uuid;u2 uuid:=gen_random_uuid();u3 uuid:=gen_random_uuid();s jsonb;t jsonb;c text;rid uuid;oldmatch uuid;req uuid;passreq uuid;answer_title text;rn int;j int;total_score int;
begin
select id into u1 from auth.users order by created_at limit 1;
insert into auth.users(id,email,raw_user_meta_data) values(u2,'room-test-'||u2::text||'@example.invalid','{"display_name":"Rollback friend"}'),(u3,'room-test-'||u3::text||'@example.invalid','{"display_name":"Rollback outsider"}');
perform set_config('request.jwt.claim.sub',u1::text,true);execute 'set local role authenticated';
s:=public.duydum_room('create');c:=s->>'code';
begin perform public.duydum_room('start',c);raise exception 'one-player start allowed';exception when raise_exception then if sqlerrm<>'NEED_PLAYERS' then raise;end if;end;
perform set_config('request.jwt.claim.sub',u2::text,true);
s:=public.duydum_room('join',c);
if jsonb_array_length(s->'players')<>2 then raise exception 'join failed';end if;
begin perform public.duydum_room('start',c);raise exception 'nonhost start allowed';exception when raise_exception then if sqlerrm<>'HOST_ONLY' then raise;end if;end;
perform set_config('request.jwt.claim.sub',u3::text,true);
begin perform public.duydum_room('state',c);raise exception 'outsider state allowed';exception when raise_exception then if sqlerrm<>'NOT_MEMBER' then raise;end if;end;
perform set_config('request.jwt.claim.sub',u1::text,true);
s:=public.duydum_room('start',c);oldmatch:=(s->>'match_id')::uuid;
if s->>'status'<>'playing' or s->'answer'<>'null'::jsonb then raise exception 'start/hidden answer failed';end if;
execute 'reset role';
select id into rid from duydum_private.rooms where code=c;
if (select count(distinct d) from duydum_private.rooms r cross join lateral unnest(r.deck)d where r.id=rid)<>10 then raise exception 'deck not unique';end if;
for rn in 1..10 loop
 select title into answer_title from duydum_private.songs where id=s->>'song_id';
 execute 'set local role authenticated';perform set_config('request.jwt.claim.sub',u1::text,true);
 if rn=1 then
  s:=public.duydum_room('guess',c,jsonb_build_object('request_id',gen_random_uuid(),'match_id',oldmatch,'round',rn,'stage',0,'guess','SECRET_GUESS_TEXT'));
  if (s->'self'->>'stage')::int<>1 then raise exception 'wrong guess stage';end if;
  begin
   perform public.duydum_room('pass',c,jsonb_build_object('request_id',gen_random_uuid(),'match_id',oldmatch,'round',rn,'stage',0));
   raise exception 'Concurrent stale stage accepted';
  exception when raise_exception then if sqlerrm<>'STAGE_CHANGED' then raise;end if;end;
  if (s->'events')::text like '%SECRET_GUESS_TEXT%' then raise exception 'guess leaked';end if;
 end if;
 req:=gen_random_uuid();
 s:=public.duydum_room('guess',c,jsonb_build_object('request_id',req,'match_id',oldmatch,'round',rn,'stage',case when rn=1 then 1 else 0 end,'guess',answer_title));
 if not(s->'self'->>'correct')::boolean then raise exception 'correct rejected';end if;
 t:=public.duydum_room('guess',c,jsonb_build_object('request_id',req,'match_id',oldmatch,'round',rn,'stage',case when rn=1 then 1 else 0 end,'guess',answer_title));
 if t->'self'<>s->'self' then raise exception 'retry changed state';end if;
 perform set_config('request.jwt.claim.sub',u2::text,true);
 passreq:=gen_random_uuid();
 t:=public.duydum_room('pass',c,jsonb_build_object('request_id',passreq,'match_id',oldmatch,'round',rn,'stage',0));
 if (t->'self'->>'stage')::int<>1 then raise exception 'stage not per player';end if;
 t:=public.duydum_room('pass',c,jsonb_build_object('request_id',passreq,'match_id',oldmatch,'round',rn,'stage',0));
 if (t->'self'->>'stage')::int<>1 then raise exception 'duplicate pass advanced';end if;
 for j in 1..5 loop
  t:=public.duydum_room('pass',c,jsonb_build_object('request_id',gen_random_uuid(),'match_id',oldmatch,'round',rn,'stage',j));
 end loop;
 if t->>'status'<>'results' or t->'answer'->>'title'<>answer_title or not(t->'self'->>'done')::boolean then raise exception 'early results failed';end if;
 execute 'reset role';
 update duydum_private.rooms set next_round_at=clock_timestamp()-interval '1 second' where id=rid;
 execute 'set local role authenticated';perform set_config('request.jwt.claim.sub',u1::text,true);
 s:=public.duydum_room('state',c);
 execute 'reset role';
end loop;
if s->>'status'<>'finished' or s->>'code'<>c then raise exception '10-round finish/code persistence failed';end if;
select score into total_score from duydum_private.members where room_id=rid and user_id=u1;
if total_score<>9850 then raise exception 'score not server calculated';end if;
execute 'set local role authenticated';
s:=public.duydum_room('replay',c);
if s->>'status'<>'playing' or (s->>'round')::int<>1 or s->>'match_id'=oldmatch::text then raise exception 'replay failed';end if;
perform set_config('request.jwt.claim.sub',u2::text,true);
begin perform public.duydum_room('close',c);raise exception 'nonhost close allowed';exception when raise_exception then if sqlerrm<>'HOST_ONLY' then raise;end if;end;
execute 'reset role';update duydum_private.rooms set round_ends_at=clock_timestamp()-interval '1 second' where id=rid;
execute 'set local role authenticated';
s:=public.duydum_room('state',c);
if s->>'status'<>'results' or not(s->'self'->>'done')::boolean then raise exception 'timeout failed';end if;
perform set_config('request.jwt.claim.sub',u1::text,true);perform public.duydum_room('leave',c);
perform set_config('request.jwt.claim.sub',u2::text,true);s:=public.duydum_room('state',c);
if s->>'host_id'<>u2::text then raise exception 'host transfer failed';end if;
perform public.duydum_room('leave',c);
begin perform public.duydum_room('join',c);raise exception 'closed code accepted';exception when raise_exception then if sqlerrm<>'ROOM_NOT_FOUND' then raise;end if;end;
execute 'reset role';
if not exists(select 1 from duydum_private.room_codes where code=c) then raise exception 'code tombstone missing';end if;
end $$;
select 'PASS: create/join, auth/member/host restrictions, 10 distinct rounds, hidden answers, per-player stages, request idempotency, server scores, timeout, finish/replay/code persistence, host transfer, closed code rejection; all test users/rooms rolled back.' as verification;
rollback;

begin;
do $$
declare users uuid[];u uuid;c text;rid uuid;s jsonb;i int;before_expiry timestamptz;
begin
select array[id] into users from auth.users order by created_at limit 1;
for i in 2..9 loop
 u:=gen_random_uuid();users:=array_append(users,u);
 insert into auth.users(id,email,raw_user_meta_data) values(u,'room-test-'||u::text||'@example.invalid','{"display_name":"Rollback capacity"}');
end loop;
perform set_config('request.jwt.claim.sub',users[1]::text,true);execute 'set local role authenticated';
s:=public.duydum_room('create');c:=s->>'code';
begin perform id from duydum_private.rooms;raise exception 'Private direct read allowed';exception when insufficient_privilege then null;end;
for i in 2..8 loop
 perform set_config('request.jwt.claim.sub',users[i]::text,true);
 s:=public.duydum_room('join',c);
end loop;
if jsonb_array_length(s->'players')<>8 then raise exception '8 members not accepted';end if;
perform set_config('request.jwt.claim.sub',users[9]::text,true);
begin perform public.duydum_room('join',c);raise exception 'ninth member accepted';exception when raise_exception then if sqlerrm<>'ROOM_FULL' then raise;end if;end;
execute 'reset role';
select id into rid from duydum_private.rooms where code=c;
update duydum_private.members set last_seen=clock_timestamp()-interval '91 seconds' where room_id=rid and user_id<>users[2];
update duydum_private.rooms set expires_at=clock_timestamp()+interval '10 seconds' where id=rid;
perform set_config('request.jwt.claim.sub',users[2]::text,true);execute 'set local role authenticated';
s:=public.duydum_room('state',c);
if jsonb_array_length(s->'players')<>1 or s->>'host_id'<>users[2]::text then raise exception 'Stale removal/host transfer failed';end if;
execute 'reset role';
if (select expires_at from duydum_private.rooms where id=rid)<clock_timestamp()+interval '23 hours' then raise exception 'Activity did not renew idle TTL';end if;
update duydum_private.members set last_seen=clock_timestamp()-interval '91 seconds' where room_id=rid;
perform set_config('request.jwt.claim.sub',users[9]::text,true);execute 'set local role authenticated';
s:=public.duydum_room('join',c);
if s->>'closed'<>'true' then raise exception 'Fully stale room revived';end if;
execute 'reset role';
if exists(select 1 from duydum_private.rooms where id=rid) then raise exception 'Stale room retained';end if;
if not exists(select 1 from duydum_private.room_codes where code=c) then raise exception 'Stale room tombstone missing';end if;
execute 'set local role anon';
begin perform public.duydum_room('create');raise exception 'Anonymous RPC allowed';exception when insufficient_privilege then null;end;
execute 'reset role';
if not duydum_private.near('GUNAH BENIM','Günah Benim') or not duydum_private.near('Zamansizdik','Zamansızdık') or duydum_private.near('uydurma','Snap') then raise exception 'Normalization mismatch';end if;
end $$;
select 'PASS: max8, ninth denied, private tables denied, stale members removed/host transfer, activity renews 24h idle TTL, all-stale join closes room, tombstone persists, anonymous RPC denied, Turkish normalization. All data rolled back.' as verification;
rollback;
