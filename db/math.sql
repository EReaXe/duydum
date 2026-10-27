-- Math game v1. All authority lives on the server. Old music data is untouched.
create schema if not exists math_private;
revoke all on schema math_private from public, anon, authenticated;
grant usage on schema math_private to authenticated,anon;
create table math_private.ratings(user_id uuid primary key references auth.users(id) on delete cascade, elo integer not null default 1000, played integer not null default 0, won integer not null default 0);
create table math_private.sessions(id uuid primary key default gen_random_uuid(), mode text not null check(mode in ('solo','ranked')), status text not null default 'playing', round integer not null default 1, questions jsonb not null, format_version integer not null default 1, deadline timestamptz not null default (now()+interval '20 seconds'), next_at timestamptz, created_at timestamptz not null default now(), finished_at timestamptz, settled boolean not null default false, forfeit uuid, starts_at timestamptz, winner_id uuid, finish_reason text);
create table math_private.players(session_id uuid references math_private.sessions on delete cascade,user_id uuid references auth.users on delete cascade,score integer not null default 0,correct integer not null default 0,round_points integer not null default 0,deadline timestamptz,question_index integer not null default 1,answered boolean not null default false,cooldown_until timestamptz,heartbeat timestamptz not null default now(),elo_before integer not null default 1000,elo_delta integer not null default 0, primary key(session_id,user_id));
create index math_players_user_idx on math_private.players(user_id);
create table math_private.queue(user_id uuid primary key references auth.users on delete cascade,joined_at timestamptz not null default now(),heartbeat timestamptz not null default now());
create table math_private.requests(user_id uuid references auth.users on delete cascade,request_id uuid not null,session_id uuid references math_private.sessions on delete cascade, primary key(user_id,request_id));
create table math_private.match_questions(session_id uuid references math_private.sessions on delete cascade,question_index integer not null,question jsonb not null,primary key(session_id,question_index));
alter table math_private.match_questions enable row level security;
create table math_private.rate_limits(user_id uuid references auth.users on delete cascade,bucket text not null check(bucket in('api','start')),tokens double precision not null,updated_at timestamptz not null default now(),primary key(user_id,bucket));
alter table math_private.rate_limits enable row level security;
create index math_requests_session_idx on math_private.requests(session_id);
create index math_sessions_finished_idx on math_private.sessions(finished_at) where status='finished' and mode='solo';
alter table math_private.ratings enable row level security;
alter table math_private.sessions enable row level security;
alter table math_private.players enable row level security;
alter table math_private.queue enable row level security;
alter table math_private.requests enable row level security;
revoke all on all tables in schema math_private from public,anon,authenticated;

