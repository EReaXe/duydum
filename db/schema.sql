-- Remote migration: beta_solo_results. Private practice history, never ranked.
create table public.beta_solo_results (
 id uuid primary key,
 user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 song_id text not null constraint beta_solo_results_song_id_check check (song_id in (
  'snap-beta-001',
  'manifest-tralala',
  'eypio-burak-king-gunah-benim',
  'manifest-zamansizdik',
  'uzi-motive-sarkilar-sokaklara-ait',
  'manifest-toz-pembe',
  'manifest-ruya',
  'crush-crush',
  'manifest-ajda-pekkan-hileli',
  'murda-motive-karambol'
 )),
 stage smallint not null check (stage between 0 and 5),
 won boolean not null,
 points integer generated always as (
  case when not won then 0 else
   case stage when 0 then 1000 when 1 then 850 when 2 then 700
    when 3 then 500 when 4 then 300 when 5 then 100 end end
 ) stored,
 played_at timestamptz not null default now(),
 created_at timestamptz not null default now()
);
create index beta_solo_results_owner_time on public.beta_solo_results(user_id,created_at,id);
alter table public.beta_solo_results enable row level security;
revoke all on public.beta_solo_results from anon, authenticated;
grant select on public.beta_solo_results to authenticated;
grant insert (id,user_id,song_id,stage,won,played_at) on public.beta_solo_results to authenticated;
create policy own_beta_read on public.beta_solo_results for select to authenticated
 using ((select auth.uid()) = user_id);
create policy own_beta_insert on public.beta_solo_results for insert to authenticated
 with check ((select auth.uid()) = user_id);

create function public.get_beta_stats() returns jsonb
language sql stable security invoker set search_path = '' as $$
 with ordered as (
  select won,points,sum(case when won then 0 else 1 end)
    over(order by played_at,id rows unbounded preceding) as loss_group
  from public.beta_solo_results where user_id=(select auth.uid())
 ), streaks as (
  select count(*) as length from ordered where won group by loss_group
 )
 select jsonb_build_object(
  'played',count(*),
  'won',count(*) filter(where won),
  'total_points',coalesce(sum(points),0),
  'best_streak',coalesce((select max(length) from streaks),0)
 ) from ordered;
$$;
revoke all on function public.get_beta_stats() from public,anon;
grant execute on function public.get_beta_stats() to authenticated;

create index beta_solo_results_play_order on public.beta_solo_results(user_id,played_at,id);
