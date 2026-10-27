begin;
insert into auth.users(id,email,raw_user_meta_data) values
('a1000000-0000-0000-0000-000000000001','math-test-1@example.invalid','{"display_name":"Test A"}'),
('a1000000-0000-0000-0000-000000000002','math-test-2@example.invalid','{"display_name":"Test B"}'),
('a1000000-0000-0000-0000-000000000003','math-test-3@example.invalid','{"display_name":"Not a math participant"}');
do $$
declare a uuid:='a1000000-0000-0000-0000-000000000001';b uuid:='a1000000-0000-0000-0000-000000000002';s uuid;t uuid;r jsonb;v int;request uuid;before_elo int;old_deadline timestamptz;after_deadline timestamptz;old_score integer;kind_q jsonb;opponent_deadline timestamptz;first_question jsonb;previous_request uuid;
begin
 perform set_config('request.jwt.claim.sub',a::text,true);
 -- Every question family produces integer answer metadata.
 for k in 0..17 loop for j in 1..30 loop kind_q:=math_private.question(k);assert (kind_q->>'kind')::int=k and (kind_q->>'answer')~'^-?[0-9]+$','18 question families';end loop;end loop;
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');s:=(r->>'session_id')::uuid;
 assert r->>'status'='playing' and r->'answer'='null'::jsonb and not (r->'question'?'answer'),'hidden answer';
 assert r->'total_rounds'='null'::jsonb and (r->>'format_version')::int=2,'unlimited contract';
 assert extract(epoch from((r->>'deadline')::timestamptz-(r->>'server_time')::timestamptz)) between 89.9 and 90.1,'90 second start';
 r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',1,'answer','999999','request_id',gen_random_uuid()));
 assert r->'self'->>'cooldown_until' is not null and r->'last_feedback'->'answer'='null'::jsonb,'wrong cooldown no answer leak';
 update math_private.players set cooldown_until=null where session_id=s;
 -- Simulate10 elapsed seconds:80 seconds left becomes85, preserving the run deadline.
 update math_private.sessions set deadline=clock_timestamp()+interval '80 seconds' where id=s;
 select deadline into old_deadline from math_private.sessions where id=s;
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');assert (r->>'deadline')::timestamptz=old_deadline and (r->>'session_id')::uuid=s,'active v2 run not reset';
 assert extract(epoch from((r->>'deadline')::timestamptz-(r->>'server_time')::timestamptz)) between 79 and 80.1,'elapsed10 leaves80';
 for i in 1..25 loop
 delete from math_private.rate_limits where user_id in(a,b);
 select (questions->0->>'answer')::int,deadline into v,old_deadline from math_private.sessions where id=s;
 request:=gen_random_uuid();
 r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',i,'answer',v,'request_id',request,'user_id',b,'score',999999,'elo',999999,'deadline','infinity'));
 assert r->>'status'='playing' and (r->>'round')::int=i+1,'immediate next no question cap';
 after_deadline:=(r->>'deadline')::timestamptz;
 assert after_deadline=old_deadline+interval '5 seconds','absolute plus5';
 if i=1 then assert extract(epoch from(after_deadline-(r->>'server_time')::timestamptz)) between 84 and 85.1,'80 plus5 gives85';end if;
 assert (r->'last_feedback'->>'bonus_seconds')::int=5 and (r->'last_feedback'->>'round')::int=i,'feedback';
 r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',i,'answer',v,'request_id',request));
 assert (r->'self'->>'score')::int=i*100 and (r->>'deadline')::timestamptz=after_deadline and (r->>'round')::int=i+1,'duplicate UUID no score/time/round';
 end loop;
 assert (select jsonb_array_length(questions) from math_private.sessions where id=s)=1,'bounded question memory';
 begin perform public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',1,'answer',v,'request_id',gen_random_uuid()));raise exception 'stale guard missing';exception when others then if sqlerrm<>'ROUND_CHANGED' then raise;end if;end;
 select deadline into old_deadline from math_private.sessions where id=s;
 r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',26,'skip',true,'request_id',gen_random_uuid()));
 assert (r->>'round')::int=27 and (r->>'deadline')::timestamptz=old_deadline and (r->'self'->>'score')::int=2500,'skip no bonus';
 update math_private.sessions set deadline=clock_timestamp()-interval '1 second' where id=s;
 select (questions->0->>'answer')::int,deadline into v,old_deadline from math_private.sessions where id=s;
 r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',27,'answer',v,'request_id',gen_random_uuid()));
 assert r->>'status'='finished' and (r->'self'->>'score')::int=2500 and (r->>'deadline')::timestamptz=old_deadline,'expiry rejects late score and bonus';
 assert (public.math_game('profile')->>'elo')::int=1000,'solo Elo invariant';
 r:=public.math_game('leaderboard');assert (select (value->>'score')::int from jsonb_array_elements(r->'rows') where value->>'user_id'=a::text)=2500,'board completed unlimited points';
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');assert r->>'status'='queued','queue';
 perform set_config('request.jwt.claim.sub',b::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 assert r->>'mode'='ranked' and jsonb_array_length(r->'players')=2,'pair';
 assert (r->>'format_version')::int=3 and r->'total_rounds'='null'::jsonb,'ranked unlimited format3';
 assert extract(epoch from((r->>'deadline')::timestamptz-(r->>'starts_at')::timestamptz))=90,'ranked each clock90';
 assert r->'question'='null'::jsonb,'countdown hides questions';
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',1,'answer','1','request_id',gen_random_uuid()));assert (r->>'round')::int=1 and (r->'self'->>'score')::int=0,'countdown no early submit';
 perform set_config('request.jwt.claim.sub',a::text,true);r:=public.math_game('state');assert r->>'session_id'=t::text,'discover paired session';
 -- An explicit old finished session cannot bypass current active match.
 r:=public.math_game('solo_start',jsonb_build_object('session_id',s));assert r->>'session_id'=t::text,'active session guard';
 begin
 perform set_config('request.jwt.claim.sub',b::text,true);perform public.math_game('state',jsonb_build_object('session_id',s));raise exception 'membership missing';
 exception when others then if sqlerrm<>'NOT_MEMBER' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',a::text,true);
 update math_private.sessions set starts_at=clock_timestamp()-interval '1 second' where id=t;
 update math_private.players set deadline=clock_timestamp()+interval '90 seconds' where session_id=t;
 select question into first_question from math_private.match_questions where session_id=t and question_index=1;
 previous_request:=request;select deadline into old_deadline from math_private.players where session_id=t and user_id=a;
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',1,'answer',first_question->>'answer','request_id',previous_request));
 assert (r->>'round')::int=1 and (r->'self'->>'score')::int=0 and (r->>'deadline')::timestamptz=old_deadline,'UUID replay from prior session cannot earn new bonus';
 select deadline into opponent_deadline from math_private.players where session_id=t and user_id=b;
 for i in 1..25 loop
 delete from math_private.rate_limits where user_id in(a,b);
 select (question->>'answer')::int into v from math_private.match_questions where session_id=t and question_index=i;
 select deadline into old_deadline from math_private.players where session_id=t and user_id=a;
 request:=gen_random_uuid();r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',i,'answer',v,'request_id',request));
 assert (r->>'round')::int=i+1 and r->>'status'='playing','personal independent progress beyond10';
 assert (r->>'deadline')::timestamptz=old_deadline+interval '5 seconds','ranked own bonus5';
 assert (select deadline from math_private.players where session_id=t and user_id=b)=opponent_deadline and (select question_index from math_private.players where session_id=t and user_id=b)=1,'opponent clock and question unchanged';
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',i,'answer',v,'request_id',request));
 assert (r->'self'->>'score')::int=i*100 and (r->>'deadline')::timestamptz=old_deadline+interval '5 seconds' and (r->>'round')::int=i+1,'ranked retry no double bonus';
 end loop;
 begin perform public.math_game('answer',jsonb_build_object('session_id',t,'round',1,'answer',v,'request_id',gen_random_uuid()));raise exception 'stale guard missing';exception when others then if sqlerrm<>'ROUND_CHANGED' then raise;end if;end;
 begin perform public.math_game('answer',jsonb_build_object('session_id',t,'round',26,'skip',true,'request_id',gen_random_uuid()));raise exception 'skip guard missing';exception when others then if sqlerrm<>'SKIP_DISABLED' then raise;end if;end;
 perform set_config('request.jwt.claim.sub',b::text,true);r:=public.math_game('state',jsonb_build_object('session_id',t));
 assert r->'question'=first_question-'answer' and r->'answer'='null'::jsonb and r->'last_feedback'='null'::jsonb,'same sequence index1 and no opponent answer leak';
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',1,'answer','999999','request_id',gen_random_uuid()));
 assert r->'last_feedback'->'answer'='null'::jsonb and r->'self'->>'cooldown_until' is not null,'ranked wrong cooldown and answer hidden';
 update math_private.players set cooldown_until=null where session_id=t and user_id=b;
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',1,'answer',first_question->>'answer','request_id',gen_random_uuid()));assert (r->>'round')::int=2,'opponent personal progress';
 -- High score cannot save the first expired player; opponent submitting must finalize first.
 update math_private.players set deadline=clock_timestamp()-interval '1 second' where session_id=t and user_id=a;
 select (question->>'answer')::int into v from math_private.match_questions where session_id=t and question_index=2;
 select deadline into old_deadline from math_private.players where session_id=t and user_id=b;
 r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',2,'answer',v,'request_id',gen_random_uuid()));
 assert r->>'status'='finished' and r->>'outcome'='win' and r->>'finish_reason'='timeout' and (r->'self'->>'score')::int=100 and (r->>'deadline')::timestamptz=old_deadline,'opponent expiry before bonus despite lower winner score';
 assert (r->'self'->>'elo')::int=1016 and (r->'self'->>'elo_delta')::int=16,'clock winner Elo';
 r:=public.math_game('state',jsonb_build_object('session_id',t));assert (r->'self'->>'elo')::int=1016,'settle only once';
 perform set_config('request.jwt.claim.sub',a::text,true);r:=public.math_game('answer',jsonb_build_object('session_id',t,'round',26,'answer',v,'request_id',gen_random_uuid()));assert r->>'outcome'='loss' and (r->'self'->>'elo')::int=984,'late loser cannot rescue';
 perform set_config('request.jwt.claim.sub',b::text,true);
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');s:=(r->>'session_id')::uuid;r:=public.math_game('solo_answer',jsonb_build_object('session_id',s,'round',1,'skip',true,'request_id',gen_random_uuid()));assert r->>'status'='playing' and (r->>'round')::int=2 and (r->'self'->>'score')::int=0,'skip';
 r:=public.math_game('cancel',jsonb_build_object('session_id',s));assert r->>'status'='finished','cancel solo';
 -- Solo cancel must not contribute even if partial score existed.
 update math_private.players set score=400 where session_id=s;
 r:=public.math_game('profile');assert (r->>'solo_points')::int=0,'cancelled solo excluded';
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',a::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 r:=public.math_game('cancel',jsonb_build_object('session_id',t));assert r->>'outcome'='loss' and (r->'self'->>'elo_delta')::int<0,'ranked cancel forfeits';
 perform set_config('request.jwt.claim.sub',b::text,true);r:=public.math_game('state',jsonb_build_object('session_id',t));assert r->>'outcome'='win','opponent receives forfeit win';
 before_elo:=(r->'self'->>'elo')::int;
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',a::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 update math_private.players set heartbeat=clock_timestamp()-interval '60 seconds' where session_id=t;
 perform set_config('request.jwt.claim.sub',b::text,true);r:=public.math_game('state',jsonb_build_object('session_id',t));assert (r->'self'->>'elo')::int=before_elo and (r->'self'->>'elo_delta')::int=0,'both stale no Elo';
 -- Delayed polling after both clocks expire uses chronological deadlines, not caller.
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',a::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 update math_private.sessions set starts_at=clock_timestamp()-interval '100 seconds' where id=t;
 update math_private.players set deadline=clock_timestamp()-case when user_id=a then interval '2 seconds' else interval '1 second' end,heartbeat=clock_timestamp() where session_id=t;
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');assert r->>'session_id'=t::text and r->>'outcome'='loss' and r->>'winner_id'=b::text and r->>'finish_reason'='timeout','directqueue settles prior expired match';
 assert (select settled from math_private.sessions where id=t),'directqueue cannot bypass Elo';
 -- Equal deadlines draw; equal Elo is irrelevant to outcome selection.
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',b::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 update math_private.players set deadline=statement_timestamp()-interval '1 second',heartbeat=clock_timestamp() where session_id=t;
 r:=public.math_game('state',jsonb_build_object('session_id',t));assert r->>'outcome'='draw' and r->'winner_id'='null'::jsonb,'exact equal expiry draw';
 -- Earlier timeout takes precedence over a later disconnect threshold.
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',a::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 update math_private.players set deadline=clock_timestamp()-case when user_id=a then interval '10 seconds' else interval '9 seconds' end,heartbeat=clock_timestamp()-interval '50 seconds' where session_id=t;
 r:=public.math_game('state',jsonb_build_object('session_id',t));assert r->>'finish_reason'='timeout' and r->>'outcome'='loss','timeout before later disconnect';
 perform set_config('request.jwt.claim.sub',b::text,true);
 -- Starting Solo cannot replace an unsettled ranked timeout either.
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');perform set_config('request.jwt.claim.sub',a::text,true);delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('queue');t:=(r->>'session_id')::uuid;
 update math_private.players set deadline=clock_timestamp()-interval '1 second',heartbeat=clock_timestamp() where session_id=t and user_id=a;
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');assert r->>'session_id'=t::text and r->>'mode'='ranked' and r->>'outcome'='loss','solo_start settles ranked first';
 assert (select settled from math_private.sessions where id=t),'solo_start cannot bypass Elo';
 perform set_config('request.jwt.claim.sub',b::text,true);
 -- Timeout exposes answer only after closing question.
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');s:=(r->>'session_id')::uuid;
 update math_private.sessions set deadline=clock_timestamp()-interval '1 second' where id=s;
 r:=public.math_game('state',jsonb_build_object('session_id',s));assert r->>'status'='finished' and r->'answer'<>'null'::jsonb,'timeout finishes unlimited';
 -- Legacy active sessions retain their old format/deadline instead of receiving a free90 reset.
 insert into math_private.sessions(mode,questions,format_version,deadline)values('solo',math_private.questions(),1,clock_timestamp()-interval '1 second')returning id,deadline into s,old_deadline;
 insert into math_private.players(session_id,user_id)values(s,b);
 delete from math_private.rate_limits where user_id in(a,b);r:=public.math_game('solo_start');assert (r->>'session_id')::uuid=s and (r->>'format_version')::int=1 and (r->>'deadline')::timestamptz=old_deadline,'legacy deadline preserved';
 r:=public.math_game('cancel',jsonb_build_object('session_id',s));
 -- Already-running legacy Ranked keeps its10-question score-based contract.
 insert into math_private.sessions(mode,questions,format_version,status,round,next_at,deadline)values('ranked',math_private.questions(),1,'reveal',10,clock_timestamp()-interval '1 second',clock_timestamp()+interval '20 seconds')returning id into t;
 insert into math_private.players(session_id,user_id,score,elo_before)select t,user_id,case when user_id=a then 1000 else 600 end,elo from math_private.ratings where user_id in(a,b);
 r:=public.math_game('state',jsonb_build_object('session_id',t));assert (r->>'format_version')::int=1 and (r->>'total_rounds')::int=10 and r->>'status'='finished' and r->>'outcome'='loss','legacy Ranked contract preserved';
 assert not has_table_privilege('authenticated','math_private.match_questions','SELECT'),'ranked question table private';
 -- Security: malformed/oversized payloads are bounded before data access.
 begin perform public.math_game(null);raise exception 'null action accepted';exception when others then if sqlerrm<>'UNKNOWN_ACTION' then raise;end if;end;
 begin perform public.math_game('leaderboard','[]');raise exception 'array payload accepted';exception when others then if sqlerrm<>'INVALID_PAYLOAD' then raise;end if;end;
 begin perform public.math_game('leaderboard',jsonb_build_object('padding',repeat('x',4097)));raise exception 'oversize accepted';exception when others then if sqlerrm<>'INVALID_PAYLOAD' then raise;end if;end;
 -- Synthetic fixture budgets are reset between accelerated game scenarios above;
 -- here the production guard is intentionally exhausted/refilled and asserted.
 perform set_config('request.jwt.claim.sub',a::text,true);
 delete from math_private.rate_limits where user_id=a;
 insert into math_private.rate_limits values(a,'api',0,clock_timestamp());
 begin perform public.math_game('state');raise exception 'API rate not enforced';exception when others then if sqlerrm<>'RATE_LIMITED' then raise;end if;end;
 update math_private.rate_limits set updated_at=clock_timestamp()-interval '1 second' where user_id=a;
 r:=public.math_game('state');assert r->>'status'='idle','API token refill recovers';
 delete from math_private.rate_limits where user_id=a;
 for burst in 1..4 loop
 r:=public.math_game('solo_start');r:=public.math_game('cancel',jsonb_build_object('session_id',r->>'session_id'));
 end loop;
 begin perform public.math_game('solo_start');raise exception 'start rate not enforced';exception when others then if sqlerrm<>'START_RATE_LIMITED' then raise;end if;end;
 delete from math_private.rate_limits where user_id=a;
 -- No legacy room or score-write path remains publicly callable.
 assert not has_function_privilege('authenticated','public.duydum_room(text,text,jsonb)','EXECUTE'),'legacy room retired';
 assert not has_any_column_privilege('authenticated','public.beta_solo_results','INSERT'),'legacy score writes retired';
 assert has_table_privilege('authenticated','public.beta_solo_results','SELECT'),'private historical reads preserved';
 assert not has_function_privilege('authenticated','math_private.take_token(uuid,text)','EXECUTE') and not has_function_privilege('anon','math_private.ranked_tick(uuid,timestamptz)','EXECUTE'),'helpers not callable';
 assert not has_table_privilege('authenticated','math_private.rate_limits','SELECT') and not has_table_privilege('anon','math_private.rate_limits','INSERT'),'rate budgets private';
 begin update math_private.sessions set deadline='infinity'::timestamptz where id=t;raise exception 'infinite deadline accepted';exception when check_violation then null;end;
 -- Public profiles expose an allowlist only; reading never creates math participation.
 update auth.users set raw_user_meta_data=raw_user_meta_data||'{"avatar_color":"pink","private_test_secret":"must-not-leak"}'::jsonb where id=a;
 r:=public.math_game('public_profile',jsonb_build_object('user_id',a));
 assert r->>'user_id'=a::text and r->>'name'='Test A' and r->>'avatar_color'='pink','authenticated cross-player public profile';
 assert (select count(*) from jsonb_object_keys(r))=8 and not(r?'email') and not(r?'raw_user_meta_data') and not(r?'session_id') and not(r?'private_test_secret'),'public field allowlist';
 r:=public.math_game('leaderboard');select value into first_question from jsonb_array_elements(r->'rows') where value->>'user_id'=a::text;
 assert first_question->>'avatar_color'='pink' and first_question?'elo' and first_question?'ranked_played','leaderboard avatar and rank data';
 perform set_config('request.jwt.claim.sub','a1000000-0000-0000-0000-000000000003',true);
 r:=public.math_game('leaderboard');r:=public.math_game('public_profile',jsonb_build_object('user_id',a));
 assert not exists(select 1 from math_private.ratings where user_id='a1000000-0000-0000-0000-000000000003'),'public reads create no rating';
 begin perform public.math_game('public_profile','{"user_id":"a1000000-0000-0000-0000-000000000003"}');raise exception 'participation guard missing';exception when others then if sqlerrm<>'PROFILE_NOT_FOUND' then raise;end if;end;
 begin perform public.math_game('public_profile','{"user_id":"invalid-id"}');raise exception 'invalid target accepted';exception when others then if sqlerrm<>'PROFILE_NOT_FOUND' then raise;end if;end;
 perform set_config('request.jwt.claim.sub','',true);r:=public.math_game('public_profile',jsonb_build_object('user_id',a));
 assert r->>'avatar_color'='pink' and (r->>'solo_points')::int=2500 and not(r?'email'),'anonymous public profile';
 update auth.users set raw_user_meta_data=raw_user_meta_data||'{"avatar_color":"url(bad)"}'::jsonb where id=a;
 r:=public.math_game('public_profile',jsonb_build_object('user_id',a));assert r->>'avatar_color'='green','avatar allowlist fallback';
 r:=public.math_game('leaderboard');select value into first_question from jsonb_array_elements(r->'rows') where value->>'user_id'=a::text;assert first_question->>'avatar_color'='green','board avatar fallback';
 perform set_config('request.jwt.claim.sub','',true);r:=public.math_game('leaderboard');assert r?'rows','anon board';
 begin perform public.math_game('profile');raise exception 'auth missing';exception when others then if sqlerrm<>'AUTH_REQUIRED' then raise;end if;end;
 assert not has_table_privilege('authenticated','math_private.players','SELECT'),'private no direct reads';
 assert has_function_privilege('anon','public.math_game(text,jsonb)','EXECUTE'),'anon RPC grant';
end $$;
rollback;