create or replace function math_private.question(p_kind integer default null) returns jsonb language plpgsql set search_path='' as $$
declare a int:=2+floor(random()*11)::int;b int:=2+floor(random()*8)::int;c int:=2+floor(random()*11)::int;p int;k int:=coalesce(p_kind,floor(random()*18)::int);t text;ans int;cat text;
begin
 case k
 when 0 then t:=format('%s + %s × %s = ?',a,b,c);ans:=a+b*c;cat:='İşlem önceliği';
 when 1 then t:=format('□ × %s = %s',b,a*b);ans:=a;cat:='Eksik çarpan';
 when 2 then t:=format('%s sayısının yarısının %s fazlası?',a*2,b);ans:=a+b;cat:='İki adım';
 when 3 then t:=format('%s, %s, %s, □',a,a+b,a+2*b);ans:=a+3*b;cat:='Sayı örüntüsü';
 when 4 then t:=format('(%s + %s) ÷ %s = ?',a*b-c,c,b);ans:=a;cat:='Parantez';
 when 5 then t:=format('%s × %s − %s = ?',a,b,c);ans:=a*b-c;cat:='Çarp ve çıkar';
 when 6 then t:=format('%s + %s + □ = %s',a,b,a+b+c);ans:=c;cat:='Eksik toplanan';
 when 7 then p:=(array[10,20,25,50])[1+floor(random()*4)::int];t:=format('%s sayısının yüzde %s’i kaçtır?',a*20,p);ans:=a*20*p/100;cat:='Yüzde';
 when 8 then t:=format('%s sayısının çeyreğinin %s fazlası?',a*4,b);ans:=a+b;cat:='Çeyrek ve ekleme';
 when 9 then t:=format('%s sayısının karesi kaçtır?',a);ans:=a*a;cat:='Kare sayılar';
 when 10 then t:=format('%s sayısının 2 katının %s eksiği?',a,b);ans:=a*2-b;cat:='İki kat ve çıkarma';
 when 11 then t:=format('Kenarları %s ve %s cm olan dikdörtgenin çevresi kaç cm?',a,b);ans:=2*(a+b);cat:='Çevre';
 when 12 then t:=format('%s ve %s sayılarının ortalaması kaçtır?',a,a+2*b);ans:=a+b;cat:='Ortalama';
 when 13 then a:=1+floor(random()*3)::int;t:=format('%s saat %s dakika toplam kaç dakikadır?',a,b);ans:=a*60+b;cat:='Zaman';
 when 14 then a:=1+floor(random()*5)::int;t:=format('%s metre %s santimetre toplam kaç santimetredir?',a,b);ans:=a*100+b;cat:='Uzunluk';
 when 15 then c:=1+floor(random()*(b-1))::int;t:=format('%s sayısının %s ile bölümünden kalan kaçtır?',a*b+c,b);ans:=c;cat:='Bölümden kalan';
 when 16 then t:=format('%s, %s, %s, □',a,a*2,a*4);ans:=a*8;cat:='Katlanan örüntü';
 when 17 then t:=format('□ ÷ %s = %s',b,a);ans:=a*b;cat:='Eksik bölünen';
 else raise exception 'INVALID_QUESTION_KIND';
 end case;
 return jsonb_build_object('text',t,'answer',ans,'category',cat,'kind',k);
end $$;
create or replace function math_private.questions() returns jsonb language plpgsql set search_path='' as $$
declare q jsonb:='[]';begin for i in 1..10 loop q:=q||jsonb_build_array(math_private.question());end loop;return q;end $$;

-- Called under the session row lock, before renewing any heartbeat or accepting answers.
create or replace function math_private.ranked_tick(p_sid uuid,p_now timestamptz) returns void language plpgsql set search_path='' as $$
declare x math_private.sessions%rowtype; first_deadline timestamptz;first_disconnect timestamptz;last_disconnect timestamptz;loser uuid;winner uuid;reason text;
begin
 select * into x from math_private.sessions where id=p_sid;
 if x.status='finished' or x.format_version<>3 then return;end if;
 if (select count(*) from math_private.players where session_id=p_sid)<>2 then update math_private.sessions set status='finished',finished_at=p_now,settled=true,finish_reason='opponent_unavailable' where id=p_sid;return;end if;
 select min(deadline),min(heartbeat+interval '45 seconds'),max(heartbeat+interval '45 seconds') into first_deadline,first_disconnect,last_disconnect from math_private.players where session_id=p_sid;
 if last_disconnect<=p_now and last_disconnect<first_deadline then
 update math_private.sessions set status='finished',finished_at=last_disconnect,finish_reason='double_disconnect',settled=true where id=p_sid;return;
 end if;
 if first_disconnect<=p_now and first_disconnect<first_deadline then
 select user_id into loser from math_private.players where session_id=p_sid order by heartbeat,user_id limit 1;reason:='disconnect';
 elsif first_deadline<=p_now then
 if (select count(distinct deadline) from math_private.players where session_id=p_sid)=1 then loser:=null;
 else select user_id into loser from math_private.players where session_id=p_sid order by deadline,user_id limit 1;end if;reason:='timeout';
 else return;end if;
 if loser is not null then select user_id into winner from math_private.players where session_id=p_sid and user_id<>loser;end if;
 update math_private.sessions set status='finished',finished_at=case when reason='disconnect' then first_disconnect else first_deadline end,winner_id=winner,finish_reason=reason,forfeit=case when reason='disconnect' then loser else null end where id=p_sid;
