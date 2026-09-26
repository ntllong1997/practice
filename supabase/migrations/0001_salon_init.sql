-- Nail salon check-in queue.
-- Tables live in their own "salon" schema (not exposed through the Supabase API).
-- The app talks to the database only through the public.salon_* functions below,
-- and every function requires the server-side app key (SALON_SECRET), so the
-- anon key alone cannot read or change anything.

create extension if not exists pgcrypto with schema extensions;

create schema if not exists salon;
revoke all on schema salon from public, anon, authenticated;

create table salon.settings (
  id int primary key default 1 check (id = 1),
  timezone text not null default 'America/Chicago',
  app_key_hash text not null,
  staff_pin_hash text not null
);

create table salon.checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_date date not null,
  ticket_number int not null,
  name text,
  entry_nonce text unique,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (ticket_date, ticket_number)
);

create table salon.checkin_services (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references salon.checkins (id) on delete cascade,
  service text not null check (service in ('pedicure', 'nails')),
  position int not null,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'done')),
  started_at timestamptz,
  completed_at timestamptz,
  unique (checkin_id, service)
);
create index on salon.checkin_services (checkin_id);

create table salon.login_failures (
  ip text primary key,
  failures int not null default 0,
  window_start timestamptz not null default now()
);

alter table salon.settings enable row level security;
alter table salon.checkins enable row level security;
alter table salon.checkin_services enable row level security;
alter table salon.login_failures enable row level security;

-- ---------- internal helpers ----------