end $$;

-- Per-account accepted-call/token budgets. Anonymous public reads remain read-only.
-- This is an application resource guard, not an IP/DDoS or automated-solver guarantee.
create or replace function math_private.take_token(p_user uuid,p_bucket text) returns boolean language plpgsql set search_path='' as $$
declare cap double precision;refill double precision;available double precision;previous_at timestamptz;n timestamptz:=clock_timestamp();
begin
 if p_bucket='api' then cap:=40;refill:=10;
 elsif p_bucket='start' then cap:=4;refill:=0.1;
 else raise exception 'INVALID_BUCKET';end if;
 insert into math_private.rate_limits(user_id,bucket,tokens,updated_at)values(p_user,p_bucket,cap,n) on conflict do nothing;
 select tokens,updated_at into available,previous_at from math_private.rate_limits where user_id=p_user and bucket=p_bucket for update;
 available:=least(cap,available+greatest(0,extract(epoch from(n-previous_at)))*refill);
 if available<1 then return false;end if;
 update math_private.rate_limits set tokens=available-1,updated_at=n where user_id=p_user and bucket=p_bucket;return true;
end $$;

create or replace function math_private.game(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); s math_private.sessions%rowtype; me math_private.players%rowtype; other_id uuid; sid uuid; q jsonb; ps jsonb; mine jsonb; result jsonb; n timestamptz:=clock_timestamp(); req uuid; expected numeric; delta int; a math_private.players%rowtype;b math_private.players%rowtype; outcome numeric; period text; cutoff timestamptz; rows jsonb; already boolean:=false; last_feedback jsonb:=null; old_answer integer; old_round integer; is_correct boolean; is_skip boolean; target_user uuid;
begin
 if p_action is null or p_action not in('leaderboard','public_profile','profile','state','solo_start','solo_answer','queue','cancel','answer','leave') then raise exception 'UNKNOWN_ACTION';end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>4096 then raise exception 'INVALID_PAYLOAD';end if;
 if u is null and p_action not in('leaderboard','public_profile') then raise exception 'AUTH_REQUIRED';end if;
 if p_action='public_profile' then
 begin target_user:=(p_payload->>'user_id')::uuid;exception when invalid_text_representation then raise exception 'PROFILE_NOT_FOUND';end;
 select jsonb_build_object('user_id',r.user_id,'name',left(coalesce(nullif(au.raw_user_meta_data->>'display_name',''),'Oyuncu'),30),'avatar_color',case when au.raw_user_meta_data->>'avatar_color' in('pink','green','yellow','purple') then au.raw_user_meta_data->>'avatar_color' else 'green' end,'elo',r.elo,'ranked_played',r.played,'ranked_won',r.won,'solo_played',(select count(*) from math_private.players p join math_private.sessions x on x.id=p.session_id where p.user_id=r.user_id and x.mode='solo' and x.status='finished' and x.forfeit is null),'solo_points',(select coalesce(sum(p.score),0) from math_private.players p join math_private.sessions x on x.id=p.session_id where p.user_id=r.user_id and x.mode='solo' and x.status='finished' and x.forfeit is null)) into result from math_private.ratings r join auth.users au on au.id=r.user_id where r.user_id=target_user;
 if result is null then raise exception 'PROFILE_NOT_FOUND';end if;return result;
 end if;
 if p_action='leaderboard' then
 period:=case when p_payload->>'period'='monthly' then 'monthly' else 'weekly' end;
 cutoff:=case when period='monthly' then date_trunc('month',n at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' else date_trunc('week',n at time zone 'Europe/Istanbul') at time zone 'Europe/Istanbul' end;
 select coalesce(jsonb_agg(to_jsonb(z)),'[]') into rows from(select row_number() over(order by sum(p.score) desc,count(*) asc,p.user_id) as position,p.user_id,left(coalesce(nullif(au.raw_user_meta_data->>'display_name',''),'Oyuncu'),30) as name,case when au.raw_user_meta_data->>'avatar_color' in('pink','green','yellow','purple') then au.raw_user_meta_data->>'avatar_color' else 'green' end as avatar_color,coalesce(r.elo,1000) as elo,coalesce(r.played,0) as ranked_played,sum(p.score) as score,count(*) as games from math_private.players p join math_private.sessions x on x.id=p.session_id join auth.users au on au.id=p.user_id left join math_private.ratings r on r.user_id=p.user_id where x.mode='solo' and x.status='finished' and x.forfeit is null and x.finished_at>=cutoff group by p.user_id,au.raw_user_meta_data,r.elo,r.played order by score desc,games asc,p.user_id limit 50) z;
 return jsonb_build_object('period',period,'rows',rows,'server_time',n);
 end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text,412));
 if not math_private.take_token(u,'api') then raise exception 'RATE_LIMITED';end if;
 -- Scheduling must be serialized before active-session discovery, including Solo switches/cancel.
 if p_action in('solo_start','queue','cancel') then perform pg_advisory_xact_lock(71020261);end if;
 n:=clock_timestamp();
 insert into math_private.ratings(user_id) values(u) on conflict do nothing;
 if p_action='profile' then
 select jsonb_build_object('elo',r.elo,'ranked_played',r.played,'ranked_won',r.won,'solo_played',(select count(*) from math_private.players p join math_private.sessions x on x.id=p.session_id where p.user_id=u and x.mode='solo' and x.status='finished' and x.forfeit is null),'solo_points',(select coalesce(sum(p.score),0) from math_private.players p join math_private.sessions x on x.id=p.session_id where p.user_id=u and x.mode='solo' and x.status='finished' and x.forfeit is null)) into result from math_private.ratings r where r.user_id=u;return result;
 end if;
 if p_action not in ('state','solo_start','solo_answer','queue','cancel','answer','leave') then raise exception 'UNKNOWN_ACTION';end if;
 -- One active session per account; stale finished sessions may be explicitly reopened for results.
 if p_payload ? 'session_id' and p_action not in ('solo_start','queue') then sid:=(p_payload->>'session_id')::uuid;
 else select x.id into sid from math_private.sessions x join math_private.players p on p.session_id=x.id where p.user_id=u and x.status<>'finished' order by x.created_at desc limit 1;end if;
 if sid is not null then
 select x.* into s from math_private.sessions x where x.id=sid and exists(select 1 from math_private.players p where p.session_id=x.id and p.user_id=u) for update of x;
 n:=clock_timestamp();
 if not found or not exists(select 1 from math_private.players where session_id=sid and user_id=u) then raise exception 'NOT_MEMBER';end if;
 if s.format_version=3 then perform math_private.ranked_tick(sid,n);select * into s from math_private.sessions where id=sid;end if;
 if s.mode='ranked' and s.format_version<>3 and s.status<>'finished' and not exists(select 1 from math_private.players where session_id=sid and heartbeat>=n-interval '45 seconds') then update math_private.sessions set status='finished',settled=true,finished_at=n where id=sid returning * into s;end if;
 update math_private.players set heartbeat=n where session_id=sid and user_id=u;
 end if;
 if p_action='cancel' then delete from math_private.queue where user_id=u;end if;
 if p_action='queue' and (sid is null or (s.status='finished' and s.settled)) then
 perform pg_advisory_xact_lock(71020261);
 n:=clock_timestamp();
 delete from math_private.queue where heartbeat<n-interval '15 seconds';
 if not exists(select 1 from math_private.queue where user_id=u) and not math_private.take_token(u,'start') then raise exception 'START_RATE_LIMITED';end if;
 insert into math_private.queue(user_id,heartbeat)values(u,n) on conflict(user_id)do update set heartbeat=n;
 select z.user_id into other_id from math_private.queue z join math_private.ratings r on r.user_id=z.user_id where z.user_id<>u and abs(r.elo-(select elo from math_private.ratings where user_id=u))<=least(1000,200+extract(epoch from(n-z.joined_at))::int*10) and not exists(select 1 from math_private.players p join math_private.sessions x on x.id=p.session_id where p.user_id=z.user_id and x.status<>'finished') order by z.joined_at limit 1 for update of z skip locked;
 if other_id is not null then
 insert into math_private.sessions(mode,questions,format_version,starts_at,deadline)values('ranked','[]'::jsonb,3,n+interval '3 seconds',n+interval '93 seconds') returning * into s;sid:=s.id;
 insert into math_private.players(session_id,user_id,elo_before,deadline)select sid,r.user_id,r.elo,s.starts_at+interval '90 seconds' from math_private.ratings r where r.user_id in(u,other_id);
 insert into math_private.match_questions values(sid,1,math_private.question());
 delete from math_private.queue where user_id in(u,other_id);
 else return jsonb_build_object('status','queued','server_time',n,'elo',(select elo from math_private.ratings where user_id=u));end if;
 end if;
 if p_action='solo_start' and (sid is null or (s.status='finished' and s.settled)) then
 if not math_private.take_token(u,'start') then raise exception 'START_RATE_LIMITED';end if;
 delete from math_private.queue where user_id=u;
 insert into math_private.sessions(mode,questions,format_version,deadline)values('solo',jsonb_build_array(math_private.question()),2,n+interval '90 seconds')returning * into s;sid:=s.id;
 insert into math_private.players(session_id,user_id,elo_before)select sid,u,elo from math_private.ratings where user_id=u;
 end if;
 if sid is null then
 if p_action='state' then update math_private.queue set heartbeat=n where user_id=u and heartbeat>n-interval '15 seconds';end if;
 return jsonb_build_object('status',case when exists(select 1 from math_private.queue where user_id=u and heartbeat>n-interval '15 seconds') then 'queued' else 'idle' end,'server_time',n);
 end if;
 if s.status<>'finished' and s.mode='ranked' and s.format_version<>3 then
 select p.user_id into other_id from math_private.players p where p.session_id=sid and p.user_id<>u and p.heartbeat<n-interval '45 seconds';
 if other_id is not null or p_action in('leave','cancel') then
 s.forfeit:=coalesce(other_id,u);s.status:='finished';
 update math_private.sessions set status='finished',forfeit=s.forfeit,finished_at=n where id=sid;
 end if;
 elsif p_action in('leave','cancel') and s.status<>'finished' then
 update math_private.sessions set status='finished',finished_at=n,forfeit=u,winner_id=case when s.format_version=3 then (select p.user_id from math_private.players p where p.session_id=sid and p.user_id<>u) else null end,finish_reason='forfeit' where id=sid returning * into s;
 end if;
 -- Ranked v3 progresses each player independently through an identical indexed sequence.
 if s.format_version=3 and s.status='playing' and p_action in('answer','solo_answer') and coalesce((p_payload->>'skip')::boolean,false) then raise exception 'SKIP_DISABLED';end if;
 if s.format_version=3 and s.status='playing' and p_action in('answer','solo_answer') and n>=s.starts_at then
 if coalesce((p_payload->>'skip')::boolean,false) then raise exception 'SKIP_DISABLED';end if;
 req:=(p_payload->>'request_id')::uuid;if req is null then raise exception 'REQUEST_REQUIRED';end if;
 already:=exists(select 1 from math_private.requests where user_id=u and request_id=req);
 if not already then
 select * into me from math_private.players where session_id=sid and user_id=u;
 if (p_payload->>'round')::int is distinct from me.question_index then raise exception 'ROUND_CHANGED';end if;
 if me.cooldown_until is null or me.cooldown_until<=n then
 if length(coalesce(p_payload->>'answer',''))>12 or coalesce(p_payload->>'answer','')!~'^-?[0-9]+$' then raise exception 'INTEGER_REQUIRED';end if;
 select (question->>'answer')::int into old_answer from math_private.match_questions where session_id=sid and question_index=me.question_index;
 old_round:=me.question_index;is_correct:=(p_payload->>'answer')::bigint=old_answer;
 insert into math_private.requests values(u,req,sid);
 if is_correct then
 update math_private.players set score=score+100,correct=correct+1,question_index=question_index+1,deadline=deadline+interval '5 seconds',cooldown_until=null where session_id=sid and user_id=u;
 if not exists(select 1 from math_private.match_questions where session_id=sid and question_index=old_round+1) then
 select question into q from math_private.match_questions where session_id=sid and question_index=old_round;
 for attempt in 1..10 loop result:=math_private.question();exit when result->>'text' is distinct from q->>'text';end loop;
 insert into math_private.match_questions values(sid,old_round+1,result);
 end if;
 else update math_private.players set cooldown_until=n+interval '3 seconds' where session_id=sid and user_id=u;end if;
 last_feedback:=jsonb_build_object('correct',is_correct,'answer',case when is_correct then old_answer else null end,'bonus_seconds',case when is_correct then 5 else 0 end,'round',old_round,'skipped',false);
 end if;end if;end if;
 -- Unlimited Solo v2 keeps only the current question and an absolute run deadline.
 if s.mode='solo' and s.format_version=2 and s.status='playing' then
 if n>=s.deadline then
 update math_private.sessions set status='finished',finished_at=n where id=sid returning * into s;
 elsif p_action in('answer','solo_answer') then
 req:=(p_payload->>'request_id')::uuid;if req is null then raise exception 'REQUEST_REQUIRED';end if;
 already:=exists(select 1 from math_private.requests where user_id=u and request_id=req);
 if not already then
 if (p_payload->>'round')::int is distinct from s.round then raise exception 'ROUND_CHANGED';end if;
 select * into me from math_private.players where session_id=sid and user_id=u;
 if me.cooldown_until is null or me.cooldown_until<=n then
 is_skip:=coalesce((p_payload->>'skip')::boolean,false);old_answer:=(s.questions->0->>'answer')::integer;old_round:=s.round;
 if not is_skip and (length(coalesce(p_payload->>'answer',''))>12 or coalesce(p_payload->>'answer','')!~'^-?[0-9]+$')then raise exception 'INTEGER_REQUIRED';end if;
 is_correct:=not is_skip and (p_payload->>'answer')::bigint=old_answer;
 insert into math_private.requests values(u,req,sid);
 if is_correct or is_skip then
 for attempt in 1..10 loop q:=math_private.question();exit when q->>'text' is distinct from s.questions->0->>'text';end loop;
 update math_private.sessions set round=round+1,questions=jsonb_build_array(q),deadline=deadline+case when is_correct then interval '5 seconds' else interval '0 seconds' end where id=sid returning * into s;
 update math_private.players set score=score+case when is_correct then 100 else 0 end,correct=correct+case when is_correct then 1 else 0 end,answered=false,round_points=0,cooldown_until=null where session_id=sid and user_id=u;
 else update math_private.players set cooldown_until=n+interval '3 seconds' where session_id=sid and user_id=u;end if;
 last_feedback:=jsonb_build_object('correct',is_correct,'answer',case when is_correct or is_skip then old_answer else null end,'bonus_seconds',case when is_correct then 5 else 0 end,'round',old_round,'skipped',is_skip);
 end if;end if;end if;
 end if;
 if s.format_version<>3 and s.status='playing' and n>=s.deadline then
 update math_private.sessions set status='reveal',next_at=n+interval '2 seconds' where id=sid;s.status:='reveal';s.next_at:=n+interval '2 seconds';
 end if;
 if s.status='reveal' and n>=s.next_at then
 if s.round=10 then update math_private.sessions set status='finished',finished_at=n where id=sid;s.status:='finished';
 else
 update math_private.sessions set round=round+1,status='playing',deadline=n+interval '20 seconds',next_at=null where id=sid returning * into s;
 update math_private.players set answered=false,round_points=0,cooldown_until=null where session_id=sid;
 end if;end if;
 if p_action in('answer','solo_answer') and s.status='playing' and s.format_version<>3 and not(s.mode='solo' and s.format_version=2) then
 if (p_payload->>'round')::int is distinct from s.round then raise exception 'ROUND_CHANGED';end if;
 req:=(p_payload->>'request_id')::uuid;if req is null then raise exception 'REQUEST_REQUIRED';end if;
 already:=exists(select 1 from math_private.requests where user_id=u and request_id=req);
 if not already then
 select * into me from math_private.players where session_id=sid and user_id=u;
 if not me.answered and (me.cooldown_until is null or me.cooldown_until<=n) then
 insert into math_private.requests values(u,req,sid);
 if coalesce((p_payload->>'skip')::boolean,false) then
 update math_private.players set answered=true where session_id=sid and user_id=u;
 else
 if length(coalesce(p_payload->>'answer',''))>12 or coalesce(p_payload->>'answer','')!~'^-?[0-9]+$' then raise exception 'INTEGER_REQUIRED';end if;
 if (p_payload->>'answer')::bigint=(s.questions->(s.round-1)->>'answer')::int then
 update math_private.players set score=score+case when s.mode='solo' or not exists(select 1 from math_private.players p where p.session_id=sid and p.round_points>0)then 100 else 60 end,round_points=case when s.mode='solo' or not exists(select 1 from math_private.players p where p.session_id=sid and p.round_points>0)then 100 else 60 end,correct=correct+1,answered=true where session_id=sid and user_id=u;
 else update math_private.players set cooldown_until=n+interval '3 seconds' where session_id=sid and user_id=u;end if;
 end if;end if;end if;
 if not exists(select 1 from math_private.players where session_id=sid and not answered)then
 update math_private.sessions set status='reveal',next_at=n+interval '2 seconds' where id=sid;s.status:='reveal';s.next_at:=n+interval '2 seconds';
 end if;
 end if;
 if s.status='finished' and not s.settled then
 if s.mode='ranked' then
 select * into a from math_private.players where session_id=sid order by user_id limit 1;
 select * into b from math_private.players where session_id=sid and user_id<>a.user_id;
 outcome:=case when s.format_version=3 then case when s.winner_id=a.user_id then 1 when s.winner_id=b.user_id then 0 else 0.5 end when s.forfeit=a.user_id then 0 when s.forfeit=b.user_id then 1 when a.score>b.score then 1 when a.score<b.score then 0 else 0.5 end;
 expected:=1/(1+power(10::numeric,(b.elo_before-a.elo_before)::numeric/400));delta:=round(32*(outcome-expected));
 update math_private.players set elo_delta=case when user_id=a.user_id then delta else -delta end where session_id=sid;
 update math_private.ratings set elo=elo+delta,played=played+1,won=won+case when outcome=1 then 1 else 0 end where user_id=a.user_id;
 update math_private.ratings set elo=elo-delta,played=played+1,won=won+case when outcome=0 then 1 else 0 end where user_id=b.user_id;
 end if;
 update math_private.sessions set settled=true where id=sid;
 end if;
 if s.format_version=3 then select mq.question into q from math_private.match_questions mq join math_private.players p on p.session_id=mq.session_id and p.question_index=mq.question_index where p.session_id=sid and p.user_id=u;else q:=s.questions->case when s.mode='solo' and s.format_version=2 then 0 else s.round-1 end;end if;
 select jsonb_agg(z.data order by z.uid) into ps from(select p.user_id uid,jsonb_build_object('user_id',p.user_id,'name',left(coalesce(nullif(au.raw_user_meta_data->>'display_name',''),'Oyuncu'),30),'score',p.score,'correct',p.correct,'answered',p.answered,'cooldown_until',p.cooldown_until,'elo',r.elo,'elo_delta',p.elo_delta,'deadline',p.deadline,'question_index',p.question_index) data from math_private.players p join auth.users au on au.id=p.user_id join math_private.ratings r on r.user_id=p.user_id where p.session_id=sid)z;
 select value into mine from jsonb_array_elements(ps)where value->>'user_id'=u::text;
 return jsonb_build_object('status',s.status,'mode',s.mode,'session_id',sid,'round',case when s.format_version=3 then (mine->>'question_index')::integer else s.round end,'total_rounds',case when (s.mode='solo' and s.format_version=2) or s.format_version=3 then null else 10 end,'format_version',s.format_version,'last_feedback',last_feedback,'server_time',n,'deadline',case when s.format_version=3 then (mine->>'deadline')::timestamptz else s.deadline end,'starts_at',s.starts_at,'winner_id',s.winner_id,'finish_reason',s.finish_reason,'next_at',s.next_at,'question',case when s.format_version=3 and n<s.starts_at then null else q-'answer' end,'answer',case when s.status in('reveal','finished')then q->'answer' else null end,'self',mine,'players',ps,'forfeit',s.forfeit,'outcome',case when s.status<>'finished' then null when s.format_version=3 then case when s.winner_id is null then 'draw' when s.winner_id=u then 'win' else 'loss' end when s.forfeit=u then 'loss' when s.forfeit is not null then 'win' when (mine->>'score')::int=(select max((v->>'score')::int) from jsonb_array_elements(ps)v) and (select count(distinct v->>'score') from jsonb_array_elements(ps)v)=1 then 'draw' when (mine->>'score')::int=(select max((v->>'score')::int)from jsonb_array_elements(ps)v) then 'win' else 'loss' end);
end $$;
revoke all on all functions in schema math_private from public,anon,authenticated;
grant execute on function math_private.game(text,jsonb) to authenticated,anon;
create or replace function public.math_game(p_action text,p_payload jsonb default '{}') returns jsonb language sql security invoker set search_path='' as $$select math_private.game(p_action,p_payload)$$;
revoke all on function public.math_game(text,jsonb) from public,anon;
grant execute on function public.math_game(text,jsonb) to authenticated,anon;

-- Retired music endpoints retain historical data/read access, but accept no new room/score writes.
revoke execute on function public.duydum_room(text,text,jsonb) from public,anon,authenticated;
revoke insert,update,delete on public.beta_solo_results from public,anon,authenticated;
revoke insert(id,user_id,song_id,stage,won,played_at) on public.beta_solo_results from authenticated;

-- Defense-in-depth invariants; normal public clients have no direct writes.
alter table math_private.sessions add constraint math_session_valid_state check(status in('playing','reveal','finished') and round>=1 and format_version in(1,2,3) and isfinite(deadline) and (starts_at is null or isfinite(starts_at)) and (finished_at is null or isfinite(finished_at)) and jsonb_typeof(questions)='array' and jsonb_array_length(questions)<=10);
alter table math_private.players add constraint math_player_valid_counters check(score>=0 and correct>=0 and question_index>=1 and (deadline is null or isfinite(deadline)));
alter table math_private.ratings add constraint math_rating_valid_counts check(played>=0 and won>=0 and won<=played);
alter table math_private.rate_limits add constraint math_rate_valid_budget check(tokens>=0 and tokens<=40 and isfinite(updated_at));