create or replace function salon.assert_app_key(p_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_key is null or not exists (
    select 1 from salon.settings s
    where s.app_key_hash = extensions.crypt(p_key, s.app_key_hash)
  ) then
    raise exception 'invalid app key' using errcode = '28000';
  end if;
end $$;

create or replace function salon.session_tag()
returns text language sql stable security definer set search_path = '' as $$
  -- Changes whenever the staff PIN changes, which signs out every device.
  select left(encode(extensions.digest(s.staff_pin_hash, 'sha256'), 'hex'), 24)
  from salon.settings s
$$;

create or replace function salon.assert_staff(p_key text, p_tag text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform salon.assert_app_key(p_key);
  if p_tag is null or p_tag is distinct from salon.session_tag() then
    raise exception 'not signed in' using errcode = '28000';
  end if;
end $$;

create or replace function salon.today()
returns date language sql stable security definer set search_path = '' as $$
  select (now() at time zone s.timezone)::date from salon.settings s
$$;

-- ---------- public API (called server-side only) ----------

create or replace function public.salon_check_in(
  p_key text, p_nonce text, p_name text, p_services text[]
) returns json language plpgsql security definer set search_path = '' as $$
declare
  v_date date;
  v_number int;
  v_id uuid;
  v_name text := nullif(left(btrim(coalesce(p_name, '')), 40), '');
  v_services text[];
begin
  perform salon.assert_app_key(p_key);

  select array_agg(distinct s order by s) into v_services
  from unnest(coalesce(p_services, '{}')) as s;
  if v_services is null or not (v_services <@ array['nails', 'pedicure']) then
    raise exception 'choose at least one valid service' using errcode = '22023';
  end if;
  if p_nonce is null or length(p_nonce) < 16 then
    raise exception 'invalid entry' using errcode = '22023';
  end if;

  v_date := salon.today();
  perform pg_advisory_xact_lock(hashtext('salon_check_in:' || v_date::text));

  select coalesce(max(ticket_number), 0) + 1 into v_number
  from salon.checkins where ticket_date = v_date;

  begin
    insert into salon.checkins (ticket_date, ticket_number, name, entry_nonce)
    values (v_date, v_number, v_name, p_nonce)
    returning id into v_id;
  exception when unique_violation then
    raise exception 'this check-in link was already used' using errcode = 'P0001';
  end;

  -- Keep the order the customer picked (pedicure first when both).
  insert into salon.checkin_services (checkin_id, service, position)
  select v_id, s, row_number() over (order by case s when 'pedicure' then 1 else 2 end)
  from unnest(v_services) as s;

  return json_build_object(
    'id', v_id, 'ticket_number', v_number, 'ticket_date', v_date,
    'name', v_name, 'created_at', now(),
    'services', (select json_agg(service order by position)
                 from salon.checkin_services where checkin_id = v_id)
  );
end $$;

create or replace function public.salon_people_ahead(p_key text, p_checkin_id uuid)
returns json language plpgsql security definer set search_path = '' as $$
declare
  c salon.checkins;
  v_ahead int;
  v_started boolean;
begin
  perform salon.assert_app_key(p_key);
  select * into c from salon.checkins where id = p_checkin_id;
  if not found then
    return null;
  end if;

  select count(*) into v_ahead
  from salon.checkins o
  where o.ticket_date = c.ticket_date
    and o.ticket_number < c.ticket_number
    and o.cancelled_at is null
    and not exists (select 1 from salon.checkin_services s
                    where s.checkin_id = o.id and s.status <> 'waiting');

  select exists (select 1 from salon.checkin_services s
                 where s.checkin_id = c.id and s.status <> 'waiting') into v_started;

  return json_build_object(
    'ahead', v_ahead,
    'started', v_started,
    'cancelled', c.cancelled_at is not null,
    'is_today', c.ticket_date = salon.today()
  );
end $$;

create or replace function public.salon_staff_login(p_key text, p_pin text, p_ip text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_ip text := coalesce(nullif(p_ip, ''), 'unknown');
  f salon.login_failures;
begin
  perform salon.assert_app_key(p_key);

  select * into f from salon.login_failures where ip = v_ip;
  if found and f.window_start > now() - interval '15 minutes' and f.failures >= 8 then
    raise exception 'too many attempts, try again in 15 minutes' using errcode = 'P0002';
  end if;

  if exists (select 1 from salon.settings s
             where s.staff_pin_hash = extensions.crypt(coalesce(p_pin, ''), s.staff_pin_hash)) then
    delete from salon.login_failures where ip = v_ip;
    return salon.session_tag();
  end if;

  insert into salon.login_failures as lf (ip, failures, window_start)
  values (v_ip, 1, now())
  on conflict (ip) do update set
    failures = case when lf.window_start > now() - interval '15 minutes' then lf.failures + 1 else 1 end,
    window_start = case when lf.window_start > now() - interval '15 minutes' then lf.window_start else now() end;
  return null;
end $$;

create or replace function public.salon_staff_check(p_key text, p_tag text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform salon.assert_app_key(p_key);
  return p_tag is not null and p_tag = salon.session_tag();
end $$;

create or replace function public.salon_staff_today(p_key text, p_tag text)
returns json language plpgsql security definer set search_path = '' as $$
begin
  perform salon.assert_staff(p_key, p_tag);
  return coalesce((
    select json_agg(json_build_object(
      'id', c.id,
      'ticket_number', c.ticket_number,
      'name', c.name,
      'created_at', c.created_at,
      'services', (select json_agg(json_build_object(
                      'id', s.id, 'service', s.service, 'status', s.status,
                      'started_at', s.started_at, 'completed_at', s.completed_at)
                    order by s.position)
                   from salon.checkin_services s where s.checkin_id = c.id)
    ) order by c.ticket_number)
    from salon.checkins c
    where c.ticket_date = salon.today() and c.cancelled_at is null
  ), '[]'::json);
end $$;

create or replace function public.salon_staff_set_status(
  p_key text, p_tag text, p_service_id uuid, p_from text, p_to text
) returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_updated int;
begin
  perform salon.assert_staff(p_key, p_tag);
  if (p_from, p_to) not in (('waiting', 'in_progress'), ('in_progress', 'done'),
                            ('done', 'waiting'), ('in_progress', 'waiting')) then
    raise exception 'invalid status change' using errcode = '22023';
  end if;

  -- Only succeeds if nobody else changed it first.
  update salon.checkin_services s set
    status = p_to,
    started_at = case p_to when 'in_progress' then now() when 'waiting' then null else s.started_at end,
    completed_at = case p_to when 'done' then now() else null end
  where s.id = p_service_id and s.status = p_from
    and exists (select 1 from salon.checkins c where c.id = s.checkin_id and c.cancelled_at is null);
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end $$;

create or replace function public.salon_staff_cancel(p_key text, p_tag text, p_checkin_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_updated int;
begin
  perform salon.assert_staff(p_key, p_tag);
  update salon.checkins set cancelled_at = now()
  where id = p_checkin_id and cancelled_at is null;
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end $$;

-- Only the API roles may call the public functions; helpers stay private.
revoke all on all functions in schema salon from public, anon, authenticated;
revoke all on function public.salon_check_in(text, text, text, text[]) from public, anon, authenticated;
revoke all on function public.salon_people_ahead(text, uuid) from public, anon, authenticated;
revoke all on function public.salon_staff_login(text, text, text) from public, anon, authenticated;
revoke all on function public.salon_staff_check(text, text) from public, anon, authenticated;
revoke all on function public.salon_staff_today(text, text) from public, anon, authenticated;
revoke all on function public.salon_staff_set_status(text, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.salon_staff_cancel(text, text, uuid) from public, anon, authenticated;
grant execute on function public.salon_check_in(text, text, text, text[]) to anon;
grant execute on function public.salon_people_ahead(text, uuid) to anon;
grant execute on function public.salon_staff_login(text, text, text) to anon;
grant execute on function public.salon_staff_check(text, text) to anon;
grant execute on function public.salon_staff_today(text, text) to anon;
grant execute on function public.salon_staff_set_status(text, text, uuid, text, text) to anon;
grant execute on function public.salon_staff_cancel(text, text, uuid) to anon;

-- The settings row (timezone, app key, staff PIN) is inserted separately so
-- no secrets are stored in this file. See README "Database setup".
